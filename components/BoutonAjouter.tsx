"use client";

import { usePanier } from "./panier/PanierProvider";

type Props = { produitId: string; nom: string; prix: number; photoUrl: string; emoji: string };

export function BoutonAjouter(props: Props) {
  const panier = usePanier();
  const article = panier.articles.find((a) => a.produitId === props.produitId);

  if (!article) {
    return (
      <button
        type="button"
        onClick={() => panier.ajouter(props)}
        className="bouton w-full py-2 text-sm"
        aria-label={`Ajouter ${props.nom} au panier`}
      >
        Ajouter
      </button>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-marque-clair p-1">
      <button
        type="button"
        onClick={() => panier.changerQuantite(props.produitId, article.quantite - 1)}
        className="h-8 w-8 rounded-lg bg-white text-lg font-bold text-marque shadow-sm"
        aria-label={`Retirer un ${props.nom}`}
      >
        −
      </button>
      <span className="text-sm font-semibold text-marque-fonce" aria-live="polite">
        {article.quantite}
      </span>
      <button
        type="button"
        onClick={() => panier.ajouter(props)}
        className="h-8 w-8 rounded-lg bg-white text-lg font-bold text-marque shadow-sm"
        aria-label={`Ajouter un ${props.nom}`}
      >
        +
      </button>
    </div>
  );
}
