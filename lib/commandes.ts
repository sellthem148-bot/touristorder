import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { calculerTotaux } from "./calcul";
import { commandeSchema, erreursParChamp, regrouperLignes } from "./validation";
import { joursDeLivraison } from "./creneaux";
import { lireReglages, plagesActives } from "./reglages";
import { tarifDeLaLivraison } from "./tarifs";
import { fraisDeLivraison, minimumPour } from "./villes";
import { formatPrix } from "./argent";
import { lireGroupes, resoudreSelection } from "./options";

export type ResultatCommande =
  | { ok: true; jeton: string; numero: number; id: string }
  | { ok: false; erreur: string; champs?: Record<string, string>; panierPerime?: boolean };

const CHAMPS = "Vérifiez les champs en rouge.";

/**
 * Crée une commande. Les prix (options, frais, express, pourboire) viennent
 * TOUJOURS de la base et des réglages, jamais du navigateur.
 */
export async function creerCommande(entree: unknown, options: { clientConnecteId?: string } = {}): Promise<ResultatCommande> {
  const lecture = commandeSchema.safeParse(entree);
  if (!lecture.success) {
    return { ok: false, erreur: CHAMPS, champs: erreursParChamp(lecture.error) };
  }
  const saisie = lecture.data;
  const [reglages, plages] = await Promise.all([lireReglages(), plagesActives()]);

  if (!reglages.ouvert) {
    return { ok: false, erreur: "Les commandes sont fermées pour le moment. Réessayez un peu plus tard." };
  }
  const ville = await prisma.ville.findFirst({
    where: { nom: saisie.ville, active: true },
    select: { nom: true, supplementLivraison: true, minimumCommande: true },
  });
  if (!ville) {
    return { ok: false, erreur: CHAMPS, champs: { ville: "Nous ne livrons pas encore cette ville." } };
  }
  // Le jour doit être un jour livré, et le créneau encore possible ce jour-là
  // (le soir même : au moins le délai de préparation avant son début).
  const jour = joursDeLivraison(reglages).find((j) => j.valeur === saisie.dateLivraison);
  if (!jour) {
    return { ok: false, erreur: CHAMPS, champs: { dateLivraison: "Ce jour n'est plus disponible : choisissez-en un autre." } };
  }
  if (!jour.creneaux.includes(saisie.creneau)) {
    return { ok: false, erreur: CHAMPS, champs: { creneau: "Ce créneau n'est plus disponible : choisissez-en un autre." } };
  }
  // Le tarif du moment de la livraison (journée, nuit, week-end…).
  const tarif = tarifDeLaLivraison(saisie.dateLivraison, saisie.creneau, plages, reglages);
  if (saisie.express && tarif.fraisExpress <= 0) {
    return { ok: false, erreur: "La livraison express n'est pas proposée sur ce créneau.", champs: { express: "Pas d'express sur ce créneau." } };
  }
  if (reglages.paiements.length > 0 && !reglages.paiements.includes(saisie.paiement)) {
    return { ok: false, erreur: CHAMPS, champs: { paiement: "Choisissez un mode de paiement." } };
  }
  if (saisie.pourboire !== 0 && !reglages.pourboires.includes(saisie.pourboire)) {
    return { ok: false, erreur: "Ce pourboire n'est plus proposé : rechargez la page.", champs: { pourboire: "Choisissez un montant dans la liste." } };
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
    erreur: "Certains articles de votre panier ne sont plus disponibles ou ont changé. Nous avons mis votre panier à jour : vérifiez-le.",
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
    return { ok: false, erreur: `Le minimum de commande pour ${ville.nom} est de ${formatPrix(minimum)} d'articles (hors frais).` };
  }

  // L'espace client de cette adresse : créé à la première commande. Les coordonnées
  // enregistrées ne sont remplacées que si c'est bien ce client qui est connecté —
  // quelqu'un qui tape l'adresse d'un autre ne réécrit pas son profil.
  const coordonnees = { nom: saisie.nomClient, telephone: saisie.telephone, ville: saisie.ville, adresse: saisie.adresse };
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
