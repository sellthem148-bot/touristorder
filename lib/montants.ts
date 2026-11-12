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

export type LibellesMontants = {
  articles: string;
  livraison: string;
  livraisonExpress: string;
  supplement: string; // « Supplément {nom} (+{pct} %) »
  horaire: string;
  fraisService: string;
  serviceLivraisonComprise: string;
  serviceExpressComprise: string;
  pourboire: string;
};

// Les libellés en français (l'espace gérant, ses e-mails) ; côté client, ceux de sa langue (`t.montants`).
export const LIBELLES_MONTANTS_FR: LibellesMontants = {
  articles: "Articles",
  livraison: "Livraison",
  livraisonExpress: "Livraison express",
  supplement: "Supplément {nom} (+{pct} %)",
  horaire: "horaire",
  fraisService: "Frais de service",
  serviceLivraisonComprise: "Frais de service (livraison comprise)",
  serviceExpressComprise: "Frais de service (livraison express comprise)",
  pourboire: "Pourboire",
};

/** Les lignes à afficher avant le total (dans l'ordre). */
export function lignesDeMontants(t: Omit<Totaux, "total">, p: PresentationMontants, libelles: LibellesMontants = LIBELLES_MONTANTS_FR): LigneDeMontant[] {
  const pour = p.ville ? ` · ${p.ville}` : "";
  const lignes: LigneDeMontant[] = [
    { libelle: `${libelles.articles}${p.nombreArticles != null ? ` (${p.nombreArticles})` : ""}`, montant: t.sousTotal },
  ];
  if (t.majoration > 0) {
    const nom = p.tarifNom && p.tarifNom !== NOM_TARIF_DE_BASE ? p.tarifNom.toLowerCase() : libelles.horaire;
    lignes.push({ libelle: libelles.supplement.replace("{nom}", nom).replace("{pct}", String(p.majorationPct)), montant: t.majoration });
  }
  if (p.regroupes) {
    lignes.push({ libelle: `${p.express ? libelles.serviceExpressComprise : libelles.serviceLivraisonComprise}${pour}`, montant: t.fraisService + t.fraisLivraison });
  } else {
    lignes.push({ libelle: libelles.fraisService, montant: t.fraisService });
    lignes.push({ libelle: `${p.express ? libelles.livraisonExpress : libelles.livraison}${pour}`, montant: t.fraisLivraison });
  }
  if (t.pourboire > 0) lignes.push({ libelle: libelles.pourboire, montant: t.pourboire });
  return lignes;
}
