"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import { Globe } from "lucide-react";
import { langueDuChemin, LANGUES, lienPour, NOM_DE_LA_LANGUE, type Langue } from "@/lib/langues";
import { changerLangue } from "@/app/(boutique)/langue-actions";
import { useTraduction } from "./LangueProvider";

/**
 * Le choix de la langue. `compact` (en-tête) : un globe et le code de la langue, avec la liste
 * native du téléphone posée par-dessus, invisible. Sinon : un champ ordinaire (pied de page, espace client).
 */
export function ChoixLangue({ compact = false, sansEtiquette = false, id = "langue" }: { compact?: boolean; sansEtiquette?: boolean; id?: string }) {
  const { langue, t } = useTraduction();
  const router = useRouter();
  const chemin = usePathname();
  const [enCours, demarrer] = useTransition();

  // Le choix est gardé (cookie, espace client), puis le visiteur passe à la même page à l'adresse de
  // sa langue (« /panier » → « /he/panier ») sans rechargement : ce qu'il a déjà saisi reste en place.
  function choisir(code: string) {
    demarrer(async () => {
      await changerLangue(code);
      const page = langueDuChemin(chemin).chemin;
      router.replace(`${lienPour(code as Langue, page)}${window.location.search}${window.location.hash}`, { scroll: false });
    });
  }

  const options = LANGUES.map((l: Langue) => (
    // Chaque langue est écrite dans sa propre langue : on la reconnaît sans lire celle de la page.
    <option key={l} value={l} lang={l}>
      {NOM_DE_LA_LANGUE[l]}
    </option>
  ));

  if (compact) {
    return (
      <label
        className={`relative hidden h-10 shrink-0 cursor-pointer min-[360px]:inline-flex items-center justify-center gap-1.5 rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-marque/40 ${enCours ? "opacity-60" : ""}`}
        title={t.langue.choisir}
      >
        <Globe className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
        <span aria-hidden="true" className="hidden uppercase sm:inline">{langue}</span>
        <span className="sr-only">{t.langue.choisir}</span>
        <select id={id} value={langue} onChange={(e) => choisir(e.target.value)} disabled={enCours} className="absolute inset-0 h-full w-full cursor-pointer opacity-0">
          {options}
        </select>
      </label>
    );
  }

  return (
    <div>
      <label htmlFor={id} className={sansEtiquette ? "sr-only" : "etiquette"}>{t.langue.titre}</label>
      <select id={id} value={langue} onChange={(e) => choisir(e.target.value)} disabled={enCours} className="champ max-w-xs">
        {options}
      </select>
    </div>
  );
}
