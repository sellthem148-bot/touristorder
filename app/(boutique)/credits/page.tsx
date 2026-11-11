import { Article, LIEN_TEXTE, PageTexte } from "@/components/PageTexte";
import { CREDITS_PHOTOS } from "@/lib/credits-photos";
import { NOM_DU_SITE } from "@/lib/marque";

export const metadata = {
  title: "Crédits photos",
  description: `Les auteurs et les licences des photos d'illustration utilisées sur ${NOM_DU_SITE}.`,
  alternates: { canonical: "/credits" },
};

/** L'attribution que demandent les licences des photos libres du catalogue. */
export default function Credits() {
  return (
    <PageTexte titre="Crédits photos">
      <p>
        Certaines photos de produits frais sont des photos d&apos;illustration, sous licence libre, issues de Wikimedia Commons.
        Elles montrent le produit, pas forcément la variété ni l&apos;emballage livrés. Merci à leurs auteurs.
      </p>
      <Article titre="Auteurs et licences">
        <ul className="divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white text-sm">
          {CREDITS_PHOTOS.map((c) => (
            <li key={c.fichier} className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 px-4 py-2.5">
              <span className="font-semibold text-encre">{c.sujet}</span>
              <span className="text-slate-600">
                — {c.auteur},{" "}
                {c.lienLicence ? (
                  <a href={c.lienLicence} className={LIEN_TEXTE} rel="license noopener noreferrer" target="_blank">{c.licence}</a>
                ) : (
                  c.licence
                )}
                {" · "}
                <a href={c.source} className={LIEN_TEXTE} rel="noopener noreferrer" target="_blank">photo d&apos;origine</a>
              </span>
            </li>
          ))}
        </ul>
      </Article>
      <Article titre="Modifications">
        <p>
          Les photos ont été recadrées et allégées. Celles publiées sous une licence « partage dans les mêmes conditions » (CC BY-SA)
          restent disponibles, dans leur version recadrée, sous la même licence.
        </p>
      </Article>
    </PageTexte>
  );
}
