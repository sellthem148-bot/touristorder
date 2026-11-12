// Tous les montants sont des entiers en agorot (1 ₪ = 100 agorot).
import { LOCALE, type Langue } from "./langues";

const formateurs = new Map<string, Intl.NumberFormat>();
function formateur(langue: Langue, decimales: boolean): Intl.NumberFormat {
  const cle = `${langue}:${decimales}`;
  let f = formateurs.get(cle);
  if (!f) {
    f = new Intl.NumberFormat(LOCALE[langue], decimales ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : {});
    formateurs.set(cle, f);
  }
  return f;
}

// Le signe du shekel : devant le nombre en anglais (« ₪12.90 »), derrière ailleurs (« 12,90 ₪ »).
const avecSigne = (nombre: string, langue: Langue) => (langue === "en" ? `₪${nombre}` : `${nombre} ₪`);

/** 1290 → « 12,90 ₪ » (français par défaut : l'espace gérant, les exports). */
export function formatPrix(agorot: number, langue: Langue = "fr"): string {
  return avecSigne(formateur(langue, true).format(agorot / 100), langue);
}

/** 1000 → « 10 ₪ », 1250 → « 12,50 ₪ » (pastilles, badges). */
export function formatPrixCourt(agorot: number, langue: Langue = "fr"): string {
  return agorot % 100 === 0 ? avecSigne(formateur(langue, false).format(agorot / 100), langue) : formatPrix(agorot, langue);
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
