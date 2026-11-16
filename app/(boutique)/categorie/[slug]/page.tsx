import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GrilleProduits, RailProduits } from "@/components/CarteProduit";
import { Apparition } from "@/components/Apparition";
import { IconeRayon } from "@/components/IconeRayon";
import { couleurDuRayon } from "@/lib/couleurs-rayons";
import { RangeeDeLiens } from "@/components/Rangee";
import { categoriesVisibles, produitsDeLaCategorie } from "@/lib/catalogue";
import { NOM_DU_SITE } from "@/lib/marque";
import { adressesParLangue, compter, remplir } from "@/lib/langues";
import { nomDuRayon, nomDuSousRayon } from "@/lib/i18n/rayons";
import { apercuDuSousRayon, grouperParSousRayon } from "@/lib/sous-rayons";
import { traduction } from "@/lib/traduction";

export const dynamic = "force-dynamic";

// En dessous, un rayon tient sur un écran ou deux : ses articles s'affichent tous, sans sous-rayons.
const SEUIL_DES_SOUS_RAYONS = 12;
// Ce que l'aperçu d'un sous-rayon montre avant « Tout voir » : UNE rangée, à faire défiler de côté
// (demande du gérant : « moins de choses par catégorie, ça fait étouffer »).
const APERCU = 6;

/** Le sous-rayon demandé par l'adresse (« ?s=colas »), s'il existe dans ce rayon. */
const sousRayonDemande = (s: string | string[] | undefined, cles: string[]) => (typeof s === "string" && cles.includes(s) ? s : null);

export async function generateMetadata({ params, searchParams }: PageProps<"/categorie/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const [categories, { langue, t }] = await Promise.all([categoriesVisibles(), traduction()]);
  const c = categories.find((x) => x.slug === slug);
  if (!c) return { title: t.categorie.titreDefaut };
  const nom = nomDuRayon(c, t);
  const groupes = grouperParSousRayon(slug, await produitsDeLaCategorie(slug, langue));
  const choisi = sousRayonDemande((await searchParams).s, groupes.map((g) => g.cle));
  if (choisi) {
    const sous = nomDuSousRayon(slug, choisi, t);
    return {
      title: `${sous} — ${nom}`,
      description: remplir(t.categorie.metaDescriptionSous, { sous, nom, site: NOM_DU_SITE }),
      alternates: adressesParLangue(`/categorie/${c.slug}?s=${choisi}`, langue),
    };
  }
  return {
    title: nom,
    description: remplir(t.categorie.metaDescription, { nom, site: NOM_DU_SITE }),
    alternates: adressesParLangue(`/categorie/${c.slug}`, langue),
  };
}

