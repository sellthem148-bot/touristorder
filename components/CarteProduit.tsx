"use client";

import { useEffect, useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import type { ProduitPublic } from "@/lib/catalogue";
import { usePanier } from "./panier/PanierProvider";
import { PastilleBadge, Prix } from "./Prix";
import { FicheProduit } from "./FicheProduit";
import { useTraduction } from "./LangueProvider";
import { RangeeQuiDefile } from "./Rangee";
import { photosDAbord } from "@/lib/sous-rayons";
import { remplir } from "@/lib/langues";
import { rangDansLaCascade } from "@/lib/cascade";
import { envolVersLePanier } from "@/lib/envol";
import { Photo } from "./Photo";
import { IconeRayon } from "./IconeRayon";
import { couleurDuRayon } from "@/lib/couleurs-rayons";
import { ApercuSurCarte } from "./admin/ApercuGerant";

// Le bouton posé dans le coin haut GAUCHE de la photo, dans toutes les langues (décision du gérant : en
// hébreu aussi, comme sur Wolt). Arrondi comme la photo côté coin, et à l'opposé : la forme de Wolt.
const COIN = "rounded-br-xl";

// Les premières tuiles d'une grille ou d'une rangée arrivent l'une après l'autre ; les suivantes, plus bas
// dans la page, sont simplement là (animer des centaines de tuiles à la fois ferait peiner un téléphone).
const EN_CASCADE = 15;

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
      // Le « − 1 + » se déplie depuis le « + » qu'il remplace : vers la droite sur une photo (le bouton y est
      // à gauche dans toutes les langues), sinon depuis le côté fin de la tuile.
      <div className={`deploie flex items-center bg-encre text-white ${surPhoto ? `[--cache-droite:58%] ${COIN}` : "rounded-xl ltr:[--cache-gauche:58%] rtl:[--cache-droite:58%]"}`}>
        <button
          type="button"
          onClick={() => panier.changerQuantite(produit.id, quantite - 1)}
          className={`flex h-9 items-center justify-center transition-colors hover:bg-white/10 active:bg-white/25 ${surPhoto ? `w-8 ${COIN}` : "w-9 rounded-xl"}`}
          aria-label={remplir(t.produit.retirerUn, { nom: produit.nom })}
        >
          <Minus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
        </button>
        {/* La clé du chiffre change avec la quantité : il rebondit à chaque ajout ou retrait. La zone annoncée
            aux lecteurs d'écran, elle, reste la même. */}
        <span className="min-w-5 text-center text-sm font-bold tabular-nums" aria-live="polite">
          <span key={quantite} className="saute inline-block">{quantite}</span>
        </span>
        <button
          type="button"
          onClick={(e) => {
            panier.ajouter(articleSansOptions(produit));
            envolVersLePanier(e.currentTarget.getBoundingClientRect(), produit.photoUrl);
          }}
          className={`flex h-9 items-center justify-center transition-colors hover:bg-white/10 active:bg-white/25 ${surPhoto ? `w-8 ${COIN}` : "w-9 rounded-xl"}`}
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
      onClick={(e) => {
        if (avecOptions) return ouvrir();
        panier.ajouter(articleSansOptions(produit));
        // L'article file vers le panier : on voit où il est allé.
        envolVersLePanier(e.currentTarget.getBoundingClientRect(), produit.photoUrl);
      }}
      className={
        surPhoto
          ? `flex h-9 min-w-9 items-center justify-center bg-encre px-2 text-sm font-bold tabular-nums text-white transition duration-150 hover:bg-encre/90 active:scale-90 ${COIN}`
          : // Sans photo aussi, le « + » est plein, aux couleurs du site : on le voit, on a envie d'appuyer.
            "flex h-9 min-w-9 items-center justify-center rounded-xl bg-encre px-2 text-sm font-bold tabular-nums text-white transition duration-150 hover:bg-encre/90 active:scale-90"
      }
      aria-label={remplir(avecOptions ? t.produit.choisirOptions : t.produit.ajouterAuPanier, { nom: produit.nom })}
    >
      {dejaChoisi ? <span key={quantite} className="saute inline-block">{quantite}</span> : <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
    </button>
  );
}

/**
 * Un article, présenté comme une carte de Wolt (demande du gérant, 16 novembre 2026 : « fais-moi le même site
 * que Wolt ») : une zone d'image en haut, le « + » dans son coin haut gauche — en hébreu aussi —, puis le prix,
 * le nom et le format. Toute la carte ouvre la fiche ; le bouton ajoute au panier.
 * Toutes les cartes ont la même forme : sans photo, la zone d'image porte l'icône du rayon sur sa couleur.
 */
