"use client";

import { useState } from "react";
import type { ProduitPublic } from "@/lib/catalogue";
import { usePanier } from "./panier/PanierProvider";
import { Vignette, pastelDe } from "./Vignette";
import { PastilleBadge, Prix } from "./Prix";
import { FicheProduit } from "./FicheProduit";

function articleSansOptions(p: ProduitPublic) {
  return { produitId: p.id, nom: p.nom, optionsLibelle: "", prix: p.prix, photoUrl: p.photoUrl, emoji: p.categorie.emoji };
}

/** Le bouton rond posé sur la photo : « + », ou la quantité déjà au panier. */
function BoutonRapide({ produit, ouvrir }: { produit: ProduitPublic; ouvrir: () => void }) {
  const panier = usePanier();
  if (produit.epuise) return null;
  const quantite = panier.quantiteDuProduit(produit.id);
  const avecOptions = produit.options.length > 0;

  if (!avecOptions && quantite > 0) {
    return (
      <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-white p-1 shadow-flottant">
        <button
          type="button"
          onClick={() => panier.changerQuantite(produit.id, quantite - 1)}
          className="flex h-8 w-8 items-center justify-center rounded-full text-xl font-bold text-marque hover:bg-marque-clair"
          aria-label={`Retirer un ${produit.nom}`}
        >
          −
        </button>
        <span className="min-w-5 text-center text-sm font-extrabold" aria-live="polite">{quantite}</span>
        <button
          type="button"
          onClick={() => panier.ajouter(articleSansOptions(produit))}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-marque text-xl font-bold text-white"
          aria-label={`Ajouter un ${produit.nom}`}
        >
          +
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => (avecOptions ? ouvrir() : panier.ajouter(articleSansOptions(produit)))}
      className="absolute bottom-2 right-2 flex h-10 min-w-10 items-center justify-center gap-1 rounded-full bg-marque px-3 text-xl font-bold text-white shadow-flottant transition active:scale-95"
      aria-label={avecOptions ? `Choisir les options de ${produit.nom}` : `Ajouter ${produit.nom} au panier`}
    >
      {avecOptions && quantite > 0 ? <span className="text-sm">{quantite}</span> : "+"}
    </button>
  );
}

export function CarteProduit({ produit, etroite = false }: { produit: ProduitPublic; etroite?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const teinte = pastelDe(produit.categorie.slug);

  return (
    <article className={`group relative flex flex-col ${etroite ? "w-40 shrink-0 snap-start sm:w-44" : ""}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOuvert(true)}
          className="block w-full overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-carte"
          aria-label={`Voir ${produit.nom}`}
        >
          <Vignette
            url={produit.photoUrl}
            emoji={produit.categorie.emoji}
            alt=""
            teinte={teinte}
            grandEmoji
            className={`aspect-square w-full transition duration-300 group-hover:scale-[1.03] ${produit.epuise ? "opacity-50 grayscale" : ""}`}
          />
        </button>
        <div className="pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1">
          <PastilleBadge badge={produit.badge} />
          {produit.epuise && <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide text-white">Épuisé</span>}
        </div>
        <BoutonRapide produit={produit} ouvrir={() => setOuvert(true)} />
      </div>
      <button type="button" onClick={() => setOuvert(true)} className="mt-2 px-1 text-left" tabIndex={-1}>
        <Prix prix={produit.prix} prixBarre={produit.prixBarre} />
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">{produit.nom}</h3>
        {produit.options.length > 0 && (
          <p className="mt-0.5 text-xs text-slate-500">{produit.options.map((g) => g.nom).join(", ")} au choix</p>
        )}
      </button>
      {ouvert && <FicheProduit produit={produit} fermer={() => setOuvert(false)} />}
    </article>
  );
}

export function GrilleProduits({ produits }: { produits: ProduitPublic[] }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-5">
      {produits.map((p) => (
        <CarteProduit key={p.id} produit={p} />
      ))}
    </div>
  );
}

export function RailProduits({ produits }: { produits: ProduitPublic[] }) {
  return (
    <div className="rail">
      {produits.map((p) => (
        <CarteProduit key={p.id} produit={p} etroite />
      ))}
    </div>
  );
}
