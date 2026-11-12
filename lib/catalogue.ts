import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { lireGroupes, type GroupeOptions } from "./options";
import { estBadge, type Badge } from "./choix-commande";
import type { Langue } from "./langues";
import { dictionnaire } from "./i18n";
import { chercherDansLaLangue, descriptionArticle, nomArticle, traduireGroupes } from "./i18n/catalogue";

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

export async function vitrine(parCategorie = 10, langue: Langue = "fr") {
  const categories = await categoriesVisibles();
  return Promise.all(
    categories.map(async (c) => ({
      categorie: c,
      produits: (
        await prisma.produit.findMany({
          where: { ...VISIBLE, categorieId: c.id },
          orderBy: ORDRE,
          take: parCategorie,
          select: PRODUIT_PUBLIC,
        })
      ).map((p) => versPublic(p, langue)),
      total: c._count.produits,
    })),
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

/**
 * La recherche du client. Dans une autre langue que le français, elle trouve aussi les articles dont
 * le nom ou la description TRADUITS contiennent le texte (« молоко » trouve « Lait 3 % 1 L »), et les
 * rayons par leur nom traduit ; un nom français ou une marque se cherche toujours directement.
 */
export async function rechercher(texte: string, langue: Langue = "fr") {
  const q = texte.trim().slice(0, 80);
  if (q.length < 2) return [];
  const traduits = chercherDansLaLangue(q, langue);
  const rayons = langue === "fr"
    ? []
    : Object.entries(dictionnaire(langue).rayons).filter(([, nom]) => nom.toLowerCase().includes(q.toLowerCase())).map(([slug]) => slug);
  const liste = await prisma.produit.findMany({
    where: {
      ...VISIBLE,
      OR: [
        { nom: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { categorie: { nom: { contains: q, mode: "insensitive" } } },
        ...(traduits.noms.length > 0 ? [{ nom: { in: traduits.noms } }] : []),
        ...(traduits.descriptions.length > 0 ? [{ description: { in: traduits.descriptions } }] : []),
        ...(rayons.length > 0 ? [{ categorie: { slug: { in: rayons } } }] : []),
      ],
    },
    orderBy: ORDRE,
    take: 60,
    select: PRODUIT_PUBLIC,
  });
  return liste.map((p) => versPublic(p, langue));
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
