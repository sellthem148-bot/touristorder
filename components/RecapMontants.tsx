import { formatPrix } from "@/lib/argent";
import type { Totaux } from "@/lib/calcul";
import { NOM_TARIF_DE_BASE } from "@/lib/tarifs";

type Props = {
  totaux: Totaux;
  regroupes: boolean; // une seule ligne « Frais de service (livraison comprise) »
  express: boolean;
  tarifNom: string;
  majorationPct: number;
  nombreArticles?: number;
  libelleTotal?: string;
  className?: string;
  ville?: string; // affichée à côté de la livraison
};

/** Le détail des montants : une seule présentation pour le panier, le suivi et l'admin. */
export function RecapMontants({ totaux, regroupes, express, tarifNom, majorationPct, nombreArticles, libelleTotal = "Total", className = "", ville }: Props) {
  const livraison = `Livraison${express ? " express" : ""}`;
  const pour = ville ? ` · ${ville}` : "";
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      <div className="flex justify-between gap-3">
        <dt>Articles{nombreArticles != null ? ` (${nombreArticles})` : ""}</dt>
        <dd className="font-semibold">{formatPrix(totaux.sousTotal)}</dd>
      </div>
      {totaux.majoration > 0 && (
        <div className="flex justify-between gap-3">
          <dt>
            Supplément {tarifNom && tarifNom !== NOM_TARIF_DE_BASE ? tarifNom.toLowerCase() : "horaire"} (+{majorationPct} %)
          </dt>
          <dd className="font-semibold">{formatPrix(totaux.majoration)}</dd>
        </div>
      )}
      {regroupes ? (
        <div className="flex justify-between gap-3">
          <dt>Frais de service ({livraison.toLowerCase()} comprise){pour}</dt>
          <dd className="font-semibold">{formatPrix(totaux.fraisService + totaux.fraisLivraison)}</dd>
        </div>
      ) : (
        <>
          <div className="flex justify-between gap-3"><dt>Frais de service</dt><dd className="font-semibold">{formatPrix(totaux.fraisService)}</dd></div>
          <div className="flex justify-between gap-3"><dt>{livraison}{pour}</dt><dd className="font-semibold">{formatPrix(totaux.fraisLivraison)}</dd></div>
        </>
      )}
      {totaux.pourboire > 0 && (
        <div className="flex justify-between gap-3"><dt>Pourboire</dt><dd className="font-semibold">{formatPrix(totaux.pourboire)}</dd></div>
      )}
      <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-lg font-extrabold">
        <dt>{libelleTotal}</dt>
        <dd>{formatPrix(totaux.total)}</dd>
      </div>
    </dl>
  );
}
