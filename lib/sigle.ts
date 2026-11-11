// Le sigle de la marque : un T et un O plein, couleur soleil, dans une tuile encre.
// Un seul tracé pour le site (components/Sigle.tsx), l'icône de l'onglet, l'icône de téléphone,
// la carte d'aperçu de lien et les fichiers de public/logo (tests/logo.test.ts les compare).
export const SIGLE = {
  /** Côté du dessin : tout est tracé dans un carré de 64. */
  cote: 64,
  /** Arrondi de la tuile. */
  rayon: 16,
  encre: "#0d1321",
  blanc: "#ffffff",
  /** La seule couleur vive de la marque : réservée au O du sigle. */
  soleil: "#f2b632",
  /** La lettre T. */
  t: "M8 20h21.6v6.8h-7.4v17.2h-6.8v-17.2h-7.4z",
  /** La lettre O : un disque plein, de la hauteur du T. */
  o: { cx: 44.2, cy: 32, r: 12 },
} as const;
