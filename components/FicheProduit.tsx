"use client";

import { useEffect, useRef, useState } from "react";
import type { ProduitPublic } from "@/lib/catalogue";
import { formatPrix } from "@/lib/argent";
import { QUANTITE_MAX } from "@/lib/calcul";
import { libelleAffiche, resoudreSelection, type Selection } from "@/lib/options";
import { usePanier } from "./panier/PanierProvider";
import { Minus, Plus, X } from "lucide-react";
import { PastilleBadge, Prix } from "./Prix";
import { useTraduction } from "./LangueProvider";
import { LOCALE, remplir } from "@/lib/langues";
import { nomDuRayon } from "@/lib/i18n/rayons";
import { rangDansLaCascade } from "@/lib/cascade";
import { envolVersLePanier } from "@/lib/envol";
import { Photo } from "./Photo";
import { IconeRayon } from "./IconeRayon";
import { couleurDuRayon } from "@/lib/couleurs-rayons";
import { ApercuSurFiche } from "./admin/ApercuGerant";

/** La fiche d'un produit : la photo s'il y en a une, la description, le choix des options, la quantité. */
export function FicheProduit({ produit, fermer }: { produit: ProduitPublic; fermer: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const panier = usePanier();
  const { langue, t } = useTraduction();
  const [selection, setSelection] = useState<Selection>({});
  const [quantite, setQuantite] = useState(1);
  const [seFerme, setSeFerme] = useState(false);

  useEffect(() => {
    const d = ref.current;
    if (d && !d.open) d.showModal();
  }, []);

  const choix = resoudreSelection(produit.options, selection);
  const manquants = produit.options.filter((g) => !selection[g.nom]).map((g) => (g.affiche ?? g.nom).toLocaleLowerCase(LOCALE[langue]));
  const prixUnitaire = produit.prix + (choix.ok ? choix.supplement : 0);
  const couleur = couleurDuRayon(produit.categorie.slug);

  // La fiche redescend avant de se fermer (règles `dialog.fiche[data-se-ferme]` de app/globals.css) ;
  // elle se ferme tout de suite pour qui a demandé moins d'animations.
  function fermerEnDouceur(ensuite?: () => void) {
    const d = ref.current;
    if (!d || seFerme) return;
    const finir = () => {
      if (d.open) d.close();
      ensuite?.();
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return finir();
    setSeFerme(true);
    window.setTimeout(finir, 180);
  }

  function ajouter() {
    if (!choix.ok || produit.epuise) return;
    // L'article partira de sa photo (sinon du haut de la fiche) vers le panier, une fois la fiche refermée.
    const depart = (ref.current?.querySelector("img") ?? ref.current?.querySelector("h2"))?.getBoundingClientRect();
    panier.ajouter(
      {
        produitId: produit.id,
        nom: produit.nom,
        options: produit.options.length ? selection : undefined,
        // Ce que le client lit dans son panier, dans sa langue ; le choix envoyé reste celui du gérant (`selection`).
        optionsLibelle: libelleAffiche(produit.options, selection, langue === "fr" ? " : " : ": ") || choix.libelle,
        prix: prixUnitaire,
        photoUrl: produit.photoUrl,
        emoji: produit.categorie.emoji,
      },
      quantite,
    );
    fermerEnDouceur(() => envolVersLePanier(depart, produit.photoUrl));
  }

  return (
    <dialog
      ref={ref}
      onClose={fermer}
      // La touche Échap : la fiche se referme en douceur, comme par son bouton.
      onCancel={(e) => {
        e.preventDefault();
        fermerEnDouceur();
      }}
      onClick={(e) => {
        // Un toucher sur le fond (hors de la fiche) la ferme.
        if (e.target === ref.current) fermerEnDouceur();
      }}
      data-se-ferme={seFerme ? "" : undefined}
      aria-labelledby={`fiche-${produit.id}`}
      className="fiche mx-0 mb-0 mt-auto max-h-[92dvh] w-full max-w-full overflow-y-auto rounded-t-3xl bg-white p-0 text-encre sm:m-auto sm:max-w-lg sm:rounded-3xl"
    >
      {/* Fermer : reste visible quand on fait défiler la fiche. */}
      <div className="sticky top-0 z-10 h-0">
        <button
          type="button"
          onClick={() => fermerEnDouceur()}
          className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition duration-150 hover:bg-slate-50 active:scale-90"
          aria-label={t.commun.fermer}
          autoFocus
        >
          <X className="h-4 w-4" strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
      {produit.photoUrl ? (
        <Photo src={produit.photoUrl} alt={produit.nom} paresseuse={false} className="en-fondu aspect-[16/10] max-h-72 w-full border-b border-slate-200 bg-white object-contain" />
      ) : produit.repere ? (
        // Vue du gérant seulement : la photo de Wolt en entier, et le lien pour poser la vraie photo.
        <ApercuSurFiche photo={produit.repere} id={produit.id} />
      ) : (
        // Sans photo : un bandeau à la couleur du rayon (pas une image de remplacement : il ne montre pas l'article).
        <div aria-hidden="true" className={`en-fondu flex h-20 items-center border-b px-5 ${couleur.bandeau}`}>
          <span className={`flex h-11 w-11 items-center justify-center rounded-full bg-white ${couleur.trait}`}>
            <IconeRayon slug={produit.categorie.slug} className="h-6 w-6" />
          </span>
        </div>
      )}

      <div className="space-y-5 p-5">
        {/* Le contenu arrive ligne après ligne, pendant que la fiche monte. (Jamais sur le bloc entier : la
            barre « Ajouter » doit rester collée en bas de la fiche.) */}
        <div className="apparait space-y-1.5 pe-10" style={rangDansLaCascade(1)}>
          {/* Le rayon, dans une pastille à sa couleur. */}
          <p className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${couleur.pastille}`}>
            <IconeRayon slug={produit.categorie.slug} className="h-3.5 w-3.5" /> {nomDuRayon(produit.categorie, t)}
          </p>
          <h2 id={`fiche-${produit.id}`} className="text-xl font-bold leading-tight"><bdi>{produit.nom}</bdi></h2>
          <div className="flex flex-wrap items-center gap-2">
            <Prix prix={produit.prix} prixBarre={produit.prixBarre} grand etiquette langue={langue} auLieuDe={t.produit.auLieuDe} />
            <PastilleBadge badge={produit.badge} libelle={produit.badge ? t.produit.badges[produit.badge] : undefined} />
          </div>
        </div>
        {produit.description && <p className="apparait whitespace-pre-line text-slate-600" style={rangDansLaCascade(2)}><bdi>{produit.description}</bdi></p>}

        {produit.options.map((g, i) => (
          <fieldset key={g.nom} className="apparait space-y-2" style={rangDansLaCascade(i + 3)}>
            <legend className="mb-2 flex w-full items-center justify-between font-semibold">
              <bdi>{g.affiche ?? g.nom}</bdi>
              <span className="text-xs font-normal text-slate-500">{t.produit.obligatoire}</span>
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
                  <bdi>{c.affiche ?? c.libelle}</bdi>
                  {c.supplement > 0 && <span className="opacity-75" dir="ltr">+{formatPrix(c.supplement, langue)}</span>}
                </label>
              ))}
            </div>
          </fieldset>
        ))}

        {produit.epuise ? (
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-center font-semibold text-slate-700">
            {t.produit.epuiseMoment}
          </p>
        ) : (
          <div className="sticky bottom-0 -mx-5 -mb-5 flex items-center gap-3 border-t border-slate-200 bg-white p-4">
            <div className="flex items-center rounded-2xl border border-slate-300">
              <button
                type="button"
                onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition duration-150 hover:bg-slate-50 active:scale-90 active:bg-slate-100"
                aria-label={t.produit.uneDeMoins}
              >
                <Minus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <span className="w-6 text-center font-bold tabular-nums" aria-live="polite"><span key={quantite} className="saute inline-block">{quantite}</span></span>
              <button
                type="button"
                onClick={() => setQuantite((q) => Math.min(QUANTITE_MAX, q + 1))}
                className="flex h-11 w-11 items-center justify-center rounded-2xl transition duration-150 hover:bg-slate-50 active:scale-90 active:bg-slate-100"
                aria-label={t.produit.uneDePlus}
              >
                <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </button>
            </div>
            <button type="button" onClick={ajouter} disabled={!choix.ok} className="bouton flex-1 py-3.5">
              {/* Le prix du bouton suit la quantité et les options : il revient en fondu à chaque changement. */}
              {choix.ok ? <span key={prixUnitaire * quantite} className="change inline-block">{remplir(t.produit.ajouter, { prix: formatPrix(prixUnitaire * quantite, langue) })}</span> : remplir(t.produit.choisissez, { options: manquants.join(", ") })}
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}
