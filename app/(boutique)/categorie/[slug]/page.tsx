import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GrilleProduits } from "@/components/CarteProduit";
import { pastelDe } from "@/components/Vignette";
import { categoriesVisibles, produitsDeLaCategorie } from "@/lib/catalogue";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const c = (await categoriesVisibles()).find((x) => x.slug === slug);
  return { title: c?.nom ?? "Catégorie" };
}

export default async function PageCategorie({ params }: PageProps<"/categorie/[slug]">) {
  const { slug } = await params;
  const categories = await categoriesVisibles();
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const produits = await produitsDeLaCategorie(slug);

  return (
    <div className="space-y-5">
      <nav aria-label="Catégories" className="rail">
        {categories.map((x) => (
          <Link
            key={x.id}
            href={`/categorie/${x.slug}`}
            aria-current={x.slug === slug ? "page" : undefined}
            className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition ${
              x.slug === slug ? "bg-slate-900 text-white" : "bg-white text-slate-700 shadow-carte hover:bg-slate-50"
            }`}
          >
            <span aria-hidden="true">{x.emoji}</span> {x.nom}
          </Link>
        ))}
      </nav>
      <header className={`flex items-center gap-4 rounded-[2rem] ${pastelDe(c.slug)} p-5`}>
        <span className="text-5xl" aria-hidden="true">{c.emoji}</span>
        <div>
          <h1 className="text-2xl font-extrabold">{c.nom}</h1>
          <p className="text-sm text-slate-600">{produits.length} article{produits.length > 1 ? "s" : ""}</p>
        </div>
      </header>
      {produits.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">Aucun produit dans cette catégorie pour le moment.</p>
      ) : (
        <GrilleProduits produits={produits} />
      )}
    </div>
  );
}
