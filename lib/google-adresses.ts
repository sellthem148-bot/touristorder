// Les propositions d'adresse de Google, dans le NAVIGATEUR seulement (Maps JavaScript API, bibliothèque
// « places » : « Place Autocomplete Data API »). Rien n'est chargé sans la clé du gérant : c'est la page du
// panier qui la reçoit du serveur (lib/google-maps.ts) et la passe ici — ce fichier ne lit aucune variable.
//
// Ce que Google facture : les propositions d'une même saisie forment une « session » (un jeton) qui se termine
// par la lecture de l'adresse choisie. On ne demande que des champs « Essentials » (composants d'adresse,
// adresse écrite, types) — jamais `displayName`, qui ferait passer la lecture au tarif supérieur.
import type { Langue } from "./langues";
import { lieuDepuisGoogle, ligneDAdresse, type ComposantGoogle } from "./lieu-google";
import { positionValide, type LieuReconnu, type Position } from "./zones";

/** La mention que Google exige sous ses propositions affichées sans carte. Une marque : elle ne se traduit pas. */
export const MENTION_GOOGLE = "Powered by Google";
/** Son logo, servi par Google (celui de son propre champ d'adresse). S'il ne se charge pas, la mention s'écrit. */
export const LOGO_GOOGLE = "https://maps.gstatic.com/mapfiles/api-3/images/powered-by-google-on-white3_hdpi.png";

export const LONGUEUR_MINIMALE_D_UNE_SAISIE = 3;
export const PROPOSITIONS_AU_PLUS = 5;

// Les codes de langue de Google (l'hébreu y est « iw »).
const LANGUE_GOOGLE: Record<Langue, string> = { fr: "fr", en: "en", ru: "ru", he: "iw", es: "es" };
const HEBREU = "iw";
// Où le gérant livre, à grands traits (de Césarée à Tel Aviv) : Google propose d'abord les adresses de ce
// rectangle, sans exclure les autres. Seul l'ordre des propositions en dépend.
const REGION_LIVREE = { north: 32.56, south: 32.0, west: 34.74, east: 35.0 };

// Ce que le site utilise de la bibliothèque de Google, et rien d'autre.
type TexteGoogle = { text?: string; toString(): string } | null | undefined;
type LieuGoogle = {
  id?: string;
  addressComponents?: ComposantGoogle[] | null;
  formattedAddress?: string | null;
  /** La position du lieu : chez Google, un objet dont `lat` et `lng` sont des fonctions. */
  location?: { lat: number | (() => number); lng: number | (() => number) } | null;
  types?: string[] | null;
  fetchFields(options: { fields: string[] }): Promise<{ place?: LieuGoogle } | undefined>;
};
type PredictionGoogle = { placeId?: string; mainText?: TexteGoogle; secondaryText?: TexteGoogle; text?: TexteGoogle; types?: string[] | null; toPlace(): LieuGoogle };
type Places = {
  AutocompleteSuggestion: { fetchAutocompleteSuggestions(demande: Record<string, unknown>): Promise<{ suggestions?: { placePrediction?: PredictionGoogle | null }[] }> };
  AutocompleteSessionToken: new () => unknown;
  Place: new (options: { id: string; requestedLanguage?: string; requestedRegion?: string }) => LieuGoogle;
};
type Fenetre = Window & {
  google?: { maps?: { importLibrary?: (nom: string) => Promise<unknown> } };
  gm_authFailure?: () => void;
  __adressesGoogle?: () => void;
};

/** Une proposition de Google, prête à afficher. */
export type Proposition = { id: string; principal: string; secondaire: string; prediction: PredictionGoogle };

/** L'adresse que le client a choisie : la ligne pour son champ, l'adresse entière, et le lieu (ville, quartier, rue). */
export type AdresseChoisie = { ligne: string; adresse: string; lieu: LieuReconnu };

