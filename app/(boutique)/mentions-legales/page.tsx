import Link from "next/link";
import type { Metadata } from "next";
import { Article, LIEN_TEXTE, PageTexte, Paragraphe } from "@/components/PageTexte";
import { infosLegales } from "@/lib/reglages";
import { NOM_DU_SITE } from "@/lib/marque";
import { remplir } from "@/lib/langues";
import { cadreDeLaPage } from "@/lib/pages-texte";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { j, adresses } = await cadreDeLaPage();
  return {
    title: j.mentions.titre,
    description: remplir(j.mentions.metaDescription, { site: NOM_DU_SITE }),
    alternates: adresses("/mentions-legales"),
  };
}

export default async function MentionsLegales() {
  const [i, { langue, lien, j, accueil, retour, misAJour, avis }] = await Promise.all([infosLegales(), cadreDeLaPage()]);
  const m = j.mentions;
  return (
    <PageTexte titre={m.titre} accueil={accueil} retour={retour} misAJour={misAJour} avis={avis}>
      <Article titre={m.editeur}>
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[180px_minmax(0,1fr)]">
          <dt className="text-slate-500">{m.site}</dt>
          <dd>{NOM_DU_SITE}</dd>
          {i.nom && (<><dt className="text-slate-500">{m.exploitant}</dt><dd><bdi>{i.nom}</bdi></dd></>)}
          {i.numero && (<><dt className="text-slate-500">{m.numero}</dt><dd><bdi>{i.numero}</bdi></dd></>)}
          {i.adresse && (<><dt className="text-slate-500">{m.adresse}</dt><dd><bdi>{i.adresse}</bdi></dd></>)}
          {i.email && (<><dt className="text-slate-500">{m.email}</dt><dd><a href={`mailto:${i.email}`} className={LIEN_TEXTE}><bdi dir="ltr">{i.email}</bdi></a></dd></>)}
          <dt className="text-slate-500">{m.contact}</dt>
          <dd><Link href={lien("/contact")} className={LIEN_TEXTE}>{m.pageContact}</Link></dd>
        </dl>
      </Article>

      <Article titre={m.hebergement.titre}>
        <Paragraphe langue={langue} texte={m.hebergement.p1} />
      </Article>

      <Article titre={m.propriete.titre}>
        <Paragraphe langue={langue} texte={m.propriete.p1} />
      </Article>

      <Article titre={m.renvoi.titre}>
        <Paragraphe langue={langue} texte={m.renvoi.p1} />
      </Article>
    </PageTexte>
  );
}
