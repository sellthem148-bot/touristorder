import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "./prisma";
import { calculerTotaux } from "./calcul";
import { commandeSchema, erreursParChamp, regrouperLignes } from "./validation";
import { joursProposes } from "./dates";
import { lireReglages } from "./reglages";
import { formatPrix } from "./argent";

export type ResultatCommande =
  | { ok: true; jeton: string; numero: number }
  | { ok: false; erreur: string; champs?: Record<string, string>; panierPerime?: boolean };

/**
 * Crée une commande. Les prix viennent TOUJOURS de la base, jamais du navigateur.
 */
export async function creerCommande(entree: unknown): Promise<ResultatCommande> {
  const lecture = commandeSchema.safeParse(entree);
  if (!lecture.success) {
    return { ok: false, erreur: "Vérifie les champs en rouge.", champs: erreursParChamp(lecture.error) };
  }
  const saisie = lecture.data;
  const reglages = await lireReglages();

  if (!reglages.ouvert) {
    return { ok: false, erreur: "Les commandes sont fermées pour le moment. Réessaie un peu plus tard." };
  }
  if (!reglages.villes.includes(saisie.ville)) {
    return { ok: false, erreur: "Vérifie les champs en rouge.", champs: { ville: "On ne livre pas encore cette ville." } };
  }
  if (!reglages.creneaux.includes(saisie.creneau)) {
    return { ok: false, erreur: "Vérifie les champs en rouge.", champs: { creneau: "Choisis un créneau dans la liste." } };
  }
  if (!joursProposes().includes(saisie.dateLivraison)) {
    return { ok: false, erreur: "Vérifie les champs en rouge.", champs: { dateLivraison: "Choisis un jour dans la liste." } };
  }

  const lignes = regrouperLignes(saisie.lignes);
  const produits = await prisma.produit.findMany({
    where: { id: { in: lignes.map((l) => l.produitId) }, actif: true, categorie: { active: true } },
    select: { id: true, nom: true, prix: true, prixAchat: true, boutique: true, lienWolt: true },
  });
  const parId = new Map(produits.map((p) => [p.id, p]));
  if (lignes.some((l) => !parId.has(l.produitId))) {
    return {
      ok: false,
      erreur: "Certains articles de ton panier ne sont plus disponibles. On a mis ton panier à jour, vérifie-le.",
      panierPerime: true,
    };
  }

  const aCopier = lignes.map((l) => {
    const p = parId.get(l.produitId)!;
    return {
      produitId: p.id,
      nom: p.nom,
      prixUnitaire: p.prix,
      prixAchatUnitaire: p.prixAchat,
      boutique: p.boutique,
      lienWolt: p.lienWolt,
      quantite: l.quantite,
    };
  });
  const totaux = calculerTotaux(aCopier, reglages);

  if (totaux.sousTotal < reglages.minimumCommande) {
    return { ok: false, erreur: `Le minimum de commande est de ${formatPrix(reglages.minimumCommande)} (hors frais).` };
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
      ...totaux,
      tarifService: reglages.fraisService,
      tarifLivraison: reglages.fraisLivraison,
      lignes: { create: aCopier },
    },
    select: { jeton: true, numero: true },
  });
  return { ok: true, jeton: commande.jeton, numero: commande.numero };
}
