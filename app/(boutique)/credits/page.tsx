import type { Metadata } from "next";
import { Article, LIEN_TEXTE, PageTexte, Paragraphe } from "@/components/PageTexte";
import { CREDITS_PHOTOS } from "@/lib/credits-photos";
import { NOM_DU_SITE } from "@/lib/marque";
import { remplir } from "@/lib/langues";
import { cadreDeLaPage } from "@/lib/pages-texte";
import { sujetPhoto } from "@/lib/i18n/catalogue";

export async function generateMetadata(): Promise<Metadata> {
  const { j, adresses } = await cadreDeLaPage();
  return {
    title: j.credits.titre,
    description: remplir(j.credits.metaDescription, { site: NOM_DU_SITE }),
    alternates: adresses("/credits"),
  };
}

/** L'attribution que demandent les licences des photos libres du catalogue. */
export default async function Credits() {
  const { j, accueil, retour, langue } = await cadreDeLaPage();
  const c = j.credits;
  return (
    <PageTexte titre={c.titre} accueil={accueil} retour={retour}>
      <Paragraphe langue={langue} texte={c.intro} />
      <Article titre={c.auteurs}>
        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white text-sm">
          {CREDITS_PHOTOS.map((p) => (
            <li key={p.fichier} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5">
              <span className="font-semibold text-encre"><bdi>{sujetPhoto(p.sujet, langue)}</bdi></span>
              <span className="text-slate-600">
                — <bdi>{p.auteur}</bdi>,{" "}
                {p.lienLicence ? (
                  <a href={p.lienLicence} className={LIEN_TEXTE} rel="license noopener noreferrer" target="_blank">{p.licence}</a>
                ) : (
                  p.licence
                )}
                {" · "}
                <a href={p.source} className={LIEN_TEXTE} rel="noopener noreferrer" target="_blank">{c.photoOrigine}</a>
              </span>
            </li>
          ))}
        </ul>
      </Article>
      <Article titre={c.modifications.titre}>
        <Paragraphe langue={langue} texte={c.modifications.p1} />
      </Article>
    </PageTexte>
  );
}
