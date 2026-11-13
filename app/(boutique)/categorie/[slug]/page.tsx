import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { GrilleProduits } from "@/components/CarteProduit";
import { IconeRayon } from "@/components/IconeRayon";
import { RangeeDeLiens } from "@/components/Rangee";
import { categoriesVisibles, produitsDeLaCategorie } from "@/lib/catalogue";
import { NOM_DU_SITE } from "@/lib/marque";
import { adressesParLangue, compter, remplir } from "@/lib/langues";
import { nomDuRayon, nomDuSousRayon } from "@/lib/i18n/rayons";
import { grouperParSousRayon, photosDAbord } from "@/lib/sous-rayons";
import { traduction } from "@/lib/traduction";

export const dynamic = "force-dynamic";

// En dessous, un rayon tient sur un écran ou deux : ses articles s'affichent tous, sans sous-rayons.
const SEUIL_DES_SOUS_RAYONS = 12;
// Ce que l'aperçu d'un sous-rayon montre avant « Tout voir » (deux lignes de tuiles).
const APERCU = 8;

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

  return (
    <div className="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-8">
      {/* Sur grand écran : la colonne des rayons, celui-ci ouvert sur ses sous-rayons (comme sur Wolt). */}
      <aside className="hidden lg:block">
        <nav aria-label={t.categorie.navAria} className="sticky top-[5.5rem] max-h-[calc(100dvh-7rem)] overflow-y-auto pe-1">
          <p className="surtitre mb-2 px-2.5">{t.accueil.rayons}</p>
          <ul className="space-y-0.5">
            {categories.map((x) => (
              <li key={x.id}>
                <Link
                  href={lien(`/categorie/${x.slug}`)}
                  aria-current={x.slug === slug && !choisi ? "page" : undefined}
                  className={`flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-semibold transition ${
                    x.slug === slug ? "bg-encre text-white" : "text-slate-700 hover:bg-slate-200/70"
                  }`}
                >
                  <IconeRayon slug={x.slug} className="h-[18px] w-[18px] shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{nomDuRayon(x, t)}</span>
                  <span className="text-xs font-normal tabular-nums opacity-60">{x._count.produits}</span>
                </Link>
                {x.slug === slug && avecSousRayons && (
                  <ul className="my-1 ms-[1.1rem] space-y-0.5 border-s border-slate-300 ps-2">
                    {groupes.map((g) => (
                      <li key={g.cle}>
                        <Link
                          href={adresse(g.cle)}
                          aria-current={g.cle === choisi ? "page" : undefined}
                          className={`flex items-baseline gap-2 rounded-lg px-2 py-1.5 text-[13px] transition ${
                            g.cle === choisi ? "bg-slate-200 font-semibold text-encre" : "text-slate-600 hover:bg-slate-200/70 hover:text-encre"
                          }`}
                        >
                          <span className="min-w-0 flex-1">{nomSous(g.cle)}</span>
                          <span className="text-xs tabular-nums text-slate-400">{g.articles.length}</span>
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

      <div className="min-w-0 space-y-5">
        {/* Sur téléphone : les rayons en rangée qui défile. */}
        <nav aria-label={t.categorie.navAria} className="lg:hidden">
          <RangeeDeLiens cle={slug} className="rail gap-2">
          {categories.map((x) => (
            <Link
              key={x.id}
              href={lien(`/categorie/${x.slug}`)}
              aria-current={x.slug === slug ? "page" : undefined}
              className={`flex shrink-0 snap-start items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                x.slug === slug ? "border-encre bg-encre text-white" : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
              }`}
            >
              <IconeRayon slug={x.slug} className="h-4 w-4 shrink-0" />
              {nomDuRayon(x, t)}
            </Link>
          ))}
          </RangeeDeLiens>
        </nav>

        <header className="flex items-center gap-3.5">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700">
            <IconeRayon slug={c.slug} className="h-6 w-6" />
          </span>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{nomDuRayon(c, t)}</h1>
            <p className="text-sm text-slate-500">{nombre(produits.length)}</p>
          </div>
        </header>

        {/* Les sous-rayons : sur téléphone, une rangée qui reste sous l'en-tête pendant qu'on fait défiler. */}
        {avecSousRayons && (
          <nav aria-label={t.categorie.sousRayonsAria} className="sticky top-[61px] z-[15] -mx-4 border-b border-slate-200 bg-fond/95 backdrop-blur sm:top-[65px] lg:hidden">
            <RangeeDeLiens cle={`${slug}/${choisi ?? ""}`} className="flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {[null, ...groupes.map((g) => g.cle)].map((cle) => (
                <Link
                  key={cle ?? "tout"}
                  href={adresse(cle)}
                  aria-current={cle === choisi ? "page" : undefined}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-semibold transition ${
                    cle === choisi ? "bg-encre text-white" : "bg-slate-200/70 text-slate-700 hover:bg-slate-200"
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
              <h2 id="titre-sous-rayon" className="text-lg font-bold sm:text-xl">
                {nomSous(groupeChoisi.cle)} <span className="ms-1 text-sm font-normal text-slate-500">{nombre(groupeChoisi.articles.length)}</span>
              </h2>
              <Link href={adresse(null)} className="text-sm font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">
                {remplir(t.categorie.retourAuRayon, { nom: nomDuRayon(c, t) })}
              </Link>
            </div>
            <GrilleProduits produits={groupeChoisi.articles} etroite />
          </section>
        ) : avecSousRayons ? (
          // Le rayon entier : un aperçu de chaque sous-rayon, et « Tout voir ».
          <div className="space-y-8">
            {groupes.map((g) => (
              <section key={g.cle} aria-labelledby={`sous-rayon-${g.cle}`} className="scroll-mt-32 space-y-3">
                <div className="flex items-baseline justify-between gap-4">
                  <h2 id={`sous-rayon-${g.cle}`} className="text-lg font-bold sm:text-xl">
                    {nomSous(g.cle)} <span className="ms-1 text-sm font-normal tabular-nums text-slate-500">{g.articles.length}</span>
                  </h2>
                  {g.articles.length > 6 && (
                    <Link href={adresse(g.cle)} className="shrink-0 text-sm font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">
                      {t.categorie.toutVoir}
                    </Link>
                  )}
                </div>
                {/* L'aperçu montre d'abord les articles qui ont une photo. */}
                <GrilleProduits produits={photosDAbord(g.articles).slice(0, APERCU)} etroite apercu />
              </section>
            ))}
          </div>
        ) : (
          <GrilleProduits produits={produits} etroite />
        )}

        <p className="pt-2 text-sm text-slate-600">
          {t.commun.introuvableQuestion}{" "}
          <Link href={lien("/panier?demande=")} className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">{t.commun.demandezLe}</Link>
          {t.commun.introuvableSuite}
        </p>
      </div>
    </div>
  );
}
