import Link from "next/link";
import { CalendarClock, ChevronRight, Clock, MapPin, Truck, Wallet, type LucideIcon } from "lucide-react";
import { RailProduits } from "@/components/CarteProduit";
import { IconeRayon } from "@/components/IconeRayon";
import { misEnAvant, vitrine } from "@/lib/catalogue";
import { libelleDuMode, nomDuRayon } from "@/lib/i18n/rayons";
import { reglagesPublics } from "@/lib/reglages";
import { formatPrixCourt } from "@/lib/argent";
import { momentPresent, NOM_TARIF_DE_BASE, tarifDeBase, tarifPour } from "@/lib/tarifs";
import { livraisonLaMoinsChere } from "@/lib/villes";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { joursOuverts } from "@/lib/livraisons";
import { ADRESSE_DU_SITE, MESSAGE_ACCUEIL_PAR_DEFAUT, NOM_DU_SITE } from "@/lib/marque";
import type { Metadata } from "next";
import { adressesParLangue, compter, heureLisible, lienPour, remplir, type Langue } from "@/lib/langues";
import { estAujourdhui, libelleDuJour } from "@/lib/dates";
import { traduction } from "@/lib/traduction";
import { nomTarif, nomVille } from "@/lib/i18n/catalogue";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { langue } = await traduction();
  return { alternates: adressesParLangue("/", langue) };
}

