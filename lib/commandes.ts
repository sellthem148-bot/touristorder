import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { calculerTotaux } from "./calcul";
import { erreursParChamp, regrouperLignes, schemasPour } from "./validation";
import { joursOuverts } from "./livraisons";
import { lireReglages, plagesActives } from "./reglages";
import { tarifDeLaLivraison } from "./tarifs";
import { fraisDeLivraison, minimumPour } from "./villes";
import { formatPrix } from "./argent";
import { lireGroupes, resoudreSelection } from "./options";
import { LANGUE_PAR_DEFAUT, type Langue } from "./langues";
import { dictionnaireServeur } from "./i18n";

export type ResultatCommande =
  | { ok: true; jeton: string; numero: number; id: string }
  | { ok: false; erreur: string; champs?: Record<string, string>; panierPerime?: boolean };

/**
 * Crée une commande. Les prix (options, frais, express, pourboire) viennent
 * TOUJOURS de la base et des réglages, jamais du navigateur.
 * Rien n'est enregistré tant qu'il manque le nom, le téléphone, l'e-mail ou l'adresse entière
 * (rue ou hôtel, étage, appartement ou chambre) : le gérant les a avant le paiement.
 * `langue` : celle du client — ses messages d'erreur, puis son e-mail et ses messages.
 */
