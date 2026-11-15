/**
 * La couleur d'un rayon (demande du gérant, 16 novembre 2026 : « un peu plus de couleur, mais sans en abuser »).
 *
 * Une teinte douce par rayon, reconnue à son adresse comme son icône (components/IconeRayon.tsx). Elle ne
 * colore que la PASTILLE de l'icône — fond clair, trait foncé de la même teinte — ou, dans une liste, le
 * trait de l'icône seul. Jamais un texte, un bouton, ni une tuile entière : le site reste encre et blanc.
 * Un rayon créé par le gérant (adresse inconnue) garde le gris.
 *
 * Les classes sont écrites en toutes lettres : Tailwind ne garde que celles qu'il lit dans le code.
 */
export type CouleurDeRayon = {
  /** La pastille de l'icône : son fond et son trait. */
  pastille: string;
  /** La même pastille un ton plus soutenu, au survol ou sous le doigt (dans un élément `group`). */
  survol: string;
  /** Le trait de l'icône seul, dans une liste de rayons. */
  trait: string;
};

const GRIS: CouleurDeRayon = { pastille: "bg-slate-100 text-slate-700", survol: "group-hover:bg-slate-200 group-active:bg-slate-200", trait: "text-slate-500" };

const PAR_RAYON: Record<string, CouleurDeRayon> = {
  "courses-epicerie": { pastille: "bg-amber-100 text-amber-800", survol: "group-hover:bg-amber-200 group-active:bg-amber-200", trait: "text-amber-700" },
  "cremerie-oeufs": { pastille: "bg-sky-100 text-sky-800", survol: "group-hover:bg-sky-200 group-active:bg-sky-200", trait: "text-sky-700" },
  "pain-patisserie": { pastille: "bg-orange-100 text-orange-800", survol: "group-hover:bg-orange-200 group-active:bg-orange-200", trait: "text-orange-700" },
  "boissons": { pastille: "bg-cyan-100 text-cyan-800", survol: "group-hover:bg-cyan-200 group-active:bg-cyan-200", trait: "text-cyan-700" },
  "fruits-legumes": { pastille: "bg-lime-100 text-lime-800", survol: "group-hover:bg-lime-200 group-active:bg-lime-200", trait: "text-lime-700" },
  "boucherie-poisson": { pastille: "bg-blue-100 text-blue-800", survol: "group-hover:bg-blue-200 group-active:bg-blue-200", trait: "text-blue-700" },
  "poisson": { pastille: "bg-blue-100 text-blue-800", survol: "group-hover:bg-blue-200 group-active:bg-blue-200", trait: "text-blue-700" },
  "surgeles-glaces": { pastille: "bg-indigo-100 text-indigo-800", survol: "group-hover:bg-indigo-200 group-active:bg-indigo-200", trait: "text-indigo-700" },
  "apero-snacks": { pastille: "bg-rose-100 text-rose-800", survol: "group-hover:bg-rose-200 group-active:bg-rose-200", trait: "text-rose-700" },
  "bebe-enfants": { pastille: "bg-pink-100 text-pink-800", survol: "group-hover:bg-pink-200 group-active:bg-pink-200", trait: "text-pink-700" },
  "plage-soleil": { pastille: "bg-yellow-100 text-yellow-800", survol: "group-hover:bg-yellow-200 group-active:bg-yellow-200", trait: "text-yellow-700" },
  "chargeurs-electronique": { pastille: "bg-violet-100 text-violet-800", survol: "group-hover:bg-violet-200 group-active:bg-violet-200", trait: "text-violet-700" },
  "vetements": { pastille: "bg-fuchsia-100 text-fuchsia-800", survol: "group-hover:bg-fuchsia-200 group-active:bg-fuchsia-200", trait: "text-fuchsia-700" },
  "pharmacie-hygiene": { pastille: "bg-emerald-100 text-emerald-800", survol: "group-hover:bg-emerald-200 group-active:bg-emerald-200", trait: "text-emerald-700" },
  "maison-entretien": { pastille: "bg-teal-100 text-teal-800", survol: "group-hover:bg-teal-200 group-active:bg-teal-200", trait: "text-teal-700" },
  "shabbat-casher": { pastille: "bg-red-100 text-red-800", survol: "group-hover:bg-red-200 group-active:bg-red-200", trait: "text-red-700" },
  "cadeaux-fleurs": { pastille: "bg-purple-100 text-purple-800", survol: "group-hover:bg-purple-200 group-active:bg-purple-200", trait: "text-purple-700" },
};

/** Les rayons qui ont leur couleur (les mêmes adresses que les icônes). */
export const RAYONS_EN_COULEUR = Object.keys(PAR_RAYON);

/** La couleur d'un rayon ; le gris pour un rayon créé par le gérant. */
export const couleurDuRayon = (slug: string): CouleurDeRayon => PAR_RAYON[slug] ?? GRIS;
