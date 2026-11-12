import Link from "next/link";
import { Fragment } from "react";
import { ArrowLeft } from "lucide-react";
import { lienPour, type Langue } from "@/lib/langues";

export const LIEN_TEXTE = "font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre";

/**
 * Une page de texte (conditions, confidentialité, mentions légales, contact) : titre, date, contenu lisible.
 * `accueil`, `misAJour` et `avis` arrivent déjà dans la langue du client ; `retour` est l'adresse de l'accueil dans cette langue.
 */
export function PageTexte({ titre, accueil, retour = "/", misAJour, avis, children }: { titre: string; accueil: string; retour?: string; misAJour?: string; avis?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <Link href={retour} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-encre">
        <ArrowLeft className="h-4 w-4 rtl:rotate-180" strokeWidth={1.8} aria-hidden="true" /> {accueil}
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{titre}</h1>
      {misAJour && <p className="mt-1 text-sm text-slate-500">{misAJour}</p>}
      {/* Une traduction : la version française fait foi. */}
      {avis && <p className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">{avis}</p>}
      <div className="mt-6 space-y-8 text-[15px] leading-relaxed text-slate-700">{children}</div>
    </article>
  );
}

/** Une section numérotée d'une page de texte. */
export function Article({ titre, children }: { titre: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-encre">{titre}</h2>
      {children}
    </section>
  );
}

/**
 * Un texte des dictionnaires avec ses deux marques de mise en forme :
 * « [texte](/adresse) » = un lien (du site, ou « mailto: »), « **texte** » = du gras.
 * Tout le reste est du texte brut : rien d'autre n'est interprété. Un lien du site mène à l'adresse
 * de la page dans la langue donnée (« /contact » → « /he/contact »).
 */
export function TexteRiche({ texte, langue = "fr" }: { texte: string; langue?: Langue }) {
  const morceaux = texte.split(/(\[[^\]]+\]\([^)\s]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {morceaux.map((m, i) => {
        const lien = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(m);
        if (lien) {
          const [, libelle, adresse] = lien;
          if (adresse.startsWith("/")) return <Link key={i} href={lienPour(langue, adresse)} className={LIEN_TEXTE}>{libelle}</Link>;
          if (adresse.startsWith("mailto:")) return <a key={i} href={adresse} className={LIEN_TEXTE}><bdi dir="ltr">{libelle}</bdi></a>;
          return <Fragment key={i}>{libelle}</Fragment>;
        }
        const gras = /^\*\*([^*]+)\*\*$/.exec(m);
        if (gras) return <strong key={i}>{gras[1]}</strong>;
        return <Fragment key={i}>{m}</Fragment>;
      })}
    </>
  );
}

/** Un paragraphe d'un dictionnaire, ses « {valeurs} » déjà remplies. */
export function Paragraphe({ texte, langue = "fr" }: { texte: string; langue?: Langue }) {
  return <p><TexteRiche texte={texte} langue={langue} /></p>;
}
