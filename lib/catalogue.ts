import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { lireGroupes, type GroupeOptions } from "./options";
import { estBadge, type Badge } from "./choix-commande";
import type { Langue } from "./langues";
import { dictionnaire } from "./i18n";
import { descriptionArticle, nomArticle, traduireGroupes } from "./i18n/catalogue";
import { nomDuRayon, nomDuSousRayon } from "./i18n/rayons";
import { classer, ficheDe, motsDeRecherche, type Fiche } from "./recherche";
import { photosDAbord, sousRayonDe } from "./sous-rayons";

// Ce qu'une page PUBLIQUE lit d'un produit. Jamais le prix d'achat,
// la boutique ni le lien Wolt : ils sont à toi seul.
export const PRODUIT_PUBLIC = {
  id: true,
  nom: true,
  description: true,
  prix: true,
  prixBarre: true,
  photoUrl: true,
  epuise: true,
  badge: true,
  options: true,
  categorie: { select: { nom: true, slug: true, emoji: true } },
} satisfies Prisma.ProduitSelect;

type Brut = Prisma.ProduitGetPayload<{ select: typeof PRODUIT_PUBLIC }>;

/** Un produit tel qu'une page publique le reçoit (options lues, badge vérifié). */
export type ProduitPublic = Omit<Brut, "options" | "badge" | "prixBarre"> & {
  options: GroupeOptions[];
  badge: Badge;
  prixBarre: number | null;
  /** Le sous-rayon de l'article dans son rayon (« eaux », « colas »… ou « autres ») : lib/sous-rayons.ts. */
  sousRayon: string;
};

/**
 * Le produit tel que le client le lit, dans sa langue : le nom, la description et les noms des options
 * de départ sont traduits (lib/i18n/catalogue) ; ce que le gérant a écrit lui-même reste tel quel.
 * Sans langue : en français (les textes de la base).
 */
function versPublic(p: Brut, langue: Langue = "fr"): ProduitPublic {
  return {
    ...p,
    nom: nomArticle(p.nom, langue),
    description: descriptionArticle(p.description, langue),
    options: traduireGroupes(lireGroupes(p.options), langue),
    badge: estBadge(p.badge) ? p.badge : "",
    // Un ancien prix qui n'est pas plus cher n'est pas une promo.
    prixBarre: p.prixBarre != null && p.prixBarre > p.prix ? p.prixBarre : null,
    // D'après le nom FRANÇAIS (celui de la base), avant sa traduction.
    sousRayon: sousRayonDe(p.categorie.slug, p.nom),
  };
}

// En ligne, avec un prix (0 = « à définir »), dans une catégorie visible.
const VISIBLE = { actif: true, prix: { gt: 0 }, categorie: { active: true } } satisfies Prisma.ProduitWhereInput;
const ORDRE: Prisma.ProduitOrderByWithRelationInput[] = [{ epuise: "asc" }, { ordre: "asc" }, { nom: "asc" }, { id: "asc" }];

export async function categoriesVisibles() {
  return prisma.categorie.findMany({
    where: { active: true, produits: { some: { actif: true, prix: { gt: 0 } } } },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: { id: true, nom: true, slug: true, emoji: true, _count: { select: { produits: { where: { actif: true, prix: { gt: 0 } } } } } },
  });
}

export async function produitsDeLaCategorie(slug: string, langue: Langue = "fr") {
  const liste = await prisma.produit.findMany({
    where: { ...VISIBLE, categorie: { active: true, slug } },
    orderBy: ORDRE,
    select: PRODUIT_PUBLIC,
  });
  return liste.map((p) => versPublic(p, langue));
}

// À partir de combien d'articles avec photo la rangée d'un rayon, sur l'accueil, ne montre qu'eux.
const PHOTOS_POUR_UNE_RANGEE = 4;

/**
 * La vitrine de l'accueil : chaque rayon et ses premiers articles. Une rangée se lit mieux quand ses tuiles
 * ont la même hauteur : si le rayon a assez d'articles avec photo, la rangée ne montre qu'eux ; sinon ses
 * premiers articles, tels quels.
 */
export async function vitrine(parCategorie = 10, langue: Langue = "fr") {
  const categories = await categoriesVisibles();
  return Promise.all(
    categories.map(async (c) => {
      const lire = (where: Prisma.ProduitWhereInput) =>
        prisma.produit.findMany({ where: { ...VISIBLE, categorieId: c.id, ...where }, orderBy: ORDRE, take: parCategorie, select: PRODUIT_PUBLIC });
      const avecPhoto = await lire({ photoUrl: { not: "" } });
      const produits = avecPhoto.length >= PHOTOS_POUR_UNE_RANGEE ? avecPhoto : await lire({});
      return { categorie: c, produits: produits.map((p) => versPublic(p, langue)), total: c._count.produits };
    }),
  );
}

/** « Les plus demandés » : les produits marqués Populaire ou Promo. */
export async function misEnAvant(nombre = 12, langue: Langue = "fr") {
  const liste = await prisma.produit.findMany({
    where: { ...VISIBLE, epuise: false, badge: { in: ["populaire", "promo"] } },
    orderBy: [{ badge: "asc" }, ...ORDRE],
    take: nombre,
    select: PRODUIT_PUBLIC,
  });
  return liste.map((p) => versPublic(p, langue));
}