export default async function PageCategorie({ params, searchParams }: PageProps<"/categorie/[slug]">) {
  const { slug } = await params;
  const [categories, { langue, t, lien }] = await Promise.all([categoriesVisibles(), traduction()]);
  const c = categories.find((x) => x.slug === slug);
  if (!c) notFound();
  const produits = await produitsDeLaCategorie(slug, langue);
  // Les sous-rayons : ce qui garde un rayon de plusieurs centaines d'articles facile à parcourir.
  const groupes = grouperParSousRayon(slug, produits);
  const avecSousRayons = groupes.length > 1 && produits.length > SEUIL_DES_SOUS_RAYONS;
  const choisi = avecSousRayons ? sousRayonDemande((await searchParams).s, groupes.map((g) => g.cle)) : null;
  const groupeChoisi = groupes.find((g) => g.cle === choisi);
  const adresse = (cle: string | null) => lien(cle ? `/categorie/${slug}?s=${cle}` : `/categorie/${slug}`);
  const nomSous = (cle: string) => nomDuSousRayon(slug, cle, t);
  const nombre = (n: number) => compter(langue, n, t.commun.articles);
  const couleur = couleurDuRayon(c.slug);

  return (
    <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
      {/* Sur grand écran : la colonne des rayons, celui-ci ouvert sur ses sous-rayons (comme sur Wolt). */}
      <aside className="hidden lg:block">
        <nav aria-label={t.categorie.navAria} className="sticky top-[calc(var(--entete-haut)+1.45rem)] max-h-[calc(100dvh-7rem)] overflow-y-auto pe-1">
          <p className="surtitre mb-2 px-2.5 nuit:text-slate-400">{t.accueil.rayons}</p>
          <ul className="space-y-0.5">
            {categories.map((x) => (
              <li key={x.id}>
                <Link
                  href={lien(`/categorie/${x.slug}`)}
                  aria-current={x.slug === slug && !choisi ? "page" : undefined}
                  className={`group flex items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold transition ${
                    x.slug === slug ? "bg-marque-clair text-encre nuit:bg-white" : "text-slate-700 hover:bg-slate-200/70 nuit:text-slate-300 nuit:hover:bg-white/10"
                  }`}
                >
                  {/* Comme sur Wolt : une pastille ronde par rayon (son icône, à sa couleur), et le rayon ouvert sur un fond bleu très clair. */}
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${couleurDuRayon(x.slug).pastille} ${couleurDuRayon(x.slug).survol}`}>
                    <IconeRayon slug={x.slug} className="h-[18px] w-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{nomDuRayon(x, t)}</span>
                  <span className="text-xs font-normal tabular-nums text-slate-500">{x._count.produits}</span>
                </Link>
                {x.slug === slug && avecSousRayons && (
                  <ul className="my-1 ms-[1.65rem] space-y-0.5 border-s border-slate-300 ps-2 nuit:border-white/15">
                    {groupes.map((g) => (
                      <li key={g.cle}>
                        <Link
                          href={adresse(g.cle)}
                          aria-current={g.cle === choisi ? "page" : undefined}
                          className={`flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-[13px] transition ${
                            g.cle === choisi ? "bg-marque-clair font-semibold text-encre nuit:bg-white/15 nuit:text-white" : "text-slate-600 hover:bg-slate-200/70 hover:text-encre nuit:text-slate-400 nuit:hover:bg-white/10 nuit:hover:text-white"
                          }`}
                        >
                          <span className="min-w-0 flex-1">{nomSous(g.cle)}</span>
                          <span className="text-xs tabular-nums text-slate-500">{g.articles.length}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      <div className="min-w-0 space-y-6">
        {/* Sur téléphone : les rayons en rangée qui défile. */}
        <nav aria-label={t.categorie.navAria} className="lg:hidden">
          <RangeeDeLiens cle={slug} className="rail gap-2">
          {categories.map((x) => (
            <Link
              key={x.id}
              href={lien(`/categorie/${x.slug}`)}
              aria-current={x.slug === slug ? "page" : undefined}
              className={`flex shrink-0 snap-start items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                x.slug === slug ? "border-encre bg-encre text-white nuit:border-soleil nuit:bg-soleil nuit:text-encre" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <IconeRayon slug={x.slug} className={`h-4 w-4 shrink-0 ${x.slug === slug ? "" : couleurDuRayon(x.slug).trait}`} />
              {nomDuRayon(x, t)}
            </Link>
          ))}
          </RangeeDeLiens>
        </nav>

        {/* Le bandeau du rayon, à sa couleur : un fond très clair, l'icône dans un rond blanc. */}
        <header className={`apparait flex items-center gap-3.5 rounded-2xl border p-4 sm:gap-4 sm:p-5 ${couleur.bandeau}`}>
          <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white sm:h-14 sm:w-14 ${couleur.trait}`}>
            <IconeRayon slug={c.slug} className="h-6 w-6 sm:h-7 sm:w-7" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{nomDuRayon(c, t)}</h1>
            <p className="text-sm text-slate-600">{nombre(produits.length)}</p>
          </div>
        </header>

        {/* Les sous-rayons : sur téléphone, une rangée qui reste sous l'en-tête pendant qu'on fait défiler. */}
        {avecSousRayons && (
          <nav aria-label={t.categorie.sousRayonsAria} className="sticky top-(--entete-haut) z-[15] -mx-4 border-b border-slate-200 bg-fond/95 backdrop-blur nuit:border-white/10 lg:hidden">
            <RangeeDeLiens cle={`${slug}/${choisi ?? ""}`} className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[null, ...groupes.map((g) => g.cle)].map((cle) => (
                <Link
                  key={cle ?? "tout"}
                  href={adresse(cle)}
                  aria-current={cle === choisi ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    cle === choisi ? "bg-encre text-white nuit:bg-soleil nuit:text-encre" : "border border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {cle ? nomSous(cle) : t.categorie.tout}
                </Link>
              ))}
            </RangeeDeLiens>
          </nav>
        )}

        {produits.length === 0 ? (
          <p className="carte p-8 text-center text-slate-600">{t.categorie.vide}</p>
        ) : groupeChoisi ? (
          // Un sous-rayon : tous ses articles.
          <section aria-labelledby="titre-sous-rayon" className="space-y-3">
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 id="titre-sous-rayon" className="flex items-center gap-2.5 text-lg font-bold nuit:text-white sm:text-xl">
                <span aria-hidden="true" className={`h-5 w-1.5 shrink-0 rounded-full ${couleur.repere}`} />
                <span>{nomSous(groupeChoisi.cle)} <span className="ms-1 text-sm font-normal text-slate-500 nuit:text-slate-400">{nombre(groupeChoisi.articles.length)}</span></span>
              </h2>
              <Link href={adresse(null)} className="text-sm font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre nuit:text-white nuit:decoration-white/40 nuit:hover:decoration-white">
                {remplir(t.categorie.retourAuRayon, { nom: nomDuRayon(c, t) })}
              </Link>
            </div>
            <GrilleProduits produits={groupeChoisi.articles} etroite auDefilement />
          </section>
        ) : avecSousRayons ? (
          // Le rayon entier : un aperçu de chaque sous-rayon, et « Tout voir ».
          <div className="space-y-10 pt-1 sm:space-y-12">
            {groupes.map((g) => {
              const apercu = apercuDuSousRayon(g.articles, APERCU);
              return (
              // Chaque sous-rayon monte en fondu quand il arrive à l'écran, ses tuiles l'une après l'autre.
              <Apparition key={g.cle}>
              <section aria-labelledby={`sous-rayon-${g.cle}`} className="scroll-mt-32 space-y-3.5">
                <div className="flex items-center justify-between gap-4">
                  {/* Un repère à la couleur du rayon devant chaque sous-rayon ; « Tout voir » dans une pastille de la même teinte. */}
                  <h2 id={`sous-rayon-${g.cle}`} className="flex min-w-0 items-center gap-2.5 text-lg font-bold nuit:text-white sm:text-xl">
                    <span aria-hidden="true" className={`h-5 w-1.5 shrink-0 rounded-full ${couleur.repere}`} />
                    <span className="min-w-0"><span data-nom>{nomSous(g.cle)}</span> <span data-compte className="ms-1 text-sm font-normal tabular-nums text-slate-500 nuit:text-slate-400">{g.articles.length}</span></span>
                  </h2>
                  {g.articles.length > apercu.length && (
                    <Link href={adresse(g.cle)} className={`group shrink-0 rounded-full px-3 py-1 text-sm font-semibold transition ${couleur.pastille} ${couleur.survol}`}>
                      {t.categorie.toutVoir}
                    </Link>
                  )}
                </div>
                {/* Une seule rangée par sous-rayon, les articles qui ont une photo d'abord ; la suite derrière « Tout voir ». */}
                <RailProduits produits={apercu} etroite />
              </section>
              </Apparition>
              );
            })}
          </div>
        ) : (
          <GrilleProduits produits={produits} etroite auDefilement />
        )}

        <p className="pt-2 text-sm text-slate-600 nuit:text-slate-300">
          {t.commun.introuvableQuestion}{" "}
          <Link href={lien("/panier?demande=")} className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre nuit:text-white nuit:decoration-white/40 nuit:hover:decoration-white">{t.commun.demandezLe}</Link>
          {t.commun.introuvableSuite}
        </p>
      </div>
    </div>
  );
}
