import Link from "next/link";
import { CalendarClock, ChevronRight, Clock, MapPin, Star, Truck, Wallet, type LucideIcon } from "lucide-react";
import { RailProduits } from "@/components/CarteProduit";
import { rangDansLaCascade } from "@/lib/cascade";
import { Apparition } from "@/components/Apparition";
import { IconeRayon } from "@/components/IconeRayon";
import { Sigle } from "@/components/Sigle";
import { couleurDuRayon } from "@/lib/couleurs-rayons";
import { misEnAvant, vitrine } from "@/lib/catalogue";
import { libelleDuMode, nomDuRayon } from "@/lib/i18n/rayons";
import { reglagesPublics } from "@/lib/reglages";
import { formatPrixCourt } from "@/lib/argent";
import { momentPresent, NOM_TARIF_DE_BASE, tarifDeBase, tarifPour } from "@/lib/tarifs";
import { livraisonLaMoinsChere } from "@/lib/villes";
import { communesLivrees } from "@/lib/zones";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { joursOuverts } from "@/lib/livraisons";
import { ADRESSE_DU_SITE, MESSAGE_ACCUEIL_PAR_DEFAUT, NOM_DU_SITE } from "@/lib/marque";
import type { Metadata } from "next";
import { Fragment } from "react";
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

type Fait = { icone: LucideIcon; titre: string; valeur: string; precision?: string; enDirect?: boolean };

// La pastille au jaune du logo (les repères de la livraison) : un fond très clair, un trait brun doré.
const PASTILLE_SOLEIL = "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-soleil/20 text-amber-900";

/** Un point vert qui bat doucement : les commandes sont ouvertes, voici la prochaine livraison. Décoratif. */
function PointOuvert() {
  return (
    <span aria-hidden="true" data-point-ouvert className="absolute -end-1 -top-1 flex h-2 w-2">
      <span className="bat absolute inset-0 rounded-full [--halo:rgb(16_185_129/0.6)] [--portee:6px]" />
      <span className="relative h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
    </span>
  );
}

// Ce qu'une rangée de l'accueil montre d'un rayon : peu, pour que la page respire — la suite est dans « Tout voir ».
const ARTICLES_PAR_RANGEE = 6;

