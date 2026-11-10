// Les tarifs selon le moment de la livraison (journée, nuit, week-end…).
// Une seule définition, pour le panier (affichage en direct) et le serveur (facturé).
import { FUSEAU } from "./marque";
import { jourEnIsrael } from "./dates";

export type PlageTarifaire = {
  id: string;
  nom: string;
  jours: number[]; // 0 = dimanche … 6 = samedi
  debut: string; // « HH:MM »
  fin: string; // « HH:MM » ; fin < début = passe minuit ; fin = début = toute la journée
  fraisService: number;
  fraisLivraison: number;
  fraisExpress: number;
  majorationPct: number;
};

export type Tarif = {
  nom: string; // « Tarif de base » quand aucune plage ne s'applique
  plageId: string | null;
  fraisService: number;
  fraisLivraison: number;
  fraisExpress: number; // 0 = pas d'express à ce moment
  majorationPct: number;
};

export type Moment = { jour: number; minutes: number }; // jour 0–6, minutes 0–1439

export const NOMS_JOURS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
export const JOURS_COURTS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
export const NOM_TARIF_DE_BASE = "Tarif de base";

const HEURE = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function heureValide(h: string): boolean {
  return HEURE.test(h);
}

/** « 08:30 » → 510. Suppose une heure valide. */
export function enMinutes(h: string): number {
  const [hh, mm] = h.split(":").map(Number);
  return hh * 60 + mm;
}

/** La plage contient-elle ce moment ? Les jours sont ceux du moment lui-même. */
export function dansLaPlage(p: Pick<PlageTarifaire, "jours" | "debut" | "fin">, m: Moment): boolean {
  if (!p.jours.includes(m.jour)) return false;
  if (!heureValide(p.debut) || !heureValide(p.fin)) return false;
  const d = enMinutes(p.debut);
  const f = enMinutes(p.fin);
  if (d === f) return true; // toute la journée
  if (d < f) return m.minutes >= d && m.minutes < f;
  return m.minutes >= d || m.minutes < f; // passe minuit : 20:00 → 08:00
}

/** Le tarif d'un moment : la première plage (dans l'ordre donné) qui le contient, sinon la base. */
export function tarifPour(m: Moment, plages: PlageTarifaire[], base: Omit<Tarif, "nom" | "plageId">): Tarif {
  const p = plages.find((x) => dansLaPlage(x, m));
  if (!p) return { nom: NOM_TARIF_DE_BASE, plageId: null, ...base };
  return {
    nom: p.nom,
    plageId: p.id,
    fraisService: p.fraisService,
    fraisLivraison: p.fraisLivraison,
    fraisExpress: p.fraisExpress,
    majorationPct: p.majorationPct,
  };
}

const heureIsrael = new Intl.DateTimeFormat("en-GB", { timeZone: FUSEAU, hour: "2-digit", minute: "2-digit", hourCycle: "h23" });

/** Jour de la semaine d'un « AAAA-MM-JJ » (calendrier pur). */
export function jourDeLaSemaine(jour: string): number {
  const [a, m, j] = jour.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, j)).getUTCDay();
}

/** Le moment présent, en Israël. */
export function momentPresent(maintenant: Date = new Date()): Moment {
  const [h, mn] = heureIsrael.format(maintenant).split(":").map(Number);
  return { jour: jourDeLaSemaine(jourEnIsrael(maintenant)), minutes: h * 60 + mn };
}

/** L'heure de début d'un créneau (« 18:00 – 21:00 » → 1080), ou null (« Dès que possible »). */
export function debutDuCreneau(creneau: string): number | null {
  const m = creneau.match(/(\d{1,2})\s*[:h]\s*(\d{2})/);
  if (!m) return null;
  const h = Number(m[1]);
  const mn = Number(m[2]);
  return h <= 23 && mn <= 59 ? h * 60 + mn : null;
}

/**
 * Le moment de la livraison, qui décide du tarif : le jour choisi à l'heure de
 * début du créneau. « Dès que possible » : maintenant si c'est aujourd'hui,
 * sinon midi ce jour-là.
 */
export function momentDeLivraison(dateLivraison: string, creneau: string, maintenant: Date = new Date()): Moment {
  const debut = debutDuCreneau(creneau);
  if (debut != null) return { jour: jourDeLaSemaine(dateLivraison), minutes: debut };
  if (dateLivraison === jourEnIsrael(maintenant)) return momentPresent(maintenant);
  return { jour: jourDeLaSemaine(dateLivraison), minutes: 12 * 60 };
}

/** Décrit une plage pour l'admin : « Ven, Sam · toute la journée », « Tous les jours · 21:00 → 08:00 ». */
export function decrirePlage(p: Pick<PlageTarifaire, "jours" | "debut" | "fin">): string {
  const jours = [...p.jours].sort((a, b) => a - b);
  const quand =
    jours.length === 7
      ? "Tous les jours"
      : jours.length === 5 && [0, 1, 2, 3, 4].every((j) => jours.includes(j))
        ? "Dim → Jeu"
        : jours.map((j) => JOURS_COURTS[j]).join(", ");
  const heures = p.debut === p.fin ? "toute la journée" : `${p.debut} → ${p.fin}${enMinutes(p.fin) < enMinutes(p.debut) ? " (lendemain)" : ""}`;
  return `${quand} · ${heures}`;
}

/** Le tarif de base : celui des Réglages, quand aucune plage ne s'applique. */
export function tarifDeBase(r: { fraisService: number; fraisLivraison: number; fraisExpress: number }) {
  return { fraisService: r.fraisService, fraisLivraison: r.fraisLivraison, fraisExpress: r.fraisExpress, majorationPct: 0 };
}

/** Le tarif d'une livraison (jour + créneau choisis). */
export function tarifDeLaLivraison(
  dateLivraison: string,
  creneau: string,
  plages: PlageTarifaire[],
  reglages: { fraisService: number; fraisLivraison: number; fraisExpress: number },
  maintenant: Date = new Date(),
): Tarif {
  return tarifPour(momentDeLivraison(dateLivraison, creneau, maintenant), plages, tarifDeBase(reglages));
}
