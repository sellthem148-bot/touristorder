// Les noms de départ (rayons, modes de paiement) dans la langue du client. Pur, et sans charger
// les cinq dictionnaires : utilisable dans le navigateur avec le dictionnaire reçu du serveur.
import fr, { type Dictionnaire } from "./fr";

/** Le nom d'un rayon de départ dans la langue du client, tant que le gérant ne l'a pas renommé. */
export function nomDuRayon(rayon: { slug: string; nom: string }, t: Dictionnaire): string {
  const depart = (fr.rayons as Record<string, string>)[rayon.slug];
  return depart !== undefined && depart === rayon.nom ? (t.rayons as Record<string, string>)[rayon.slug] ?? rayon.nom : rayon.nom;
}

/**
 * Le nom d'un sous-rayon (lib/sous-rayons.ts) dans la langue du client ; « Autres » pour ce qu'aucune règle
 * ne range. Le rayon « Boucherie & poisson » d'une base ancienne lit les noms du rayon « Poisson ».
 */
export function nomDuSousRayon(slugRayon: string, cle: string, t: Dictionnaire): string {
  const rayon = slugRayon === "boucherie-poisson" ? "poisson" : slugRayon;
  return (t.sousRayons as Record<string, Record<string, string>>)[rayon]?.[cle] ?? t.categorie.autres;
}

/** Un mode de paiement de départ (« Virement ») dans la langue du client ; un mode ajouté par le gérant garde son nom. */
export function libelleDuMode(mode: string, t: Dictionnaire): string {
  return (t.modesPaiement as Record<string, string>)[mode] ?? mode;
}
