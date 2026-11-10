import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { lireReglages, plagesActives } from "@/lib/reglages";
import { formatPrixCourt, prixPourChamp } from "@/lib/argent";
import { NOM_TARIF_DE_BASE, tarifDeBase } from "@/lib/tarifs";
import { fraisDeLivraison } from "@/lib/villes";
import { Messages } from "@/components/admin/Messages";
import { ajouterVille, enregistrerVilles } from "../actions";

export const metadata = { title: "Villes" };

export default async function PageVilles({ searchParams }: PageProps<"/admin/villes">) {
  await exigerAdmin();
  const params = await searchParams;
  const [villes, reglages, plages] = await Promise.all([
    prisma.ville.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }] }),
    lireReglages(),
    plagesActives(),
  ]);
  const actives = villes.filter((v) => v.active);
  // Les colonnes du récapitulatif : le tarif de base, puis chaque plage active.
  const tarifs = [
    { nom: NOM_TARIF_DE_BASE, ...tarifDeBase(reglages) },
    ...plages.map((p) => ({ nom: p.nom, fraisService: p.fraisService, fraisLivraison: p.fraisLivraison, fraisExpress: p.fraisExpress, majorationPct: p.majorationPct })),
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold">Villes livrées</h1>
        <p className="text-sm text-slate-600">
          Prix de livraison d&apos;une ville = livraison du moment (<Link href="/admin/tarifs" className="font-semibold text-marque underline">Tarifs</Link>)
          + supplément de la ville. Le minimum d&apos;une ville s&apos;applique s&apos;il est plus élevé que celui des Réglages.
        </p>
      </div>
      <Messages params={params} />
      {actives.length === 0 && (
        <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-800">Aucune ville active : les clients ne peuvent pas commander.</p>
      )}

      <form action={enregistrerVilles} className="space-y-3">
        <ul className="carte divide-y divide-slate-100">
          {villes.map((v) => (
            <li key={v.id} className="grid gap-2 p-3 sm:grid-cols-[1fr_110px_110px_auto_auto] sm:items-end sm:gap-3">
              <input type="hidden" name="ids" value={v.id} />
              <div>
                <label htmlFor={`nom-${v.id}`} className="block text-[11px] font-semibold text-slate-500">Ville</label>
                <input id={`nom-${v.id}`} name={`nom_${v.id}`} defaultValue={v.nom} className="champ px-2.5 py-2 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div>
                  <label htmlFor={`supp-${v.id}`} className="block text-[11px] font-semibold text-slate-500">Supplément ₪</label>
                  <input id={`supp-${v.id}`} name={`supp_${v.id}`} defaultValue={v.supplementLivraison ? prixPourChamp(v.supplementLivraison) : ""} placeholder="0" inputMode="decimal" className="champ px-2.5 py-2" />
                </div>
                <div>
                  <label htmlFor={`min-${v.id}`} className="block text-[11px] font-semibold text-slate-500">Minimum ₪</label>
                  <input id={`min-${v.id}`} name={`min_${v.id}`} defaultValue={v.minimumCommande ? prixPourChamp(v.minimumCommande) : ""} placeholder="—" inputMode="decimal" className="champ px-2.5 py-2" />
                </div>
              </div>
              <div className="flex gap-4 sm:contents">
                <label className="flex items-center gap-2 text-sm font-semibold sm:pb-2.5">
                  <input type="checkbox" name={`active_${v.id}`} defaultChecked={v.active} className="h-5 w-5 accent-marque" /> Livrée
                </label>
                <label className="flex items-center gap-2 text-sm font-semibold text-red-700 sm:pb-2.5">
                  <input type="checkbox" name={`retirer_${v.id}`} className="h-5 w-5 accent-red-600" /> Retirer
                </label>
              </div>
            </li>
          ))}
        </ul>
        {villes.length > 0 && (
          <div className="sticky bottom-3 z-10">
            <button type="submit" className="bouton w-full py-4 text-base shadow-flottant">Enregistrer les villes</button>
          </div>
        )}
        <p className="text-xs text-slate-500">
          « Livrée » décoché : la ville n&apos;est plus proposée mais reste dans la liste. « Retirer » la supprime ; les anciennes commandes gardent leur ville.
        </p>
      </form>

      <section className="carte p-5">
        <h2 className="mb-3 text-lg font-extrabold">Ajouter une ville</h2>
        <form action={ajouterVille} className="grid gap-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end">
          <div>
            <label htmlFor="nouvelle-ville" className="etiquette">Ville</label>
            <input id="nouvelle-ville" name="nom" required placeholder="Ex. Kfar Vitkin" className="champ" />
          </div>
          <div>
            <label htmlFor="nouvelle-supp" className="etiquette">Supplément ₪</label>
            <input id="nouvelle-supp" name="supplement" placeholder="0" inputMode="decimal" className="champ" />
          </div>
          <div>
            <label htmlFor="nouvelle-min" className="etiquette">Minimum ₪</label>
            <input id="nouvelle-min" name="minimum" placeholder="—" inputMode="decimal" className="champ" />
          </div>
          <button type="submit" className="bouton">Ajouter</button>
        </form>
      </section>

      <section className="carte p-5">
        <h2 className="mb-1 text-lg font-extrabold">Prix de livraison par ville</h2>
        <p className="mb-3 text-xs text-slate-500">Ce que le client paie pour la livraison, selon sa ville et le moment (sans l&apos;express).</p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[420px] text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left">
                <th className="py-2 pr-3">Ville</th>
                {tarifs.map((t) => (
                  <th key={t.nom} className="py-2 pr-3 text-right">
                    {t.nom}
                    <span className="block text-[11px] font-normal text-slate-500">service {formatPrixCourt(t.fraisService)}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {actives.map((v) => (
                <tr key={v.id} className="border-b border-slate-100">
                  <td className="py-2 pr-3 font-semibold">{v.nom}</td>
                  {tarifs.map((t) => (
                    <td key={t.nom} className="py-2 pr-3 text-right tabular-nums">{formatPrixCourt(fraisDeLivraison(t, v, false))}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
