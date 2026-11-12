// Les langues du site côté client (pur : partagé serveur / navigateur).
// L'espace gérant reste en français. Le français est la langue de référence.

export const LANGUES = ["fr", "en", "ru", "he", "es"] as const;
export type Langue = (typeof LANGUES)[number];

export const LANGUE_PAR_DEFAUT: Langue = "fr";

/** Le cookie qui garde la langue choisie (un an). */
export const COOKIE_LANGUE = "langue";
export const DUREE_COOKIE_LANGUE_S = 365 * 24 * 60 * 60;

/** Le nom de chaque langue, écrit dans cette langue (le sélecteur). */
export const NOM_DE_LA_LANGUE: Record<Langue, string> = {
  fr: "Français",
  en: "English",
  ru: "Русский",
  he: "עברית",
  es: "Español",
};

/** La locale des formats (dates, nombres). */
export const LOCALE: Record<Langue, string> = {
  fr: "fr-FR",
  en: "en-GB",
  ru: "ru-RU",
  he: "he-IL",
  es: "es-ES",
};

/** L'hébreu s'écrit de droite à gauche. */
export function sens(langue: Langue): "rtl" | "ltr" {
  return langue === "he" ? "rtl" : "ltr";
}

export function estLangue(x: unknown): x is Langue {
  return typeof x === "string" && (LANGUES as readonly string[]).includes(x);
}

/** « ru-RU,ru;q=0.9,en;q=0.8 » → « ru » ; la première langue du site que le navigateur accepte. */
export function langueDepuisEntete(entete: string | null | undefined): Langue | null {
  if (!entete) return null;
  const choix = entete
    .split(",")
    .map((morceau, i) => {
      const [code, ...params] = morceau.trim().split(";");
      const q = params.map((p) => p.trim()).find((p) => p.startsWith("q="));
      return { code: code.trim().toLowerCase().split("-")[0], q: q ? Number(q.slice(2)) || 0 : 1, i };
    })
    .filter((c) => c.code && c.q > 0)
    .sort((a, b) => b.q - a.q || a.i - b.i);
  for (const c of choix) {
    // « iw » : l'ancien code de l'hébreu, encore envoyé par certains navigateurs.
    const code = c.code === "iw" ? "he" : c.code;
    if (estLangue(code)) return code;
  }
  return null;
}

/** La langue retenue : celle choisie (cookie), sinon celle du navigateur, sinon le français. */
export function choisirLangue(cookie: string | null | undefined, entete: string | null | undefined): Langue {
  if (estLangue(cookie)) return cookie;
  return langueDepuisEntete(entete) ?? LANGUE_PAR_DEFAUT;
}

/** Les formes d'un texte selon le nombre : « one » / « other », et « few » / « many » pour le russe. */
export type Formes = { one: string; few?: string; many?: string; other: string };

/** Choisit la forme d'un texte selon le nombre et la langue (« 1 article », « 2 articles » ; russe : 3 formes). */
export function pluriel(langue: Langue, n: number, formes: Formes): string {
  const regle = new Intl.PluralRules(LOCALE[langue]).select(n);
  if (regle === "one") return formes.one;
  if (regle === "few" && formes.few) return formes.few;
  if (regle === "many" && formes.many) return formes.many;
  // Le français met « 0 article » au singulier.
  if (langue === "fr" && n === 0) return formes.one;
  return formes.other;
}

/** Remplace les « {cle} » d'un modèle par leurs valeurs. Une clé inconnue reste telle quelle. */
export function remplir(modele: string, valeurs: Record<string, string | number> = {}): string {
  return modele.replace(/\{(\w+)\}/g, (tout, cle: string) => (cle in valeurs ? String(valeurs[cle]) : tout));
}

/** Le texte au bon nombre, « {n} » rempli : compter("fr", 2, { one: "{n} article", other: "{n} articles" }) → « 2 articles ». */
export function compter(langue: Langue, n: number, formes: Formes, valeurs: Record<string, string | number> = {}): string {
  return remplir(pluriel(langue, n, formes), { n, ...valeurs });
}

/** « 17:00 » → « 17h », « 17:30 » → « 17h30 » en français ; ailleurs, l'heure telle quelle. */
export function heureLisible(hhmm: string, langue: Langue): string {
  return langue === "fr" ? hhmm.replace(":", "h").replace(/h00$/, "h") : hhmm;
}

/** Un jour (« Demain », « Vendredi 13 novembre ») au milieu d'une phrase : en minuscules, sauf en anglais qui garde ses majuscules. */
export function jourDansPhrase(libelle: string, langue: Langue): string {
  return langue === "en" ? libelle : libelle.toLocaleLowerCase(LOCALE[langue]);
}

// ---------------------------------------------------------------------------------------------
// Une adresse par langue : le français garde les adresses sans préfixe (« /panier »), les autres
// langues ont le leur (« /he/panier »). proxy.ts aiguille chaque demande avec `aiguiller`.
// ---------------------------------------------------------------------------------------------

