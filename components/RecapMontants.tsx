import { formatPrix } from "@/lib/argent";
import type { Totaux } from "@/lib/calcul";
import { lignesDeMontants, type PresentationMontants } from "@/lib/montants";

type Props = PresentationMontants & {
  totaux: Totaux;
  libelleTotal?: string;
  className?: string;
};

/** Le détail des montants : une seule présentation pour le panier, le suivi et l'admin. */
export function RecapMontants({ totaux, libelleTotal = "Total", className = "", ...presentation }: Props) {
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      {lignesDeMontants(totaux, presentation).map((l) => (
        <div key={l.libelle} className="flex justify-between gap-3">
          <dt>{l.libelle}</dt>
          <dd className="font-semibold">{formatPrix(l.montant)}</dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-lg font-extrabold">
        <dt>{libelleTotal}</dt>
        <dd>{formatPrix(totaux.total)}</dd>
      </div>
    </dl>
  );
}
