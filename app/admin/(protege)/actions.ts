"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculerTotaux, QUANTITE_MAX } from "@/lib/calcul";
import { estStatut } from "@/lib/statuts";
import { categorieSchema, plageSchema, produitSchema, reglagesSchema } from "@/lib/admin-schemas";
import { erreursParChamp } from "@/lib/validation";
import { enregistrerPhoto, supprimerPhoto } from "@/lib/stockage";
import { slugDe } from "@/lib/slug";
import { lireReglages } from "@/lib/reglages";
import { lirePrix } from "@/lib/argent";

const texte = (form: FormData, cle: string) => String(form.get(cle) ?? "");
const id = (form: FormData, cle = "id") => {
  const v = texte(form, cle);
  return v.length > 0 && v.length <= 40 ? v : null;
};
const avecMessage = (chemin: string, cle: "ok" | "erreur", message: string) =>
  `${chemin}${chemin.includes("?") ? "&" : "?"}${cle}=${encodeURIComponent(message)}`;

// ─── Commandes ────────────────────────────────────────────────────────────

export async function changerStatut(form: FormData) {
  await exigerAdmin();
  const commandeId = id(form);
  const statut = texte(form, "statut");
  if (!commandeId || !estStatut(statut)) return;
  await prisma.commande.updateMany({ where: { id: commandeId }, data: { statut } });
  refresh();
}

/** Ajuste une ligne (quantité réellement trouvée, ou indisponible) et recalcule la commande. */
export async function modifierLigne(form: FormData) {
  await exigerAdmin();
  const ligneId = id(form, "ligneId");
  const quantite = Number(texte(form, "quantite"));
  const indisponible = texte(form, "indisponible") === "1";
  if (!ligneId || !Number.isInteger(quantite) || quantite < 1 || quantite > QUANTITE_MAX) return;

  await prisma.$transaction(async (tx) => {
    const ligne = await tx.ligneCommande.update({
      where: { id: ligneId },
      data: { quantite, indisponible },
      select: { commandeId: true },
    });
    const commande = await tx.commande.findUniqueOrThrow({
      where: { id: ligne.commandeId },
      select: {
        tarifService: true, tarifLivraison: true, tarifPourboire: true, majorationPct: true,
        lignes: { select: { prixUnitaire: true, quantite: true, indisponible: true } },
      },
    });
    const totaux = calculerTotaux(commande.lignes, {
      fraisService: commande.tarifService,
      fraisLivraison: commande.tarifLivraison,
      pourboire: commande.tarifPourboire,
      majorationPct: commande.majorationPct,
    });
    await tx.commande.update({ where: { id: ligne.commandeId }, data: totaux });
  });
  refresh();
}

export async function enregistrerNoteInterne(form: FormData) {
  await exigerAdmin();
  const commandeId = id(form);
  if (!commandeId) return;
  await prisma.commande.updateMany({
    where: { id: commandeId },
    data: { noteInterne: texte(form, "noteInterne").trim().slice(0, 2000) },
  });
  refresh();
}

// ─── Produits ─────────────────────────────────────────────────────────────

export type EtatProduit = {
  erreur?: string;
  /** Change à chaque refus : le formulaire se reconstruit avec les valeurs saisies. */
  essai?: number;
  champs?: Record<string, string>;
  valeurs?: Record<string, string>;
};

