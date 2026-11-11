"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

type Lien = { href: string; libelle: string; pastille?: number };

/**
 * Le menu du gérant. Tous les liens doivent rester atteignables :
 * - sur ordinateur et tablette, le menu passe à la ligne (aucun lien hors de l'écran) ;
 * - sur téléphone, une seule rangée qui défile au doigt : son bord droit s'estompe pour montrer
 *   qu'elle continue, et le lien de la page ouverte est amené dans l'écran.
 */
export function NavAdmin({ liens }: { liens: Lien[] }) {
  const chemin = usePathname();
  // Le lien le plus précis gagne : « Prix rapides » (/admin/produits/prix) plutôt que « Produits ».
  const correspond = (href: string) =>
    href === "/admin" ? chemin === "/admin" || chemin.startsWith("/admin/commandes") : chemin === href || chemin.startsWith(`${href}/`);
  const choisi = liens.filter((l) => correspond(l.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const actif = (href: string) => href === choisi;

  const rangee = useRef<HTMLElement>(null);
  useEffect(() => {
    // Sur téléphone : la rangée défile jusqu'au lien de la page ouverte (sans faire défiler la page).
    const nav = rangee.current;
    const lien = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!nav || !lien || nav.scrollWidth <= nav.clientWidth) return;
    nav.scrollTo({ left: Math.max(0, lien.offsetLeft - (nav.clientWidth - lien.offsetWidth) / 2) });
  }, [choisi]);

  return (
    <nav
      ref={rangee}
      aria-label="Administration"
      className="rail relative mx-0 gap-1 px-0 pb-0 pr-12 [mask-image:linear-gradient(to_right,#000_80%,transparent)] sm:snap-none sm:flex-wrap sm:gap-y-1.5 sm:overflow-visible sm:pr-0 sm:[mask-image:none]"
    >
      {liens.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={actif(l.href) ? "page" : undefined}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-bold transition ${
            actif(l.href) ? "bg-white text-slate-900" : "text-slate-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          {l.libelle}
          {!!l.pastille && <span className="rounded-full bg-soleil px-1.5 text-xs font-extrabold text-slate-900">{l.pastille}</span>}
        </Link>
      ))}
    </nav>
  );
}