/** L'en-tête par lequel proxy.ts dit au serveur la langue de l'adresse demandée. */
export const ENTETE_LANGUE = "x-langue";

/** « /he » pour l'hébreu ; rien pour le français, qui n'a pas de préfixe. */
export function prefixeDe(langue: Langue): string {
  return langue === LANGUE_PAR_DEFAUT ? "" : `/${langue}`;
}

/**
 * L'adresse d'une page dans une langue : « /panier » → « /he/panier », « / » → « /he ».
 * Une ancre (« #rayons ») ou un lien externe est rendu tel quel.
 */
export function lienPour(langue: Langue, chemin: string): string {
  const prefixe = prefixeDe(langue);
  if (!prefixe || !chemin.startsWith("/") || chemin.startsWith("//")) return chemin;
  // « / », « /?q=… », « /#etapes » : pas de barre après le préfixe.
  return chemin === "/" || chemin[1] === "?" || chemin[1] === "#" ? `${prefixe}${chemin.slice(1)}` : `${prefixe}${chemin}`;
}

/** « /he/panier » → l'hébreu et « /panier » ; « /panier » → le français. `prefixe` : l'adresse portait un code de langue. */
export function langueDuChemin(chemin: string): { langue: Langue; chemin: string; prefixe: boolean } {
  const [, premier, ...reste] = chemin.split("/");
  if (!estLangue(premier)) return { langue: LANGUE_PAR_DEFAUT, chemin, prefixe: false };
  return { langue: premier, chemin: `/${reste.join("/")}`, prefixe: true };
}

// Ce qui n'a pas de langue : l'espace gérant (toujours en français), le lien de connexion reçu par e-mail,
// les fichiers et les images générées.
const HORS_LANGUE = /^\/(admin|compte\/acces|apercu|_next|logo|produits|uploads|icon|apple-icon|robots\.txt|sitemap\.xml|favicon\.ico)(\/|$)/;

export type Aiguillage =
  /** Hors langue : la demande passe telle quelle. */
  | { action: "laisser" }
  /** Une adresse sans préfixe, servie en français. */
  | { action: "suivre"; langue: Langue }
  /** « /he/panier » : la page « /panier », en hébreu. */
  | { action: "reecrire"; langue: Langue; chemin: string }
  | { action: "rediriger"; vers: string; permanent: boolean };

/**
 * Que faire d'une demande, d'après son adresse :
 * - « /he/… » : la page dans cette langue (c'est l'adresse qui commande, pas le cookie) ;
 * - « /fr/… » : le français n'a pas de préfixe → redirection définitive vers « /… » ;
 * - « /admin/… » : toujours en français ;
 * - « /… » : en français — sauf si le visiteur a choisi une autre langue, ou si son navigateur en
 *   demande une : il est alors envoyé vers l'adresse de sa langue. Un moteur de recherche, qui ne
 *   demande aucune langue, lit donc le français ici et chaque autre langue à sa propre adresse.
 */
export function aiguiller(o: { chemin: string; recherche?: string; methode?: string; cookie?: string | null; entete?: string | null }): Aiguillage {
  const recherche = o.recherche ?? "";
  const { langue, chemin, prefixe } = langueDuChemin(o.chemin);
  if (!prefixe) {
    // L'espace gérant est en français, de gauche à droite, quel que soit le navigateur du gérant.
    if (/^\/admin(\/|$)/.test(chemin)) return { action: "suivre", langue: LANGUE_PAR_DEFAUT };
    if (HORS_LANGUE.test(chemin)) return { action: "laisser" };
    const methode = (o.methode ?? "GET").toUpperCase();
    if (methode === "GET" || methode === "HEAD") {
      const preferee = choisirLangue(o.cookie, o.entete);
      if (preferee !== LANGUE_PAR_DEFAUT) return { action: "rediriger", vers: `${lienPour(preferee, chemin)}${recherche}`, permanent: false };
    }
    return { action: "suivre", langue: LANGUE_PAR_DEFAUT };
  }
  if (langue === LANGUE_PAR_DEFAUT) return { action: "rediriger", vers: `${chemin}${recherche}`, permanent: true };
  if (HORS_LANGUE.test(chemin)) return { action: "rediriger", vers: `${chemin}${recherche}`, permanent: false };
  return { action: "reecrire", langue, chemin };
}

/**
 * Pour les moteurs de recherche : l'adresse de référence d'une page dans sa langue, et la même page
 * dans chaque autre langue (« hreflang »). Sans langue demandée (« x-default ») : le français.
 */
export function adressesParLangue(chemin: string, langue: Langue): { canonical: string; languages: Record<string, string> } {
  return {
    canonical: lienPour(langue, chemin),
    languages: { ...Object.fromEntries(LANGUES.map((l) => [l, lienPour(l, chemin)])), "x-default": chemin },
  };
}
