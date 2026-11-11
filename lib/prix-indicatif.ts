import type { Prisma } from "@prisma/client";

/**
 * Un article EN VENTE au prix d'une liste du gérant, que personne n'a encore vérifié sur Wolt :
 * il porte un prix indicatif (`prixIndicatif`) et son prix d'achat — ce qu'il coûte vraiment sur
 * Wolt — n'est pas noté. Dès que le gérant note le prix d'achat, l'article est tenu pour vérifié.
 */
export const PRIX_NON_VERIFIE = { actif: true, prix: { gt: 0 }, prixIndicatif: { not: null }, prixAchat: null } satisfies Prisma.ProduitWhereInput;

export function prixNonVerifie(p: { prix: number; prixIndicatif: number | null; prixAchat: number | null; actif?: boolean }): boolean {
  return p.actif !== false && p.prix > 0 && p.prixIndicatif != null && p.prixAchat == null;
}