export function CarteProduit({ produit, sansBadge = false, rang }: { produit: ProduitPublic; sansBadge?: boolean; rang?: number }) {
  const [ouvert, setOuvert] = useState(false);
  const { langue, t } = useTraduction();
  const detail = produit.description || (produit.options.length > 0 ? remplir(t.produit.auChoix, { options: produit.options.map((g) => g.affiche ?? g.nom).join(", ") }) : "");
  const enCascade = rang !== undefined && rang < EN_CASCADE;

  return (
    // La carte, comme sur Wolt : blanche, sans trait, détachée du fond par une ombre légère. Elle se soulève au
    // survol (ordinateur) et s'enfonce un peu sous le doigt.
    <article
      className={`group/tuile relative flex h-full flex-col overflow-hidden rounded-xl bg-white shadow-(--shadow-tuile) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-tuile-survol) active:scale-[0.985] ${enCascade ? "apparait" : ""}`}
      style={enCascade ? rangDansLaCascade(rang) : undefined}
    >
      {/* La zone d'image, la même sur toutes les cartes : la photo de l'article ; sinon l'icône de son rayon sur
          sa couleur — elle ne prétend pas montrer l'article, mais les cartes gardent toutes la même forme. */}
      <div className="relative">
        {produit.photoUrl ? (
          <Photo
            src={produit.photoUrl}
            className={`aspect-[4/3] w-full bg-white object-contain p-2 transition-transform duration-300 group-hover/tuile:scale-[1.05] ${produit.epuise ? "opacity-50 grayscale" : ""}`}
          />
        ) : produit.repere ? (
          // Vue du gérant seulement : la photo de Wolt, pour qu'il sache quelle image chercher (lib/vue-gerant.ts).
          <ApercuSurCarte photo={produit.repere} epuise={produit.epuise} />
        ) : (
          <div data-sans-photo aria-hidden="true" className={`flex aspect-[4/3] w-full items-center justify-center ${couleurDuRayon(produit.categorie.slug).zone} ${produit.epuise ? "opacity-60 grayscale" : ""}`}>
            <IconeRayon slug={produit.categorie.slug} className="h-11 w-11 transition-transform duration-300 group-hover/tuile:scale-110 sm:h-12 sm:w-12" />
          </div>
        )}
        {/* Le « + » en haut à gauche, quelle que soit la langue : la seule position qui ne se retourne pas en hébreu. */}
        <div className="absolute left-0 top-0 z-10">
          <BoutonRapide produit={produit} ouvrir={() => setOuvert(true)} surPhoto />
        </div>
        {/* Les étiquettes, en bas à droite de l'image : le « − 1 + », qui se déplie depuis le coin haut gauche,
            ne passe jamais dessus (une carte de téléphone est étroite). */}
        {((produit.badge && !sansBadge) || produit.epuise) && (
          <p className="pointer-events-none absolute bottom-1.5 right-1.5 flex max-w-[80%] flex-wrap justify-end gap-1">
            {!sansBadge && <PastilleBadge badge={produit.badge} libelle={produit.badge ? t.produit.badges[produit.badge] : undefined} />}
            {produit.epuise && <span className="inline-block rounded-md bg-slate-200 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase leading-4 tracking-wide text-slate-700">{t.produit.epuise}</span>}
          </p>
        )}
      </div>
      {/* Sous l'image, dans l'ordre de Wolt : le prix, le nom, puis le format tout en bas. */}
      <div className="flex min-w-0 flex-1 flex-col px-3 pb-3 pt-2.5">
        <Prix prix={produit.prix} prixBarre={produit.prixBarre} etiquette langue={langue} auLieuDe={t.produit.auLieuDe} />
        <h3 className={`mt-1 text-sm font-semibold leading-snug ${produit.epuise ? "text-slate-500" : "text-encre"}`}>
          {/* Le bouton s'étend à toute la carte (after:inset-0). */}
          <button type="button" onClick={() => setOuvert(true)} className="line-clamp-2 text-start after:absolute after:inset-0 after:rounded-xl" aria-label={remplir(t.produit.voir, { nom: produit.nom })}>
            {/* <bdi> : un nom en français garde son ordre dans une page en hébreu. */}
            <bdi>{produit.nom}</bdi>
          </button>
        </h3>
        {detail && <p className="mt-auto line-clamp-1 pt-2 text-xs text-slate-500"><bdi>{detail}</bdi></p>}
      </div>
      {ouvert && <FicheProduit produit={produit} fermer={() => setOuvert(false)} />}
    </article>
  );
}

/**
 * Dans une longue liste (un sous-rayon entier, une recherche), les tuiles plus bas dans la page arrivent
 * rangée par rangée quand on y descend — comme les blocs d'`Apparition`, avec un seul observateur pour
 * toute la grille. Mêmes règles : seule une tuile encore SOUS l'écran est mise en attente, par le navigateur ;
 * rien pour qui a demandé moins d'animations ; et tout est rendu visible si la grille est démontée.
 */
