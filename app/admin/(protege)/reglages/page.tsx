import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { lireReglages } from "@/lib/reglages";
import { prixPourChamp } from "@/lib/argent";
import { JOURS_COURTS } from "@/lib/tarifs";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { Check } from "lucide-react";
import { Messages } from "@/components/admin/Messages";
import { delierTelegram, enregistrerReglages, enregistrerTelegram, essayerTelegram, relierTelegram } from "../actions";

export const metadata = { title: "Réglages" };

const un = (v: string | string[] | undefined) => ((Array.isArray(v) ? v[0] : v) ?? "").slice(0, 400);

/** Une étape numérotée de l'installation : faite (cochée), en cours (mise en avant) ou à venir (grisée). */
function Etape({ numero, titre, etat, children }: { numero: number; titre: string; etat: "faite" | "en-cours" | "a-venir"; children?: React.ReactNode }) {
  return (
    <li className={`flex gap-3 rounded-2xl border p-3 ${etat === "en-cours" ? "border-slate-900 bg-white" : "border-slate-200 bg-slate-50"} ${etat === "a-venir" ? "opacity-60" : ""}`}>
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold ${etat === "faite" ? "bg-emerald-600 text-white" : etat === "en-cours" ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-600"}`}
        aria-hidden="true"
      >
        {etat === "faite" ? <Check className="h-4 w-4" strokeWidth={2.5} /> : numero}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <p className="font-semibold">
          <span className="sr-only">Étape {numero}{etat === "faite" ? " (faite)" : etat === "en-cours" ? " (à faire maintenant)" : ""} : </span>
          {titre}
        </p>
        {children}
      </div>
    </li>
  );
}

/**
 * L'alerte Telegram, en trois étapes. L'état est écrit en clair en haut (pas installée, à terminer,
 * active) et chaque geste ramène ici, avec son résultat : rien à chercher ailleurs dans la page.
 */
function AlerteTelegram({ jeton, reliee, robot, ok, erreur }: { jeton: boolean; reliee: boolean; robot: string; ok: string; erreur: string }) {
  const etat = reliee ? { libelle: "Active", classes: "bg-emerald-50 text-emerald-900 ring-emerald-200" } : jeton ? { libelle: "À terminer", classes: "bg-amber-50 text-amber-900 ring-amber-200" } : { libelle: "Pas installée", classes: "bg-slate-100 text-slate-700 ring-slate-300" };
  return (
    <section id="telegram" className="carte scroll-mt-4 space-y-4 p-4 sm:p-5" aria-labelledby="t-telegram">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="t-telegram" className="text-lg font-bold">Alerte Telegram</h2>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ring-inset ${etat.classes}`}>{etat.libelle}</span>
      </div>
      <p className="text-sm text-slate-600">Un message sur ton téléphone à chaque nouvelle commande, en plus de l&apos;e-mail.</p>

      {erreur && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm font-medium text-red-800">{erreur}</p>}
      {!erreur && ok && <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">{ok}</p>}

      {reliee ? (
        <>
          <p className="rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
            <strong>C&apos;est en place.</strong> À chaque nouvelle commande, ton robot{robot ? ` @${robot}` : ""} t&apos;écrit dans Telegram : numéro, client, ville, créneau, montant et lien vers la commande.
          </p>
          <div className="flex flex-wrap gap-2">
            <form action={essayerTelegram}><button type="submit" className="bouton">Envoyer un essai maintenant</button></form>
            <form action={delierTelegram}><button type="submit" className="bouton-secondaire">Retirer l&apos;alerte</button></form>
          </div>
          <p className="text-xs text-slate-500">L&apos;essai arrive en quelques secondes dans Telegram. Rien reçu ? Vérifie que les notifications de Telegram sont autorisées sur ton téléphone.</p>
        </>
      ) : (
        <ol className="space-y-2">
          <Etape numero={1} titre="Créer ton robot et coller son jeton" etat={jeton ? "faite" : "en-cours"}>
            {jeton ? (
              <p className="break-words text-sm text-slate-600">Robot enregistré{robot ? <> : <strong>@{robot}</strong></> : null}.</p>
            ) : (
              <>
                <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
                  <li>Dans Telegram, cherche <strong>@BotFather</strong> et envoie-lui <strong>/newbot</strong>.</li>
                  <li>Donne un nom au robot (ex. « Tourist Order commandes »), puis un identifiant qui finit par « bot ».</li>
                  <li>BotFather te répond avec un jeton : une longue suite de chiffres et de lettres. Copie-le et colle-le ici.</li>
                </ul>
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
          </Etape>
          <Etape numero={2} titre="Dire bonjour à ton robot dans Telegram" etat={jeton ? "en-cours" : "a-venir"}>
            {jeton && (
              <>
                <p className="text-sm text-slate-700">
                  Ouvre ton robot dans Telegram et appuie sur <strong>Démarrer</strong> (ou écris-lui « bonjour »). Sans ce premier message, il n&apos;a pas le droit de t&apos;écrire.
                </p>
                {robot && (
                  <a href={`https://t.me/${robot}`} target="_blank" rel="noopener noreferrer" className="bouton-secondaire w-full sm:w-auto">Ouvrir mon robot dans Telegram</a>
                )}
              </>
            )}
          </Etape>
          <Etape numero={3} titre="Revenir ici et appuyer sur « Relier »" etat={jeton ? "en-cours" : "a-venir"}>
            {jeton && (
              <>
                <p className="text-sm text-slate-700">Ton robot t&apos;envoie aussitôt « Alerte reliée » dans Telegram : c&apos;est la preuve que tout fonctionne.</p>
                <div className="flex flex-wrap gap-2">
                  <form action={relierTelegram}><button type="submit" className="bouton">Relier</button></form>
                  <form action={delierTelegram}><button type="submit" className="bouton-secondaire">Recommencer</button></form>
                </div>
              </>
            )}
          </Etape>
        </ol>
      )}
    </section>
  );
}

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
          <label htmlFor="lienBit" className="etiquette">Ton lien de paiement Bit (facultatif)</label>
          <input id="lienBit" name="lienBit" type="url" inputMode="url" maxLength={300} defaultValue={r.lienBit} className="champ" placeholder="https://…" dir="ltr" />
          <p className="mt-1 text-xs text-slate-500">
            Si tu colles ici un lien de paiement Bit, le client qui a choisi Bit voit un bouton « Payer avec Bit » sur sa page de suivi tant qu&apos;il reste à régler, avec le montant et la référence à indiquer ; le lien part aussi dans ton message WhatsApp « Envoyer le montant ». Vide = pas de bouton : le client te demande les coordonnées sur WhatsApp, comme aujourd&apos;hui.
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

      <AlerteTelegram
        jeton={r.telegramJeton !== ""}
        reliee={r.telegramJeton !== "" && r.telegramDiscussion !== ""}
        robot={r.telegramNom}
        ok={un(params.tgOk)}
        erreur={un(params.tgErreur)}
      />
    </div>
  );
}
