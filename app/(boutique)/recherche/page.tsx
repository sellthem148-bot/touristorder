import Link from "next/link";
import { GrilleProduits } from "@/components/CarteProduit";
import { rechercher } from "@/lib/catalogue";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recherche" };

export default async function PageRecherche({ searchParams }: PageProps<"/recherche">) {
  const brut = (await searchParams).q;
  const q = (Array.isArray(brut) ? brut[0] : brut ?? "").trim();
  const produits = await rechercher(q);

  return (
    <div className="space-y-4">
      <Link href="/" className="text-sm font-semibold text-marque hover:underline">
        ← Tout le catalogue
      </Link>
      <h1 className="text-2xl font-extrabold">{q ? <>Résultats pour « {q} »</> : "Recherche"}</h1>
      {q.length < 2 ? (
        <p className="text-slate-600">Tape au moins deux lettres dans la barre de recherche.</p>
      ) : produits.length === 0 ? (
        <div className="carte space-y-2 p-6 text-center text-slate-600">
          <p>Aucun produit trouvé.</p>
          <p className="text-sm">
            Tu ne trouves pas ce qu&apos;il te faut ? Ajoute-le dans la note de ta commande, on essaiera de le trouver.
          </p>
        </div>
      ) : (
        <GrilleProduits produits={produits} />
      )}
    </div>
  );
}
