import Link from "next/link";
import { CalendarClock, ChevronRight, Clock, MapPin, Truck, Wallet, type LucideIcon } from "lucide-react";
import { GrilleProduits } from "@/components/CarteProduit";
import { IconeRayon } from "@/components/IconeRayon";
import { misEnAvant, vitrine } from "@/lib/catalogue";
import { reglagesPublics } from "@/lib/reglages";
import { formatPrixCourt } from "@/lib/argent";
import { momentPresent, NOM_TARIF_DE_BASE, tarifDeBase, tarifPour } from "@/lib/tarifs";
import { livraisonLaMoinsChere } from "@/lib/villes";
import { amplitudeDesCreneaux, joursDeLivraison } from "@/lib/creneaux";
import { ADRESSE_DU_SITE, DESCRIPTION_DU_SITE, NOM_DU_SITE } from "@/lib/marque";

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };

// Ce que les moteurs de recherche lisent du site : son nom, son logo, sa recherche.
const DONNEES_STRUCTUREES = JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${ADRESSE_DU_SITE}/#organisation`,
      name: NOM_DU_SITE,
      url: ADRESSE_DU_SITE,
      logo: `${ADRESSE_DU_SITE}/logo/tourist-order-sigle.png`,
      description: DESCRIPTION_DU_SITE,
    },
    {
      "@type": "WebSite",
      "@id": `${ADRESSE_DU_SITE}/#site`,
      name: NOM_DU_SITE,
      url: ADRESSE_DU_SITE,
      inLanguage: "fr",
      publisher: { "@id": `${ADRESSE_DU_SITE}/#organisation` },
      potentialAction: { "@type": "SearchAction", target: `${ADRESSE_DU_SITE}/recherche?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ],
}).replace(/</g, "\\u003c");

const ETAPES = [
  { titre: "Vous choisissez", texte: "Courses, produits pour bébé, chargeur oublié, pharmacie : tout se commande ici, en français." },
  { titre: "Vous réglez", texte: "À la commande, par Bit, PayBox ou virement : nous vous envoyons les coordonnées de paiement sur WhatsApp." },
  { titre: "Nous vous livrons", texte: "Nous faisons vos achats dans la journée et vous livrons le soir, à votre logement ou à votre hôtel." },
];

type Fait = { icone: LucideIcon; titre: string; valeur: string; precision?: string };

export default async function Accueil() {
  const [rayons, populaires, reglages] = await Promise.all([vitrine(1), misEnAvant(), reglagesPublics()]);
  // Le tarif qui s'appliquerait à une livraison maintenant.
  const tarif = tarifPour(momentPresent(), reglages.plages, tarifDeBase(reglages));
  const amplitude = amplitudeDesCreneaux(reglages.creneaux);
  const prochaine = joursDeLivraison(reglages)[0];
  const expressQuelquefois = reglages.fraisExpress > 0 || reglages.plages.some((p) => p.fraisExpress > 0);
  const villes = reglages.villes.map((v) => v.nom);

  const faits: Fait[] = [];
  if (amplitude) {
    faits.push({
      icone: Clock,
      titre: "Horaires",
      valeur: `Le soir, ${amplitude}`,
      precision: expressQuelquefois ? "Express possible selon l'heure" : undefined,
    });
  }
  if (prochaine) {
    faits.push({
      icone: CalendarClock,
      titre: "Prochaine livraison",
      valeur: `${prochaine.libelle === "Aujourd'hui" ? "Ce soir" : prochaine.libelle} dès ${prochaine.creneaux[0].split(/\s*[–-]\s*/)[0]}`,
      precision: reglages.heureLimite ? `Commandez avant ${reglages.heureLimite.replace(":", "h").replace("h00", "h")} pour être livré ce soir` : undefined,
    });
  }
  faits.push({
    icone: Truck,
    titre: reglages.fraisRegroupes ? "Service + livraison" : "Frais de livraison",
    valeur: `dès ${formatPrixCourt(reglages.fraisRegroupes ? tarif.fraisService + livraisonLaMoinsChere(tarif, reglages.villes) : livraisonLaMoinsChere(tarif, reglages.villes))}`,
    precision: tarif.nom !== NOM_TARIF_DE_BASE ? `Tarif ${tarif.nom.toLowerCase()} en ce moment` : undefined,
  });
  faits.push({
    icone: Wallet,
    titre: "Paiement",
    valeur: "À la commande",
    precision: reglages.paiements.length > 0 ? reglages.paiements.join(", ") : undefined,
  });

  return (
    <div className="space-y-12 sm:space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: DONNEES_STRUCTUREES }} />
      <section className="grid gap-8 pt-2 sm:pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
        <div className="space-y-5">
          <p className="surtitre">Livraison à domicile · Service en français</p>
          <h1 className="text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
            Vos courses livrées à votre logement, le soir même.
          </h1>
          {reglages.messageAccueil && <p className="max-w-xl text-pretty text-slate-600 sm:text-lg">{reglages.messageAccueil}</p>}
          {!reglages.ouvert && (
            <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              Les commandes sont fermées pour le moment — vous pouvez quand même préparer votre panier.
            </p>
          )}
          {rayons.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              <a href="#rayons" className="bouton px-4 sm:px-5">Voir les rayons</a>
              <a href="#etapes" className="bouton-secondaire px-4 sm:px-5">Comment ça marche</a>
            </div>
          )}
        </div>

        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200">
          {faits.map((f, i) => (
            <div key={f.titre} className={`flex flex-col gap-2 bg-white p-3.5 sm:flex-row sm:gap-3 sm:p-4 ${faits.length % 2 === 1 && i === faits.length - 1 ? "col-span-2" : ""}`}>
              <f.icone className="h-5 w-5 shrink-0 text-slate-500 sm:mt-0.5" strokeWidth={1.6} aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[13px] text-slate-500">{f.titre}</dt>
                <dd className="font-semibold leading-snug">{f.valeur}</dd>
                {f.precision && <dd className="mt-0.5 text-[13px] leading-snug text-slate-500">{f.precision}</dd>}
              </div>
            </div>
          ))}
          {villes.length > 0 && (
            <div className="col-span-2 flex gap-3 bg-white p-3.5 sm:p-4">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.6} aria-hidden="true" />
              <div className="min-w-0">
                <dt className="text-[13px] text-slate-500">{villes.length > 1 ? `${villes.length} villes livrées` : "Ville livrée"}</dt>
                <dd className="text-sm leading-relaxed text-slate-700">{villes.join(" · ")}</dd>
              </div>
            </div>
          )}
        </dl>
      </section>

      {rayons.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">Le catalogue arrive très bientôt.</p>
      ) : (
        <>
          <section id="rayons" aria-labelledby="titre-categories" className="scroll-mt-24 space-y-4">
            <h2 id="titre-categories" className="text-xl font-bold sm:text-2xl">Rayons</h2>
            <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
              {rayons.map(({ categorie, total }) => (
                <li key={categorie.id}>
                  <Link
                    href={`/categorie/${categorie.slug}`}
                    className="group flex h-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 transition hover:border-slate-400 sm:p-3.5"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                      <IconeRayon slug={categorie.slug} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold leading-tight">{categorie.nom}</span>
                      <span className="block text-xs text-slate-500">{total} article{total > 1 ? "s" : ""}</span>
                    </span>
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700 sm:block" strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              Un article introuvable dans le catalogue ?{" "}
              <Link href="/panier?demande=" className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">Demandez-le nous</Link>
              {" "}: nous le recherchons et vous confirmons son prix.
            </p>
          </section>

          {populaires.length > 0 && (
            <section aria-labelledby="titre-populaires" className="space-y-4">
              <h2 id="titre-populaires" className="text-xl font-bold sm:text-2xl">Les plus demandés</h2>
              <GrilleProduits produits={populaires} sansBadge />
            </section>
          )}

          <section id="etapes" aria-labelledby="titre-etapes" className="scroll-mt-24 space-y-4">
            <h2 id="titre-etapes" className="text-xl font-bold sm:text-2xl">Comment ça marche ?</h2>
            <ol className="grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
              {ETAPES.map((e, i) => (
                <li key={e.titre} className="space-y-2 bg-white p-5">
                  <span className="text-sm font-semibold tabular-nums text-slate-400">0{i + 1}</span>
                  <span className="block font-semibold">{e.titre}</span>
                  <span className="block text-sm text-slate-600">{e.texte}</span>
                </li>
              ))}
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
