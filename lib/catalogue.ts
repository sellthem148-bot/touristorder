import "server-only";
import type { Prisma } from "@prisma/client";
import { prisma } from "./prisma";

// Ce qu'une page PUBLIQUE lit d'un produit. Jamais le prix d'achat,
// la boutique ni le lien Wolt : ils sont à toi seul.
export const PRODUIT_PUBLIC = {
  id: true,
  nom: true,
  description: true,
  prix: true,
  photoUrl: true,
  categorie: { select: { nom: true, slug: true, emoji: true } },
} satisfies Prisma.ProduitSelect;

export type ProduitPublic = Prisma.ProduitGetPayload<{ select: typeof PRODUIT_PUBLIC }>;

const VISIBLE = { actif: true, categorie: { active: true } } satisfies Prisma.ProduitWhereInput;
const ORDRE: Prisma.ProduitOrderByWithRelationInput[] = [{ ordre: "asc" }, { nom: "asc" }, { id: "asc" }];

export async function categoriesVisibles() {
  return prisma.categorie.findMany({
    where: { active: true, produits: { some: { actif: true } } },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: { id: true, nom: true, slug: true, emoji: true },
  });
}

export async function produitsDeLaCategorie(slug: string) {
  return prisma.produit.findMany({
    where: { ...VISIBLE, categorie: { active: true, slug } },
    orderBy: ORDRE,
    select: PRODUIT_PUBLIC,
  });
}

export async function vitrine(parCategorie = 8) {
  const categories = await categoriesVisibles();
  const rayons = await Promise.all(
    categories.map(async (c) => ({
      categorie: c,
      produits: await prisma.produit.findMany({
        where: { ...VISIBLE, categorieId: c.id },
        orderBy: ORDRE,
        take: parCategorie,
        select: PRODUIT_PUBLIC,
      }),
      total: await prisma.produit.count({ where: { ...VISIBLE, categorieId: c.id } }),
    })),
  );
  return rayons;
}

export async function rechercher(texte: string) {
  const q = texte.trim().slice(0, 80);
  if (q.length < 2) return [];
  return prisma.produit.findMany({
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
}

/** Prix et disponibilité actuels des produits d'un panier. */
export async function etatDuPanier(ids: string[]) {
  const uniques = [...new Set(ids.filter((id) => typeof id === "string" && id.length > 0 && id.length < 40))].slice(0, 100);
  if (uniques.length === 0) return [];
  return prisma.produit.findMany({
    where: { id: { in: uniques }, ...VISIBLE },
    select: { id: true, nom: true, prix: true, photoUrl: true },
  });
}