export async function enregistrerProduit(_avant: EtatProduit, form: FormData): Promise<EtatProduit> {
  await exigerAdmin();
  const produitId = id(form);
  const valeurs: Record<string, string> = Object.fromEntries(
    ["nom", "description", "prix", "prixAchat", "prixBarre", "categorieId", "boutique", "lienWolt", "ordre", "badge", "options"].map(
      (k) => [k, texte(form, k)],
    ),
  );
  valeurs.actif = form.get("actif") === "on" ? "on" : "";
  valeurs.epuise = form.get("epuise") === "on" ? "on" : "";
  const lecture = produitSchema.safeParse({ ...valeurs, actif: valeurs.actif === "on", epuise: valeurs.epuise === "on" });
  if (!lecture.success) {
    return { erreur: "Vérifie les champs en rouge.", champs: erreursParChamp(lecture.error), valeurs, essai: Date.now() };
  }
  const data = lecture.data;

  const categorie = await prisma.categorie.findUnique({ where: { id: data.categorieId }, select: { id: true } });
  if (!categorie) return { erreur: "Catégorie introuvable.", champs: { categorieId: "Choisis une catégorie." }, valeurs, essai: Date.now() };

  const existant = produitId
    ? await prisma.produit.findUnique({ where: { id: produitId }, select: { photoUrl: true } })
    : null;
  if (produitId && !existant) return { erreur: "Ce produit n'existe plus." };

  let photoUrl = existant?.photoUrl ?? "";
  const ancienne = photoUrl;
  const fichier = form.get("photo");
  if (fichier instanceof File && fichier.size > 0) {
    const envoi = await enregistrerPhoto(fichier);
    if (!envoi.ok) return { erreur: envoi.erreur, champs: { photo: envoi.erreur }, valeurs, essai: Date.now() };
    photoUrl = envoi.url;
  } else if (form.get("retirerPhoto") === "on") {
    photoUrl = "";
  }

  if (produitId) {
    await prisma.produit.update({ where: { id: produitId }, data: { ...data, photoUrl } });
  } else {
    await prisma.produit.create({ data: { ...data, photoUrl } });
  }
  if (ancienne && ancienne !== photoUrl) await supprimerPhotoSiOrpheline(ancienne);

  redirect(avecMessage("/admin/produits", "ok", produitId ? `« ${data.nom} » enregistré.` : `« ${data.nom} » ajouté.`));
}

export async function basculerProduit(form: FormData) {
  await exigerAdmin();
  const produitId = id(form);
  if (!produitId) return;
  const p = await prisma.produit.findUnique({ where: { id: produitId }, select: { actif: true, prix: true, nom: true } });
  if (!p) return;
  if (!p.actif && p.prix === 0) {
    redirect(avecMessage("/admin/produits", "erreur", `« ${p.nom} » n'a pas encore de prix : ajoute-le avant de le mettre en ligne.`));
  }
  await prisma.produit.update({ where: { id: produitId }, data: { actif: !p.actif } });
  refresh();
}

export async function basculerEpuise(form: FormData) {
  await exigerAdmin();
  const produitId = id(form);
  if (!produitId) return;
  const p = await prisma.produit.findUnique({ where: { id: produitId }, select: { epuise: true } });
  if (!p) return;
  await prisma.produit.update({ where: { id: produitId }, data: { epuise: !p.epuise } });
  refresh();
}

export async function supprimerProduit(form: FormData) {
  await exigerAdmin();
  const produitId = id(form);
  if (!produitId) return;
  // Les commandes passées gardent leur copie du produit (nom, prix, boutique).
  const p = await prisma.produit.delete({ where: { id: produitId }, select: { nom: true, photoUrl: true } }).catch(() => null);
  if (p?.photoUrl) await supprimerPhotoSiOrpheline(p.photoUrl);
  redirect(avecMessage("/admin/produits", "ok", p ? `« ${p.nom} » supprimé.` : "Produit déjà supprimé."));
}

/** Une copie masquée du produit (même photo, mêmes options), à compléter. */
export async function dupliquerProduit(form: FormData) {
  await exigerAdmin();
  const produitId = id(form);
  if (!produitId) return;
  const p = await prisma.produit.findUnique({ where: { id: produitId } });
  if (!p) redirect(avecMessage("/admin/produits", "erreur", "Ce produit n'existe plus."));
  const copie = await prisma.produit.create({
    data: {
      nom: `${p.nom} (copie)`.slice(0, 120),
      description: p.description,
      prix: p.prix,
      prixBarre: p.prixBarre,
      prixAchat: p.prixAchat,
      photoUrl: p.photoUrl,
      badge: p.badge,
      options: p.options ?? [],
      boutique: p.boutique,
      lienWolt: p.lienWolt,
      ordre: p.ordre,
      categorieId: p.categorieId,
      actif: false, // masquée tant que tu ne l'as pas relue
    },
    select: { id: true },
  });
  redirect(`/admin/produits/${copie.id}?ok=${encodeURIComponent("Copie créée (masquée) : modifie-la puis coche « En ligne ».")}`);
}

