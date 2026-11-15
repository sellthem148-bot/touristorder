import { formatPrix } from "@/lib/argent";
import type { Totaux } from "@/lib/calcul";
import type { Langue } from "@/lib/langues";
import { LIBELLES_MONTANTS_FR, lignesDeMontants, type LibellesMontants, type PresentationMontants } from "@/lib/montants";

type Props = PresentationMontants & {
  totaux: Totaux;
  libelleTotal?: string;
  className?: string;
  /** La langue du client et ses libellés (`t.montants`) ; sans eux, le français de l'espace gérant. */
  langue?: Langue;
  libelles?: LibellesMontants;
};

/** Le détail des montants : une seule présentation pour le panier, le suivi et l'admin.
 *  Un montant qui change (quantité, créneau, ville, pourboire…) revient en fondu : il porte sa valeur en `key`. */
export function RecapMontants({ totaux, libelleTotal = "Total", className = "", langue = "fr", libelles = LIBELLES_MONTANTS_FR, ...presentation }: Props) {
  return (
    <dl className={`space-y-2 text-sm ${className}`}>
      {lignesDeMontants(totaux, presentation, libelles).map((l) => (
        <div key={l.libelle} className="flex justify-between gap-3">
          <dt>{l.libelle}</dt>
          <dd className="font-semibold"><span key={l.montant} className="change inline-block">{formatPrix(l.montant, langue)}</span></dd>
        </div>
      ))}
      <div className="flex justify-between gap-3 border-t border-slate-100 pt-3 text-lg font-extrabold">
        <dt>{libelleTotal}</dt>
        <dd><span key={totaux.total} className="change inline-block">{formatPrix(totaux.total, langue)}</span></dd>
      </div>
    </dl>
  );
}
