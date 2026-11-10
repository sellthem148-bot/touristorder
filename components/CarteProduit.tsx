import type { ProduitPublic } from "@/lib/catalogue";
import { formatPrix } from "@/lib/argent";
import { BoutonAjouter } from "./BoutonAjouter";
import { Vignette } from "./Vignette";

export function CarteProduit({ produit }: { produit: ProduitPublic }) {
  return (
    <article className="carte flex flex-col overflow-hidden">
      <Vignette url={produit.photoUrl} emoji={produit.categorie.emoji} alt={produit.nom} className="aspect-square w-full" />
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900">{produit.nom}</h3>
        {produit.description && <p className="line-clamp-2 text-xs text-slate-500">{produit.description}</p>}
        <p className="mt-auto pt-1 font-bold text-slate-900">{formatPrix(produit.prix)}</p>
        <BoutonAjouter
          produitId={produit.id}
          nom={produit.nom}
          prix={produit.prix}
          photoUrl={produit.photoUrl}
          emoji={produit.categorie.emoji}
        />
      </div>
    </article>
  );
}

export function GrilleProduits({ produits }: { produits: ProduitPublic[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {produits.map((p) => (
        <CarteProduit key={p.id} produit={p} />
      ))}
    </div>
  );
}
