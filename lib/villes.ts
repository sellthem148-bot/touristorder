// Les villes livrées : une seule définition du prix de livraison et du minimum,
// pour le panier (affichage en direct) et le serveur (facturé).
import type { Tarif } from "./tarifs";

export type VilleLivree = { nom: string; supplementLivraison: number; minimumCommande: number };

/** Livraison = livraison du tarif du moment + supplément de la ville (+ express si choisi). */
export function fraisDeLivraison(tarif: Pick<Tarif, "fraisLivraison" | "fraisExpress">, ville: VilleLivree | undefined, express: boolean): number {
  return tarif.fraisLivraison + (ville?.supplementLivraison ?? 0) + (express ? tarif.fraisExpress : 0);
}

/** Le minimum d'articles : le plus élevé entre celui des Réglages et celui de la ville. */
export function minimumPour(ville: VilleLivree | undefined, minimumGeneral: number): number {
  return Math.max(minimumGeneral, ville?.minimumCommande ?? 0);
}

/** « Livraison dès X ₪ » : la livraison la moins chère d'un tarif, toutes villes confondues. */
export function livraisonLaMoinsChere(tarif: Pick<Tarif, "fraisLivraison">, villes: VilleLivree[]): number {
  if (villes.length === 0) return tarif.fraisLivraison;
  return tarif.fraisLivraison + Math.min(...villes.map((v) => v.supplementLivraison));
}

/**
 * La livraison d'une commande dont le gérant change la zone : le reste (tarif du moment, express) ne bouge
 * pas, seul le supplément de l'ancienne zone laisse la place à celui de la nouvelle.
 */
export function livraisonApresChangementDeZone(livraison: number, ancienSupplement: number, nouveauSupplement: number): number {
  return Math.max(0, livraison - ancienSupplement + nouveauSupplement);
}
