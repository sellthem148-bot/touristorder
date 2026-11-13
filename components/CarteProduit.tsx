/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { ProduitPublic } from "@/lib/catalogue";
import { usePanier } from "./panier/PanierProvider";
import { PastilleBadge, Prix } from "./Prix";
import { FicheProduit } from "./FicheProduit";
import { useTraduction } from "./LangueProvider";
import { RangeeQuiDefile } from "./Rangee";
import { photosDAbord } from "@/lib/sous-rayons";
import { remplir } from "@/lib/langues";

// Le bouton posé dans le coin haut GAUCHE de la photo, dans toutes les langues (décision du gérant : en
// hébreu aussi, comme sur Wolt). Arrondi comme la photo côté coin, et à l'opposé : la forme de Wolt.
const COIN = "rounded-tl-2xl rounded-br-xl";

function articleSansOptions(p: ProduitPublic) {
  return { produitId: p.id, nom: p.nom, optionsLibelle: "", prix: p.prix, photoUrl: p.photoUrl, emoji: p.categorie.emoji };
}

/**
 * Le bouton d'ajout : « + », ou la quantité déjà au panier.
 * - `surPhoto` : posé dans le coin de la photo, comme sur Wolt, aux couleurs du site (encre, « + » blanc) ;
 * - sinon (article sans photo) : en bas à droite de la ligne.
 */
