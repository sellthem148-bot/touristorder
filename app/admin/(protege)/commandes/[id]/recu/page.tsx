import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { formatDateHeure, libelleDuJour } from "@/lib/dates";
import { lignesDeMontants } from "@/lib/montants";
import { etatDuPaiement } from "@/lib/paiement";
import { lireReglages } from "@/lib/reglages";
import { NOM_DU_SITE } from "@/lib/marque";
import { Sigle } from "@/components/Sigle";
import { BoutonImprimer } from "@/components/admin/BoutonImprimer";

export const metadata = { title: "Reçu" };

/** Le reçu d'une commande, à imprimer ou à enregistrer en PDF pour l'envoyer au client. */
export default async function PageRecu({ params }: PageProps<"/admin/commandes/[id]/recu">) {
  await exigerAdmin();
  const { id } = await params;
  const [c, r] = await Promise.all([
    prisma.commande.findUnique({
      where: { id },
      // Seulement ce que le client a le droit de lire : ni prix d'achat, ni boutique.
      select: {
        id: true, numero: true, statut: true, createdAt: true, nomClient: true, adresse: true, ville: true, dateLivraison: true, creneau: true,
        paiement: true, montantPaye: true, payeLe: true, express: true, tarifNom: true, majorationPct: true,
        sousTotal: true, majoration: true, fraisService: true, fraisLivraison: true, pourboire: true, total: true,
        lignes: { where: { indisponible: false }, orderBy: { nom: "asc" }, select: { id: true, nom: true, options: true, quantite: true, prixUnitaire: true } },
      },
    }),
    lireReglages(),
  ]);
  if (!c) notFound();

  const paiement = etatDuPaiement(c);
  const entreprise = [r.entrepriseNom, r.entrepriseNumero && `N° ${r.entrepriseNumero}`, r.entrepriseAdresse, r.emailContact].filter(Boolean);
  const montants = lignesDeMontants(c, { regroupes: r.fraisRegroupes, express: c.express, tarifNom: c.tarifNom, majorationPct: c.majorationPct, ville: c.ville });

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link href={`/admin/commandes/${c.id}`} className="text-sm font-semibold text-marque hover:underline">← Commande n°{c.numero}</Link>
        <BoutonImprimer />
      </div>
      {entreprise.length === 0 && (
        <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 print:hidden">
          Les informations de ton entreprise ne sont pas encore renseignées : <Link href="/admin/reglages" className="underline">ajoute-les dans Réglages</Link> pour qu&apos;elles figurent sur le reçu.
        </p>
      )}

      <article className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 text-sm sm:p-8 print:rounded-none print:border-0 print:p-0">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <Sigle taille={44} />
            <div>
              <p className="text-lg font-bold leading-tight">{NOM_DU_SITE}</p>
              {entreprise.map((ligne) => <p key={ligne} className="text-xs text-slate-600">{ligne}</p>)}
            </div>
          </div>
          <div className="text-right">
            <h1 className="text-xl font-extrabold">Reçu n°{c.numero}</h1>
            <p className="text-slate-600">Commande du {formatDateHeure(c.createdAt)}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <h2 className="surtitre mb-1">Client</h2>
            <p className="font-semibold">{c.nomClient}</p>
            <p className="whitespace-pre-line">{c.adresse}</p>
            <p>{c.ville}</p>
          </div>
          <div>
            <h2 className="surtitre mb-1">Livraison</h2>
            <p>{libelleDuJour(c.dateLivraison)} ({c.dateLivraison.split("-").reverse().join("/")})</p>
            <p>{c.creneau}</p>
          </div>
        </section>

        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-slate-300 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="py-2 pr-2 font-semibold">Article</th>
              <th className="w-12 py-2 text-right font-semibold">Qté</th>
              <th className="w-24 py-2 text-right font-semibold">Prix</th>
              <th className="w-24 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {c.lignes.map((l) => (
              <tr key={l.id} className="border-b border-slate-100 align-top">
                <td className="py-2 pr-2">{l.nom}{l.options && <span className="block text-xs text-slate-500">{l.options}</span>}</td>
                <td className="py-2 text-right tabular-nums">{l.quantite}</td>
                <td className="py-2 text-right tabular-nums">{formatPrix(l.prixUnitaire)}</td>
                <td className="py-2 text-right tabular-nums">{formatPrix(l.prixUnitaire * l.quantite)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <dl className="ml-auto max-w-xs space-y-1.5">
          {montants.map((m) => (
            <div key={m.libelle} className="flex justify-between gap-3"><dt className="text-slate-600">{m.libelle}</dt><dd className="tabular-nums">{formatPrix(m.montant)}</dd></div>
          ))}
          <div className="flex justify-between gap-3 border-t border-slate-300 pt-2 text-base font-extrabold"><dt>Total</dt><dd className="tabular-nums">{formatPrix(c.total)}</dd></div>
          <div className="flex justify-between gap-3 pt-1">
            <dt className="text-slate-600">Payé{c.paiement ? ` (${c.paiement})` : ""}{c.payeLe ? `, le ${formatDateHeure(c.payeLe)}` : ""}</dt>
            <dd className="tabular-nums">{formatPrix(c.montantPaye)}</dd>
          </div>
          {(paiement.etat === "A_PAYER" || paiement.etat === "COMPLEMENT") && (
            <div className="flex justify-between gap-3 font-semibold"><dt>Reste à régler</dt><dd className="tabular-nums">{formatPrix(paiement.montant)}</dd></div>
          )}
          {paiement.etat === "A_REMBOURSER" && (
            <div className="flex justify-between gap-3 font-semibold"><dt>À rembourser</dt><dd className="tabular-nums">{formatPrix(paiement.montant)}</dd></div>
          )}
        </dl>

        <p className="border-t border-slate-200 pt-4 text-xs text-slate-500">
          Récapitulatif de commande. Ce document ne remplace pas une facture fiscale.
        </p>
      </article>
    </div>
  );
}
