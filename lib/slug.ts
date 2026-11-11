/** « Bébé & enfants » → « bebe-enfants » */
export function slugDe(texte: string): string {
  return (
    texte
      // « œufs » → « oeufs » (la décomposition Unicode ne sépare pas les lettres liées).
      .replace(/œ/gi, "oe")
      .replace(/æ/gi, "ae")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "categorie"
  );
}
