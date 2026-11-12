// Les jours et créneaux de livraison proposés au client : une seule définition,
// pour le panier (ce qu'on propose) et le serveur (ce qu'on accepte).
import { ajouterJours, jourEnIsrael, libelleDuJour } from "./dates";
import type { Langue } from "./langues";
import { debutDuCreneau, enMinutes, heureValide, jourDeLaSemaine, momentPresent } from "./tarifs";

/** `creneaux` : ceux qu'on peut choisir ; `complets` : ceux qui ont atteint la limite de commandes (affichés, non choisissables). */
export type JourDeLivraison = { valeur: string; libelle: string; creneaux: string[]; complets: string[] };

/** Combien de commandes (non annulées) un créneau porte déjà : clé `cleDuCreneau(jour, créneau)`. */
export type Occupation = Record<string, number>;
export const cleDuCreneau = (jour: string, creneau: string) => `${jour}|${creneau}`;

export const NOMBRE_DE_JOURS = 8;

/** Ce que les réglages disent des livraisons. */
export type ReglesDeLivraison = {
  creneaux: string[];
  joursLivres: number[];
  delaiPreparation: number; // minutes
  heureLimite: string; // « HH:MM » : commande avant cette heure pour le soir même ; vide = pas de limite
  commandesParCreneau?: number; // commandes acceptées par créneau ; 0 ou absent = pas de limite
};

/** L'heure de fin d'un créneau (« 19:00 – 20:00 » → 1200 ; « 23:00 – 00:00 » → 1440). null s'il n'y en a pas. */
export function finDuCreneau(creneau: string): number | null {
  const heures = [...creneau.matchAll(/(\d{1,2})\s*[:h]\s*(\d{2})/g)].map((m) => Number(m[1]) * 60 + Number(m[2]));
  if (heures.length < 2) return null;
  const [debut, fin] = heures;
  return fin <= debut ? fin + 24 * 60 : fin; // passe minuit
}

/** L'heure limite du jour même est-elle passée ? (false s'il n'y en a pas.) */
export function heureLimitePassee(heureLimite: string, maintenant: Date = new Date()): boolean {
  return heureValide(heureLimite) && momentPresent(maintenant).minutes >= enMinutes(heureLimite);
}

/**
 * Les prochains jours livrés (sur NOMBRE_DE_JOURS jours) et, pour chacun, les créneaux
 * encore possibles. Aujourd'hui : seulement avant l'heure limite (le temps que Wolt
 * livre les articles dans la journée), et seulement les créneaux qui commencent au
 * moins `delaiPreparation` après maintenant. Un créneau sans heure (« Dès que possible »)
 * reste proposé. Un créneau qui a atteint `commandesParCreneau` (d'après `occupation`) est
 * « complet » : montré, mais plus choisissable. Un jour sans créneau à choisir disparaît.
 */
export function joursDeLivraison(
  regles: ReglesDeLivraison,
  maintenant: Date = new Date(),
  nombre: number = NOMBRE_DE_JOURS,
  occupation: Occupation = {},
): JourDeLivraison[] {
  const { creneaux, joursLivres, delaiPreparation } = regles;
  const aujourdhui = jourEnIsrael(maintenant);
  const fermeAujourdhui = heureLimitePassee(regles.heureLimite, maintenant);
  const limite = momentPresent(maintenant).minutes + Math.max(0, delaiPreparation);
  const jours: JourDeLivraison[] = [];
  for (let i = 0; i < nombre; i++) {
    const jour = ajouterJours(aujourdhui, i);
    if (!joursLivres.includes(jourDeLaSemaine(jour))) continue;
    if (i === 0 && fermeAujourdhui) continue;
    const possibles =
      i === 0
        ? creneaux.filter((c) => {
            const debut = debutDuCreneau(c);
            return debut == null || debut >= limite;
          })
        : creneaux;
    const plafond = regles.commandesParCreneau ?? 0;
    const complets = plafond > 0 ? possibles.filter((c) => (occupation[cleDuCreneau(jour, c)] ?? 0) >= plafond) : [];
    const libres = possibles.filter((c) => !complets.includes(c));
    if (libres.length > 0) jours.push({ valeur: jour, libelle: libelleDuJour(jour, maintenant), creneaux: libres, complets });
  }
  return jours;
}

/**
 * « 19h – 00h » : du début du premier créneau à la fin du dernier. null si les créneaux n'ont pas d'heures.
 * Hors du français, les heures s'écrivent « 19:00 – 00:00 ».
 */
export function amplitudeDesCreneaux(creneaux: string[], langue: Langue = "fr"): string | null {
  const debuts = creneaux.map(debutDuCreneau).filter((x): x is number => x != null);
  const fins = creneaux.map(finDuCreneau).filter((x): x is number => x != null);
  if (debuts.length === 0 || fins.length === 0) return null;
  const h = (minutes: number) => {
    const m = minutes % (24 * 60);
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = m % 60;
    if (langue !== "fr") return `${hh}:${String(mm).padStart(2, "0")}`;
    return mm ? `${hh}h${String(mm).padStart(2, "0")}` : `${hh}h`;
  };
  return `${h(Math.min(...debuts))} – ${h(Math.max(...fins))}`;
}
