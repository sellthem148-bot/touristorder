/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { ProduitPublic } from "@/lib/catalogue";
import { usePanier } from "./panier/PanierProvider";
import { PastilleBadge, Prix } from "./Prix";
import { FicheProduit } from "./FicheProduit";

function articleSansOptions(p: ProduitPublic) {
  return { produitId: p.id, nom: p.nom, optionsLibelle: "", prix: p.prix, photoUrl: p.photoUrl, emoji: p.categorie.emoji };
}

/** Le bouton d'ajout, en bas à droite de la ligne : « + », ou la quantité déjà au panier. */
function BoutonRapide({ produit, ouvrir }: { produit: ProduitPublic; ouvrir: () => void }) {
  const panier = usePanier();
  if (produit.epuise) return null;
  const quantite = panier.quantiteDuProduit(produit.id);
  const avecOptions = produit.options.length > 0;

  if (!avecOptions && quantite > 0) {
    return (
      <div className="flex items-center rounded-xl bg-encre text-white">
        <button
          type="button"
          onClick={() => panier.changerQuantite(produit.id, quantite - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10"
          aria-label={`Retirer un ${produit.nom}`}
        >
          <Minus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="min-w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">{quantite}</span>
        <button
          type="button"
          onClick={() => panier.ajouter(articleSansOptions(produit))}
          className="flex h-9 w-9 items-center justify-center rounded-xl hover:bg-white/10"
          aria-label={`Ajouter un ${produit.nom}`}
        >
          <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </button>
      </div>
    );
  }

  const dejaChoisi = avecOptions && quantite > 0;
  return (
    <button
      type="button"
      onClick={() => (avecOptions ? ouvrir() : panier.ajouter(articleSansOptions(produit)))}
      className={`flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-sm font-bold tabular-nums transition active:scale-95 ${
        dejaChoisi ? "border-encre bg-encre text-white" : "border-slate-300 bg-white text-encre hover:border-encre hover:bg-slate-50"
      }`}
      aria-label={avecOptions ? `Choisir les options de ${produit.nom}` : `Ajouter ${produit.nom} au panier`}
    >
      {dejaChoisi ? quantite : <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
    </button>
  );
}

/**
 * Un article, présenté comme une ligne de menu : le nom, le format, le prix — et la photo
 * seulement quand il y en a une. Toute la ligne ouvre la fiche ; le bouton ajoute au panier.
 */
export function CarteProduit({ produit, sansBadge = false }: { produit: ProduitPublic; sansBadge?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const detail = produit.description || (produit.options.length > 0 ? `${produit.options.map((g) => g.nom).join(", ")} au choix` : "");

  return (
    <article className={`relative flex min-h-[5.75rem] flex-col rounded-2xl border border-slate-200 bg-white p-3.5 transition hover:border-slate-400 ${produit.epuise ? "bg-slate-50" : ""}`}>
      <div className="flex gap-3">
        <div className="min-w-0 flex-1">
          {((produit.badge && !sansBadge) || produit.epuise) && (
            <p className="mb-1 flex flex-wrap gap-1">
              {!sansBadge && <PastilleBadge badge={produit.badge} />}
              {produit.epuise && <span className="inline-block rounded-md bg-slate-200 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase leading-4 tracking-wide text-slate-700">Épuisé</span>}
            </p>
          )}
          <h3 className={`text-[15px] font-semibold leading-snug ${produit.epuise ? "text-slate-500" : "text-encre"}`}>
            {/* Le bouton s'étend à toute la ligne (after:inset-0). */}
            <button type="button" onClick={() => setOuvert(true)} className="line-clamp-2 text-left after:absolute after:inset-0 after:rounded-2xl" aria-label={`Voir ${produit.nom}`}>
              {produit.nom}
            </button>
          </h3>
          {detail && <p className="mt-0.5 line-clamp-1 text-[13px] text-slate-500">{detail}</p>}
        </div>
        {produit.photoUrl && (
          <img
            src={produit.photoUrl}
            alt=""
            loading="lazy"
            className={`h-16 w-16 shrink-0 rounded-xl border border-slate-200 bg-white object-contain ${produit.epuise ? "opacity-50 grayscale" : ""}`}
          />
        )}
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <Prix prix={produit.prix} prixBarre={produit.prixBarre} />
        <div className="relative z-10">
          <BoutonRapide produit={produit} ouvrir={() => setOuvert(true)} />
        </div>
      </div>
      {ouvert && <FicheProduit produit={produit} fermer={() => setOuvert(false)} />}
    </article>
  );
}

/** `sansBadge` : dans une sélection où tous les articles portent la même étiquette (« Les plus demandés »). */
export function GrilleProduits({ produits, sansBadge = false }: { produits: ProduitPublic[]; sansBadge?: boolean }) {
  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
      {produits.map((p) => (
        <CarteProduit key={p.id} produit={p} sansBadge={sansBadge} />
      ))}
    </div>
  );
}

/** (Ancien nom : une rangée qui défilait.) La même grille, pour une sélection courte. */
export const RailProduits = GrilleProduits;
