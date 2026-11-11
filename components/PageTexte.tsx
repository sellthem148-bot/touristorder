import Link from "next/link";
import { ArrowLeft } from "lucide-react";

/** Une page de texte (conditions, confidentialité, mentions légales, contact) : titre, date, contenu lisible. */
export function PageTexte({ titre, misAJour, children }: { titre: string; misAJour?: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl">
      <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-encre">
        <ArrowLeft className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Accueil
      </Link>
      <h1 className="mt-3 text-2xl font-bold sm:text-3xl">{titre}</h1>
      {misAJour && <p className="mt-1 text-sm text-slate-500">Dernière mise à jour : {misAJour}</p>}
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

export const LIEN_TEXTE = "font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre";