// Ce que la recherche lit de chaque article en vente : peu de chose, gardé quelques secondes. La recherche de
// l'en-tête interroge le site pendant que le visiteur tape : sans cela, chaque lettre relirait tout le catalogue.
type ArticleCherche = { id: string; nom: string; description: string; photoUrl: string; categorie: { nom: string; slug: string } };
const DUREE_DU_RELEVE = 20_000;
let releve: { lu: number; articles: ArticleCherche[]; fiches: Map<Langue, Map<string, Fiche>> } | null = null;

async function articlesAChercher() {
  if (releve && Date.now() - releve.lu < DUREE_DU_RELEVE) return releve;
  const articles = await prisma.produit.findMany({
    where: VISIBLE,
    orderBy: ORDRE,
    select: { id: true, nom: true, description: true, photoUrl: true, categorie: { select: { nom: true, slug: true } } },
  });
  // Les articles avec photo d'abord : à réponse égale, les grandes tuiles se suivent.
  releve = { lu: Date.now(), articles: photosDAbord(articles), fiches: new Map() };
  return releve;
}

/** Ce qu'on cherche dans un article pour un client de cette langue : le français de la base ET sa traduction. */
function fichesPour(langue: Langue, source: NonNullable<typeof releve>): Map<string, Fiche> {
  const connues = source.fiches.get(langue);
  if (connues) return connues;
  const t = dictionnaire(langue);
  const fiches = new Map(
    source.articles.map((a) => [
      a.id,
      ficheDe(
        [a.nom, nomArticle(a.nom, langue)],
        [
          a.description,
          descriptionArticle(a.description, langue),
          a.categorie.nom,
          nomDuRayon(a.categorie, t),
          nomDuSousRayon(a.categorie.slug, sousRayonDe(a.categorie.slug, a.nom), t),
        ],
      ),
    ]),
  );
  source.fiches.set(langue, fiches);
  return fiches;
}

/**
 * La recherche du client (lib/recherche.ts) : sans accents ni tirets, chaque mot tapé doit se retrouver dans
 * l'article — « coca zero » trouve « Coca-Cola Zero », « oeufs » trouve « Œufs ». Les articles dont le NOM
 * répond passent d'abord, puis ceux que leur description, leur rayon ou leur sous-rayon font trouver (à réponse
 * égale : ceux qui ont une photo, puis l'ordre du catalogue — la page les affiche dans cet ordre). Dans une
 * autre langue que le français, on cherche aussi dans la traduction (« молоко » trouve « Lait 3 % 1 L ») ; un
 * nom français ou une marque se cherche toujours directement.
 */
export async function rechercher(texte: string, langue: Langue = "fr", maximum = 60) {
  const mots = motsDeRecherche(texte);
  if (mots.length === 0) return [];
  const source = await articlesAChercher();
  const fiches = fichesPour(langue, source);
  const ids = classer(source.articles, (a) => fiches.get(a.id) ?? { nom: "", autres: "" }, mots, maximum).map((a) => a.id);
  if (ids.length === 0) return [];
  // Relus à l'instant, avec la même condition : un article masqué depuis le relevé ne ressort pas.
  const liste = await prisma.produit.findMany({ where: { ...VISIBLE, id: { in: ids } }, select: PRODUIT_PUBLIC });
  const parId = new Map(liste.map((p) => [p.id, p]));
  return ids.flatMap((id) => {
    const p = parId.get(id);
    return p ? [versPublic(p, langue)] : [];
  });
}

/** Prix, options et disponibilité actuels des produits d'un panier. */
export async function etatDuPanier(ids: string[], langue: Langue = "fr") {
  const uniques = [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0 && id.length < 40))].slice(0, 100);
  if (uniques.length === 0) return [];
  const liste = await prisma.produit.findMany({
    where: { id: { in: uniques }, ...VISIBLE, epuise: false },
    select: { id: true, nom: true, prix: true, photoUrl: true, options: true },
  });
  return liste.map((p) => ({ ...p, nom: nomArticle(p.nom, langue), options: traduireGroupes(lireGroupes(p.options), langue) }));
}

/** Des produits précis, encore en ligne (pour « mes articles préférés »), dans l'ordre demandé. */
export async function produitsParIds(ids: string[], langue: Langue = "fr") {
  if (ids.length === 0) return [];
  const liste = await prisma.produit.findMany({ where: { id: { in: ids.slice(0, 50) }, ...VISIBLE }, select: PRODUIT_PUBLIC });
  const parId = new Map(liste.map((p) => [p.id, versPublic(p, langue)]));
  return ids.map((id) => parId.get(id)).filter((p): p is ProduitPublic => !!p);
}

/** Ce qu'il faut d'un produit pour le remettre dans un panier (« commander à nouveau »). */
export async function produitsPourLePanier(ids: string[], langue: Langue = "fr") {
  if (ids.length === 0) return [];
  const liste = await prisma.produit.findMany({
    where: { id: { in: ids.slice(0, 100) }, ...VISIBLE, epuise: false },
    select: { id: true, nom: true, prix: true, photoUrl: true, options: true, categorie: { select: { emoji: true } } },
  });
  return liste.map((p) => ({ ...p, nom: nomArticle(p.nom, langue), options: traduireGroupes(lireGroupes(p.options), langue) }));
}
