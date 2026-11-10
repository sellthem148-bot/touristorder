"use client";

import { useEffect, useRef, useState } from "react";
import type { ProduitPublic } from "@/lib/catalogue";
import { formatPrix } from "@/lib/argent";
import { QUANTITE_MAX } from "@/lib/calcul";
import { resoudreSelection, type Selection } from "@/lib/options";
import { usePanier } from "./panier/PanierProvider";
import { Vignette, pastelDe } from "./Vignette";
import { PastilleBadge, Prix } from "./Prix";

/** La fiche d'un produit : grande photo, description, choix des options, quantité. */
export function FicheProduit({ produit, fermer }: { produit: ProduitPublic; fermer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const panier = usePanier();
  const [selection, setSelection] = useState<Selection>({});
  const [quantite, setQuantite] = useState(1);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const choix = resoudreSelection(produit.options, selection);
  const manquants = produit.options.filter((g) => !selection[g.nom]).map((g) => g.nom.toLowerCase());
  const prixUnitaire = produit.prix + (choix.ok ? choix.supplement : 0);

  function ajouter() {
    if (!choix.ok || produit.epuise) return;
    panier.ajouter(
      {
        produitId: produit.id,
        nom: produit.nom,
        options: produit.options.length ? selection : undefined,
        optionsLibelle: choix.libelle,
        prix: prixUnitaire,
        photoUrl: produit.photoUrl,
        emoji: produit.categorie.emoji,
      },
      quantite,
    );
    ref.current?.close();
  }

  return (
    <dialog
      ref={ref}
      onClose={fermer}
      onClick={(e) => {
        // Un toucher sur le fond (hors de la fiche) la ferme.
        if (e.target === ref.current) ref.current?.close();
      }}
      aria-labelledby={`fiche-${produit.id}`}
      className="fiche mx-0 mb-0 mt-auto max-h-[92dvh] w-full max-w-full overflow-y-auto rounded-t-3xl bg-white p-0 text-slate-900 sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {/* Fermer : reste visible quand on fait défiler la fiche. */}
      <div className="sticky top-0 z-10 h-0">
        <button
          type="button"
          onClick={() => ref.current?.close()}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-2xl leading-none shadow-flottant"
          aria-label="Fermer"
          autoFocus
        >
          ×
        </button>
      </div>
      <div className="relative">
        <Vignette
          url={produit.photoUrl}
          emoji={produit.categorie.emoji}
          alt={produit.nom}
          teinte={pastelDe(produit.categorie.slug)}
          grandEmoji
          className="aspect-[16/10] max-h-72 w-full"
        />
        <PastilleBadge badge={produit.badge} className="absolute left-3 top-3" />
      </div>

      <div className="space-y-5 p-5">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {produit.categorie.emoji} {produit.categorie.nom}
          </p>
          <h2 id={`fiche-${produit.id}`} className="text-xl font-extrabold leading-tight">{produit.nom}</h2>
          <Prix prix={produit.prix} prixBarre={produit.prixBarre} grand />
        </div>
        {produit.description && <p className="whitespace-pre-line text-slate-600">{produit.description}</p>}

        {produit.options.map((g) => (
          <fieldset key={g.nom} className="space-y-2">
            <legend className="mb-2 flex w-full items-center justify-between font-bold">
              {g.nom}
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Obligatoire</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {g.choix.map((c) => (
                <label key={c.libelle} className="pastille">
                  <input
                    type="radio"
                    name={`${produit.id}-${g.nom}`}
                    value={c.libelle}
                    checked={selection[g.nom] === c.libelle}
                    onChange={() => setSelection((s) => ({ ...s, [g.nom]: c.libelle }))}
                    className="sr-only"
                  />
                  {c.libelle}
                  {c.supplement > 0 && <span className="opacity-75">+{formatPrix(c.supplement)}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {produit.epuise ? (
          <p className="rounded-2xl bg-slate-100 p-4 text-center font-semibold text-slate-700">
            Épuisé pour le moment — reviens bientôt !
          </p>
        ) : (
          <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-3 border-t border-slate-100 bg-white p-4">
            <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold hover:bg-white"
                aria-label="Une de moins"
              >
                −
              </button>
              <span className="w-6 text-center font-extrabold" aria-live="polite">{quantite}</span>
              <button
                type="button"
                onClick={() => setQuantite((q) => Math.min(QUANTITE_MAX, q + 1))}
                className="flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold hover:bg-white"
                aria-label="Une de plus"
              >
                +
              </button>
            </div>
            <button type="button" onClick={ajouter} disabled={!choix.ok} className="bouton flex-1 py-3.5">
              {choix.ok ? `Ajouter · ${formatPrix(prixUnitaire * quantite)}` : `Choisis : ${manquants.join(", ")}`}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
