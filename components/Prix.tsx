import { formatPrix } from "@/lib/argent";
import { BADGES, type Badge } from "@/lib/choix-commande";
import type { Langue } from "@/lib/langues";

/**
 * Le prix d'un article. Sans `langue` ni `auLieuDe` : en français (l'espace gérant).
 * `etiquette` (côté client) : le prix dans une petite étiquette au jaune du logo — rose pour une promotion.
 */
export function Prix({
  prix, prixBarre, grand = false, etiquette = false, langue = "fr", auLieuDe = "au lieu de ",
}: { prix: number; prixBarre: number | null; grand?: boolean; etiquette?: boolean; langue?: Langue; auLieuDe?: string }) {
  const fond = !etiquette ? "" : `${grand ? "rounded-xl px-2.5 py-1" : "rounded-lg px-2 py-0.5"} ${prixBarre ? "bg-rose-100" : "bg-soleil/25"}`;
  return (
    <p className="flex flex-wrap items-baseline gap-x-2 tabular-nums">
      <span className={`font-bold ${fond} ${prixBarre ? "text-rose-700" : "text-encre"} ${grand ? "text-2xl" : "text-[15px]"}`}>
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
