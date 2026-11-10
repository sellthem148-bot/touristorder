import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GrilleProduits } from "@/components/CarteProduit";
import { produitsDeLaCategorie } from "@/lib/catalogue";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function categorie(slug: string) {
  return prisma.categorie.findFirst({
    where: { slug, active: true },
    select: { nom: true, emoji: true, slug: true },
  });
}

export async function generateMetadata({ params }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const c = await categorie((await params).slug);
  return { title: c?.nom ?? "Catégorie" };
}

export default async function PageCategorie({ params }: PageProps<"/categorie/[slug]">) {
  const { slug } = await params;
  const c = await categorie(slug);
  if (!c) notFound();
  const produits = await produitsDeLaCategorie(slug);

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm font-semibold text-marque hover:underline">
        ← Tout le catalogue
      </Link>
      <h1 className="text-2xl font-extrabold">
        <span aria-hidden="true">{c.emoji}</span> {c.nom}
      </h1>
      {produits.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">Aucun produit dans cette catégorie pour le moment.</p>
      ) : (
        <GrilleProduits produits={produits} />
      )}
    </div>
  );
}
