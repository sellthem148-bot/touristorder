import Link from "next/link";
import { Article, LIEN_TEXTE, PageTexte } from "@/components/PageTexte";
import { infosLegales } from "@/lib/reglages";
import { NOM_DU_SITE } from "@/lib/marque";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Mentions légales",
  description: `Éditeur, contact et hébergement du site ${NOM_DU_SITE}.`,
  alternates: { canonical: "/mentions-legales" },
};

export default async function MentionsLegales() {
  const i = await infosLegales();
  return (
    <PageTexte titre="Mentions légales" misAJour="11 novembre 2026">
      <Article titre="Éditeur du site">
        <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[180px_minmax(0,1fr)]">
          <dt className="text-slate-500">Site</dt>
          <dd>{NOM_DU_SITE}</dd>
          {i.nom && (<><dt className="text-slate-500">Exploitant</dt><dd>{i.nom}</dd></>)}
          {i.numero && (<><dt className="text-slate-500">Numéro d&apos;entreprise</dt><dd>{i.numero}</dd></>)}
          {i.adresse && (<><dt className="text-slate-500">Adresse</dt><dd>{i.adresse}</dd></>)}
          {i.email && (<><dt className="text-slate-500">E-mail</dt><dd><a href={`mailto:${i.email}`} className={LIEN_TEXTE}>{i.email}</a></dd></>)}
          <dt className="text-slate-500">Contact</dt>
          <dd><Link href="/contact" className={LIEN_TEXTE}>Page de contact</Link></dd>
        </dl>
      </Article>

      <Article titre="Hébergement">
        <p>
          Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com).
          Les données sont enregistrées dans une base gérée par Supabase.
        </p>
      </Article>

      <Article titre="Propriété intellectuelle">
        <p>
          Le site, son logo et ses textes appartiennent à leur éditeur. Les marques et les noms de produits cités appartiennent à leurs propriétaires
          respectifs : ils sont mentionnés uniquement pour désigner les articles que nous achetons pour vous.
        </p>
      </Article>

      <Article titre="Conditions et données personnelles">
        <p>
          Voir les <Link href="/conditions" className={LIEN_TEXTE}>conditions générales de vente</Link> et la{" "}
          <Link href="/confidentialite" className={LIEN_TEXTE}>politique de confidentialité</Link>.
        </p>
      </Article>
    </PageTexte>
  );
}