/** Une photo partagée par une copie de produit ne quitte le stockage qu'avec le dernier produit qui l'utilise. */
async function supprimerPhotoSiOrpheline(url: string) {
  const encore = await prisma.produit.count({ where: { photoUrl: url } });
  if (encore === 0) await supprimerPhoto(url);
}

// ─── Catégories ───────────────────────────────────────────────────────────

export async function enregistrerCategorie(form: FormData) {
  await exigerAdmin();
  const categorieId = id(form);
  const lecture = categorieSchema.safeParse({
    nom: texte(form, "nom"),
    emoji: texte(form, "emoji"),
    ordre: texte(form, "ordre"),
    active: form.get("active") === "on",
  });
  if (!lecture.success) {
    redirect(avecMessage("/admin/categories", "erreur", Object.values(erreursParChamp(lecture.error))[0]));
  }
  const data = lecture.data;

  // Un slug libre : « plage », puis « plage-2 »…
  let slug = slugDe(data.nom);
  for (let i = 2; ; i++) {
    const pris = await prisma.categorie.findFirst({
      where: { slug, ...(categorieId ? { NOT: { id: categorieId } } : {}) },
      select: { id: true },
    });
    if (!pris) break;
    slug = `${slugDe(data.nom)}-${i}`;
  }

  try {
    if (categorieId) {
      await prisma.categorie.update({ where: { id: categorieId }, data: { ...data, slug } });
    } else {
      await prisma.categorie.create({ data: { ...data, slug } });
    }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      redirect(avecMessage("/admin/categories", "erreur", `Une catégorie « ${data.nom} » existe déjà.`));
    }
    throw e;
  }
  redirect(avecMessage("/admin/categories", "ok", `Catégorie « ${data.nom} » enregistrée.`));
}

export async function supprimerCategorie(form: FormData) {
  await exigerAdmin();
  const categorieId = id(form);
  if (!categorieId) return;
  const n = await prisma.produit.count({ where: { categorieId } });
  if (n > 0) {
    redirect(avecMessage("/admin/categories", "erreur", `Impossible : ${n} produit(s) sont dans cette catégorie. Déplace-les ou masque la catégorie.`));
  }
  await prisma.categorie.deleteMany({ where: { id: categorieId } });
  redirect(avecMessage("/admin/categories", "ok", "Catégorie supprimée."));
}

// ─── Réglages ─────────────────────────────────────────────────────────────

export async function enregistrerReglages(form: FormData) {
  await exigerAdmin();
  const lecture = reglagesSchema.safeParse({
    fraisService: texte(form, "fraisService"),
    fraisLivraison: texte(form, "fraisLivraison"),
    fraisExpress: texte(form, "fraisExpress"),
    minimumCommande: texte(form, "minimumCommande"),
    pourboires: texte(form, "pourboires"),
    paiements: texte(form, "paiements"),
    creneaux: texte(form, "creneaux"),
    whatsapp: texte(form, "whatsapp"),
    messageAccueil: texte(form, "messageAccueil"),
    ouvert: form.get("ouvert") === "on",
    fraisRegroupes: form.get("fraisRegroupes") === "on",
    joursLivres: form.getAll("joursLivres").map(String),
    delaiPreparation: texte(form, "delaiPreparation"),
    heureLimite: texte(form, "heureLimite"),
  });
  if (!lecture.success) {
    const [champ, message] = Object.entries(erreursParChamp(lecture.error))[0];
    redirect(avecMessage("/admin/reglages", "erreur", `${champ} : ${message}`));
  }
  await lireReglages(); // crée la ligne si besoin
  await prisma.reglages.update({ where: { id: 1 }, data: lecture.data });
  redirect(avecMessage("/admin/reglages", "ok", "Réglages enregistrés."));
}

// ─── Tarifs selon le moment ───────────────────────────────────────────────

