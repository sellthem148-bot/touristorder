import Link from "next/link";
import { GrilleProduits } from "@/components/CarteProduit";
import { vitrine } from "@/lib/catalogue";
import { reglagesPublics } from "@/lib/reglages";
import { formatPrix } from "@/lib/argent";
import { SLOGAN } from "@/lib/marque";

export const dynamic = "force-dynamic";

export default async function Accueil() {
  const [rayons, reglages] = await Promise.all([vitrine(), reglagesPublics()]);

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-marque to-marque-fonce px-5 py-7 text-white sm:px-8 sm:py-10">
        <h1 className="max-w-xl text-2xl font-extrabold leading-tight sm:text-4xl">{SLOGAN}</h1>
        {reglages.messageAccueil && <p className="mt-3 max-w-xl text-blue-100">{reglages.messageAccueil}</p>}
        <ul className="mt-5 flex flex-wrap gap-2 text-sm">
          <li className="rounded-full bg-white/15 px-3 py-1">Livraison {formatPrix(reglages.fraisLivraison)}</li>
          <li className="rounded-full bg-white/15 px-3 py-1">Paiement à la livraison</li>
          {reglages.villes.length > 0 && (
            <li className="rounded-full bg-white/15 px-3 py-1">{reglages.villes.join(" · ")}</li>
          )}
        </ul>
        {!reglages.ouvert && (
          <p className="mt-4 rounded-xl bg-accent px-3 py-2 font-semibold text-slate-900">
            Les commandes sont fermées pour le moment — tu peux quand même préparer ton panier.
          </p>
        )}
      </section>

      {rayons.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">Le catalogue arrive très bientôt.</p>
      ) : (
        <>
          <nav aria-label="Catégories" className="-mx-4 overflow-x-auto px-4">
            <ul className="flex gap-2 pb-1">
              {rayons.map(({ categorie }) => (
                <li key={categorie.id}>
                  <Link
                    href={`/categorie/${categorie.slug}`}
                    className="flex items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-marque"
                  >
                    <span aria-hidden="true">{categorie.emoji}</span>
                    {categorie.nom}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {rayons.map(({ categorie, produits, total }) => (
            <section key={categorie.id} aria-labelledby={`rayon-${categorie.id}`} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id={`rayon-${categorie.id}`} className="text-xl font-bold">
                  <span aria-hidden="true">{categorie.emoji}</span> {categorie.nom}
                </h2>
                {total > produits.length && (
                  <Link href={`/categorie/${categorie.slug}`} className="text-sm font-semibold text-marque hover:underline">
                    Tout voir ({total})
                  </Link>
                )}
              </div>
              <GrilleProduits produits={produits} />
            </section>
          ))}
        </>
      )}
    </div>
  );
}
