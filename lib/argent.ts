// Tous les montants sont des entiers en agorot (1 ₪ = 100 agorot).

const formateur = new Intl.NumberFormat("fr-FR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1290 → « 12,90 ₪ » */
export function formatPrix(agorot: number): string {
  return `${formateur.format(agorot / 100)} ₪`;
}

/** Valeur d'un champ de formulaire (« 12,90 », « 12.9 », « 12 ») → 1290. null si illisible. */
export function lirePrix(texte: string): number | null {
  const propre = texte.trim().replace(/\s|₪/g, "").replace(",", ".");
  if (!/^\d{1,6}(\.\d{1,2})?$/.test(propre)) return null;
  return Math.round(Number(propre) * 100);
}

/** 1290 → « 12,90 » pour pré-remplir un champ. */
export function prixPourChamp(agorot: number | null | undefined): string {
  if (agorot == null) return "";
  return (agorot / 100).toFixed(2).replace(".", ",");
}
