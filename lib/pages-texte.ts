import "server-only";
import { dateLongue } from "./dates";
import { remplir } from "./langues";
import { traduction } from "./traduction";

// La date de la dernière modification des pages légales (conditions, confidentialité, mentions).
const MIS_A_JOUR = new Date("2026-11-12T12:00:00Z");

/** Ce qu'une page de texte affiche autour de son contenu, dans la langue du client. */
export async function cadreDeLaPage() {
  const { langue, t, ts } = await traduction();
  return {
    langue,
    t,
    j: ts.juridique,
    accueil: t.commun.accueil,
    misAJour: remplir(ts.juridique.misAJour, { date: dateLongue(MIS_A_JOUR, langue) }),
    avis: ts.juridique.traduction || undefined,
  };
}
