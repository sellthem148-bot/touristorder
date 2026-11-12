import "server-only";
import { cookies, headers } from "next/headers";
import { choisirLangue, COOKIE_LANGUE, type Langue } from "./langues";
import { dictionnaire, dictionnaireServeur } from "./i18n";

/** La langue du visiteur : celle qu'il a choisie (cookie), sinon celle de son navigateur, sinon le français. */
export async function langueActuelle(): Promise<Langue> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  return choisirLangue(c.get(COOKIE_LANGUE)?.value, h.get("accept-language"));
}

/**
 * La langue du visiteur et ses textes : `t` (ceux du site, partagés avec le navigateur)
 * et `ts` (ceux du serveur : erreurs, e-mails, pages légales).
 */
export async function traduction() {
  const langue = await langueActuelle();
  return { langue, t: dictionnaire(langue), ts: dictionnaireServeur(langue) };
}
