"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart } from "lucide-react";
import { formatPrix } from "@/lib/argent";
import { compter, langueDuChemin } from "@/lib/langues";
import { usePanier } from "./panier/PanierProvider";
import { useTraduction } from "./LangueProvider";

export function LienPanier() {
  const { nombre } = usePanier();
  const { langue, t, lien } = useTraduction();
  return (
    <Link
      href={lien("/panier")}
      data-cible-panier="entete"
      className="relative inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-encre px-3 text-sm font-semibold text-white transition duration-150 hover:bg-slate-800 active:scale-95"
      aria-label={compter(langue, nombre, t.entete.panierAria)}
    >
      {/* Le chariot se balance à chaque article qui entre ou sort (sa clé change avec le nombre). Sa clé et
          celle du compteur sont distinctes : deux voisins de même clé, et React en laissait des copies. */}
      <ShoppingCart key={`chariot-${nombre}`} className={`h-[18px] w-[18px] ${nombre > 0 ? "balance" : ""}`} strokeWidth={1.8} aria-hidden="true" />
      <span className="hidden sm:inline" aria-hidden="true">{t.entete.panier}</span>
      {nombre > 0 && (
        // La clé change avec le nombre d'articles : le compteur rebondit à chaque ajout.
        <span key={`compteur-${nombre}`} className="saute min-w-5 rounded-md bg-soleil px-1 text-center text-xs font-bold leading-5 text-encre tabular-nums" aria-hidden="true">
          {nombre > 99 ? "99+" : nombre}
        </span>
      )}
    </Link>
  );
}

/** Barre « Voir le panier » en bas de l'écran, sur téléphone. */
export function BarrePanier() {
  const { nombre, sousTotal } = usePanier();
  const { langue, t, lien } = useTraduction();
  // L'adresse sans son préfixe de langue : « /he/panier » est la page du panier.
  const chemin = langueDuChemin(usePathname()).chemin;
  if (nombre === 0 || chemin === "/panier" || chemin.startsWith("/suivi")) return null;
  return (
    // `monte` : la barre arrive par le bas quand le premier article entre au panier.
    <aside aria-label={t.entete.panier} data-cible-panier="barre" className="monte fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:hidden">
      <Link href={lien("/panier")} className="bouton w-full justify-between py-3.5">
        <span className="flex items-center gap-2.5">
          <span key={nombre} data-compteur className="saute flex h-6 min-w-6 items-center justify-center rounded-md bg-soleil px-1.5 text-sm font-bold text-encre tabular-nums">{nombre}</span>
          {t.entete.voirLePanier}
        </span>
        <span key={sousTotal} className="change tabular-nums">{formatPrix(sousTotal, langue)}</span>
      </Link>
    </aside>
  );
}