// Ce que les moteurs de recherche lisent du site : son nom, son logo, sa recherche.
const donneesStructurees = (langue: Langue, description: string) => JSON.stringify({
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${ADRESSE_DU_SITE}/#organisation`,
      name: NOM_DU_SITE,
      url: ADRESSE_DU_SITE,
      logo: `${ADRESSE_DU_SITE}/logo/tourist-order-sigle.png`,
      description,
    },
    {
      "@type": "WebSite",
      "@id": `${ADRESSE_DU_SITE}${lienPour(langue, "/")}#site`,
      name: NOM_DU_SITE,
      url: `${ADRESSE_DU_SITE}${lienPour(langue, "/")}`,
      inLanguage: langue,
      publisher: { "@id": `${ADRESSE_DU_SITE}/#organisation` },
      potentialAction: { "@type": "SearchAction", target: `${ADRESSE_DU_SITE}${lienPour(langue, "/recherche")}?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ],
}).replace(/</g, "\\u003c");

type Fait = { icone: LucideIcon; titre: string; valeur: string; precision?: string };

export default async function Accueil() {
  const { langue, t, ts, lien } = await traduction();
  const [rayons, populaires, reglages] = await Promise.all([vitrine(10, langue), misEnAvant(undefined, langue), reglagesPublics()]);
  const a = t.accueil;
  // Le message d'accueil du gérant ; tant qu'il a gardé celui de départ, le client le lit dans sa langue.
  const messageAccueil = reglages.messageAccueil === MESSAGE_ACCUEIL_PAR_DEFAUT ? a.messageParDefaut : reglages.messageAccueil;
  // Le tarif qui s'appliquerait à une livraison maintenant.
  const tarif = tarifPour(momentPresent(), reglages.plages, tarifDeBase(reglages));
  const amplitude = amplitudeDesCreneaux(reglages.creneaux, langue);
  // La prochaine livraison possible : le premier créneau qui n'est ni passé ni complet.
  const prochaine = (await joursOuverts(reglages))[0];
  const expressQuelquefois = reglages.fraisExpress > 0 || reglages.plages.some((p) => p.fraisExpress > 0);
  const villes = reglages.villes.map((v) => nomVille(v.nom, langue));

  const faits: Fait[] = [];
  if (amplitude) {
    faits.push({
      icone: Clock,
      titre: a.horaires,
      valeur: remplir(a.leSoir, { amplitude: amplitude.replace(/ /g, "\u00a0") }),
      precision: expressQuelquefois ? a.expressPossible : undefined,
    });
  }
  if (prochaine) {
    faits.push({
      icone: CalendarClock,
      titre: a.prochaineLivraison,
      valeur: remplir(a.jourDes, {
        jour: estAujourdhui(prochaine.valeur) ? a.ceSoir : libelleDuJour(prochaine.valeur, undefined, langue),
        heure: prochaine.creneaux[0].split(/\s*[–-]\s*/)[0],
      }),
      precision: reglages.heureLimite ? remplir(a.commandezAvant, { heure: heureLisible(reglages.heureLimite, langue) }) : undefined,
    });
  }
  faits.push({
    icone: Truck,
    titre: reglages.fraisRegroupes ? a.serviceLivraison : a.fraisLivraison,
    valeur: remplir(a.desPrix, { prix: formatPrixCourt(reglages.fraisRegroupes ? tarif.fraisService + livraisonLaMoinsChere(tarif, reglages.villes) : livraisonLaMoinsChere(tarif, reglages.villes), langue) }),
    precision: tarif.nom !== NOM_TARIF_DE_BASE ? remplir(a.tarifEnCeMoment, { nom: nomTarif(tarif.nom, langue).toLowerCase() }) : undefined,
  });
  faits.push({
    icone: Wallet,
    titre: a.paiement,
    valeur: a.aLaCommande,
    precision: reglages.paiements.length > 0 ? reglages.paiements.map((m) => libelleDuMode(m, t)).join(", ") : undefined,
  });

  // Les repères de la livraison : à côté du titre sur grand écran, sous le catalogue sur téléphone
  // (où les rayons passent d'abord, comme sur Wolt ou Uber Eats).
  const reperes = (
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
            <dt className="text-[13px] text-slate-500">{compter(langue, villes.length, a.villesLivrees)}</dt>
            <dd className="text-sm leading-relaxed text-slate-700">{villes.join(" · ")}</dd>
          </div>
        </div>
      )}
    </dl>
  );
  // Les rayons qui ont assez d'articles pour une rangée à faire défiler.
  const rangees = rayons.filter((r) => r.produits.length >= 4);

  return (
    <div className="space-y-9 sm:space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: donneesStructurees(langue, ts.meta.description) }} />
      <section className="grid gap-6 pt-1 sm:pt-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
        <div className="space-y-3.5 sm:space-y-5">
          <p className="surtitre">{a.surtitre}</p>
          <h1 className="text-balance text-[1.7rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-5xl sm:leading-[1.08]">
            {a.titre}
          </h1>
          {messageAccueil && <p className="max-w-xl text-pretty text-[15px] text-slate-600 sm:text-lg">{messageAccueil}</p>}
          {!reglages.ouvert && (
            <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {a.ferme}
            </p>
          )}
          {/* Sur téléphone : l'essentiel de la livraison en deux pastilles ; le détail est plus bas. */}
          <ul className="flex flex-wrap gap-2 lg:hidden">
            {faits.slice(amplitude ? 1 : 0, amplitude ? 3 : 2).map((f) => (
              <li key={f.titre} className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[13px] font-semibold">
                <f.icone className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.7} aria-hidden="true" />
                <span className="sr-only">{f.titre} : </span>{f.valeur}
              </li>
            ))}
          </ul>
          {rayons.length > 0 && (
            <div className="hidden flex-wrap gap-2.5 pt-1 lg:flex">
              <a href="#rayons" className="bouton px-5">{a.voirRayons}</a>
              <a href="#etapes" className="bouton-secondaire px-5">{a.commentCaMarche}</a>
            </div>
          )}
        </div>
        <div className="hidden lg:block">{reperes}</div>
      </section>

      {rayons.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">{a.catalogueBientot}</p>
      ) : (
        <>
          <section id="rayons" aria-labelledby="titre-categories" className="scroll-mt-24 space-y-3.5">
            <h2 id="titre-categories" className="text-xl font-bold sm:text-2xl">{a.rayons}</h2>
            {/* Des tuiles à icône, trois par ligne sur téléphone : tous les rayons tiennent sur un écran. */}
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-2.5 lg:grid-cols-6">
              {rayons.map(({ categorie, total }) => (
                <li key={categorie.id}>
                  <Link
                    href={lien(`/categorie/${categorie.slug}`)}
                    className="group flex h-full flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white px-2 py-3.5 text-center transition hover:border-slate-400 sm:py-4"
                  >
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-encre group-hover:text-white">
                      <IconeRayon slug={categorie.slug} className="h-[22px] w-[22px]" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-semibold leading-tight sm:text-sm">{nomDuRayon(categorie, t)}</span>
                      <span className="mt-0.5 block text-[11px] text-slate-500 sm:text-xs">{compter(langue, total, t.commun.articles)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              {t.commun.introuvableQuestion}{" "}
              <Link href={lien("/panier?demande=")} className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">{t.commun.demandezLe}</Link>
              {t.commun.introuvableSuite}
            </p>
          </section>

          {populaires.length > 0 && (
            <section aria-labelledby="titre-populaires" className="space-y-3">
              <h2 id="titre-populaires" className="text-xl font-bold sm:text-2xl">{a.plusDemandes}</h2>
              <RailProduits produits={populaires} sansBadge />
            </section>
          )}

          {/* Une rangée à faire défiler par rayon, et « Tout voir ». */}
          {rangees.map(({ categorie, produits, total }) => (
            <section key={categorie.id} aria-labelledby={`rangee-${categorie.slug}`} className="space-y-3">
              <div className="flex items-baseline justify-between gap-4">
                <h2 id={`rangee-${categorie.slug}`} className="text-lg font-bold sm:text-xl">
                  <Link href={lien(`/categorie/${categorie.slug}`)} className="hover:underline">{nomDuRayon(categorie, t)}</Link>
                </h2>
                <Link href={lien(`/categorie/${categorie.slug}`)} className="inline-flex shrink-0 items-center gap-0.5 text-sm font-semibold text-encre hover:underline">
                  {t.categorie.toutVoir} <span className="font-normal tabular-nums text-slate-500">({total})</span>
                  <ChevronRight className="h-4 w-4 rtl:rotate-180" strokeWidth={1.8} aria-hidden="true" />
                </Link>
              </div>
              <RailProduits produits={produits} />
            </section>
          ))}

          <div className="lg:hidden">{reperes}</div>

          <section id="etapes" aria-labelledby="titre-etapes" className="scroll-mt-24 space-y-4">
            <h2 id="titre-etapes" className="text-xl font-bold sm:text-2xl">{a.commentTitre}</h2>
            <ol className="grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-3">
              {a.etapes.map((e, i) => (
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
