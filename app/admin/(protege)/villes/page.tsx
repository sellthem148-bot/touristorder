import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { lireReglages, plagesActives } from "@/lib/reglages";
import { formatPrixCourt, prixPourChamp } from "@/lib/argent";
import { NOM_TARIF_DE_BASE, tarifDeBase } from "@/lib/tarifs";
import { fraisDeLivraison } from "@/lib/villes";
import { Messages } from "@/components/admin/Messages";
import { ajouterVille, enregistrerVilles } from "../actions";
import { LONGUEUR_MAXIMALE_DES_REPERES, lireReperes } from "@/lib/zones";
import { cleGoogleMaps } from "@/lib/google-maps";


export const metadata = { title: "Villes" };

export default async function PageVilles({ searchParams }: PageProps<"/admin/villes">) {
  await exigerAdmin();
  // L'adresse vérifiée par Google est-elle en service (la clé du site, lib/google-maps.ts) ?
  const adressesGoogleActives = cleGoogleMaps() !== "";
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
              {/* Ce qui, dans l'adresse d'un client, désigne cette zone : sert à signaler une commande passée dans la mauvaise. */}
              <details className="sm:col-span-5" open={lireReperes(v.reperes).length > 0}>
                <summary className="cursor-pointer text-xs font-semibold text-marque">
                  Rues et repères de cette zone{lireReperes(v.reperes).length > 0 ? ` (${lireReperes(v.reperes).length})` : ""}
                </summary>
                <label htmlFor={`rep-${v.id}`} className="sr-only">Rues et repères de {v.nom}</label>
                <textarea
                  id={`rep-${v.id}`}
                  name={`rep_${v.id}`}
                  rows={2}
                  defaultValue={v.reperes}
                  maxLength={LONGUEUR_MAXIMALE_DES_REPERES}
                  placeholder="Noms de rues, d'hôtels, de résidences, séparés par des virgules"
                  className="champ mt-1.5 text-sm"
                />
              </details>
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
        <div className="rounded-2xl bg-sky-50 p-3 text-sm text-sky-950">
          <p className="font-semibold">Les zones se définissent par les adresses</p>
          <ul className="mt-1 list-disc space-y-1 ps-5">
            <li>
              Un quartier à son propre prix s&apos;écrit <strong>Ville – Quartier</strong> (un tiret entouré d&apos;espaces), par exemple « Netanya – Ir Yamim / Poleg ».
              Le client le choisit dans la liste comme une ville.
            </li>
            <li>
              Dans « Rues et repères », écris ce qui se trouve dans cette zone : noms de rues, d&apos;hôtels, de résidences. Le nom de la ville et celui du quartier comptent déjà, dans toutes les langues.
            </li>
            <li>
              Quand un client choisit une zone et que son adresse en désigne une autre, il est prévenu au panier, et sa commande t&apos;est signalée « Zone à vérifier » :
              tu changes la zone dans la commande, la livraison et le total suivent avant que tu demandes le paiement.
            </li>
            <li data-adresses-google={adressesGoogleActives ? "actives" : "en-attente"}>
              {adressesGoogleActives ? (
                <>
                  <strong>Adresse vérifiée par Google : active.</strong> Au panier, Google propose des adresses pendant que le client tape, et le site pose la zone tout seul.
                  Tes rues et repères servent toujours : Google donne la rue et la ville, pas le quartier — c&apos;est par ses rues que le site reconnaît un quartier à son prix.
                  Écris-les comme Google les écrit (tu les lis sur une commande, sous « Adresse reconnue par Google »), en lettres latines ou en hébreu ; inutile d&apos;écrire « rue », « St » ou « Sderot ».
                </>
              ) : (
                <>
                  <strong>Adresse vérifiée par Google : pas encore active.</strong> Le site est prêt ; il attend ta clé Google.
                </>
              )}
            </li>
          </ul>
        </div>
      </form>

      <section className="carte p-5">
        <h2 className="mb-3 text-lg font-extrabold">Ajouter une ville</h2>
        <form action={ajouterVille} className="grid gap-3 sm:grid-cols-[1fr_130px_130px_auto] sm:items-end">
          <div>
            <label htmlFor="nouvelle-ville" className="etiquette">Ville</label>
            <input id="nouvelle-ville" name="nom" required placeholder="Ex. Kfar Vitkin, ou Netanya – Ir Yamim" className="champ" />
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
