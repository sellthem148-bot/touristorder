/**
 * La couleur d'un rayon (demandes du gérant, 16 novembre 2026 : « un peu plus de couleur, mais sans en
 * abuser », puis « plus de couleur sur les pages produits : ça fait trop brut, ça ne donne pas envie de commander »).
 *
 * Une teinte douce par rayon, reconnue à son adresse comme son icône (components/IconeRayon.tsx). Elle sert à :
 * - la PASTILLE de l'icône (fond clair, trait foncé de la même teinte) — et, dans une liste, le trait seul ;
 * - le BANDEAU en tête de la page du rayon et de la fiche d'un article sans photo (un fond très clair) ;
 * - le REPÈRE, un petit trait de couleur devant le titre de chaque sous-rayon ;
 * - la ZONE d'image d'une carte d'article qui n'a pas de photo (16 novembre : « le même site que Wolt » — toutes
 *   les cartes ont la même forme) : le fond le plus clair et l'icône du rayon, qui ne prétend pas montrer l'article.
 * Jamais un texte, ni le fond d'une tuile d'article. Un rayon créé par le gérant (adresse inconnue) garde le gris.
 *
 * Les classes sont écrites en toutes lettres : Tailwind ne garde que celles qu'il lit dans le code.
 */
export type CouleurDeRayon = {
  /** La pastille de l'icône : son fond et son trait. */
  pastille: string;
  /** La même pastille un ton plus soutenu, au survol ou sous le doigt (dans un élément `group`). */
  survol: string;
  /** Le trait de l'icône seul, dans une liste de rayons (un ton clair sur le fond sombre de la boutique). */
  trait: string;
  /** Le bandeau : un fond très clair et son liseré. */
  bandeau: string;
  /** La zone d'image d'une carte d'article sans photo : le ton le plus clair, et l'icône du rayon en clair. */
  zone: string;
  /** Le repère : un petit trait de couleur franche. */
  repere: string;
};

const GRIS: CouleurDeRayon = {
  pastille: "bg-slate-100 text-slate-700",
  survol: "group-hover:bg-slate-200 group-active:bg-slate-200",
  trait: "text-slate-500 nuit:text-slate-400",
  bandeau: "border-slate-200 bg-white",
  zone: "bg-slate-100 text-slate-300",
  repere: "bg-slate-300",
};

