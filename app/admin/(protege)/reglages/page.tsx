import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { lireReglages } from "@/lib/reglages";
import { prixPourChamp } from "@/lib/argent";
import { JOURS_COURTS } from "@/lib/tarifs";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { Messages } from "@/components/admin/Messages";
import { delierTelegram, enregistrerReglages, enregistrerTelegram, essayerTelegram, relierTelegram } from "../actions";

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
          <legend className="mb-1 font-bold">Tarif de base (ta marge)</legend>
          <p className="col-span-full -mt-1 mb-1 text-xs text-slate-500">
            S&apos;applique quand aucune plage horaire ne correspond (nuit, week-end…) : voir <Link href="/admin/tarifs" className="font-semibold text-marque underline">Tarifs</Link>.
          </p>
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

        <label className="flex items-start gap-2">
          <input type="checkbox" name="fraisRegroupes" defaultChecked={r.fraisRegroupes} className="mt-1 h-5 w-5 accent-marque" />
          <span>
            <span className="block font-semibold">Afficher « Frais de service (livraison comprise) »</span>
            <span className="text-xs text-slate-500">Le client voit une seule ligne : service + livraison additionnés. Les montants restent réglés séparément.</span>
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl bg-sable p-4 text-sm">
            <p className="etiquette">Villes livrées</p>
            <p>Les villes, leur supplément de livraison et leur minimum se règlent dans la page{" "}
              <Link href="/admin/villes" className="font-semibold text-marque underline">Villes</Link>.
            </p>
          </div>
          <div>
            <label htmlFor="creneaux" className="etiquette">Créneaux (un par ligne)</label>
            <textarea id="creneaux" name="creneaux" rows={6} defaultValue={r.creneaux.join("\n")} className="champ" />
            <p className="mt-1 text-xs text-slate-500">
              Format « 19:00 – 20:00 ». Actuellement : {amplitudeDesCreneaux(r.creneaux) ?? "créneaux sans heure"}.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset>
            <legend className="etiquette">Jours où tu livres</legend>
            <div className="flex flex-wrap gap-1.5">
              {JOURS_COURTS.map((j, i) => (
                <label key={j} className="pastille px-3 py-1.5">
                  <input type="checkbox" name="joursLivres" value={i} defaultChecked={r.joursLivres.includes(i)} className="sr-only" />
                  {j}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-slate-500">Les jours non cochés ne sont pas proposés au client.</p>
          </fieldset>
          <div className="grid gap-4">
          <div>
            <label htmlFor="heureLimite" className="etiquette">Commande avant… pour être livré le soir même</label>
            <input id="heureLimite" name="heureLimite" type="time" defaultValue={r.heureLimite} className="champ" />
            <p className="mt-1 text-xs text-slate-500">
              Le temps que Wolt te livre les articles dans la journée. Après cette heure, le client est livré le soir suivant. Vide = pas d&apos;heure limite.
            </p>
          </div>
          <div>
            <label htmlFor="commandesParCreneau" className="etiquette">Commandes par créneau (au plus)</label>
            <input id="commandesParCreneau" name="commandesParCreneau" defaultValue={r.commandesParCreneau} inputMode="numeric" className="champ" />
            <p className="mt-1 text-xs text-slate-500">
              Quand un créneau a ce nombre de commandes (annulées non comptées), il est affiché « complet » et ne peut plus être choisi. 0 = pas de limite.
            </p>
          </div>
          <div>
            <label htmlFor="delaiPreparation" className="etiquette">Délai de préparation (minutes)</label>
            <input id="delaiPreparation" name="delaiPreparation" defaultValue={r.delaiPreparation} inputMode="numeric" className="champ" />
            <p className="mt-1 text-xs text-slate-500">
              Pour le soir même, un créneau n&apos;est proposé que s&apos;il commence au moins ce délai après la commande
              (le temps de commander sur Wolt, de recevoir et de préparer).
            </p>
          </div>
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
          <label htmlFor="coordonneesPaiement" className="etiquette">Tes coordonnées de paiement (privé)</label>
          <textarea
            id="coordonneesPaiement"
            name="coordonneesPaiement"
            rows={4}
            maxLength={600}
            defaultValue={r.coordonneesPaiement}
            className="champ"
            placeholder={"Bit ou PayBox : 05x xxx xxxx\nVirement : IBAN IL00 0000 0000 0000 0000 000, au nom de…"}
          />
          <p className="mt-1 text-xs text-slate-500">
            Jamais affichées sur le site. Elles sont glissées dans le message WhatsApp « Envoyer le montant » que tu envoies au client : le paiement se fait avant que tu commandes sur Wolt.
          </p>
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

        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-1 font-bold">Ton entreprise (pages légales, reçus)</legend>
          <p className="col-span-full -mt-1 mb-1 text-xs text-slate-500">
            Affichées dans les mentions légales, les conditions de vente et sur les reçus. Tu peux les remplir plus tard : une ligne vide n&apos;est simplement pas affichée.
          </p>
          <div>
            <label htmlFor="entrepriseNom" className="etiquette">Nom de l&apos;entreprise ou du responsable</label>
            <input id="entrepriseNom" name="entrepriseNom" defaultValue={r.entrepriseNom} maxLength={120} className="champ" />
          </div>
          <div>
            <label htmlFor="entrepriseNumero" className="etiquette">Numéro d&apos;entreprise</label>
            <input id="entrepriseNumero" name="entrepriseNumero" defaultValue={r.entrepriseNumero} maxLength={60} className="champ" placeholder="Numéro d'enregistrement (עוסק / ח.פ)" />
          </div>
          <div>
            <label htmlFor="entrepriseAdresse" className="etiquette">Adresse</label>
            <input id="entrepriseAdresse" name="entrepriseAdresse" defaultValue={r.entrepriseAdresse} maxLength={300} className="champ" />
          </div>
          <div>
            <label htmlFor="emailContact" className="etiquette">E-mail de contact</label>
            <input id="emailContact" name="emailContact" type="email" defaultValue={r.emailContact} maxLength={254} className="champ" placeholder="contact@…" />
          </div>
        </fieldset>

        <button type="submit" className="bouton">Enregistrer</button>
      </form>

      <section className="carte space-y-4 p-4 sm:p-5" aria-labelledby="t-telegram">
        <div>
          <h2 id="t-telegram" className="text-lg font-bold">Alerte Telegram</h2>
          <p className="text-sm text-slate-600">Un message sur ton téléphone à chaque nouvelle commande, en plus de l&apos;e-mail.</p>
        </div>
        {r.telegramJeton && r.telegramDiscussion ? (
          <>
            <p className="rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">
              Alerte active{r.telegramNom ? ` (robot @${r.telegramNom})` : ""} : chaque nouvelle commande t&apos;est envoyée sur Telegram.
            </p>
            <div className="flex flex-wrap gap-2">
              <form action={essayerTelegram}><button type="submit" className="bouton-secondaire">Envoyer un essai</button></form>
              <form action={delierTelegram}><button type="submit" className="bouton-danger">Retirer l&apos;alerte</button></form>
            </div>
          </>
        ) : r.telegramJeton ? (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Dans Telegram, ouvre ton robot{r.telegramNom ? <> (<strong>@{r.telegramNom}</strong>)</> : null} et écris-lui « bonjour ».</li>
              <li>Reviens ici et appuie sur « Relier ».</li>
            </ol>
            <div className="flex flex-wrap gap-2">
              <form action={relierTelegram}><button type="submit" className="bouton">Relier</button></form>
              <form action={delierTelegram}><button type="submit" className="bouton-secondaire">Changer de robot</button></form>
            </div>
          </>
        ) : (
          <>
            <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
              <li>Dans Telegram, cherche <strong>@BotFather</strong> et envoie-lui <strong>/newbot</strong>.</li>
              <li>Donne un nom au robot (ex. « Tourist Order commandes ») puis un identifiant qui finit par « bot ».</li>
              <li>BotFather te donne un jeton (une longue suite de chiffres et de lettres) : colle-le ici.</li>
            </ol>
            <form action={enregistrerTelegram} className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div className="min-w-0 flex-1">
                <label htmlFor="jeton" className="etiquette">Jeton du robot</label>
                <input id="jeton" name="jeton" type="password" autoComplete="off" required className="champ" placeholder="123456789:AA…" />
              </div>
              <button type="submit" className="bouton">Ajouter le robot</button>
            </form>
            <p className="text-xs text-slate-500">Le jeton reste sur le site et n&apos;est plus jamais affiché. Ne l&apos;envoie à personne.</p>
          </>
        )}
      </section>
    </div>
  );
}
