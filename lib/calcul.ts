// Le calcul d'une commande : une seule définition, pour le panier (affichage)
// et pour le serveur (ce qui est réellement facturé).

export type LigneACalculer = {
  prixUnitaire: number; // options comprises
  quantite: number;
  indisponible?: boolean;
};

export type Frais = {
  fraisService: number;
  fraisLivraison: number;
  pourboire?: number;
  majorationPct?: number; // % ajouté aux articles par le tarif du moment (nuit, week-end…)
};

export type Totaux = {
  sousTotal: number;
  majoration: number;
  fraisService: number;
  fraisLivraison: number;
  pourboire: number;
  total: number;
};

export function calculerTotaux(lignes: LigneACalculer[], frais: Frais): Totaux {
  const sousTotal = lignes
    .filter((l) => !l.indisponible)
    .reduce((somme, l) => somme + l.prixUnitaire * l.quantite, 0);
  // Une commande vidée (tout indisponible) ne facture rien, pourboire compris.
  const rien = sousTotal === 0;
  const pct = Math.min(Math.max(frais.majorationPct ?? 0, 0), 100);
  const majoration = rien ? 0 : Math.round((sousTotal * pct) / 100);
  const fraisService = rien ? 0 : frais.fraisService;
  const fraisLivraison = rien ? 0 : frais.fraisLivraison;
  const pourboire = rien ? 0 : (frais.pourboire ?? 0);
  return {
    sousTotal,
    majoration,
    fraisService,
    fraisLivraison,
    pourboire,
    total: sousTotal + majoration + fraisService + fraisLivraison + pourboire,
  };
}

export type LigneAvecAchat = LigneACalculer & { prixAchatUnitaire: number | null };

/**
 * Ta marge estimée sur une commande : ce que le client paie (pourboire compris),
 * moins ce que les articles te coûtent sur Wolt. `complete` est faux si un prix d'achat manque.
 */
export function margeEstimee(lignes: LigneAvecAchat[], totaux: Pick<Totaux, "total">) {
  const actives = lignes.filter((l) => !l.indisponible);
  const cout = actives.reduce((s, l) => s + (l.prixAchatUnitaire ?? 0) * l.quantite, 0);
  const complete = actives.every((l) => l.prixAchatUnitaire != null);
  return { cout, marge: totaux.total - cout, complete };
}

export const QUANTITE_MAX = 50;
export const LIGNES_MAX = 60;
