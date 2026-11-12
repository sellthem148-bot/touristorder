// Les dictionnaires des cinq langues du site. Le français est la référence (lib/i18n/fr.ts).
import { estLangue, LANGUE_PAR_DEFAUT, type Langue } from "../langues";
import fr, { type Dictionnaire } from "./fr";
import en from "./en";
import ru from "./ru";
import he from "./he";
import es from "./es";
import frServeur, { type DictionnaireServeur } from "./serveur/fr";
import enServeur from "./serveur/en";
import ruServeur from "./serveur/ru";
import heServeur from "./serveur/he";
import esServeur from "./serveur/es";

export type { Dictionnaire, DictionnaireServeur };

export const DICTIONNAIRES: Record<Langue, Dictionnaire> = { fr, en, ru, he, es };
export const DICTIONNAIRES_SERVEUR: Record<Langue, DictionnaireServeur> = { fr: frServeur, en: enServeur, ru: ruServeur, he: heServeur, es: esServeur };

/** Les textes du site dans une langue (ceux qui partent aussi dans le navigateur). */
export function dictionnaire(langue: Langue): Dictionnaire {
  return DICTIONNAIRES[langue] ?? fr;
}

/** Les textes que seul le serveur écrit : erreurs, e-mails, messages, pages légales. */
export function dictionnaireServeur(langue: Langue): DictionnaireServeur {
  return DICTIONNAIRES_SERVEUR[langue] ?? frServeur;
}

/** Ce qu'il faut pour écrire un e-mail au client dans sa langue (lib/courriels.ts). */
export function langueDuCourriel(langue: Langue) {
  const t = dictionnaire(langue);
  return { langue, c: dictionnaireServeur(langue).courriel, montants: t.montants };
}

/** La langue enregistrée sur une commande ou un compte ; le français si elle manque ou n'est plus proposée. */
export function langueEnregistree(code: string | null | undefined): Langue {
  return estLangue(code) ? code : LANGUE_PAR_DEFAUT;
}

import { libelleDuMode } from "./rayons";

export { libelleDuMode, nomDuRayon } from "./rayons";

/**
 * Ce qu'il faut pour écrire au client, sur WhatsApp, dans la langue de sa commande (lib/messages-client.ts) :
 * les textes des messages, et le nom du mode de paiement dans cette langue.
 */
export function langueDesMessages(code: string | null | undefined) {
  const langue = langueEnregistree(code);
  const t = dictionnaire(langue);
  return { langue, m: dictionnaireServeur(langue).messages, mode: (mode: string) => libelleDuMode(mode, t) };
}