const PAR_RAYON: Record<string, CouleurDeRayon> = {
  "courses-epicerie": {
    pastille: "bg-amber-100 text-amber-800",
    survol: "group-hover:bg-amber-200 group-active:bg-amber-200",
    trait: "text-amber-700 nuit:text-amber-300",
    bandeau: "border-amber-200 bg-amber-50",
    zone: "bg-amber-50 text-amber-300",
    repere: "bg-amber-400",
  },
  "cremerie-oeufs": {
    pastille: "bg-sky-100 text-sky-800",
    survol: "group-hover:bg-sky-200 group-active:bg-sky-200",
    trait: "text-sky-700 nuit:text-sky-300",
    bandeau: "border-sky-200 bg-sky-50",
    zone: "bg-sky-50 text-sky-300",
    repere: "bg-sky-400",
  },
  "pain-patisserie": {
    pastille: "bg-orange-100 text-orange-800",
    survol: "group-hover:bg-orange-200 group-active:bg-orange-200",
    trait: "text-orange-700 nuit:text-orange-300",
    bandeau: "border-orange-200 bg-orange-50",
    zone: "bg-orange-50 text-orange-300",
    repere: "bg-orange-400",
  },
  "boissons": {
    pastille: "bg-cyan-100 text-cyan-800",
    survol: "group-hover:bg-cyan-200 group-active:bg-cyan-200",
    trait: "text-cyan-700 nuit:text-cyan-300",
    bandeau: "border-cyan-200 bg-cyan-50",
    zone: "bg-cyan-50 text-cyan-300",
    repere: "bg-cyan-400",
  },
  "fruits-legumes": {
    pastille: "bg-lime-100 text-lime-800",
    survol: "group-hover:bg-lime-200 group-active:bg-lime-200",
    trait: "text-lime-700 nuit:text-lime-300",
    bandeau: "border-lime-200 bg-lime-50",
    zone: "bg-lime-50 text-lime-300",
    repere: "bg-lime-400",
  },
  "boucherie-poisson": {
    pastille: "bg-blue-100 text-blue-800",
    survol: "group-hover:bg-blue-200 group-active:bg-blue-200",
    trait: "text-blue-700 nuit:text-blue-300",
    bandeau: "border-blue-200 bg-blue-50",
    zone: "bg-blue-50 text-blue-300",
    repere: "bg-blue-400",
  },
  "poisson": {
    pastille: "bg-blue-100 text-blue-800",
    survol: "group-hover:bg-blue-200 group-active:bg-blue-200",
    trait: "text-blue-700 nuit:text-blue-300",
    bandeau: "border-blue-200 bg-blue-50",
    zone: "bg-blue-50 text-blue-300",
    repere: "bg-blue-400",
  },
  "surgeles-glaces": {
    pastille: "bg-indigo-100 text-indigo-800",
    survol: "group-hover:bg-indigo-200 group-active:bg-indigo-200",
    trait: "text-indigo-700 nuit:text-indigo-300",
    bandeau: "border-indigo-200 bg-indigo-50",
    zone: "bg-indigo-50 text-indigo-300",
    repere: "bg-indigo-400",
  },
  "apero-snacks": {
    pastille: "bg-rose-100 text-rose-800",
    survol: "group-hover:bg-rose-200 group-active:bg-rose-200",
    trait: "text-rose-700 nuit:text-rose-300",
    bandeau: "border-rose-200 bg-rose-50",
    zone: "bg-rose-50 text-rose-300",
    repere: "bg-rose-400",
  },
  "bebe-enfants": {
    pastille: "bg-pink-100 text-pink-800",
    survol: "group-hover:bg-pink-200 group-active:bg-pink-200",
    trait: "text-pink-700 nuit:text-pink-300",
    bandeau: "border-pink-200 bg-pink-50",
    zone: "bg-pink-50 text-pink-300",
    repere: "bg-pink-400",
  },
  "plage-soleil": {
    pastille: "bg-yellow-100 text-yellow-800",
    survol: "group-hover:bg-yellow-200 group-active:bg-yellow-200",
    trait: "text-yellow-700 nuit:text-yellow-300",
    bandeau: "border-yellow-200 bg-yellow-50",
    zone: "bg-yellow-50 text-yellow-300",
    repere: "bg-yellow-400",
  },
  "chargeurs-electronique": {
    pastille: "bg-violet-100 text-violet-800",
    survol: "group-hover:bg-violet-200 group-active:bg-violet-200",
    trait: "text-violet-700 nuit:text-violet-300",
    bandeau: "border-violet-200 bg-violet-50",
    zone: "bg-violet-50 text-violet-300",
    repere: "bg-violet-400",
  },
  "vetements": {
    pastille: "bg-fuchsia-100 text-fuchsia-800",
    survol: "group-hover:bg-fuchsia-200 group-active:bg-fuchsia-200",
    trait: "text-fuchsia-700 nuit:text-fuchsia-300",
    bandeau: "border-fuchsia-200 bg-fuchsia-50",
    zone: "bg-fuchsia-50 text-fuchsia-300",
    repere: "bg-fuchsia-400",
  },
  "pharmacie-hygiene": {
    pastille: "bg-emerald-100 text-emerald-800",
    survol: "group-hover:bg-emerald-200 group-active:bg-emerald-200",
    trait: "text-emerald-700 nuit:text-emerald-300",
    bandeau: "border-emerald-200 bg-emerald-50",
    zone: "bg-emerald-50 text-emerald-300",
    repere: "bg-emerald-400",
  },
  "maison-entretien": {
    pastille: "bg-teal-100 text-teal-800",
    survol: "group-hover:bg-teal-200 group-active:bg-teal-200",
    trait: "text-teal-700 nuit:text-teal-300",
    bandeau: "border-teal-200 bg-teal-50",
    zone: "bg-teal-50 text-teal-300",
    repere: "bg-teal-400",
  },
  "shabbat-casher": {
    pastille: "bg-red-100 text-red-800",
    survol: "group-hover:bg-red-200 group-active:bg-red-200",
    trait: "text-red-700 nuit:text-red-300",
    bandeau: "border-red-200 bg-red-50",
    zone: "bg-red-50 text-red-300",
    repere: "bg-red-400",
  },
  "cadeaux-fleurs": {
    pastille: "bg-purple-100 text-purple-800",
    survol: "group-hover:bg-purple-200 group-active:bg-purple-200",
    trait: "text-purple-700 nuit:text-purple-300",
    bandeau: "border-purple-200 bg-purple-50",
    zone: "bg-purple-50 text-purple-300",
    repere: "bg-purple-400",
  },
};

/** Les rayons qui ont leur couleur (les mêmes adresses que les icônes). */
export const RAYONS_EN_COULEUR = Object.keys(PAR_RAYON);

/** La couleur d'un rayon ; le gris pour un rayon créé par le gérant. */
export const couleurDuRayon = (slug: string): CouleurDeRayon => PAR_RAYON[slug] ?? GRIS;
