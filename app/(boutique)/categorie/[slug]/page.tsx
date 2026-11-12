import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GrilleProduits } from "@/components/CarteProduit";
import { IconeRayon } from "@/components/IconeRayon";
import { categoriesVisibles, produitsDeLaCategorie } from "@/lib/catalogue";
import { NOM_DU_SITE } from "@/lib/marque";
import { compter, remplir } from "@/lib/langues";
import { nomDuRayon } from "@/lib/i18n/rayons";
import { traduction } from "@/lib/traduction";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [categories, { t }] = await Promise.all([categoriesVisibles(), traduction()]);
  const c = categories.find((x) => x.slug === slug);
  if (!c) return { title: t.categorie.titreDefaut };
  const nom = nomDuRayon(c, t);
  return {
    title: nom,
    description: remplir(t.categorie.metaDescription, { nom, site: NOM_DU_SITE }),
    alternates: { canonical: `/categorie/${c.slug}` },
  };
}

export default async function PageCategorie({ params }: PageProps<"/categorie/[slug]">) {
  const { slug } = await params;
  const [categories, { langue, t }] = await Promise.all([categoriesVisibles(), traduction()]);
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const produits = await produitsDeLaCategorie(slug);

  return (
    <div className="space-y-6">
      <nav aria-label={t.categorie.navAria} className="rail">
        {categories.map((x) => (
          <Link
            key={x.id}
            href={`/categorie/${x.slug}`}
            aria-current={x.slug === slug ? "page" : undefined}
            className={`shrink-0 snap-start rounded-xl border px-3.5 py-2 text-sm font-semibold transition ${
              x.slug === slug ? "border-encre bg-encre text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
            }`}
          >
            {nomDuRayon(x, t)}
          </Link>
        ))}
      </nav>
      <header className="flex items-center gap-3.5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
          <IconeRayon slug={c.slug} className="h-6 w-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{nomDuRayon(c, t)}</h1>
          <p className="text-sm text-slate-500">{compter(langue, produits.length, t.commun.articles)}</p>
        </div>
      </header>
      {produits.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">{t.categorie.vide}</p>
      ) : (
        <GrilleProduits produits={produits} />
      )}
    </div>
  );
}
