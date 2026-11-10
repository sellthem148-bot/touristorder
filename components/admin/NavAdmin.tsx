"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Lien = { href: string; libelle: string; pastille?: number };

export function NavAdmin({ liens }: { liens: Lien[] }) {
  const chemin = usePathname();
  // Le lien le plus précis gagne : « Prix rapides » (/admin/produits/prix) plutôt que « Produits ».
  const correspond = (href: string) =>
    href === "/admin" ? chemin === "/admin" || chemin.startsWith("/admin/commandes") : chemin === href || chemin.startsWith(`${href}/`);
  const choisi = liens.filter((l) => correspond(l.href)).sort((a, b) => b.href.length - a.href.length)[0]?.href;
  const actif = (href: string) => href === choisi;
  return (
    <nav aria-label="Administration" className="rail mx-0 px-0 pb-0">
      {liens.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          aria-current={actif(l.href) ? "page" : undefined}
          className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition ${
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
