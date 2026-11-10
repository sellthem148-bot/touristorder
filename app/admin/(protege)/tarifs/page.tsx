import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { lireReglages } from "@/lib/reglages";
import { formatPrixCourt, prixPourChamp } from "@/lib/argent";
import { decrirePlage, JOURS_COURTS, momentPresent, NOM_TARIF_DE_BASE, tarifDeBase, tarifPour, type PlageTarifaire } from "@/lib/tarifs";
import { Messages } from "@/components/admin/Messages";
import { enregistrerPlage, supprimerPlage } from "../actions";

export const metadata = { title: "Tarifs" };

// Une couleur par plage (dans l'ordre), pour la grille de la semaine.
const COULEURS = ["bg-indigo-500", "bg-amber-400", "bg-rose-500", "bg-emerald-500", "bg-violet-500", "bg-cyan-500", "bg-orange-500"];
const BASE = "bg-slate-200";

type Plage = PlageTarifaire & { ordre: number; active: boolean };

function Champs({ p }: { p?: Plage }) {
  const id = p?.id ?? "nouvelle";
  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
        <div>
          <label htmlFor={`nom-${id}`} className="etiquette">Nom</label>
          <input id={`nom-${id}`} name="nom" defaultValue={p?.nom ?? ""} placeholder="Fin de soirée" required className="champ" />
        </div>
        <div>
          <label htmlFor={`ordre-${id}`} className="etiquette">Priorité</label>
          <input id={`ordre-${id}`} name="ordre" defaultValue={p?.ordre ?? 0} inputMode="numeric" className="champ" />
        </div>
      </div>
      <fieldset>
        <legend className="etiquette">Jours</legend>
        <div className="flex flex-wrap gap-1.5">
          {JOURS_COURTS.map((j, i) => (
            <label key={j} className="pastille px-3 py-1.5">
              <input type="checkbox" name="jours" value={i} defaultChecked={p ? p.jours.includes(i) : true} className="sr-only" />
              {j}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`debut-${id}`} className="etiquette">De</label>
          <input id={`debut-${id}`} name="debut" type="time" defaultValue={p?.debut ?? "22:00"} required className="champ" />
        </div>
        <div>
          <label htmlFor={`fin-${id}`} className="etiquette">Jusqu&apos;à</label>
          <input id={`fin-${id}`} name="fin" type="time" defaultValue={p?.fin ?? "00:00"} required className="champ" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <label htmlFor={`fs-${id}`} className="etiquette">Service (₪)</label>
          <input id={`fs-${id}`} name="fraisService" defaultValue={prixPourChamp(p?.fraisService ?? 0)} inputMode="decimal" className="champ" />
        </div>
        <div>
          <label htmlFor={`fl-${id}`} className="etiquette">Livraison (₪)</label>
          <input id={`fl-${id}`} name="fraisLivraison" defaultValue={prixPourChamp(p?.fraisLivraison ?? 0)} inputMode="decimal" className="champ" />
        </div>
        <div>
          <label htmlFor={`fe-${id}`} className="etiquette">Express (₪)</label>
          <input id={`fe-${id}`} name="fraisExpress" defaultValue={prixPourChamp(p?.fraisExpress ?? 0)} inputMode="decimal" className="champ" />
        </div>
        <div>
          <label htmlFor={`mj-${id}`} className="etiquette">Articles + %</label>
          <input id={`mj-${id}`} name="majorationPct" defaultValue={p?.majorationPct ?? 0} inputMode="numeric" className="champ" />
        </div>
      </div>
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" name="active" defaultChecked={p?.active ?? true} className="h-5 w-5 accent-marque" />
        Active
      </label>
    </div>
  );
}

export default async function PageTarifs({ searchParams }: PageProps<"/admin/tarifs">) {
  await exigerAdmin();
  const params = await searchParams;
  const [reglages, plages] = await Promise.all([
    lireReglages(),
    prisma.plageTarifaire.findMany({ orderBy: [{ ordre: "asc" }, { createdAt: "asc" }] }),
  ]);
  const actives = plages.filter((p) => p.active);
  const base = tarifDeBase(reglages);
  const couleur = (plageId: string | null) => (plageId ? COULEURS[actives.findIndex((p) => p.id === plageId) % COULEURS.length] : BASE);
  const maintenant = tarifPour(momentPresent(), actives, base);

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Tarifs selon le moment</h1>
      <Messages params={params} />

      <section className="carte space-y-2 p-5 text-sm">
        <p>
          Le tarif dépend du <strong>moment de la livraison</strong> (le jour choisi et le début du créneau ; « Dès que possible » = maintenant).
          La première plage active qui contient ce moment s&apos;applique, par ordre de <strong>priorité</strong> (le plus petit d&apos;abord) ;
          sinon, c&apos;est le tarif de base.
        </p>
        <p className="rounded-2xl bg-sable p-3">
          <strong>Tarif de base</strong> : service {formatPrixCourt(base.fraisService)}, livraison {formatPrixCourt(base.fraisLivraison)},
          express {base.fraisExpress ? formatPrixCourt(base.fraisExpress) : "non proposé"}.{" "}
          <Link href="/admin/reglages" className="font-bold text-marque underline">Le modifier dans Réglages</Link>
        </p>
        <p>
          En ce moment : <strong>{maintenant.nom}</strong>
          {maintenant.majorationPct > 0 && <> (articles +{maintenant.majorationPct} %)</>}.
          {reglages.fraisRegroupes && <> Les frais sont affichés au client en une seule ligne « service, livraison comprise ».</>}
        </p>
      </section>

      <section className="carte p-5">
        <h2 className="mb-3 font-extrabold">La semaine en un coup d&apos;œil</h2>
        <div className="overflow-x-auto">
          {/* table-fixed : 24 colonnes égales (en mode auto, une heure sans libellé faisait 0 px de large). */}
          <table className="w-full min-w-[560px] table-fixed border-separate border-spacing-0.5 text-xs">
            <thead>
              <tr>
                <th className="w-10" aria-label="Jour" />
                {Array.from({ length: 24 }, (_, h) => (
                  <th key={h} className="font-medium text-slate-500">{h % 3 === 0 ? `${h}h` : ""}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOURS_COURTS.map((j, jour) => (
                <tr key={j}>
                  <th className="pr-1 text-left font-semibold">{j}</th>
                  {Array.from({ length: 24 }, (_, h) => {
                    const t = tarifPour({ jour, minutes: h * 60 }, actives, base);
                    return <td key={h} className={`h-6 rounded ${couleur(t.plageId)}`} title={`${j} ${h}h : ${t.nom}`} />;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 flex flex-wrap gap-3 text-xs">
          <li className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${BASE}`} />{NOM_TARIF_DE_BASE}</li>
          {actives.map((p) => (
            <li key={p.id} className="flex items-center gap-1.5"><span className={`h-3 w-3 rounded ${couleur(p.id)}`} />{p.nom}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-extrabold">Plages ({plages.length})</h2>
        {plages.length === 0 && <p className="text-sm text-slate-600">Aucune plage : le tarif de base s&apos;applique tout le temps.</p>}
        {plages.map((p) => (
          <details key={p.id} className="carte group p-5">
            <summary className="flex cursor-pointer list-none flex-wrap items-center gap-3">
              <span className={`h-3 w-3 rounded ${p.active ? couleur(p.id) : "bg-slate-300"}`} aria-hidden="true" />
              <span className="font-bold">{p.nom}</span>
              {!p.active && <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold">Désactivée</span>}
              <span className="text-sm text-slate-600">{decrirePlage(p)}</span>
              <span className="ml-auto text-sm">
                service {formatPrixCourt(p.fraisService)} · livraison {formatPrixCourt(p.fraisLivraison)}
                {p.majorationPct > 0 && <> · articles +{p.majorationPct} %</>}
              </span>
              <span className="text-sm font-bold text-marque group-open:hidden">Modifier</span>
            </summary>
            <form action={enregistrerPlage} className="mt-4 space-y-4 border-t border-slate-100 pt-4">
              <input type="hidden" name="id" value={p.id} />
              <Champs p={p} />
              <button type="submit" className="bouton">Enregistrer</button>
            </form>
            <form action={supprimerPlage} className="mt-2">
              <input type="hidden" name="id" value={p.id} />
              <button type="submit" className="text-sm font-semibold text-red-700 hover:underline">Supprimer cette plage</button>
            </form>
          </details>
        ))}
      </section>

      <section className="carte p-5">
        <h2 className="mb-3 text-lg font-extrabold">Ajouter une plage</h2>
        <form action={enregistrerPlage} className="space-y-4">
          <Champs />
          <button type="submit" className="bouton">Ajouter</button>
        </form>
        <p className="mt-3 text-xs text-slate-500">
          Une plage qui passe minuit (22:00 → 02:00) couvre la fin de soirée et le début de la nuit de chaque jour coché ; 22:00 → 00:00 s&apos;arrête à minuit.
          Même heure de début et de fin = toute la journée. « Express » à 0 = pas d&apos;express pendant cette plage.
        </p>
      </section>
    </div>
  );
}
