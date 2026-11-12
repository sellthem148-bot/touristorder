import "server-only";
import { cookies, headers } from "next/headers";
import { choisirLangue, COOKIE_LANGUE, ENTETE_LANGUE, estLangue, lienPour, type Langue } from "./langues";
import { dictionnaire, dictionnaireServeur } from "./i18n";

/**
 * La langue de la page demandée : celle de son adresse (« /he/… » → l'hébreu, sans préfixe → le français),
 * que proxy.ts transmet dans l'en-tête `x-langue`. Hors de ces adresses (l'espace gérant, le lien de
 * connexion) : la langue choisie par le visiteur (cookie), sinon celle de son navigateur, sinon le français.
 */
export async function langueActuelle(): Promise<Langue> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  const adresse = h.get(ENTETE_LANGUE);
  if (estLangue(adresse)) return adresse;
  return choisirLangue(c.get(COOKIE_LANGUE)?.value, h.get("accept-language"));
}

/**
 * La langue du visiteur et ses textes : `t` (ceux du site, partagés avec le navigateur)
 * et `ts` (ceux du serveur : erreurs, e-mails, pages légales). `lien("/panier")` donne l'adresse
 * d'une page dans cette langue (« /he/panier ») : tout lien et toute redirection côté client passent par lui.
 */
export async function traduction() {
  const langue = await langueActuelle();
  return { langue, t: dictionnaire(langue), ts: dictionnaireServeur(langue), lien: (chemin: string) => lienPour(langue, chemin) };
}
