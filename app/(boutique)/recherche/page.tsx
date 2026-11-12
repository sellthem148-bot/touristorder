import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { GrilleProduits } from "@/components/CarteProduit";
import type { Metadata } from "next";
import { rechercher } from "@/lib/catalogue";
import { compter, remplir } from "@/lib/langues";
import { traduction } from "@/lib/traduction";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await traduction();
  return { title: t.recherche.titre, robots: { index: false } };
}

export default async function PageRecherche({ searchParams }: PageProps<"/recherche">) {
  const brut = (await searchParams).q;
  const q = (Array.isArray(brut) ? brut[0] : brut ?? "").trim();
  const { langue, t, lien } = await traduction();
  const produits = await rechercher(q, langue);
  const r = t.recherche;

  return (
    <div className="space-y-6">
      <div>
        <Link href={lien("/")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-encre">
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.8} aria-hidden="true" /> {r.retour}
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{q ? remplir(r.resultats, { q }) : r.titre}</h1>
        {q.length >= 2 && produits.length > 0 && (
          <p className="text-sm text-slate-500">{compter(langue, produits.length, t.commun.articles)}</p>
        )}
      </div>
      {q.length < 2 ? (
        <p className="text-slate-600">{r.minimum}</p>
      ) : produits.length === 0 ? (
        <div className="carte space-y-3 p-8 text-center">
          <SearchX className="mx-auto h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
          <p className="font-semibold">{r.aucun}</p>
          <p className="mx-auto max-w-md text-sm text-slate-600">
            {r.aucunAide}
          </p>
          <Link href={lien(`/panier?demande=${encodeURIComponent(q.slice(0, 200))}`)} className="bouton">{r.demander}</Link>
        </div>
      ) : (
        <GrilleProduits produits={produits} />
      )}
    </div>
  );
}
