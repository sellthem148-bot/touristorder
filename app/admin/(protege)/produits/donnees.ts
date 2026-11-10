import "server-only";
import { prisma } from "@/lib/prisma";

export async function donneesDuFormulaire() {
  const [categories, boutiques] = await Promise.all([
    prisma.categorie.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }], select: { id: true, nom: true, emoji: true } }),
    prisma.produit.findMany({ where: { boutique: { not: "" } }, distinct: ["boutique"], select: { boutique: true }, orderBy: { boutique: "asc" } }),
  ]);
  return { categories, boutiques: boutiques.map((b) => b.boutique) };
}
