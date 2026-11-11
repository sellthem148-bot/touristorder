import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
import { GrilleProduits } from "@/components/CarteProduit";
import { rechercher } from "@/lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recherche" };

export default async function PageRecherche({ searchParams }: PageProps<"/recherche">) {
  const brut = (await searchParams).q;
  const q = (Array.isArray(brut) ? brut[0] : brut ?? "").trim();
  const produits = await rechercher(q);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-encre">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Tout le catalogue
        </Link>
        <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{q ? <>Résultats pour « {q} »</> : "Recherche"}</h1>
        {q.length >= 2 && produits.length > 0 && (
          <p className="text-sm text-slate-500">{produits.length} article{produits.length > 1 ? "s" : ""}</p>
        )}
      </div>
      {q.length < 2 ? (
        <p className="text-slate-600">Tape au moins deux lettres dans la barre de recherche.</p>
      ) : produits.length === 0 ? (
        <div className="carte space-y-2 p-8 text-center">
          <SearchX className="mx-auto h-8 w-8 text-slate-400" strokeWidth={1.5} aria-hidden="true" />
          <p className="font-semibold">Aucun produit trouvé.</p>
          <p className="mx-auto max-w-md text-sm text-slate-600">
            Tu ne trouves pas ce qu&apos;il te faut ? Ajoute-le dans la note de ta commande, on essaiera de le trouver pour toi.
          </p>
        </div>
      ) : (
        <GrilleProduits produits={produits} />
      )}
    </div>
  );
}
