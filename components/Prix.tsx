import { formatPrix } from "@/lib/argent";
import { BADGES, type Badge } from "@/lib/choix-commande";

export function Prix({ prix, prixBarre, grand = false }: { prix: number; prixBarre: number | null; grand?: boolean }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      <span className={`font-bold ${prixBarre ? "text-rose-700" : "text-encre"} ${grand ? "text-2xl" : "text-[15px]"}`}>
        {formatPrix(prix)}
      </span>
      {prixBarre && (
        <s className={`text-slate-400 ${grand ? "text-base" : "text-xs"}`}>
          <span className="sr-only">au lieu de </span>
          {formatPrix(prixBarre)}
        </s>
      )}
    </p>
  );
}

/** Une petite étiquette discrète : Populaire, Nouveau, Promo. */
export function PastilleBadge({ badge, className = "" }: { badge: Badge; className?: string }) {
  if (!badge) return null;
  const b = BADGES[badge];
  return <span className={`inline-block rounded-md px-1.5 py-0.5 text-[10.5px] font-semibold uppercase leading-4 tracking-wide ${b.classes} ${className}`}>{b.libelle}</span>;
}
