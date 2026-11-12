import { formatPrix } from "@/lib/argent";
import { BADGES, type Badge } from "@/lib/choix-commande";
import type { Langue } from "@/lib/langues";

/** Le prix d'un article. Sans `langue` ni `auLieuDe` : en français (l'espace gérant). */
export function Prix({
  prix, prixBarre, grand = false, langue = "fr", auLieuDe = "au lieu de ",
}: { prix: number; prixBarre: number | null; grand?: boolean; langue?: Langue; auLieuDe?: string }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      <span className={`font-bold ${prixBarre ? "text-rose-700" : "text-encre"} ${grand ? "text-2xl" : "text-[15px]"}`}>
        {formatPrix(prix, langue)}
      </span>
      {prixBarre && (
        <s className={`text-slate-400 ${grand ? "text-base" : "text-xs"}`}>
          <span className="sr-only">{auLieuDe}</span>
          {formatPrix(prixBarre, langue)}
        </s>
      )}
    </p>
  );
}

/** Une petite étiquette discrète : Populaire, Nouveau, Promo. `libelle` : son nom dans la langue du client. */
export function PastilleBadge({ badge, libelle, className = "" }: { badge: Badge; libelle?: string; className?: string }) {
  if (!badge) return null;
  const b = BADGES[badge];
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase leading-4 tracking-wide ${b.classes} ${className}`}>{libelle ?? b.libelle}</span>;
}
