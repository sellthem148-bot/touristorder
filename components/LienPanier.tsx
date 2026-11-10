"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrix } from "@/lib/argent";
import { usePanier } from "./panier/PanierProvider";
import { IconePanier } from "./Icones";

export function LienPanier() {
  const { nombre } = usePanier();
  return (
    <Link
      href="/panier"
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marque text-white shadow-sm"
      aria-label={`Panier, ${nombre} article${nombre > 1 ? "s" : ""}`}
    >
      <IconePanier />
      {nombre > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-soleil px-1 text-center text-xs font-extrabold leading-5 text-slate-900 ring-2 ring-white">
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
    <aside aria-label="Panier" className="fixed inset-x-0 bottom-0 z-30 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <Link href="/panier" className="bouton w-full justify-between rounded-2xl py-3.5 shadow-flottant">
        <span className="flex items-center gap-2">
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/20 px-1.5 text-sm">{nombre}</span>
          Voir le panier
        </span>
        <span>{formatPrix(sousTotal)}</span>
      </Link>
    </aside>
  );
}
