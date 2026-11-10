import { exigerAdmin } from "@/lib/admin";
import { lireReglages } from "@/lib/reglages";
import { prixPourChamp } from "@/lib/argent";
import { Messages } from "@/components/admin/Messages";
import { enregistrerReglages } from "../actions";

export const metadata = { title: "Réglages" };

export default async function PageReglages({ searchParams }: PageProps<"/admin/reglages">) {
  await exigerAdmin();
  const params = await searchParams;
  const r = await lireReglages();

  return (
    <div className="max-w-2xl space-y-4">
      <h1 className="text-2xl font-extrabold">Réglages</h1>
      <Messages params={params} />
      <form action={enregistrerReglages} className="carte space-y-5 p-4 sm:p-5">
        <label className="flex items-center gap-2 font-semibold">
          <input type="checkbox" name="ouvert" defaultChecked={r.ouvert} className="h-5 w-5" />
          Commandes ouvertes
        </label>

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 font-bold">Tes frais (ta marge)</legend>
          <div>
            <label htmlFor="fraisService" className="etiquette">Frais de service (₪)</label>
            <input id="fraisService" name="fraisService" defaultValue={prixPourChamp(r.fraisService)} inputMode="decimal" className="champ" />
          </div>
          <div>
            <label htmlFor="fraisLivraison" className="etiquette">Livraison (₪)</label>
            <input id="fraisLivraison" name="fraisLivraison" defaultValue={prixPourChamp(r.fraisLivraison)} inputMode="decimal" className="champ" />
          </div>
          <div>
            <label htmlFor="fraisExpress" className="etiquette">Supplément express (₪)</label>
            <input id="fraisExpress" name="fraisExpress" defaultValue={prixPourChamp(r.fraisExpress)} inputMode="decimal" className="champ" />
            <p className="mt-1 text-xs text-slate-500">0 = pas d&apos;option express.</p>
          </div>
          <div>
            <label htmlFor="minimumCommande" className="etiquette">Minimum d&apos;articles (₪)</label>
            <input id="minimumCommande" name="minimumCommande" defaultValue={prixPourChamp(r.minimumCommande)} inputMode="decimal" className="champ" />
          </div>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="villes" className="etiquette">Villes livrées (une par ligne)</label>
            <textarea id="villes" name="villes" rows={6} defaultValue={r.villes.join("\n")} className="champ" />
          </div>
          <div>
            <label htmlFor="creneaux" className="etiquette">Créneaux (un par ligne)</label>
            <textarea id="creneaux" name="creneaux" rows={6} defaultValue={r.creneaux.join("\n")} className="champ" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="pourboires" className="etiquette">Pourboires proposés (₪)</label>
            <input id="pourboires" name="pourboires" defaultValue={r.pourboires.filter((p) => p > 0).map((p) => prixPourChamp(p).replace(",00", "")).join(" ")} className="champ" placeholder="10 15 20" />
            <p className="mt-1 text-xs text-slate-500">Séparés par des espaces. Vide = pas de pourboire. « Non merci » est toujours proposé.</p>
          </div>
          <div>
            <label htmlFor="paiements" className="etiquette">Modes de paiement (un par ligne)</label>
            <textarea id="paiements" name="paiements" rows={3} defaultValue={r.paiements.join("\n")} className="champ" />
            <p className="mt-1 text-xs text-slate-500">Vide = le client ne choisit pas.</p>
          </div>
        </div>

        <div>
          <label htmlFor="whatsapp" className="etiquette">Ton numéro WhatsApp</label>
          <input id="whatsapp" name="whatsapp" defaultValue={r.whatsapp} type="tel" placeholder="+972 50 123 4567" className="champ" />
          <p className="mt-1 text-xs text-slate-500">Le bouton « Nous écrire sur WhatsApp » du client ouvre une conversation avec ce numéro.</p>
        </div>

        <div>
          <label htmlFor="messageAccueil" className="etiquette">Message d&apos;accueil</label>
          <textarea id="messageAccueil" name="messageAccueil" rows={2} defaultValue={r.messageAccueil} className="champ" />
        </div>

        <button type="submit" className="bouton">Enregistrer</button>
      </form>
    </div>
  );
}
