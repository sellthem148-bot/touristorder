import { FUSEAU } from "./marque";

const jourIsrael = new Intl.DateTimeFormat("en-CA", {
  timeZone: FUSEAU,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const libelleJour = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "UTC",
  weekday: "long",
  day: "numeric",
  month: "long",
});

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

/** « 2026-11-10 » → « mardi 10 novembre » */
export function libelleDuJour(jour: string, maintenant: Date = new Date()): string {
  const aujourdhui = jourEnIsrael(maintenant);
  if (jour === aujourdhui) return "Aujourd'hui";
  if (jour === ajouterJours(aujourdhui, 1)) return "Demain";
  const [a, m, j] = jour.split("-").map(Number);
  const texte = libelleJour.format(new Date(Date.UTC(a, m - 1, j)));
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** « 10/11 14:32 », heure d'Israël. */
export function formatDateHeure(instant: Date): string {
  return dateHeure.format(instant);
}