let chargement: Promise<Places> | null = null;
// Google a refusé la clé (mauvaise clé, site non autorisé, facturation coupée), son script n'arrive pas ou
// ses propositions échouent : on n'insiste pas, le champ redevient un champ ordinaire — sans rien dire au client.
let refuse = false;
const aPrevenir = new Set<() => void>();

function refuser() {
  refuse = true;
  for (const prevenir of aPrevenir) prevenir();
}

/** Les propositions sont-elles encore possibles (Google n'a rien refusé depuis l'ouverture de la page) ? */
export const adressesGoogleDisponibles = () => !refuse;

/** Être prévenu si Google refuse la clé en cours de route. Rend de quoi se désabonner. */
export function surRefusDeGoogle(prevenir: () => void): () => void {
  aPrevenir.add(prevenir);
  return () => {
    aPrevenir.delete(prevenir);
  };
}

/**
 * Charge la bibliothèque de Google, une seule fois, à la première demande (jamais à l'ouverture de la page).
 * `cle` : la clé du gérant, reçue du serveur ; sans elle, rien n'est demandé à Google.
 */
export function chargerLesAdresses(cle: string, langue: Langue): Promise<Places> {
  if (!cle || !adressesGoogleDisponibles() || typeof window === "undefined") return Promise.reject(new Error("propositions indisponibles"));
  chargement ??= new Promise<Places>((resolve, reject) => {
    const fenetre = window as Fenetre;
    const echec = (raison: string) => {
      refuser();
      reject(new Error(raison));
    };
    // Google appelle cette fonction quand il refuse la clé — parfois après le chargement.
    fenetre.gm_authFailure = () => echec("clé refusée");
    fenetre.__adressesGoogle = () => {
      const importer = fenetre.google?.maps?.importLibrary;
      if (!importer) return echec("bibliothèque absente");
      importer("places").then((places) => resolve(places as Places), () => echec("bibliothèque refusée"));
    };
    const parametres = new URLSearchParams({ key: cle, v: "weekly", loading: "async", callback: "__adressesGoogle", language: LANGUE_GOOGLE[langue], region: "IL" });
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?${parametres}`;
    script.async = true;
    script.onerror = () => echec("script injoignable");
    document.head.append(script);
  });
  return chargement;
}

const lire = (texte: TexteGoogle) => (texte ? String(texte.text ?? texte.toString()) : "").replace(/\s+/g, " ").trim();

// Si Google refuse la région proposée (forme de la demande), on s'en passe : seul l'ordre des propositions change.
let avecRegion = true;

/**
 * Les propositions de Google pour ce que le client a tapé : en Israël seulement, dans la langue du site.
 * `session` : le jeton de la saisie en cours (créé au besoin, remis à zéro quand une adresse est choisie).
 */
export async function proposerDesAdresses(places: Places, saisie: string, langue: Langue, session: { jeton: unknown }): Promise<Proposition[]> {
  session.jeton ??= new places.AutocompleteSessionToken();
  const demande = { input: saisie, includedRegionCodes: ["il"], language: LANGUE_GOOGLE[langue], region: "il", sessionToken: session.jeton };
  let reponse;
  try {
    reponse = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(avecRegion ? { ...demande, locationBias: REGION_LIVREE } : demande);
  } catch {
    // Une clé refusée (« Permission denied on the service. », site non autorisé) lève ici, comme une région
    // mal comprise : on réessaie une fois sans la région, et si Google refuse encore, on ne lui demande plus rien.
    try {
      if (!avecRegion) throw new Error("propositions refusées");
      avecRegion = false;
      reponse = await places.AutocompleteSuggestion.fetchAutocompleteSuggestions(demande);
    } catch (erreur) {
      refuser();
      throw erreur;
    }
  }
  const propositions: Proposition[] = [];
  for (const s of reponse.suggestions ?? []) {
    const prediction = s.placePrediction;
    if (!prediction) continue;
    const principal = lire(prediction.mainText) || lire(prediction.text);
    if (!principal) continue;
    propositions.push({ id: prediction.placeId || `${propositions.length}-${principal}`, principal, secondaire: lire(prediction.secondaryText), prediction });
    if (propositions.length === PROPOSITIONS_AU_PLUS) break;
  }
  return propositions;
}

// Des champs « Essentials » seulement : `displayName` ferait passer la lecture au tarif supérieur.
const CHAMPS_ESSENTIELS = ["addressComponents", "formattedAddress", "types", "location"];

/** La position que Google donne au lieu, si elle est plausible. */
function positionDe(lieu: LieuGoogle): Position | null {
  const l = lieu.location;
  if (!l) return null;
  const nombre = (v: number | (() => number)) => (typeof v === "function" ? v() : v);
  try {
    return positionValide(nombre(l.lat), nombre(l.lng));
  } catch {
    return null;
  }
}
const CHAMPS_DES_AUTRES_LECTURES = ["addressComponents", "formattedAddress"];

/**
 * Les autres langues dans lesquelles relire l'adresse choisie, en plus de celle du site (codes de Google).
 * Google rend les composants dans la langue demandée — pour un site en français : « Ehud Manor Street »,
 * « Netanya », même si le client a tapé en hébreu. Or le gérant note ses rues en lettres latines OU en hébreu,
 * et c'est en hébreu que les villes s'écrivent d'une seule façon. Il faut donc toujours les deux écritures :
 * l'hébreu pour un site en lettres latines, l'anglais pour le site en hébreu, les deux pour le site en russe.
 */
export function autresLectures(langue: Langue): string[] {
  if (langue === "he") return ["en"];
  return langue === "ru" ? [HEBREU, "en"] : [HEBREU];
}

/**
 * L'adresse choisie : ses composants dans la langue du site (cette lecture termine la session de Google), puis
 * dans les autres écritures (`autresLectures`). Ces lectures-là sont facultatives : si l'une échoue, on fait sans.
 */
export async function lireLAdresseChoisie(places: Places, proposition: Proposition, langue: Langue): Promise<AdresseChoisie> {
  const lieu = proposition.prediction.toPlace();
  const id = lieu.id ?? proposition.prediction.placeId;
  const autres = id ? autresLectures(langue).map((code) => ({ code, lieu: new places.Place({ id, requestedLanguage: code, requestedRegion: "il" }) })) : [];
  const [premiere, ...suites] = await Promise.allSettled([lieu.fetchFields({ fields: CHAMPS_ESSENTIELS }), ...autres.map((a) => a.lieu.fetchFields({ fields: CHAMPS_DES_AUTRES_LECTURES }))]);
  if (premiere.status === "rejected") throw premiere.reason;
  const lu = premiere.value?.place ?? lieu;
  const relus = autres.flatMap((a, i) => {
    const suite = suites[i];
    return suite.status === "fulfilled" ? [{ code: a.code, lieu: suite.value?.place ?? a.lieu }] : [];
  });
  const types = lu.types?.length ? lu.types : proposition.prediction.types;
  // L'adresse entière que lira le gérant (et Waze) : celle du site ; pour un site en russe, celle en lettres latines.
  const pourLeGerant = (langue === "ru" ? relus.find((r) => r.code === "en")?.lieu.formattedAddress : null) ?? lu.formattedAddress;
  return {
    ligne: ligneDAdresse(proposition.principal, types, lu.addressComponents),
    adresse: (pourLeGerant ?? "").trim() || [proposition.principal, proposition.secondaire].filter(Boolean).join(", "),
    // Le nom du lieu (un hôtel, une résidence) peut être un repère du gérant ; une adresse de rue l'est déjà par sa rue.
    lieu: lieuDepuisGoogle([lu.addressComponents, ...relus.map((r) => r.lieu.addressComponents)], proposition.principal, positionDe(lu)),
  };
}
