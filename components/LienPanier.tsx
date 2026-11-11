"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { formatPrix } from "@/lib/argent";
import { usePanier } from "./panier/PanierProvider";

export function LienPanier() {
  const { nombre } = usePanier();
  return (
    <Link
      href="/panier"
      className="relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-encre px-3 text-sm font-semibold text-white hover:bg-slate-800"
      aria-label={`Panier, ${nombre} article${nombre > 1 ? "s" : ""}`}
    >
      <ShoppingCart className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden sm:inline" aria-hidden="true">Panier</span>
      {nombre > 0 && (
        <span className="min-w-5 rounded-md bg-white px-1 text-center text-xs font-bold leading-5 text-encre tabular-nums" aria-hidden="true">
          {nombre > 99 ? "99+" : nombre}
        </span>
      )}
    </Link>
  );
}

/** Barre « Voir le panier » en bas de l'écran, sur téléphone. */
export function BarrePanier() {
  const { nombre, sousTotal } = usePanier();
  const chemin = usePathname();
  if (nombre === 0 || chemin === "/panier" || chemin.startsWith("/suivi")) return null;
  return (
    <aside aria-label="Panier" className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <Link href="/panier" className="bouton w-full justify-between py-3.5">
        <span className="flex items-center gap-2.5">
          <span className="flex h-6 min-w-6 items-center justify-center rounded-md bg-white/15 px-1.5 text-sm tabular-nums">{nombre}</span>
          Voir le panier
        </span>
        <span className="tabular-nums">{formatPrix(sousTotal)}</span>
      </Link>
    </aside>
  );
}