function useTuilesAuDefilement(actif: boolean, produits: ProduitPublic[]) {
  const grille = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = grille.current;
    if (!actif || !el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const enAttente = Array.from(el.children).filter((t): t is HTMLElement => t instanceof HTMLElement && t.getBoundingClientRect().top >= window.innerHeight);
    if (enAttente.length === 0) return;
    const versLaGauche = getComputedStyle(el).direction === "rtl";
    for (const t of enAttente) t.classList.add("a-venir");
    const observateur = new IntersectionObserver(
      (entrees) => {
        // Les tuiles d'une même rangée arrivent ensemble : elles partent dans l'ordre de lecture, à un
        // instant d'écart. Vite (`vite`), et dès que la tuile touche le bas de l'écran : en faisant défiler
        // d'un coup de pouce, on ne doit jamais attendre devant un écran vide.
        const arrivent = entrees.filter((e) => e.isIntersecting).map((e) => e.target as HTMLElement);
        arrivent.sort((a, b) => a.offsetTop - b.offsetTop || (versLaGauche ? b.offsetLeft - a.offsetLeft : a.offsetLeft - b.offsetLeft));
        let rangee = Number.NaN;
        let place = 0;
        for (const t of arrivent) {
          place = t.offsetTop === rangee ? place + 1 : 0;
          rangee = t.offsetTop;
          observateur.unobserve(t);
          t.style.setProperty("--i", String(place));
          t.classList.remove("a-venir");
          t.classList.add("apparait", "vite");
        }
      },
      { rootMargin: "0px" },
    );
    for (const t of enAttente) observateur.observe(t);
    return () => {
      observateur.disconnect();
      for (const t of enAttente) t.classList.remove("a-venir");
    };
  }, [actif, produits]);
  return grille;
}

/**
 * Une grille de tuiles : deux par ligne sur téléphone, jusqu'à cinq sur grand écran.
 * - `sansBadge` : dans une sélection où tous les articles portent la même étiquette (« Les plus demandés ») ;
 * - `etroite` : à côté de la colonne des rayons, une colonne de moins ;
 * - `auDefilement` : pour une longue liste — les tuiles plus bas arrivent quand on y descend ;
 * - `ordreRecu` : pour la recherche — les articles sont déjà rangés (ceux qui répondent le mieux d'abord) :
 *   la grille ne fait pas passer devant un article qui a une photo mais répond moins bien.
 */
export function GrilleProduits({ produits, sansBadge = false, etroite = false, auDefilement = false, ordreRecu = false }: { produits: ProduitPublic[]; sansBadge?: boolean; etroite?: boolean; auDefilement?: boolean; ordreRecu?: boolean }) {
  const grille = useTuilesAuDefilement(auDefilement, produits);
  const colonnes = etroite ? "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5";
  // Les tuiles ne se touchent pas : un écart franc entre elles (le site « étouffait »).
  return (
    <div ref={grille} className={`grid gap-3 sm:gap-4 lg:gap-5 ${colonnes}`}>
      {(ordreRecu ? produits : photosDAbord(produits)).map((p, i) => (
        <CarteProduit key={p.id} produit={p} sansBadge={sansBadge} rang={i} />
      ))}
    </div>
  );
}

/**
 * Une rangée de tuiles qui défile de côté, comme sur Wolt ou Uber Eats : les sélections de l'accueil et
 * l'aperçu de chaque sous-rayon. Une seule ligne par bloc : la page respire, la suite est à un geste.
 */
export function RailProduits({ produits, sansBadge = false, etroite = false }: { produits: ProduitPublic[]; sansBadge?: boolean; etroite?: boolean }) {
  // Sur grand écran la rangée tombe juste, sans tuile coupée au bord : six tuiles sur la largeur de la page,
  // quatre à côté de la colonne des rayons (`etroite`) — la largeur moins les écarts de la rangée (1,25 rem
  // chacun, voir `RangeeQuiDefile`). S'il y en a davantage, une flèche mène à la suite.
  const largeur = etroite ? "lg:w-[calc((100%_-_3.75rem)/4)]" : "lg:w-[calc((100%_-_6.25rem)/6)]";
  return (
    <RangeeQuiDefile>
      {photosDAbord(produits).map((p, i) => (
        <div key={p.id} className={`w-[9.75rem] shrink-0 snap-start sm:w-48 ${largeur}`}>
          <CarteProduit produit={p} sansBadge={sansBadge} rang={i} />
        </div>
      ))}
    </RangeeQuiDefile>
  );
}
