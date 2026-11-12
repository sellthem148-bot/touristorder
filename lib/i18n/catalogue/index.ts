// Le catalogue dans les quatre autres langues : noms et descriptions des articles de départ, options,
// villes, noms des tarifs. Un texte que le gérant a écrit ou réécrit lui-même n'y est pas : il reste tel quel.
//
// Pur, mais LOURD (une centaine de Ko par langue) : jamais importé par un composant du navigateur.
// Les pages traduisent côté serveur (lib/catalogue.ts, lib/commande-courriels.ts) et n'envoient que le résultat.
import { LOCALE, type Langue } from "../../langues";
import type { GroupeOptions } from "../../options";
import type { TraductionsCatalogue } from "./type";
import en from "./en";
import ru from "./ru";
import he from "./he";
import es from "./es";

export type { TraductionsCatalogue };

export const CATALOGUES: Partial<Record<Langue, TraductionsCatalogue>> = { en, ru, he, es };

type Table = keyof TraductionsCatalogue;

/** La traduction d'un texte du catalogue ; le texte lui-même en français ou quand il n'est pas connu. */
function traduire(table: Table, texte: string, langue: Langue): string {
  const t = CATALOGUES[langue]?.[table];
  const cle = texte.trim();
  return t && Object.hasOwn(t, cle) ? t[cle] : texte;
}

export const nomArticle = (nom: string, langue: Langue) => traduire("noms", nom, langue);
export const descriptionArticle = (description: string, langue: Langue) => traduire("descriptions", description, langue);
export const nomGroupe = (nom: string, langue: Langue) => traduire("groupes", nom, langue);
export const libelleChoix = (libelle: string, langue: Langue) => traduire("choix", libelle, langue);
export const nomVille = (nom: string, langue: Langue) => traduire("villes", nom, langue);
export const nomTarif = (nom: string, langue: Langue) => traduire("tarifs", nom, langue);
export const sujetPhoto = (sujet: string, langue: Langue) => traduire("sujets", sujet, langue);

/** « : » entre une option et son choix — avec une espace devant en français seulement. */
export const deuxPointsDe = (langue: Langue) => (langue === "fr" ? " : " : ": ");

/** Les options d'un produit avec leurs noms dans la langue du client (`affiche`) ; ce qui est choisi reste le texte du gérant. */
export function traduireGroupes(groupes: GroupeOptions[], langue: Langue): GroupeOptions[] {
  if (langue === "fr") return groupes;
  return groupes.map((g) => ({
    ...g,
    affiche: nomGroupe(g.nom, langue),
    choix: g.choix.map((c) => ({ ...c, affiche: libelleChoix(c.libelle, langue) })),
  }));
}

/**
 * Le libellé gardé sur une ligne de commande (« Taille : 4 ans · Couleur : Bleu ») dans la langue du client.
 * Un libellé qui n'a pas cette forme est rendu tel quel.
 */
export function libelleOptions(libelle: string, langue: Langue): string {
  if (langue === "fr" || !libelle.trim()) return libelle;
  const morceaux: string[] = [];
  for (const morceau of libelle.split(" · ")) {
    const i = morceau.indexOf(" : ");
    if (i < 1) return libelle;
    morceaux.push(`${nomGroupe(morceau.slice(0, i), langue)}${deuxPointsDe(langue)}${libelleChoix(morceau.slice(i + 3), langue)}`);
  }
  return morceaux.join(" · ");
}

/**
 * La recherche dans la langue du client : les noms et les descriptions FRANÇAIS (ceux de la base) dont
 * la traduction contient le texte cherché. Rien en français : la base se cherche directement.
 */
export function chercherDansLaLangue(texte: string, langue: Langue, maximum = 200): { noms: string[]; descriptions: string[] } {
  const t = CATALOGUES[langue];
  const q = texte.trim().toLocaleLowerCase(LOCALE[langue]);
  if (!t || q.length < 2) return { noms: [], descriptions: [] };
  const trouves = (table: Record<string, string>) =>
    Object.keys(table).filter((fr) => table[fr].toLocaleLowerCase(LOCALE[langue]).includes(q)).slice(0, maximum);
  return { noms: trouves(t.noms), descriptions: trouves(t.descriptions) };
}
