import Link from "next/link";
import { Search, User } from "lucide-react";
import { NOM_DU_SITE } from "@/lib/marque";
import { lienPour, remplir, type Langue } from "@/lib/langues";
import type { Dictionnaire } from "@/lib/i18n/fr";
import { LienPanier } from "./LienPanier";
import { ChoixLangue } from "./ChoixLangue";
import { Sigle } from "./Sigle";

/** Le logo : le sigle (un T et un O couleur soleil dans une tuile), et le nom. */
export function Logo({ clair = false, sansNom = false, compactSurMobile = false }: { clair?: boolean; sansNom?: boolean; compactSurMobile?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <Sigle taille={36} clair={clair} />
      {!sansNom && (
        <span className={`text-[17px] font-bold tracking-tight ${clair ? "text-white" : "text-encre"} ${compactSurMobile ? "hidden sm:inline" : ""}`}>{NOM_DU_SITE}</span>
      )}
    </span>
  );
}

/** L'en-tête de la boutique, dans la langue du visiteur. Les marges sont « logiques » (début / fin) : en hébreu, tout se retourne. */
export function EnTete({ t, langue }: { t: Dictionnaire; langue: Langue }) {
  const lien = (chemin: string) => lienPour(langue, chemin);
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-2.5 sm:gap-5 sm:py-3">
        <Link href={lien("/")} className="shrink-0" aria-label={remplir(t.entete.accueilAria, { site: NOM_DU_SITE })}>
          <span className="sm:hidden"><Logo sansNom /></span>
          <span className="hidden sm:block"><Logo /></span>
        </Link>
        <form action={lien("/recherche")} method="get" role="search" className="relative min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="recherche" className="sr-only">{t.entete.rechercherLabel}</label>
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} aria-hidden="true" />
          <input
            id="recherche"
            name="q"
            type="search"
            placeholder={t.entete.rechercherPlaceholder}
            className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 ps-9 pe-3 text-sm placeholder:text-slate-500 focus:border-encre focus:bg-white focus:outline-none focus:ring-2 focus:ring-encre/10"
          />
        </form>
        <div className="flex shrink-0 items-center gap-0.5 sm:ms-auto sm:gap-2">
          <ChoixLangue compact id="langue-entete" />
          <Link
            href={lien("/compte")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:px-2.5"
            aria-label={t.entete.monEspace}
            title={t.entete.monEspace}
          >
            <User className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            <span className="hidden md:inline">{t.entete.monCompte}</span>
          </Link>
          <LienPanier />
        </div>
      </div>
    </header>
  );
}
