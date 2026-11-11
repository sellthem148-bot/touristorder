import { exigerAdmin } from "@/lib/admin";
import { formatPrix } from "@/lib/argent";
import type { Periode } from "@/lib/statistiques";
import { lireStatistiques } from "@/lib/statistiques-lecture";
import { derniersMois } from "@/lib/export";
import { jourEnIsrael } from "@/lib/dates";

export const metadata = { title: "Statistiques" };

function Bloc({ titre, p, fonce = false }: { titre: string; p: Periode; fonce?: boolean }) {
  return (
    <section className={`rounded-3xl p-5 ${fonce ? "bg-marque text-white" : "carte"}`}>
      <h2 className={`text-sm font-bold ${fonce ? "text-blue-100" : "text-slate-500"}`}>{titre}</h2>
      <p className="mt-1 text-3xl font-extrabold">{formatPrix(p.chiffre)}</p>
      {/* Une ligne par chiffre : tient sur un petit téléphone quel que soit le montant. */}
      <dl className={`mt-3 space-y-1 text-sm ${fonce ? "text-blue-50" : "text-slate-600"}`}>
        <div className="flex items-baseline justify-between gap-3"><dt>Commandes</dt><dd className={`text-base font-bold tabular-nums ${fonce ? "text-white" : "text-slate-900"}`}>{p.commandes}</dd></div>
        <div className="flex items-baseline justify-between gap-3"><dt>Marge estimée</dt><dd className={`whitespace-nowrap text-base font-bold tabular-nums ${fonce ? "text-white" : "text-emerald-700"}`}>{formatPrix(p.marge)}</dd></div>
        <div className="flex items-baseline justify-between gap-3"><dt>Panier moyen</dt><dd className={`whitespace-nowrap text-base font-bold tabular-nums ${fonce ? "text-white" : "text-slate-900"}`}>{formatPrix(p.panierMoyen)}</dd></div>
      </dl>
    </section>
  );
}

export default async function PageStatistiques() {
  await exigerAdmin();
  const s = await lireStatistiques();
  const max = Math.max(1, ...s.parJour.map((j) => j.chiffre));
  const mois = derniersMois(jourEnIsrael());

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Statistiques</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Bloc titre="Aujourd'hui" p={s.aujourdhui} fonce />
        <Bloc titre="7 derniers jours" p={s.semaine} />
        <Bloc titre="30 derniers jours" p={s.mois} />
      </div>

      <section className="carte space-y-3 p-5" aria-labelledby="t-compta">
        <div>
          <h2 id="t-compta" className="font-extrabold">Comptabilité : exporter</h2>
          <p className="text-sm text-slate-600">
            Deux fichiers à ouvrir dans Excel ou à donner à ton comptable : les ventes (ce que les clients paient) et les achats Wolt (ce que les articles te coûtent).
          </p>
        </div>
        <form method="get" className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <label htmlFor="mois" className="etiquette">Période (date de livraison)</label>
            <select id="mois" name="mois" className="champ" defaultValue={mois[0].valeur}>
              {mois.map((m) => <option key={m.valeur} value={m.valeur}>{m.libelle}</option>)}
              <option value="tout">Tout depuis le début</option>
            </select>
          </div>
          <button type="submit" formAction="/admin/export/ventes" className="bouton">Exporter les ventes</button>
          <button type="submit" formAction="/admin/export/achats" className="bouton-secondaire">Exporter les achats Wolt</button>
        </form>
        <p className="text-xs text-slate-500">
          Les achats sont estimés d&apos;après le prix d&apos;achat de chaque article (hors frais de livraison Wolt) : le montant exact est sur tes reçus Wolt. Un reçu par commande s&apos;imprime depuis la commande.
        </p>
      </section>

      <section className="carte p-5">
        <h2 className="mb-4 font-extrabold">Chiffre par jour (14 jours)</h2>
        <ol className="flex h-40 items-end gap-1.5" aria-label="Chiffre d'affaires par jour">
          {s.parJour.map((j) => (
            <li key={j.jour} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${j.jour} : ${formatPrix(j.chiffre)} (${j.commandes} commande${j.commandes > 1 ? "s" : ""})`}>
              <span className="sr-only">{j.jour} : {formatPrix(j.chiffre)}</span>
              <div className="w-full rounded-t-lg bg-marque" style={{ height: `${Math.max(j.chiffre ? 4 : 1, (j.chiffre / max) * 100)}%`, opacity: j.chiffre ? 1 : 0.15 }} />
              <span className="text-[10px] text-slate-500" aria-hidden="true">{j.jour.slice(8)}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="carte p-5">
          <h2 className="mb-3 font-extrabold">Les plus vendus (30 jours)</h2>
          {s.meilleures.length === 0 ? (
            <p className="text-sm text-slate-500">Pas encore de ventes.</p>
          ) : (
            <ol className="space-y-2 text-sm">
              {s.meilleures.map((m, i) => (
                <li key={m.nom} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-marque-clair text-xs font-bold text-marque">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{m.nom}</span>
                  <span className="text-slate-600">{m.quantite} vendu{m.quantite > 1 ? "s" : ""}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
        <section className="carte p-5 text-sm">
          <h2 className="mb-3 font-extrabold">Par ville (30 jours)</h2>
          {s.parVille.length === 0 ? (
            <p className="text-slate-500">Pas encore de commandes.</p>
          ) : (
            <ul className="space-y-2">
              {s.parVille.map((v) => (
                <li key={v.ville} className="flex items-center justify-between gap-3">
                  <span className="font-medium">{v.ville}</span>
                  <span className="text-slate-600">{v.commandes} commande{v.commandes > 1 ? "s" : ""} · <strong className="text-slate-900">{formatPrix(v.chiffre)}</strong></span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="carte space-y-2 p-5 text-sm">
          <h2 className="mb-1 font-extrabold">En bref (30 jours)</h2>
          <p className="flex justify-between"><span>Pourboires reçus</span><strong>{formatPrix(s.pourboiresMois)}</strong></p>
          <p className="flex justify-between"><span>Commandes en express</span><strong>{s.partExpress} %</strong></p>
          <p className="flex justify-between"><span>Commandes annulées</span><strong>{s.annulees}</strong></p>
          <p className="pt-2 text-xs text-slate-500">
            Marge estimée = ce que le client paie − prix d&apos;achat Wolt des articles. Hors frais de livraison Wolt, et 0 pour un article sans prix d&apos;achat renseigné.
          </p>
        </section>
      </div>
    </div>
  );
}
