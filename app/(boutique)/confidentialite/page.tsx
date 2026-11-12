import type { Metadata } from "next";
import { Article, PageTexte, Paragraphe, TexteRiche } from "@/components/PageTexte";
import { infosLegales } from "@/lib/reglages";
import { NOM_DU_SITE } from "@/lib/marque";
import { remplir } from "@/lib/langues";
import { cadreDeLaPage } from "@/lib/pages-texte";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { j } = await cadreDeLaPage();
  return {
    title: j.confidentialite.titre,
    description: remplir(j.confidentialite.metaDescription, { site: NOM_DU_SITE }),
    alternates: { canonical: "/confidentialite" },
  };
}

export default async function Confidentialite() {
  const [i, { j, accueil, misAJour, avis }] = await Promise.all([infosLegales(), cadreDeLaPage()]);
  const c = j.confidentialite;
  const responsable = i.nom || NOM_DU_SITE;
  const liste = (points: string[]) => (
    <ul className="list-disc space-y-1.5 ps-5">
      {points.map((point) => <li key={point}><TexteRiche texte={point} /></li>)}
    </ul>
  );
  return (
    <PageTexte titre={c.titre} accueil={accueil} misAJour={misAJour} avis={avis}>
      <Paragraphe texte={remplir(c.intro, { responsable, site: NOM_DU_SITE })} />

      <Article titre={c.recueil.titre}>{liste(c.recueil.points)}</Article>

      <Article titre={c.usage.titre}>
        {liste(c.usage.points)}
        <Paragraphe texte={c.usage.p1} />
      </Article>

      <Article titre={c.partage.titre}>
        <Paragraphe texte={c.partage.p1} />
      </Article>

      <Article titre={c.cookies.titre}>
        <Paragraphe texte={c.cookies.p1} />
      </Article>

      <Article titre={c.duree.titre}>
        <Paragraphe texte={c.duree.p1} />
      </Article>

      <Article titre={c.droits.titre}>
        <Paragraphe texte={i.email ? remplir(c.droits.p1AvecEmail, { email: i.email }) : c.droits.p1} />
      </Article>

      <Article titre={c.securite.titre}>
        <Paragraphe texte={c.securite.p1} />
      </Article>
    </PageTexte>
  );
}