export default async function Accueil() {
  const { langue, t, ts, lien } = await traduction();
  const [rayons, populaires, reglages] = await Promise.all([vitrine(ARTICLES_PAR_RANGEE, langue), misEnAvant(ARTICLES_PAR_RANGEE + 2, langue), reglagesPublics()]);
  const a = t.accueil;
  // Le message d'accueil du gérant ; tant qu'il a gardé celui de départ, le client le lit dans sa langue.
  const messageAccueil = reglages.messageAccueil === MESSAGE_ACCUEIL_PAR_DEFAUT ? a.messageParDefaut : reglages.messageAccueil;
  // Le tarif qui s'appliquerait à une livraison maintenant.
  const tarif = tarifPour(momentPresent(), reglages.plages, tarifDeBase(reglages));
  const amplitude = amplitudeDesCreneaux(reglages.creneaux, langue);
  // La prochaine livraison possible : le premier créneau qui n'est ni passé ni complet.
  const prochaine = (await joursOuverts(reglages))[0];
  const expressQuelquefois = reglages.fraisExpress > 0 || reglages.plages.some((p) => p.fraisExpress > 0);
  // Les villes, pas les zones : un quartier vendu à son prix (« Netanya – Ir Yamim / Poleg ») n'en est pas une de plus.
  const villes = communesLivrees(reglages.villes.map((v) => v.nom)).map((v) => nomVille(v, langue));

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
      enDirect: reglages.ouvert,
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

  // Le détail de la livraison (horaires, frais, paiement, villes) : plus bas dans la page. En haut, la bande
  // d'informations sous la bannière en donne l'essentiel, comme sur la page d'une boutique de Wolt.
  const reperes = (
    <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-(--shadow-tuile) lg:grid-cols-4">
      {faits.map((f, i) => (
        <div key={f.titre} className={`flex flex-col gap-2 bg-white p-3.5 sm:flex-row sm:gap-3 sm:p-4 ${faits.length % 2 === 1 && i === faits.length - 1 ? "col-span-2 lg:col-span-1" : ""}`}>
          <span className={PASTILLE_SOLEIL}>
            <f.icone className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <dt className="text-[13px] text-slate-500">{f.titre}</dt>
            <dd className="font-semibold leading-snug">{f.valeur}</dd>
            {f.precision && <dd className="mt-0.5 text-[13px] leading-snug text-slate-500">{f.precision}</dd>}
          </div>
        </div>
      ))}
      {villes.length > 0 && (
        <div className="col-span-2 flex gap-3 bg-white p-3.5 sm:p-4 lg:col-span-4">
          <span className={PASTILLE_SOLEIL}><MapPin className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden="true" /></span>
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
    <div className="space-y-7 sm:space-y-9">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: donneesStructurees(langue, ts.meta.description) }} />

      {/* La bannière de la boutique, comme sur la page d'une boutique de Wolt (demande du gérant, 16 novembre 2026 :
          « fais-moi le même site que Wolt ») : une image de produits frais, le sigle et le nom, puis le titre.
          D'un bord à l'autre de l'écran jusqu'à la largeur de la page ; au-delà, une carte aux coins arrondis.
          Le fond encre est sous l'image : le texte blanc se lit même avant qu'elle n'arrive. */}
      <div>
        <section data-banniere className="relative -mx-4 -mt-5 overflow-hidden bg-encre text-white sm:-mt-8 xl:mx-0 xl:mt-0 xl:rounded-t-3xl">
          {/* eslint-disable-next-line @next/next/no-img-element -- une image du site, déjà à la bonne taille */}
          <img src="/accueil/banniere.jpg" alt="" width={1800} height={600} className="absolute inset-0 h-full w-full object-cover" />
          <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-encre from-5% via-encre/80 via-45% to-encre/30" />
          <div className="relative flex min-h-[17.5rem] flex-col justify-end gap-2.5 px-4 pb-5 pt-12 sm:min-h-[21rem] sm:gap-3.5 sm:px-8 sm:pb-8">
            {/* Le haut de page arrive ligne après ligne (`apparait`, dans l'ordre de `--i`). */}
            <p className="apparait flex items-center gap-3">
              <span className="shrink-0 overflow-hidden rounded-[14px] shadow-lg ring-1 ring-white/25"><Sigle taille={52} clair /></span>
              <span className="min-w-0">
                <span className="block text-lg font-bold leading-tight sm:text-xl">{NOM_DU_SITE}</span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.08em] text-white/75 sm:text-xs">{a.surtitre}</span>
              </span>
            </p>
            {/* Le titre arrive mot à mot (chaque mot est un bloc qui monte ; le texte lu reste le même). */}
            <h1 className="max-w-3xl text-balance text-[1.7rem] font-bold leading-[1.1] tracking-[-0.03em] sm:text-5xl sm:leading-[1.08]">
              {a.titre.split(" ").map((mot, i) => (
                <Fragment key={i}>
                  <span className="apparait inline-block" style={{ animationDelay: `${70 + i * 55}ms` }}>{mot}</span>{" "}
                </Fragment>
              ))}
            </h1>
            {messageAccueil && <p className="apparait max-w-2xl text-pretty text-[15px] text-white/85 sm:text-lg" style={rangDansLaCascade(6)}>{messageAccueil}</p>}
          </div>
        </section>

        {/* La bande d'informations, collée sous la bannière : l'essentiel de la livraison d'un coup d'œil. */}
        <ul data-infos className="clair -mx-4 grid grid-cols-2 gap-x-4 gap-y-3 border-b border-slate-200 bg-white px-4 py-3.5 text-sm sm:flex sm:flex-wrap sm:items-center sm:gap-x-7 sm:px-8 xl:mx-0 xl:rounded-b-3xl xl:border-b-0 xl:shadow-(--shadow-tuile)">
          {faits.map((f, i) => (
            <li key={f.titre} className="apparait flex min-w-0 items-center gap-2.5" style={rangDansLaCascade(i + 7)}>
              <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-soleil/20 text-amber-900">
                <f.icone className="h-[18px] w-[18px]" strokeWidth={1.7} aria-hidden="true" />
                {f.enDirect && <PointOuvert />}
              </span>
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[11px] text-slate-500 sm:text-xs">{f.titre}</span>
                <span className="block text-[13px] font-semibold sm:text-sm">{f.valeur}</span>
              </span>
            </li>
          ))}
          {villes.length > 0 && (
            <li className="apparait col-span-2 sm:ms-auto" style={rangDansLaCascade(faits.length + 7)}>
              <a href="#livraison" className="inline-flex items-center gap-1.5 rounded-full bg-marque-clair px-3.5 py-1.5 text-[13px] font-semibold text-marque-fonce transition hover:bg-marque/15">
                <MapPin className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
                {compter(langue, villes.length, a.villesLivrees)}
              </a>
            </li>
          )}
        </ul>
      </div>

      {!reglages.ouvert && (
        <p className="rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          {a.ferme}
        </p>
      )}

      {rayons.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">{a.catalogueBientot}</p>
      ) : (
        <>
          {/* Comme sur Wolt : sur grand écran, la colonne des rayons à côté du catalogue ; sur téléphone, les
              rayons en tuiles d'abord. C'est la MÊME liste, présentée autrement selon la largeur. */}
          <div className="space-y-9 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:items-start lg:gap-8 lg:space-y-0">
            <section id="rayons" aria-labelledby="titre-categories" className="scroll-mt-24 space-y-3.5 lg:sticky lg:top-[calc(var(--entete-haut)+1.45rem)] lg:max-h-[calc(100dvh-7rem)] lg:space-y-2 lg:overflow-y-auto lg:pe-1">
              <h2 id="titre-categories" className="apparait text-xl font-bold nuit:text-white sm:text-2xl lg:px-2.5 lg:text-xs lg:font-semibold lg:uppercase lg:tracking-[0.08em] lg:text-slate-500" style={rangDansLaCascade(9)}>{a.rayons}</h2>
              {/* Des tuiles à icône, trois par ligne sur téléphone : tous les rayons tiennent sur un écran. */}
              <ul className="grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 lg:grid-cols-1 lg:gap-0.5">
                {rayons.map(({ categorie, total }, i) => (
                  <li key={categorie.id} className="apparait" style={{ animationDelay: `${420 + i * 45}ms` }}>
                    {/* La tuile se soulève au survol et s'enfonce sous le doigt ; son icône suit. Sur grand écran : une ligne de la colonne. */}
                    <Link
                      href={lien(`/categorie/${categorie.slug}`)}
                      className="group flex h-full flex-col items-center gap-2 rounded-2xl bg-white px-2 py-3.5 text-center shadow-(--shadow-tuile) transition duration-200 hover:-translate-y-0.5 hover:shadow-(--shadow-tuile-survol) active:scale-[0.96] sm:py-4 lg:flex-row lg:gap-2.5 lg:rounded-xl lg:bg-transparent lg:px-2.5 lg:py-1.5 lg:text-start lg:shadow-none lg:hover:translate-y-0 lg:hover:bg-slate-200/70 lg:hover:shadow-none"
                    >
                      {/* L'icône, dans une pastille ronde à la couleur du rayon, rebondit juste après l'arrivée de sa tuile. */}
                      <span className={`saute flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition duration-200 group-hover:scale-110 lg:h-9 lg:w-9 ${couleurDuRayon(categorie.slug).pastille} ${couleurDuRayon(categorie.slug).survol}`} style={{ animationDelay: `${640 + i * 45}ms` }}>
                        <IconeRayon slug={categorie.slug} className="h-[22px] w-[22px] lg:h-[18px] lg:w-[18px]" />
                      </span>
                      <span className="min-w-0 lg:flex lg:flex-1 lg:items-baseline lg:gap-2">
                        <span className="block text-[13px] font-semibold leading-tight sm:text-sm lg:min-w-0 lg:flex-1 lg:truncate">{nomDuRayon(categorie, t)}</span>
                        <span className="mt-0.5 block text-[11px] text-slate-500 sm:text-xs lg:hidden">{compter(langue, total, t.commun.articles)}</span>
                        <span aria-hidden="true" className="hidden text-xs tabular-nums text-slate-500 lg:inline">{total}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>

            <div className="min-w-0 space-y-10 sm:space-y-12">
              {/* Plus bas dans la page, chaque bloc monte en fondu quand il arrive à l'écran (`Apparition`). */}
              {populaires.length > 0 && (
                <Apparition>
                  <section aria-labelledby="titre-populaires" className="space-y-3.5">
                    <h2 id="titre-populaires" className="flex items-center gap-2.5 text-xl font-bold nuit:text-white sm:text-2xl">
                      <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-soleil/25 text-amber-900 nuit:bg-soleil nuit:text-encre"><Star className="h-[17px] w-[17px]" strokeWidth={1.8} /></span>
                      {a.plusDemandes}
                    </h2>
                    <RailProduits produits={populaires} sansBadge etroite />
                  </section>
                </Apparition>
              )}

              {/* Une rangée à faire défiler par rayon, et « Tout voir ». */}
              {rangees.map(({ categorie, produits, total }) => (
                <Apparition key={categorie.id}>
                  <section aria-labelledby={`rangee-${categorie.slug}`} className="space-y-3.5">
                    <div className="flex items-center justify-between gap-4">
                      <h2 id={`rangee-${categorie.slug}`} className="flex min-w-0 items-center gap-2.5 text-lg font-bold nuit:text-white sm:text-xl">
                        {/* La pastille du rayon, à sa couleur : on retrouve la tuile d'en haut. */}
                        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${couleurDuRayon(categorie.slug).pastille}`}>
                          <IconeRayon slug={categorie.slug} className="h-[17px] w-[17px]" />
                        </span>
                        <Link href={lien(`/categorie/${categorie.slug}`)} className="min-w-0 truncate hover:underline">{nomDuRayon(categorie, t)}</Link>
                      </h2>
                      <Link href={lien(`/categorie/${categorie.slug}`)} className={`group group/lien inline-flex shrink-0 items-center gap-0.5 rounded-full py-1 ps-3 pe-2 text-sm font-semibold transition ${couleurDuRayon(categorie.slug).pastille} ${couleurDuRayon(categorie.slug).survol}`}>
                        {t.categorie.toutVoir} <span className="font-normal tabular-nums opacity-70">({total})</span>
                        <ChevronRight className="h-4 w-4 transition-transform group-hover/lien:translate-x-0.5 rtl:rotate-180 rtl:group-hover/lien:-translate-x-0.5" strokeWidth={1.8} aria-hidden="true" />
                      </Link>
                    </div>
                    <RailProduits produits={produits} etroite />
                  </section>
                </Apparition>
              ))}

              <p className="text-sm text-slate-600 nuit:text-slate-300">
                {t.commun.introuvableQuestion}{" "}
                <Link href={lien("/panier?demande=")} className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre nuit:text-white nuit:decoration-white/40 nuit:hover:decoration-white">{t.commun.demandezLe}</Link>
                {t.commun.introuvableSuite}
              </p>
            </div>
          </div>

          <Apparition>
            <section id="livraison" aria-labelledby="titre-livraison" className="scroll-mt-24 space-y-4">
              <h2 id="titre-livraison" className="text-xl font-bold nuit:text-white sm:text-2xl">{a.prochaineLivraison}</h2>
              {reperes}
            </section>
          </Apparition>

          <Apparition>
            <section id="etapes" aria-labelledby="titre-etapes" className="scroll-mt-24 space-y-4">
              <h2 id="titre-etapes" className="text-xl font-bold nuit:text-white sm:text-2xl">{a.commentTitre}</h2>
              <ol className="grid gap-px overflow-hidden rounded-2xl bg-slate-200 shadow-(--shadow-tuile) sm:grid-cols-3">
                {a.etapes.map((e, i) => (
                  <li key={e.titre} className="bg-white p-5">
                    {/* Le contenu de chaque étape arrive à son tour (la case reste en place : pas de trou gris). */}
                    <div className="apparait space-y-2" style={rangDansLaCascade(i * 3)}>
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-soleil/25 text-[13px] font-bold tabular-nums text-amber-900">{i + 1}</span>
                      <span className="block font-semibold">{e.titre}</span>
                      <span className="block text-sm text-slate-600">{e.texte}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          </Apparition>
        </>
      )}
    </div>
  );
}
