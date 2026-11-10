"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatPrix } from "@/lib/argent";
import { usePanier } from "./panier/PanierProvider";

function IconePanier() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5" aria-hidden="true">
      <path d="M6 6h15l-1.5 9h-12z" strokeLinejoin="round" />
      <path d="M6 6 5 3H2" strokeLinecap="round" />
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
    </svg>
  );
}

export function LienPanier() {
  const { nombre } = usePanier();
  return (
    <Link
      href="/panier"
      className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-marque-clair text-marque"
      aria-label={`Panier, ${nombre} article${nombre > 1 ? "s" : ""}`}
    >
      <IconePanier />
      {nombre > 0 && (
        <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-accent px-1 text-center text-xs font-bold leading-5 text-slate-900">
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
    <aside aria-label="Panier" className="fixed inset-x-0 bottom-0 z-30 p-3 sm:hidden">
      <Link href="/panier" className="bouton w-full justify-between py-3.5 shadow-lg">
        <span>
          Voir le panier · {nombre} article{nombre > 1 ? "s" : ""}
        </span>
        <span>{formatPrix(sousTotal)}</span>
      </Link>
    </aside>
  );
}
