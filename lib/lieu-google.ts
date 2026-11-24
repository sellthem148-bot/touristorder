// Ce que Google renvoie pour une adresse choisie dans ses propositions, ramené à ce dont le site a besoin :
// la ligne d'adresse du client, et le lieu (ville, quartier, rue) d'où `zonePourLieu` tire la zone.
// Pur, sans rien de Google : des objets simples, pour être testé et partagé (navigateur, serveur).
import { SEPARATEUR_DE_NOMS, type LieuReconnu } from "./zones";

/** Un composant d'adresse de Google (`Place.addressComponents`). */
export type ComposantGoogle = { longText?: string | null; shortText?: string | null; types?: readonly string[] | null };

/** Ce qu'on garde d'une commande : bornes des trois champs (le navigateur les envoie, le serveur les revérifie). */
export const LONGUEUR_ADRESSE_GOOGLE = 300;
export const LONGUEUR_VILLE_GOOGLE = 160;
export const LONGUEUR_REPERES_GOOGLE = 400;

// Les types de composants (documentation de Google) qui nomment la ville, puis ce qui situe dans la ville.
const TYPES_DE_VILLE = ["locality", "postal_town"];
const TYPES_DE_QUARTIER = ["neighborhood", "sublocality", "sublocality_level_1", "sublocality_level_2"];
// Un lieu de ces types est une adresse (une rue, un immeuble) ; les autres ont un nom (un hôtel — `hotel`,
// `lodging`, `establishment` —, une résidence).
const TYPES_D_ADRESSE = ["street_address", "premise", "subpremise", "route", "intersection", "street_number"];

const propre = (texte: string | null | undefined) => (texte ?? "").replace(/\s+/g, " ").trim();
const texteDe = (c: ComposantGoogle) => propre(c.longText) || propre(c.shortText);
const duType = (composants: readonly ComposantGoogle[], types: string[]) => composants.filter((c) => (c.types ?? []).some((t) => types.includes(t)));
const avecType = (composants: readonly ComposantGoogle[], types: string[]) => duType(composants, types).map(texteDe).filter(Boolean);
// Le nom long ET le nom court : Google écrit « Ehud Manor Street » et « Ehud Manor St », « Nitsa Boulevard » et « Nitsa Blvd ».
const lesDeuxNoms = (composants: readonly ComposantGoogle[], types: string[]) => duType(composants, types).flatMap((c) => [propre(c.longText), propre(c.shortText)]).filter(Boolean);
// Le trait vertical sépare les noms dans les champs enregistrés : il ne reste jamais dans un nom.
const uniques = (textes: string[]) => [...new Set(textes.map((t) => t.replace(/\|/g, " ").replace(/\s+/g, " ").trim()).filter(Boolean))];

/**
 * Le lieu, d'après les composants d'adresse — une liste par langue demandée (celle du client, puis l'hébreu :
 * les noms de villes s'y écrivent d'une seule façon, et le gérant peut avoir saisi ses rues dans l'une ou l'autre).
 * `nom` : le nom du lieu quand c'en est un (hôtel, résidence) — un repère du gérant peut le désigner.
 */
export function lieuDepuisGoogle(listes: (readonly ComposantGoogle[] | null | undefined)[], nom = ""): LieuReconnu {
  const toutes = listes.map((l) => l ?? []);
  return {
    villes: uniques(toutes.flatMap((l) => avecType(l, TYPES_DE_VILLE))),
    // Google ne range pas toujours une rue dans un quartier (aucun pour Ir Yamim, à Netanya) : c'est alors
    // la RUE qui dit le quartier, par les repères du gérant.
    precisions: uniques([...toutes.flatMap((l) => lesDeuxNoms(l, TYPES_DE_QUARTIER)), ...toutes.flatMap((l) => lesDeuxNoms(l, ["route"])), nom]),
  };
}

export function estUneAdresse(types: readonly string[] | null | undefined): boolean {
  return (types ?? []).some((t) => TYPES_D_ADRESSE.includes(t));
}

/**
 * La ligne que reçoit le champ « Rue et numéro » : ce que la proposition affichait en premier (« Herzl St 12 »,
 * dans la langue du client). Pour un lieu qui a un nom (hôtel, résidence), son nom puis sa rue : le livreur
 * a les deux. 200 caractères au plus, comme le champ.
 */
export function ligneDAdresse(principal: string, types: readonly string[] | null | undefined, composants: readonly ComposantGoogle[] | null | undefined): string {
  const nom = principal.replace(/\s+/g, " ").trim();
  if (estUneAdresse(types)) return nom.slice(0, 200);
  const rue = avecType(composants ?? [], ["route"])[0] ?? "";
  const numero = avecType(composants ?? [], ["street_number"])[0] ?? "";
  // En Israël, Google écrit le numéro après la rue, dans toutes les langues.
  const voie = [rue, numero].filter(Boolean).join(" ");
  if (!voie || nom.toLowerCase().includes(rue.toLowerCase())) return nom.slice(0, 200);
  return (nom ? `${nom}, ${voie}` : voie).slice(0, 200);
}

/** Plusieurs noms dans un champ enregistré (« Netanya | נתניה »), sans dépasser sa longueur : un nom entier ou rien. */
export function nomsEnTexte(noms: string[], longueur: number): string {
  let texte = "";
  for (const nom of uniques(noms)) {
    const suite = texte ? `${texte}${SEPARATEUR_DE_NOMS}${nom}` : nom;
    if (suite.length > longueur) break;
    texte = suite;
  }
  return texte;
}

/** Ce que le formulaire envoie avec la commande (trois champs cachés) pour une adresse reconnue. */
export function champsGoogle(adresse: string, lieu: LieuReconnu): { adresseGoogle: string; villeGoogle: string; reperesGoogle: string } {
  return {
    adresseGoogle: adresse.replace(/\s+/g, " ").trim().slice(0, LONGUEUR_ADRESSE_GOOGLE),
    villeGoogle: nomsEnTexte(lieu.villes, LONGUEUR_VILLE_GOOGLE),
    reperesGoogle: nomsEnTexte(lieu.precisions, LONGUEUR_REPERES_GOOGLE),
  };
}
