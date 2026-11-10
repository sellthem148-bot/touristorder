import Link from "next/link";
import { NOM_DU_SITE } from "@/lib/marque";
import { LienPanier } from "./LienPanier";

export function EnTete({ recherche = "" }: { recherche?: string }) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
        <Link href="/" className="shrink-0 text-lg font-extrabold tracking-tight text-marque">
          {NOM_DU_SITE}
        </Link>
        <form action="/recherche" method="get" role="search" className="min-w-0 flex-1">
          <label htmlFor="recherche" className="sr-only">
            Rechercher un produit
          </label>
          <input
            id="recherche"
            name="q"
            type="search"
            defaultValue={recherche}
            placeholder="Chargeur, couches, maillot…"
            className="w-full rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-marque focus:bg-white focus:outline-none"
          />
        </form>
        <LienPanier />
      </div>
    </header>
  );
}
