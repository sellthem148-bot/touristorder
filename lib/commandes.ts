import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { calculerTotaux } from "./calcul";
import { commandeSchema, erreursParChamp, regrouperLignes } from "./validation";
import { joursProposes } from "./dates";
import { lireReglages, plagesActives } from "./reglages";
import { tarifDeLaLivraison } from "./tarifs";
import { fraisDeLivraison, minimumPour } from "./villes";
import { formatPrix } from "./argent";
import { lireGroupes, resoudreSelection } from "./options";

export type ResultatCommande =
  | { ok: true; jeton: string; numero: number }
  | { ok: false; erreur: string; champs?: Record<string, string>; panierPerime?: boolean };

const CHAMPS = "Vérifie les champs en rouge.";

/**
 * Crée une commande. Les prix (options, frais, express, pourboire) viennent
 * TOUJOURS de la base et des réglages, jamais du navigateur.
 */
export async function creerCommande(entree: unknown): Promise<ResultatCommande> {
  const lecture = commandeSchema.safeParse(entree);
  if (!lecture.success) {
    return { ok: false, erreur: CHAMPS, champs: erreursParChamp(lecture.error) };
  }
  const saisie = lecture.data;
  const [reglages, plages] = await Promise.all([lireReglages(), plagesActives()]);

  if (!reglages.ouvert) {
    return { ok: false, erreur: "Les commandes sont fermées pour le moment. Réessaie un peu plus tard." };
  }
  const ville = await prisma.ville.findFirst({
    where: { nom: saisie.ville, active: true },
    select: { nom: true, supplementLivraison: true, minimumCommande: true },
  });
  if (!ville) {
    return { ok: false, erreur: CHAMPS, champs: { ville: "On ne livre pas encore cette ville." } };
  }
  if (!reglages.creneaux.includes(saisie.creneau)) {
    return { ok: false, erreur: CHAMPS, champs: { creneau: "Choisis un créneau dans la liste." } };
  }
  if (!joursProposes().includes(saisie.dateLivraison)) {
    return { ok: false, erreur: CHAMPS, champs: { dateLivraison: "Choisis un jour dans la liste." } };
  }
  // Le tarif du moment de la livraison (journée, nuit, week-end…).
  const tarif = tarifDeLaLivraison(saisie.dateLivraison, saisie.creneau, plages, reglages);
  if (saisie.express && tarif.fraisExpress <= 0) {
    return { ok: false, erreur: "La livraison express n'est pas proposée sur ce créneau.", champs: { express: "Pas d'express sur ce créneau." } };
  }
  if (reglages.paiements.length > 0 && !reglages.paiements.includes(saisie.paiement)) {
    return { ok: false, erreur: CHAMPS, champs: { paiement: "Choisis un mode de paiement." } };
  }
  if (saisie.pourboire !== 0 && !reglages.pourboires.includes(saisie.pourboire)) {
    return { ok: false, erreur: "Ce pourboire n'est plus proposé : recharge la page.", champs: { pourboire: "Choisis un montant dans la liste." } };
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
    erreur: "Certains articles de ton panier ne sont plus disponibles ou ont changé. On a mis ton panier à jour, vérifie-le.",
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

  const minimum = minimumPour(ville, reglages.minimumCommande);
  if (totaux.sousTotal < minimum) {
    return { ok: false, erreur: `Le minimum de commande pour ${ville.nom} est de ${formatPrix(minimum)} d'articles (hors frais).` };
  }

  const jeton = randomBytes(18).toString("base64url");
  const commande = await prisma.commande.create({
    data: {
      jeton,
      nomClient: saisie.nomClient,
      telephone: saisie.telephone,
      ville: saisie.ville,
      adresse: saisie.adresse,
      dateLivraison: saisie.dateLivraison,
      creneau: saisie.creneau,
      notes: saisie.notes,
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
    select: { jeton: true, numero: true },
  });
  return { ok: true, jeton: commande.jeton, numero: commande.numero };
}
