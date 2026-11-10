import { formatPrix } from "@/lib/argent";
import { BADGES, type Badge } from "@/lib/choix-commande";

export function Prix({ prix, prixBarre, grand = false }: { prix: number; prixBarre: number | null; grand?: boolean }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      <span className={`font-extrabold ${prixBarre ? "text-rose-600" : "text-slate-900"} ${grand ? "text-2xl" : "text-[15px]"}`}>
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

export function PastilleBadge({ badge, className = "" }: { badge: Badge; className?: string }) {
  if (!badge) return null;
  const b = BADGES[badge];
  return <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${b.classes} ${className}`}>{b.libelle}</span>;
}
