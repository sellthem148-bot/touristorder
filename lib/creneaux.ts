// Les jours et créneaux de livraison proposés au client : une seule définition,
// pour le panier (ce qu'on propose) et le serveur (ce qu'on accepte).
import { ajouterJours, jourEnIsrael, libelleDuJour } from "./dates";
import { debutDuCreneau, jourDeLaSemaine, momentPresent } from "./tarifs";

export type JourDeLivraison = { valeur: string; libelle: string; creneaux: string[] };

export const NOMBRE_DE_JOURS = 8;

/** L'heure de fin d'un créneau (« 19:00 – 20:00 » → 1200 ; « 23:00 – 00:00 » → 1440). null s'il n'y en a pas. */
export function finDuCreneau(creneau: string): number | null {
  const heures = [...creneau.matchAll(/(\d{1,2})\s*[:h]\s*(\d{2})/g)].map((m) => Number(m[1]) * 60 + Number(m[2]));
  if (heures.length < 2) return null;
  const [debut, fin] = heures;
  return fin <= debut ? fin + 24 * 60 : fin; // passe minuit
}

/**
 * Les prochains jours livrés (sur NOMBRE_DE_JOURS jours) et, pour chacun, les créneaux
 * encore possibles. Aujourd'hui : seulement les créneaux qui commencent au moins
 * `delaiMinutes` après maintenant (le temps de commander sur Wolt et de préparer).
 * Un créneau sans heure (« Dès que possible ») reste proposé. Un jour sans créneau disparaît.
 */
export function joursDeLivraison(
  creneaux: string[],
  joursLivres: number[],
  delaiMinutes: number,
  maintenant: Date = new Date(),
  nombre: number = NOMBRE_DE_JOURS,
): JourDeLivraison[] {
  const aujourdhui = jourEnIsrael(maintenant);
  const limite = momentPresent(maintenant).minutes + Math.max(0, delaiMinutes);
  const jours: JourDeLivraison[] = [];
  for (let i = 0; i < nombre; i++) {
    const jour = ajouterJours(aujourdhui, i);
    if (!joursLivres.includes(jourDeLaSemaine(jour))) continue;
    const possibles =
      i === 0
        ? creneaux.filter((c) => {
            const debut = debutDuCreneau(c);
            return debut == null || debut >= limite;
          })
        : creneaux;
    if (possibles.length > 0) jours.push({ valeur: jour, libelle: libelleDuJour(jour, maintenant), creneaux: possibles });
  }
  return jours;
}

/** « 19h – 00h » : du début du premier créneau à la fin du dernier. null si les créneaux n'ont pas d'heures. */
export function amplitudeDesCreneaux(creneaux: string[]): string | null {
  const debuts = creneaux.map(debutDuCreneau).filter((x): x is number => x != null);
  const fins = creneaux.map(finDuCreneau).filter((x): x is number => x != null);
  if (debuts.length === 0 || fins.length === 0) return null;
  const h = (minutes: number) => {
    const m = minutes % (24 * 60);
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = m % 60;
    return mm ? `${hh}h${String(mm).padStart(2, "0")}` : `${hh}h`;
  };
  return `${h(Math.min(...debuts))} – ${h(Math.max(...fins))}`;
}
