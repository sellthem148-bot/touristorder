"use server";

import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { calculerTotaux, QUANTITE_MAX } from "@/lib/calcul";
import { estStatut } from "@/lib/statuts";
import { categorieSchema, produitSchema, reglagesSchema } from "@/lib/admin-schemas";
import { erreursParChamp } from "@/lib/validation";
import { enregistrerPhoto, supprimerPhoto } from "@/lib/stockage";
import { slugDe } from "@/lib/slug";
import { lireReglages } from "@/lib/reglages";

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
      select: { tarifService: true, tarifLivraison: true, lignes: { select: { prixUnitaire: true, quantite: true, indisponible: true } } },
    });
    const totaux = calculerTotaux(commande.lignes, {
      fraisService: commande.tarifService,
      fraisLivraison: commande.tarifLivraison,
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
  const valeurs = Object.fromEntries(
    ["nom", "description", "prix", "prixAchat", "categorieId", "boutique", "lienWolt", "ordre"].map((k) => [k, texte(form, k)]),
  );
  const lecture = produitSchema.safeParse({ ...valeurs, actif: form.get("actif") === "on" });
  if (!lecture.success) {
    return { erreur: "Vérifie les champs en rouge.", champs: erreursParChamp(lecture.error), valeurs: { ...valeurs, actif: form.get("actif") === "on" ? "on" : "" }, essai: Date.now() };
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
    if (!envoi.ok) return { erreur: envoi.erreur, champs: { photo: envoi.erreur }, valeurs: { ...valeurs, actif: data.actif ? "on" : "" }, essai: Date.now() };
    photoUrl = envoi.url;
  } else if (form.get("retirerPhoto") === "on") {
    photoUrl = "";
  }

  if (produitId) {
    await prisma.produit.update({ where: { id: produitId }, data: { ...data, photoUrl } });
  } else {
    await prisma.produit.create({ data: { ...data, photoUrl } });
  }
  if (ancienne && ancienne !== photoUrl) await supprimerPhoto(ancienne);

  redirect(avecMessage("/admin/produits", "ok", produitId ? `« ${data.nom} » enregistré.` : `« ${data.nom} » ajouté.`));
}

export async function basculerProduit(form: FormData) {
  await exigerAdmin();
  const produitId = id(form);
  if (!produitId) return;
  const p = await prisma.produit.findUnique({ where: { id: produitId }, select: { actif: true } });
  if (!p) return;
  await prisma.produit.update({ where: { id: produitId }, data: { actif: !p.actif } });
  refresh();
}

export async function supprimerProduit(form: FormData) {
  await exigerAdmin();
  const produitId = id(form);
  if (!produitId) return;
  // Les commandes passées gardent leur copie du produit (nom, prix, boutique).
  const p = await prisma.produit.delete({ where: { id: produitId }, select: { nom: true, photoUrl: true } }).catch(() => null);
  if (p?.photoUrl) await supprimerPhoto(p.photoUrl);
  redirect(avecMessage("/admin/produits", "ok", p ? `« ${p.nom} » supprimé.` : "Produit déjà supprimé."));
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
    minimumCommande: texte(form, "minimumCommande"),
    villes: texte(form, "villes"),
    creneaux: texte(form, "creneaux"),
    whatsapp: texte(form, "whatsapp"),
    messageAccueil: texte(form, "messageAccueil"),
    ouvert: form.get("ouvert") === "on",
  });
  if (!lecture.success) {
    const [champ, message] = Object.entries(erreursParChamp(lecture.error))[0];
    redirect(avecMessage("/admin/reglages", "erreur", `${champ} : ${message}`));
  }
  await lireReglages(); // crée la ligne si besoin
  await prisma.reglages.update({ where: { id: 1 }, data: lecture.data });
  redirect(avecMessage("/admin/reglages", "ok", "Réglages enregistrés."));
}
