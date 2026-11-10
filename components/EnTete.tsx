import Link from "next/link";
import { NOM_DU_SITE } from "@/lib/marque";
import { LienPanier } from "./LienPanier";
import { IconeLoupe, IconeRecu, IconeSac } from "./Icones";

export function Logo({ clair = false, compactSurMobile = false }: { clair?: boolean; compactSurMobile?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${clair ? "bg-white text-marque" : "bg-marque text-white"} shadow-sm`}>
        <IconeSac className="h-5 w-5" />
      </span>
      <span className={`text-lg font-extrabold tracking-tight ${clair ? "text-white" : "text-slate-900"} ${compactSurMobile ? "hidden sm:inline" : ""}`}>{NOM_DU_SITE}</span>
    </span>
  );
}

export function EnTete() {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5">
        <Link href="/" className="shrink-0" aria-label={`${NOM_DU_SITE}, accueil`}>
          <span className="sm:hidden"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-marque text-white shadow-sm"><IconeSac /></span></span>
          <span className="hidden sm:block"><Logo /></span>
        </Link>
        <form action="/recherche" method="get" role="search" className="relative min-w-0 flex-1">
          <label htmlFor="recherche" className="sr-only">Rechercher un produit</label>
          <IconeLoupe className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="recherche"
            name="q"
            type="search"
            placeholder="Chargeur, couches, maillot…"
            className="w-full rounded-full border border-transparent bg-slate-100 py-2.5 pl-10 pr-4 text-sm font-medium placeholder:text-slate-500 focus:border-marque focus:bg-white focus:outline-none focus:ring-4 focus:ring-marque/15"
          />
        </form>
        <Link
          href="/commandes"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100"
          aria-label="Mes commandes"
          title="Mes commandes"
        >
          <IconeRecu />
        </Link>
        <LienPanier />
      </div>
    </header>
  );
}
