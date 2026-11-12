import { FUSEAU } from "./marque";
import { LOCALE, type Langue } from "./langues";

const jourIsrael = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatsDuJour = new Map<Langue, Intl.DateTimeFormat>();
function formatDuJour(langue: Langue): Intl.DateTimeFormat {
  let format = formatsDuJour.get(langue);
  if (!format) {
    format = new Intl.DateTimeFormat(LOCALE[langue], { timeZone: "UTC", weekday: "long", day: "numeric", month: "long" });
    formatsDuJour.set(langue, format);
  }
  return format;
}

const AUJOURDHUI: Record<Langue, string> = { fr: "Aujourd'hui", en: "Today", ru: "Сегодня", he: "היום", es: "Hoy" };
const DEMAIN: Record<Langue, string> = { fr: "Demain", en: "Tomorrow", ru: "Завтра", he: "מחר", es: "Mañana" };

const dateHeure = new Intl.DateTimeFormat("fr-FR", {
  timeZone: FUSEAU,
  day: "2-digit",
  month: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

/** Le jour en Israël (AAAA-MM-JJ) d'un instant. */
export function jourEnIsrael(instant: Date = new Date()): string {
  return jourIsrael.format(instant);
}

/** AAAA-MM-JJ + n jours (calendrier pur, sans fuseau). */
export function ajouterJours(jour: string, n: number): string {
  const [a, m, j] = jour.split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 1, j + n));
  return d.toISOString().slice(0, 10);
}

/** Les jours proposés au client : aujourd'hui (Israël) et les `nombre - 1` suivants. */
export function joursProposes(nombre = 8, maintenant: Date = new Date()): string[] {
  const aujourdhui = jourEnIsrael(maintenant);
  return Array.from({ length: nombre }, (_, i) => ajouterJours(aujourdhui, i));
}

/** « 2026-11-10 » → « Mardi 10 novembre » (ou « Aujourd'hui », « Demain »), dans la langue demandée. */
export function libelleDuJour(jour: string, maintenant: Date = new Date(), langue: Langue = "fr"): string {
  const aujourdhui = jourEnIsrael(maintenant);
  if (jour === aujourdhui) return AUJOURDHUI[langue];
  if (jour === ajouterJours(aujourdhui, 1)) return DEMAIN[langue];
  const [a, m, j] = jour.split("-").map(Number);
  const texte = formatDuJour(langue).format(new Date(Date.UTC(a, m - 1, j)));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Le jour est-il aujourd'hui (en Israël) ? */
export function estAujourdhui(jour: string, maintenant: Date = new Date()): boolean {
  return jour === jourEnIsrael(maintenant);
}

/** « 12 novembre 2026 », dans la langue demandée (jour israélien). */
export function dateLongue(instant: Date, langue: Langue = "fr"): string {
  return new Intl.DateTimeFormat(LOCALE[langue], { timeZone: FUSEAU, day: "numeric", month: "long", year: "numeric" }).format(instant);
}

/** « 10/11 14:32 », heure d'Israël. */
export function formatDateHeure(instant: Date): string {
  return dateHeure.format(instant);
}