export async function enregistrerPlage(form: FormData) {
  await exigerAdmin();
  const plageId = id(form);
  const lecture = plageSchema.safeParse({
    nom: texte(form, "nom"),
    jours: form.getAll("jours").map(String),
    debut: texte(form, "debut"),
    fin: texte(form, "fin"),
    fraisService: texte(form, "fraisService"),
    fraisLivraison: texte(form, "fraisLivraison"),
    fraisExpress: texte(form, "fraisExpress"),
    majorationPct: texte(form, "majorationPct"),
    ordre: texte(form, "ordre"),
    active: form.get("active") === "on",
  });
  if (!lecture.success) {
    const [champ, message] = Object.entries(erreursParChamp(lecture.error))[0];
    redirect(avecMessage("/admin/tarifs", "erreur", `${texte(form, "nom") || "Plage"} — ${champ} : ${message}`));
  }
  if (plageId) {
    const n = await prisma.plageTarifaire.updateMany({ where: { id: plageId }, data: lecture.data });
    if (n.count === 0) redirect(avecMessage("/admin/tarifs", "erreur", "Cette plage n'existe plus."));
  } else {
    await prisma.plageTarifaire.create({ data: lecture.data });
  }
  redirect(avecMessage("/admin/tarifs", "ok", `Tarif « ${lecture.data.nom} » enregistré.`));
}

export async function supprimerPlage(form: FormData) {
  await exigerAdmin();
  const plageId = id(form);
  if (!plageId) return;
  await prisma.plageTarifaire.deleteMany({ where: { id: plageId } });
  redirect(avecMessage("/admin/tarifs", "ok", "Plage supprimée."));
}

// ─── Saisie rapide des prix ───────────────────────────────────────────────

/**
 * Enregistre d'un coup les prix d'une liste d'articles. Tout ou rien : une
 * valeur illisible n'enregistre rien et dit quel article corriger.
 * Un article sans prix reste masqué, même si « En ligne » est coché.
 */
export async function enregistrerPrixRapides(form: FormData) {
  await exigerAdmin();
  const brut = texte(form, "retour");
  const retour = brut.startsWith("/admin/produits/prix") ? brut : "/admin/produits/prix";
  const ids = [...new Set(form.getAll("ids").map(String))].filter((x) => x.length > 0 && x.length <= 40).slice(0, 300);
  if (ids.length === 0) redirect(retour);

  const existants = await prisma.produit.findMany({ where: { id: { in: ids } }, select: { id: true, nom: true, prix: true, prixAchat: true, actif: true } });
  const modifs: { id: string; prix: number; prixAchat: number | null; actif: boolean }[] = [];
  const erreurs: string[] = [];
  for (const p of existants) {
    const champPrix = texte(form, `prix_${p.id}`).trim();
    const champAchat = texte(form, `achat_${p.id}`).trim();
    const prix = champPrix === "" ? 0 : lirePrix(champPrix);
    const prixAchat = champAchat === "" ? null : lirePrix(champAchat);
    const achatIllisible = champAchat !== "" && prixAchat == null;
    if (prix == null) erreurs.push(`${p.nom} (prix « ${champPrix.slice(0, 12)} »)`);
    if (achatIllisible) erreurs.push(`${p.nom} (achat « ${champAchat.slice(0, 12)} »)`);
    if (prix == null || achatIllisible) continue;
    const actif = form.get(`actif_${p.id}`) === "on" && prix > 0;
    if (prix !== p.prix || prixAchat !== p.prixAchat || actif !== p.actif) modifs.push({ id: p.id, prix, prixAchat, actif });
  }
  if (erreurs.length > 0) {
    redirect(avecMessage(retour, "erreur", `Rien n'a été enregistré. À corriger (ex. 12,90) : ${erreurs.slice(0, 5).join(", ")}${erreurs.length > 5 ? "…" : ""}`));
  }
  await prisma.$transaction(
    modifs.map((m) =>
      prisma.produit.update({
        where: { id: m.id },
        // Un prix barré devenu inférieur au nouveau prix n'est plus affiché (lib/catalogue.ts).
        data: { prix: m.prix, prixAchat: m.prixAchat, actif: m.actif },
      }),
    ),
  );
  const enLigne = modifs.filter((m) => m.actif).length;
  redirect(
    avecMessage(
      retour,
      "ok",
      modifs.length === 0 ? "Aucun changement." : `${modifs.length} article${modifs.length > 1 ? "s" : ""} enregistré${modifs.length > 1 ? "s" : ""}, dont ${enLigne} en ligne.`,
    ),
  );
}

// ─── Villes livrées ───────────────────────────────────────────────────────

