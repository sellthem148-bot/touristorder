// Les lignes du détail d'une commande (articles, supplément, frais, pourboire) :
// une seule définition pour le panier, le suivi, l'admin et les e-mails.
import type { Totaux } from "./calcul";
import { NOM_TARIF_DE_BASE } from "./tarifs";

export type PresentationMontants = {
  regroupes: boolean; // une seule ligne « Frais de service (livraison comprise) »
  express: boolean;
  tarifNom: string;
  majorationPct: number;
  ville?: string;
  nombreArticles?: number;
};

export type LigneDeMontant = { libelle: string; montant: number };

/** Les lignes à afficher avant le total (dans l'ordre). */
export function lignesDeMontants(t: Omit<Totaux, "total">, p: PresentationMontants): LigneDeMontant[] {
  const livraison = `Livraison${p.express ? " express" : ""}`;
  const pour = p.ville ? ` · ${p.ville}` : "";
  const lignes: LigneDeMontant[] = [
    { libelle: `Articles${p.nombreArticles != null ? ` (${p.nombreArticles})` : ""}`, montant: t.sousTotal },
  ];
  if (t.majoration > 0) {
    const nom = p.tarifNom && p.tarifNom !== NOM_TARIF_DE_BASE ? p.tarifNom.toLowerCase() : "horaire";
    lignes.push({ libelle: `Supplément ${nom} (+${p.majorationPct} %)`, montant: t.majoration });
  }
  if (p.regroupes) {
    lignes.push({ libelle: `Frais de service (${livraison.toLowerCase()} comprise)${pour}`, montant: t.fraisService + t.fraisLivraison });
  } else {
    lignes.push({ libelle: "Frais de service", montant: t.fraisService });
    lignes.push({ libelle: `${livraison}${pour}`, montant: t.fraisLivraison });
  }
  if (t.pourboire > 0) lignes.push({ libelle: "Pourboire", montant: t.pourboire });
  return lignes;
}
