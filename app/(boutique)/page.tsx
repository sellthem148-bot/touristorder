import Link from "next/link";
import { CalendarClock, ChevronRight, Clock, MapPin, Truck, Wallet, type LucideIcon } from "lucide-react";
import { GrilleProduits } from "@/components/CarteProduit";
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
import { compter, heureLisible, remplir, type Langue } from "@/lib/langues";
import { estAujourdhui, libelleDuJour } from "@/lib/dates";
import { traduction } from "@/lib/traduction";
import { nomTarif, nomVille } from "@/lib/i18n/catalogue";

export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" } };

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
      "@id": `${ADRESSE_DU_SITE}/#site`,
      name: NOM_DU_SITE,
      url: ADRESSE_DU_SITE,
      inLanguage: langue,
      publisher: { "@id": `${ADRESSE_DU_SITE}/#organisation` },
      potentialAction: { "@type": "SearchAction", target: `${ADRESSE_DU_SITE}/recherche?q={search_term_string}`, "query-input": "required name=search_term_string" },
    },
  ],
}).replace(/</g, "\\u003c");

type Fait = { icone: LucideIcon; titre: string; valeur: string; precision?: string };

export default async function Accueil() {
  const { langue, t, ts } = await traduction();
  const [rayons, populaires, reglages] = await Promise.all([vitrine(1, langue), misEnAvant(undefined, langue), reglagesPublics()]);
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

  return (
    <div className="space-y-12 sm:space-y-16">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: donneesStructurees(langue, ts.meta.description) }} />
      <section className="grid gap-8 pt-2 sm:pt-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-12">
        <div className="space-y-5">
          <p className="surtitre">{a.surtitre}</p>
          <h1 className="text-balance text-[2rem] font-bold leading-[1.08] tracking-[-0.03em] sm:text-5xl">
            {a.titre}
          </h1>
          {messageAccueil && <p className="max-w-xl text-pretty text-slate-600 sm:text-lg">{messageAccueil}</p>}
          {!reglages.ouvert && (
            <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
              {a.ferme}
            </p>
          )}
          {rayons.length > 0 && (
            <div className="flex flex-wrap gap-2.5 pt-1">
              <a href="#rayons" className="bouton px-4 sm:px-5">{a.voirRayons}</a>
              <a href="#etapes" className="bouton-secondaire px-4 sm:px-5">{a.commentCaMarche}</a>
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
                <dt className="text-[13px] text-slate-500">{compter(langue, villes.length, a.villesLivrees)}</dt>
                <dd className="text-sm leading-relaxed text-slate-700">{villes.join(" · ")}</dd>
              </div>
            </div>
          )}
        </dl>
      </section>

      {rayons.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">{a.catalogueBientot}</p>
      ) : (
        <>
          <section id="rayons" aria-labelledby="titre-categories" className="scroll-mt-24 space-y-4">
            <h2 id="titre-categories" className="text-xl font-bold sm:text-2xl">{a.rayons}</h2>
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
                      <span className="block text-sm font-semibold leading-tight">{nomDuRayon(categorie, t)}</span>
                      <span className="block text-xs text-slate-500">{compter(langue, total, t.commun.articles)}</span>
                    </span>
                    <ChevronRight className="hidden h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-700 sm:block rtl:rotate-180 rtl:group-hover:-translate-x-0.5" strokeWidth={1.8} aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
            <p className="text-sm text-slate-600">
              {t.commun.introuvableQuestion}{" "}
              <Link href="/panier?demande=" className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">{t.commun.demandezLe}</Link>
              {t.commun.introuvableSuite}
            </p>
          </section>

          {populaires.length > 0 && (
            <section aria-labelledby="titre-populaires" className="space-y-4">
              <h2 id="titre-populaires" className="text-xl font-bold sm:text-2xl">{a.plusDemandes}</h2>
              <GrilleProduits produits={populaires} sansBadge />
            </section>
          )}

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