function BoutonRapide({ produit, ouvrir, surPhoto = false }: { produit: ProduitPublic; ouvrir: () => void; surPhoto?: boolean }) {
  const panier = usePanier();
  const { t } = useTraduction();
  if (produit.epuise) return null;
  const quantite = panier.quantiteDuProduit(produit.id);
  const avecOptions = produit.options.length > 0;

  if (!avecOptions && quantite > 0) {
    return (
      <div className={`flex items-center bg-encre text-white ${surPhoto ? COIN : "rounded-xl"}`}>
        <button
          type="button"
          onClick={() => panier.changerQuantite(produit.id, quantite - 1)}
          className={`flex h-9 items-center justify-center hover:bg-white/10 ${surPhoto ? `w-8 ${COIN}` : "w-9 rounded-xl"}`}
          aria-label={remplir(t.produit.retirerUn, { nom: produit.nom })}
        >
          <Minus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </button>
        <span className="min-w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">{quantite}</span>
        <button
          type="button"
          onClick={() => panier.ajouter(articleSansOptions(produit))}
          className={`flex h-9 items-center justify-center hover:bg-white/10 ${surPhoto ? `w-8 ${COIN}` : "w-9 rounded-xl"}`}
          aria-label={remplir(t.produit.ajouterUn, { nom: produit.nom })}
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
      className={
        surPhoto
          ? `flex h-9 min-w-9 items-center justify-center bg-encre px-2 text-sm font-bold tabular-nums text-white transition hover:bg-encre/90 active:scale-95 ${COIN}`
          : `flex h-9 min-w-9 items-center justify-center rounded-xl border px-2 text-sm font-bold tabular-nums transition active:scale-95 ${
              dejaChoisi ? "border-encre bg-encre text-white" : "border-slate-300 bg-white text-encre hover:border-encre hover:bg-slate-50"
            }`
      }
      aria-label={remplir(avecOptions ? t.produit.choisirOptions : t.produit.ajouterAuPanier, { nom: produit.nom })}
    >
      {dejaChoisi ? quantite : <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
    </button>
  );
}

/**
 * Un article, présenté comme une tuile (deux par ligne sur téléphone, comme sur Wolt ou Uber Eats) : la photo
 * en haut quand il y en a une, puis le nom, le format, le prix. Toute la tuile ouvre la fiche ; le bouton
 * ajoute au panier.
 * Avec une photo : elle porte le bouton « + » dans son coin haut gauche — en hébreu aussi, comme sur Wolt.
 * Sans photo : pas d'image de remplacement, la tuile est plus basse et le bouton est en bas, côté fin.
 */
export function CarteProduit({ produit, sansBadge = false }: { produit: ProduitPublic; sansBadge?: boolean }) {
  const [ouvert, setOuvert] = useState(false);
  const { langue, t } = useTraduction();
  const detail = produit.description || (produit.options.length > 0 ? remplir(t.produit.auChoix, { options: produit.options.map((g) => g.affiche ?? g.nom).join(", ") }) : "");

  return (
    <article className={`relative flex h-full flex-col rounded-2xl border border-slate-200 bg-white transition hover:border-slate-400 ${produit.epuise ? "bg-slate-50" : ""}`}>
      {produit.photoUrl && (
        <div className="relative">
          <img
            src={produit.photoUrl}
            alt=""
            loading="lazy"
            className={`aspect-[4/3] w-full rounded-t-2xl border-b border-slate-100 bg-white object-contain p-2 ${produit.epuise ? "opacity-50 grayscale" : ""}`}
          />
          {/* Le « + » en haut à gauche de la photo, quelle que soit la langue : la seule position qui ne se retourne pas en hébreu. */}
          <div className="absolute left-0 top-0 z-10">
            <BoutonRapide produit={produit} ouvrir={() => setOuvert(true)} surPhoto />
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col p-3">
        {((produit.badge && !sansBadge) || produit.epuise) && (
          <p className="mb-1 flex flex-wrap gap-1">
            {!sansBadge && <PastilleBadge badge={produit.badge} libelle={produit.badge ? t.produit.badges[produit.badge] : undefined} />}
            {produit.epuise && <span className="inline-block rounded-md bg-slate-200 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase leading-4 tracking-wide text-slate-700">{t.produit.epuise}</span>}
          </p>
        )}
        <h3 className={`text-sm font-semibold leading-snug ${produit.epuise ? "text-slate-500" : "text-encre"}`}>
          {/* Le bouton s'étend à toute la tuile (after:inset-0). */}
          <button type="button" onClick={() => setOuvert(true)} className="line-clamp-3 text-start after:absolute after:inset-0 after:rounded-2xl" aria-label={remplir(t.produit.voir, { nom: produit.nom })}>
            {/* <bdi> : un nom en français garde son ordre dans une page en hébreu. */}
            <bdi>{produit.nom}</bdi>
          </button>
        </h3>
        {detail && <p className="mt-0.5 line-clamp-1 text-xs text-slate-500"><bdi>{detail}</bdi></p>}
        {/* Sur un écran étroit, « − 1 + » passe sous le prix plutôt que de sortir de la tuile. */}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1.5 pt-2.5">
          <Prix prix={produit.prix} prixBarre={produit.prixBarre} langue={langue} auLieuDe={t.produit.auLieuDe} />
          {!produit.photoUrl && (
            <div className="relative z-10 ms-auto">
              <BoutonRapide produit={produit} ouvrir={() => setOuvert(true)} />
            </div>
          )}
        </div>
      </div>
      {ouvert && <FicheProduit produit={produit} fermer={() => setOuvert(false)} />}
    </article>
  );
}

/**
 * Une grille de tuiles : deux par ligne sur téléphone, jusqu'à cinq sur grand écran.
 * - `sansBadge` : dans une sélection où tous les articles portent la même étiquette (« Les plus demandés ») ;
 * - `etroite` : à côté de la colonne des rayons, une colonne de moins ;
 * - `apercu` : pour l'aperçu d'un sous-rayon — deux lignes entières, jamais une ligne à moitié vide.
 */
export function GrilleProduits({ produits, sansBadge = false, etroite = false, apercu = false }: { produits: ProduitPublic[]; sansBadge?: boolean; etroite?: boolean; apercu?: boolean }) {
  const colonnes = etroite ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  // L'aperçu reçoit huit articles : six affichés sur deux ou trois colonnes, huit sur quatre — toujours des lignes entières.
  const coupe = apercu ? (etroite ? "max-xl:[&>*:nth-child(n+7)]:hidden" : "max-lg:[&>*:nth-child(n+7)]:hidden xl:[&>*:nth-child(n+6)]:hidden") : "";
  return (
    <div className={`grid gap-2.5 ${colonnes} ${coupe}`}>
      {photosDAbord(produits).map((p) => (
        <CarteProduit key={p.id} produit={p} sansBadge={sansBadge} />
      ))}
    </div>
  );
}

/** Une rangée de tuiles qui défile de côté (les sélections de l'accueil), comme sur Wolt ou Uber Eats. */
export function RailProduits({ produits, sansBadge = false }: { produits: ProduitPublic[]; sansBadge?: boolean }) {
  return (
    <RangeeQuiDefile>
      {photosDAbord(produits).map((p) => (
        <div key={p.id} className="w-[9.75rem] shrink-0 snap-start sm:w-48">
          <CarteProduit produit={p} sansBadge={sansBadge} />
        </div>
      ))}
    </RangeeQuiDefile>
  );
}
