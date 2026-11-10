import Link from "next/link";
import { RailProduits } from "@/components/CarteProduit";
import { pastelDe } from "@/components/Vignette";
import { IconeEclair, IconeHotel, IconeScooter, IconeSac } from "@/components/Icones";
import { misEnAvant, vitrine } from "@/lib/catalogue";
import { reglagesPublics } from "@/lib/reglages";
import { formatPrixCourt } from "@/lib/argent";
import { momentPresent, NOM_TARIF_DE_BASE, tarifDeBase, tarifPour } from "@/lib/tarifs";
import { livraisonLaMoinsChere } from "@/lib/villes";
import { amplitudeDesCreneaux, joursDeLivraison } from "@/lib/creneaux";

export const dynamic = "force-dynamic";

const ETAPES = [
  { icone: IconeSac, titre: "Tu choisis", texte: "Courses, couches, chargeur, maillot, cadeau…" },
  { icone: IconeScooter, titre: "On s'occupe de tout", texte: "On achète et on prépare ta commande." },
  { icone: IconeHotel, titre: "On te livre", texte: "À ton hôtel ou ton logement. Tu paies à la livraison." },
];

export default async function Accueil() {
  const [rayons, populaires, reglages] = await Promise.all([vitrine(), misEnAvant(), reglagesPublics()]);
  // Le tarif qui s'appliquerait à une livraison maintenant.
  const tarif = tarifPour(momentPresent(), reglages.plages, tarifDeBase(reglages));
  const amplitude = amplitudeDesCreneaux(reglages.creneaux);
  const prochaine = joursDeLivraison(reglages.creneaux, reglages.joursLivres, reglages.delaiPreparation)[0];
  const expressQuelquefois = reglages.fraisExpress > 0 || reglages.plages.some((p) => p.fraisExpress > 0);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-[2rem] bg-marque px-5 py-7 text-white sm:px-10 sm:py-12">
        {/* Soleil et vagues décoratifs */}
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-28 w-28 rounded-full bg-soleil sm:-right-10 sm:-top-10 sm:h-64 sm:w-64" />
        <div aria-hidden="true" className="absolute -bottom-16 -left-10 h-40 w-[140%] rounded-[100%] bg-marque-fonce/40" />
        <div className="relative max-w-xl space-y-3 sm:space-y-4">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold sm:text-sm">
            🇫🇷 Service en français
          </p>
          <h1 className="pr-8 text-[1.75rem] font-extrabold leading-[1.1] sm:pr-0 sm:text-5xl">
            Tes courses et tes oublis, livrés à ton hôtel.
          </h1>
          {reglages.messageAccueil && <p className="text-blue-50 sm:text-lg">{reglages.messageAccueil}</p>}
          <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold sm:text-sm">
            <span className="rounded-full bg-white px-3 py-1.5 text-marque-fonce">
              {reglages.fraisRegroupes
                ? `Service + livraison dès ${formatPrixCourt(tarif.fraisService + livraisonLaMoinsChere(tarif, reglages.villes))}`
                : `Livraison dès ${formatPrixCourt(livraisonLaMoinsChere(tarif, reglages.villes))}`}
            </span>
            {amplitude && <span className="rounded-full bg-white/15 px-3 py-1.5">🌙 Livré le soir, {amplitude}</span>}
            {prochaine && (
              <span className="rounded-full bg-white/15 px-3 py-1.5">
                Prochaine livraison : {prochaine.libelle === "Aujourd'hui" ? "ce soir" : prochaine.libelle.toLowerCase()} dès {prochaine.creneaux[0].split(/\s*[–-]\s*/)[0]}
              </span>
            )}
            {tarif.nom !== NOM_TARIF_DE_BASE && (
              <span className="rounded-full bg-marque-fonce px-3 py-1.5">Tarif {tarif.nom.toLowerCase()} en ce moment</span>
            )}
            {expressQuelquefois && (
              <span className="inline-flex items-center gap-1 rounded-full bg-soleil px-3 py-1.5 text-slate-900">
                <IconeEclair className="h-4 w-4" /> Express
              </span>
            )}
            <span className="rounded-full bg-white/15 px-3 py-1.5">Paiement à la livraison</span>
          </div>
          {reglages.villes.length > 0 && <p className="text-xs text-blue-100 sm:text-sm">📍 {reglages.villes.map((v) => v.nom).join(" · ")}</p>}
        </div>
        {!reglages.ouvert && (
          <p className="relative mt-5 rounded-2xl bg-white px-4 py-3 font-semibold text-slate-900">
            Les commandes sont fermées pour le moment — tu peux quand même préparer ton panier.
          </p>
        )}
      </section>

      {rayons.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">Le catalogue arrive très bientôt.</p>
      ) : (
        <>
          <section aria-labelledby="titre-categories" className="space-y-3">
            <h2 id="titre-categories" className="text-xl font-extrabold">Catégories</h2>
            <ul className="rail sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
              {rayons.map(({ categorie, total }) => (
                <li key={categorie.id} className="w-28 shrink-0 snap-start sm:w-auto">
                  <Link
                    href={`/categorie/${categorie.slug}`}
                    className={`flex h-full flex-col items-center gap-2 rounded-3xl ${pastelDe(categorie.slug)} p-3 text-center transition hover:-translate-y-0.5 hover:shadow-carte`}
                  >
                    <span className="text-4xl" aria-hidden="true">{categorie.emoji}</span>
                    <span className="text-sm font-bold leading-tight text-slate-800">{categorie.nom}</span>
                    <span className="text-xs text-slate-600">{total} article{total > 1 ? "s" : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          {populaires.length > 0 && (
            <section aria-labelledby="titre-populaires" className="space-y-3">
              <h2 id="titre-populaires" className="text-xl font-extrabold">⭐ Les plus demandés</h2>
              <RailProduits produits={populaires} />
            </section>
          )}

          {rayons.map(({ categorie, produits, total }) => (
            <section key={categorie.id} aria-labelledby={`rayon-${categorie.id}`} className="space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <h2 id={`rayon-${categorie.id}`} className="text-xl font-extrabold">
                  <span aria-hidden="true">{categorie.emoji}</span> {categorie.nom}
                </h2>
                <Link href={`/categorie/${categorie.slug}`} className="shrink-0 rounded-full bg-marque-clair px-3 py-1 text-sm font-bold text-marque hover:bg-marque hover:text-white">
                  Tout voir{total > produits.length ? ` (${total})` : ""}
                </Link>
              </div>
              <RailProduits produits={produits} />
            </section>
          ))}

          <section aria-labelledby="titre-etapes" className="rounded-[2rem] bg-sable p-6 sm:p-8">
            <h2 id="titre-etapes" className="mb-5 text-xl font-extrabold">Comment ça marche ?</h2>
            <ol className="grid gap-5 sm:grid-cols-3">
              {ETAPES.map((e, i) => (
                <li key={e.titre} className="flex gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-marque shadow-sm">
                    <e.icone className="h-6 w-6" />
                  </span>
                  <span>
                    <span className="block font-bold">{i + 1}. {e.titre}</span>
                    <span className="text-sm text-slate-600">{e.texte}</span>
                  </span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
