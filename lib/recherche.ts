// La recherche du site (pur) : ce que le visiteur tape, ce qui lui correspond, et dans quel ordre.
// Elle ignore les majuscules, les accents et la ponctuation (« cafe » trouve « café », « oeufs » trouve « œufs »,
// « coca zero » trouve « Coca-Cola Zero ») et demande que CHAQUE mot tapé se retrouve dans l'article — dans son
// nom, sinon dans sa description, son rayon ou son sous-rayon. Elle sert à la recherche « vivante » de l'en-tête,
// qui interroge le site à chaque frappe : un visiteur ne tape ni les accents ni les tirets.

/** En dessous, on ne cherche pas : une seule lettre ramènerait tout le catalogue. */
export const LONGUEUR_MINIMALE = 2;
const LONGUEUR_MAXIMALE = 80;
const MOTS_AU_PLUS = 8;

/** Un texte ramené à des mots simples séparés par une espace : minuscules, sans accents ni signes. */
export function simplifier(texte: string): string {
  return texte
    .toLowerCase()
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/\p{M}+/gu, "") // accents, et points-voyelles de l'hébreu
    .replace(/[׳״]/g, "") // « צ׳יפס » et « ציפס » sont le même mot
    .replace(/(?<=[֐-׿])['’"](?=[֐-׿])/g, "") // la même apostrophe, tapée au clavier
    .replace(/[^\p{L}\p{N}]+/gu, " ") // tirets, apostrophes, virgules, « % », « × »…
    .trim();
}

/** Les mots d'une recherche ; aucun si elle est trop courte pour être lancée. */
export function motsDeRecherche(texte: string): string[] {
  const mots = simplifier(texte.slice(0, LONGUEUR_MAXIMALE)).split(" ").filter(Boolean).slice(0, MOTS_AU_PLUS);
  return mots.join("").length < LONGUEUR_MINIMALE ? [] : mots;
}

/** Ce qu'on cherche dans un article, déjà simplifié : son nom (dans les langues utiles), et le reste. */
export type Fiche = { nom: string; autres: string };

export function ficheDe(noms: string[], autres: string[]): Fiche {
  return { nom: [...new Set(noms.map(simplifier))].join(" "), autres: [...new Set(autres.map(simplifier))].join(" ") };
}

/**
 * À quel point un article répond à la recherche :
 * 0 — chaque mot tapé est un mot entier de son nom (« lait » → « Lait Tnuva 3 % », avant « Laitue ») ;
 * 1 — chaque mot tapé commence un mot de son nom (« coc » → « Coca-Cola ») ;
 * 2 — chaque mot est dans son nom ;
 * 3 — chaque mot est quelque part (description, rayon, sous-rayon) ;
 * null — un mot au moins ne s'y trouve pas.
 */
export function rangDe(fiche: Fiche, mots: string[]): 0 | 1 | 2 | 3 | null {
  if (mots.length === 0) return null;
  const nom = ` ${fiche.nom} `;
  const tout = ` ${fiche.nom} ${fiche.autres} `;
  if (!mots.every((m) => tout.includes(m))) return null;
  if (mots.every((m) => nom.includes(` ${m} `))) return 0;
  if (mots.every((m) => nom.includes(` ${m}`))) return 1;
  if (mots.every((m) => nom.includes(m))) return 2;
  return 3;
}

/**
 * Les articles qui répondent à la recherche, les meilleurs d'abord ; à rang égal, l'ordre reçu est gardé
 * (celui du catalogue).
 */
export function classer<T>(articles: T[], fiche: (article: T) => Fiche, mots: string[], maximum = 60): T[] {
  const parRang: [T[], T[], T[], T[]] = [[], [], [], []];
  for (const a of articles) {
    const rang = rangDe(fiche(a), mots);
    if (rang !== null) parRang[rang].push(a);
  }
  return parRang.flat().slice(0, maximum);
}

/** L'adresse des résultats pour ce texte, à partir de l'adresse de la page de recherche (avec son préfixe de langue). */
export function adresseDesResultats(pageDeRecherche: string, texte: string): string {
  const q = texte.trim().slice(0, LONGUEUR_MAXIMALE);
  return q ? `${pageDeRecherche}?q=${encodeURIComponent(q)}` : pageDeRecherche;
}
