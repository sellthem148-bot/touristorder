import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { lireGroupes, type GroupeOptions } from "./options";
import { estBadge, type Badge } from "./choix-commande";

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

function versPublic(p: Brut): ProduitPublic {
  return {
    ...p,
    options: lireGroupes(p.options),
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

export async function produitsDeLaCategorie(slug: string) {
  const liste = await prisma.produit.findMany({
    where: { ...VISIBLE, categorie: { active: true, slug } },
    orderBy: ORDRE,
    select: PRODUIT_PUBLIC,
  });
  return liste.map(versPublic);
}

export async function vitrine(parCategorie = 10) {
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
      ).map(versPublic),
      total: c._count.produits,
    })),
  );
}

/** « Les plus demandés » : les produits marqués Populaire ou Promo. */
export async function misEnAvant(nombre = 12) {
  const liste = await prisma.produit.findMany({
    where: { ...VISIBLE, epuise: false, badge: { in: ["populaire", "promo"] } },
    orderBy: [{ badge: "asc" }, ...ORDRE],
    take: nombre,
    select: PRODUIT_PUBLIC,
  });
  return liste.map(versPublic);
}

export async function rechercher(texte: string) {
  const q = texte.trim().slice(0, 80);
  if (q.length < 2) return [];
  const liste = await prisma.produit.findMany({
    where: {
      ...VISIBLE,
      OR: [
        { nom: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
        { categorie: { nom: { contains: q, mode: "insensitive" } } },
      ],
    },
    orderBy: ORDRE,
    take: 60,
    select: PRODUIT_PUBLIC,
  });
  return liste.map(versPublic);
}

/** Prix, options et disponibilité actuels des produits d'un panier. */
export async function etatDuPanier(ids: string[]) {
  const uniques = [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0 && id.length < 40))].slice(0, 100);
  if (uniques.length === 0) return [];
  const liste = await prisma.produit.findMany({
    where: { id: { in: uniques }, ...VISIBLE, epuise: false },
    select: { id: true, nom: true, prix: true, photoUrl: true, options: true },
  });
  return liste.map((p) => ({ ...p, options: lireGroupes(p.options) }));
}