export async function creerCommande(entree: unknown, options: { clientConnecteId?: string; langue?: Langue } = {}): Promise<ResultatCommande> {
  const langue = options.langue ?? LANGUE_PAR_DEFAUT;
  const m = dictionnaireServeur(langue).erreurs;
  const CHAMPS = m.champs;
  const lecture = schemasPour(m).commandeSchema.safeParse(entree);
  if (!lecture.success) {
    return { ok: false, erreur: CHAMPS, champs: erreursParChamp(lecture.error) };
  }
  const saisie = lecture.data;
  const [reglages, plages] = await Promise.all([lireReglages(), plagesActives()]);

  if (!reglages.ouvert) {
    return { ok: false, erreur: m.ferme };
  }
  const ville = await prisma.ville.findFirst({
    where: { nom: saisie.ville, active: true },
    select: { nom: true, supplementLivraison: true, minimumCommande: true },
  });
  if (!ville) {
    return { ok: false, erreur: CHAMPS, champs: { ville: m.villeNonLivree } };
  }
  // Le jour doit être un jour livré, et le créneau encore possible ce jour-là
  // (le soir même : au moins le délai de préparation avant son début).
  const jour = (await joursOuverts(reglages)).find((j) => j.valeur === saisie.dateLivraison);
  if (!jour) {
    return { ok: false, erreur: CHAMPS, champs: { dateLivraison: m.jourIndisponible } };
  }
  // La limite de commandes par créneau : le gérant livre seul.
  if (jour.complets.includes(saisie.creneau)) {
    return { ok: false, erreur: m.creneauComplet, champs: { creneau: m.creneauCompletChamp } };
  }
  if (!jour.creneaux.includes(saisie.creneau)) {
    return { ok: false, erreur: CHAMPS, champs: { creneau: m.creneauIndisponible } };
  }
  // Le tarif du moment de la livraison (journée, nuit, week-end…).
  const tarif = tarifDeLaLivraison(saisie.dateLivraison, saisie.creneau, plages, reglages);
  if (saisie.express && tarif.fraisExpress <= 0) {
    return { ok: false, erreur: m.expressNonPropose, champs: { express: m.expressChamp } };
  }
  if (reglages.paiements.length > 0 && !reglages.paiements.includes(saisie.paiement)) {
    return { ok: false, erreur: CHAMPS, champs: { paiement: m.paiementRequis } };
  }
  if (saisie.pourboire !== 0 && !reglages.pourboires.includes(saisie.pourboire)) {
    return { ok: false, erreur: m.pourboirePerime, champs: { pourboire: m.pourboireChamp } };
  }
  const pourboire = saisie.pourboire;

  const lignes = regrouperLignes(saisie.lignes);
  const produits = await prisma.produit.findMany({
    where: { id: { in: lignes.map((l) => l.produitId) }, actif: true, epuise: false, prix: { gt: 0 }, categorie: { active: true } },
    select: { id: true, nom: true, prix: true, prixAchat: true, boutique: true, lienWolt: true, options: true },
  });
  const parId = new Map(produits.map((p) => [p.id, p]));
  const perime = {
    ok: false as const,
    erreur: m.panierPerime,
    panierPerime: true,
  };
  if (lignes.some((l) => !parId.has(l.produitId))) return perime;

  const aCopier = [];
  for (const l of lignes) {
    const p = parId.get(l.produitId)!;
    const choix = resoudreSelection(lireGroupes(p.options), l.options);
    // Des options qui n'existent plus (l'admin a modifié le produit) : panier à revoir.
    if (!choix.ok) return perime;
    aCopier.push({
      produitId: p.id,
      nom: p.nom,
      options: choix.libelle,
      prixUnitaire: p.prix + choix.supplement,
      prixAchatUnitaire: p.prixAchat,
      boutique: p.boutique,
      lienWolt: p.lienWolt,
      quantite: l.quantite,
    });
  }

  const tarifLivraison = fraisDeLivraison(tarif, ville, saisie.express);
  const totaux = calculerTotaux(aCopier, {
    fraisService: tarif.fraisService,
    fraisLivraison: tarifLivraison,
    pourboire,
    majorationPct: tarif.majorationPct,
  });

  // Une demande d'article hors catalogue, sans article du catalogue : rien à facturer pour
  // l'instant (le gérant ajoutera l'article et son prix), donc pas de minimum à vérifier.
  const minimum = minimumPour(ville, reglages.minimumCommande);
  if (aCopier.length > 0 && totaux.sousTotal < minimum) {
    return { ok: false, erreur: m.minimum.replace("{ville}", ville.nom).replace("{prix}", formatPrix(minimum, langue)) };
  }

  // L'espace client de cette adresse : créé à la première commande. Les coordonnées
  // enregistrées ne sont remplacées que si c'est bien ce client qui est connecté —
  // quelqu'un qui tape l'adresse d'un autre ne réécrit pas son profil.
  const coordonnees = {
    nom: saisie.nomClient, telephone: saisie.telephone, ville: saisie.ville,
    adresse: saisie.adresse, etage: saisie.etage, appartement: saisie.appartement, codeEntree: saisie.codeEntree,
    langue,
  };
  const existant = await prisma.client.findUnique({ where: { email: saisie.email }, select: { id: true, nom: true } });
  const client = existant
    ? existant.id === options.clientConnecteId
      ? await prisma.client.update({ where: { id: existant.id }, data: coordonnees, select: { id: true } })
      : existant
    : await prisma.client.upsert({ where: { email: saisie.email }, update: {}, create: { email: saisie.email, ...coordonnees }, select: { id: true } });

  const jeton = randomBytes(18).toString("base64url");
  const commande = await prisma.commande.create({
    data: {
      jeton,
      clientId: client.id,
      email: saisie.email,
      nomClient: saisie.nomClient,
      telephone: saisie.telephone,
      ville: saisie.ville,
      adresse: saisie.adresse,
      etage: saisie.etage,
      appartement: saisie.appartement,
      codeEntree: saisie.codeEntree,
      langue,
      dateLivraison: saisie.dateLivraison,
      creneau: saisie.creneau,
      notes: saisie.notes,
      demandeLibre: saisie.demandeLibre,
      express: saisie.express,
      remplacement: saisie.remplacement,
      paiement: reglages.paiements.length > 0 ? saisie.paiement : "",
      ...totaux,
      tarifService: tarif.fraisService,
      tarifLivraison,
      tarifPourboire: pourboire,
      supplementVille: ville.supplementLivraison,
      tarifNom: tarif.nom,
      majorationPct: tarif.majorationPct,
      lignes: { create: aCopier },
    },
    select: { id: true, jeton: true, numero: true },
  });
  return { ok: true, jeton: commande.jeton, numero: commande.numero, id: commande.id };
}
