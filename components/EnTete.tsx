import Link from "next/link";
import { Search, User } from "lucide-react";
import { NOM_DU_SITE } from "@/lib/marque";
import { LienPanier } from "./LienPanier";

/** Les initiales du nom : « Tourist Order » → « TO ». */
export function monogramme(nom: string): string {
  const mots = nom.trim().split(/\s+/).filter(Boolean);
  const lettres = mots.length >= 2 ? mots[0][0] + mots[1][0] : (mots[0] ?? "").slice(0, 2);
  return lettres.toUpperCase();
}

/** Le logo : un monogramme dans un carré, et le nom. */
export function Logo({ clair = false, sansNom = false, compactSurMobile = false }: { clair?: boolean; sansNom?: boolean; compactSurMobile?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-xl text-[13px] font-extrabold tracking-tight ${clair ? "bg-white text-encre" : "bg-encre text-white"}`}
        aria-hidden="true"
      >
        {monogramme(NOM_DU_SITE)}
      </span>
      {!sansNom && (
        <span className={`text-[17px] font-bold tracking-tight ${clair ? "text-white" : "text-encre"} ${compactSurMobile ? "hidden sm:inline" : ""}`}>{NOM_DU_SITE}</span>
      )}
    </span>
  );
}

export function EnTete() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5 sm:gap-5 sm:py-3">
        <Link href="/" className="shrink-0" aria-label={`${NOM_DU_SITE}, accueil`}>
          <span className="sm:hidden"><Logo sansNom /></span>
          <span className="hidden sm:block"><Logo /></span>
        </Link>
        <form action="/recherche" method="get" role="search" className="relative min-w-0 flex-1 sm:max-w-md">
          <label htmlFor="recherche" className="sr-only">Rechercher un produit</label>
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" strokeWidth={1.8} aria-hidden="true" />
          <input
            id="recherche"
            name="q"
            type="search"
            placeholder="Rechercher un article"
            className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 pl-9 pr-3 text-sm placeholder:text-slate-500 focus:border-encre focus:bg-white focus:outline-none focus:ring-2 focus:ring-encre/10"
          />
        </form>
        <div className="flex shrink-0 items-center gap-1 sm:ml-auto sm:gap-2">
          <Link
            href="/compte"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100"
            aria-label="Mon espace client"
            title="Mon espace client"
          >
            <User className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            <span className="hidden md:inline">Mon compte</span>
          </Link>
          <LienPanier />
        </div>
      </div>
    </header>
  );
}