const montantOuZero = (t: string) => (t.trim() === "" ? 0 : lirePrix(t));

/** Enregistre toute la liste des villes d'un coup (noms, suppléments, minimums, actives, retirées). Tout ou rien. */
export async function enregistrerVilles(form: FormData) {
  await exigerAdmin();
  const ids = [...new Set(form.getAll("ids").map(String))].filter((x) => x.length > 0 && x.length <= 40).slice(0, 200);
  const erreurs: string[] = [];
  const aGarder: { id: string; nom: string; supplementLivraison: number; minimumCommande: number; active: boolean }[] = [];
  const aRetirer: string[] = [];
  for (const villeId of ids) {
    if (form.get(`retirer_${villeId}`) === "on") {
      aRetirer.push(villeId);
      continue;
    }
    const nom = texte(form, `nom_${villeId}`).trim();
    const supplement = montantOuZero(texte(form, `supp_${villeId}`));
    const minimum = montantOuZero(texte(form, `min_${villeId}`));
    if (nom.length < 2 || nom.length > 60) erreurs.push(`nom « ${nom || "vide"} »`);
    if (supplement == null) erreurs.push(`supplément de ${nom}`);
    if (minimum == null) erreurs.push(`minimum de ${nom}`);
    if (supplement == null || minimum == null) continue;
    aGarder.push({ id: villeId, nom, supplementLivraison: supplement, minimumCommande: minimum, active: form.get(`active_${villeId}`) === "on" });
  }
  const noms = aGarder.map((v) => v.nom.toLowerCase());
  const doublons = noms.filter((n, i) => noms.indexOf(n) !== i);
  if (doublons.length) erreurs.push(`ville en double « ${doublons[0]} »`);
  if (erreurs.length) {
    redirect(avecMessage("/admin/villes", "erreur", `Rien n'a été enregistré. À corriger : ${erreurs.slice(0, 4).join(", ")}.`));
  }
  try {
    await prisma.$transaction([
      prisma.ville.deleteMany({ where: { id: { in: aRetirer } } }),
      ...aGarder.map(({ id: villeId, ...data }) => prisma.ville.update({ where: { id: villeId }, data })),
    ]);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      redirect(avecMessage("/admin/villes", "erreur", "Deux villes portent le même nom."));
    }
    throw e;
  }
  redirect(avecMessage("/admin/villes", "ok", `Villes enregistrées${aRetirer.length ? ` (${aRetirer.length} retirée${aRetirer.length > 1 ? "s" : ""})` : ""}.`));
}

export async function ajouterVille(form: FormData) {
  await exigerAdmin();
  const nom = texte(form, "nom").trim();
  const supplement = montantOuZero(texte(form, "supplement"));
  const minimum = montantOuZero(texte(form, "minimum"));
  if (nom.length < 2 || nom.length > 60) redirect(avecMessage("/admin/villes", "erreur", "Nom de ville trop court ou trop long."));
  if (supplement == null || minimum == null) redirect(avecMessage("/admin/villes", "erreur", "Montant illisible (ex. 15 ou 12,50)."));
  const existe = await prisma.ville.findFirst({ where: { nom: { equals: nom, mode: "insensitive" } }, select: { id: true } });
  if (existe) redirect(avecMessage("/admin/villes", "erreur", `« ${nom} » est déjà dans la liste.`));
  const dernier = await prisma.ville.aggregate({ _max: { ordre: true } });
  await prisma.ville.create({
    data: { nom, supplementLivraison: supplement, minimumCommande: minimum, ordre: (dernier._max.ordre ?? 0) + 10 },
  });
  redirect(avecMessage("/admin/villes", "ok", `« ${nom} » ajoutée.`));
}

// ─── Ma journée ───────────────────────────────────────────────────────────

/** Marque « commandées sur Wolt » les commandes reçues cochées (ou toutes celles listées). */
export async function marquerCommandees(form: FormData) {
  await exigerAdmin();
  const ids = [...new Set(form.getAll("ids").map(String))].filter((x) => x.length > 0 && x.length <= 40).slice(0, 200);
  if (ids.length === 0) return;
  await prisma.commande.updateMany({ where: { id: { in: ids }, statut: "RECUE" }, data: { statut: "COMMANDEE" } });
  refresh();
}
