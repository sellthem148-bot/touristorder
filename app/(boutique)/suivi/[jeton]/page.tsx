import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, ETAPES, EXPLICATION_STATUT, LIBELLE_STATUT } from "@/lib/statuts";
import { estRemplacement, REMPLACEMENTS } from "@/lib/choix-commande";
import { lireReglages } from "@/lib/reglages";
import { lienWhatsapp } from "@/lib/whatsapp";
import { NOM_DU_SITE } from "@/lib/marque";
import { Actualiser } from "@/components/Actualiser";
import { IconeCoche, IconeEclair, IconeHotel, IconeRecu, IconeScooter, IconeSac, IconeWhatsapp } from "@/components/Icones";
import { ViderPanier } from "./ViderPanier";
import { RecapMontants } from "@/components/RecapMontants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suivi de commande", robots: { index: false } };

const ICONES = { RECUE: IconeRecu, COMMANDEE: IconeSac, EN_LIVRAISON: IconeScooter, LIVREE: IconeHotel } as const;

export default async function Suivi({ params, searchParams }: PageProps<"/suivi/[jeton]">) {
  const { jeton } = await params;
  const nouvelle = (await searchParams).nouvelle === "1";
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(jeton)) notFound();

  // Ce que le client voit de SA commande : jamais les prix d'achat ni les boutiques.
  const commande = await prisma.commande.findUnique({
    where: { jeton },
    select: {
      numero: true, statut: true, nomClient: true, ville: true, adresse: true,
      dateLivraison: true, creneau: true, notes: true, express: true, remplacement: true, paiement: true,
      sousTotal: true, majoration: true, majorationPct: true, tarifNom: true, fraisService: true, fraisLivraison: true, pourboire: true, total: true,
      lignes: {
        select: { id: true, nom: true, options: true, prixUnitaire: true, quantite: true, indisponible: true },
        orderBy: { nom: "asc" },
      },
    },
  });
  if (!commande) notFound();
  const reglages = await lireReglages();

  const etapeActuelle = ETAPES.indexOf(commande.statut);
  const messageGerant = lienWhatsapp(
    reglages.whatsapp,
    `Bonjour ! J'ai passé la commande n°${commande.numero} sur ${NOM_DU_SITE} (${commande.nomClient}, ${commande.ville}).`,
  );

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ViderPanier jeton={jeton} vider={nouvelle} />
      <Actualiser secondes={30} />

      {nouvelle && (
        <section className="rounded-[2rem] bg-emerald-500 p-6 text-white">
          <p className="text-4xl" aria-hidden="true">🎉</p>
          <h1 className="mt-2 text-2xl font-extrabold">Merci, ta commande est envoyée !</h1>
          <p className="mt-1 text-emerald-50">
            Cette page se met à jour toute seule, et tu la retrouves dans « Mes commandes ». Pour aller plus vite, envoie-nous un WhatsApp.
          </p>
        </section>
      )}

      <section className="carte space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-500">Commande n°{commande.numero}</p>
            <h2 className="text-xl font-extrabold">{LIBELLE_STATUT[commande.statut]}</h2>
          </div>
          {commande.express && (
            <span className="inline-flex items-center gap-1 rounded-full bg-soleil px-3 py-1 text-sm font-bold text-slate-900">
              <IconeEclair className="h-4 w-4" /> Express
            </span>
          )}
        </div>
        <p className="text-slate-700">{EXPLICATION_STATUT[commande.statut]}</p>

        {commande.statut === "ANNULEE" ? (
          <p className={`rounded-2xl px-4 py-3 font-semibold ${COULEUR_STATUT.ANNULEE}`}>Commande annulée</p>
        ) : (
          <ol className="relative grid grid-cols-4" aria-label="Avancement">
            <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-slate-200" />
            <div
              aria-hidden="true"
              className="absolute left-[12.5%] top-5 h-1 rounded-full bg-marque transition-all"
              style={{ width: `${(Math.max(etapeActuelle, 0) / (ETAPES.length - 1)) * 75}%` }}
            />
            {ETAPES.map((e, i) => {
              const Icone = ICONES[e as keyof typeof ICONES];
              const faite = i <= etapeActuelle;
              return (
                <li key={e} className="relative flex flex-col items-center gap-2 text-center" aria-current={i === etapeActuelle ? "step" : undefined}>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-white ${
                      i === etapeActuelle ? "bg-marque text-white shadow-flottant" : faite ? "bg-marque-clair text-marque" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {faite && i < etapeActuelle ? <IconeCoche /> : <Icone />}
                  </span>
                  <span className={`text-xs ${faite ? "font-bold text-slate-900" : "text-slate-500"}`}>{LIBELLE_STATUT[e]}</span>
                </li>
              );
            })}
          </ol>
        )}

        {messageGerant && (
          <a href={messageGerant} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp w-full">
            <IconeWhatsapp /> Nous écrire sur WhatsApp
          </a>
        )}
      </section>

      <section className="carte grid gap-4 p-5 text-sm sm:grid-cols-2 sm:p-6">
        <div className="space-y-1">
          <h2 className="mb-1 text-base font-extrabold">Livraison</h2>
          <p className="font-semibold">{commande.nomClient}</p>
          <p className="whitespace-pre-line">{commande.adresse}, {commande.ville}</p>
          <p>{libelleDuJour(commande.dateLivraison)} · {commande.creneau}</p>
        </div>
        <div className="space-y-1">
          <h2 className="mb-1 text-base font-extrabold">Tes préférences</h2>
          {commande.paiement && <p>Paiement : <strong>{commande.paiement}</strong></p>}
          {estRemplacement(commande.remplacement) && <p>Si un article manque : <strong>{REMPLACEMENTS[commande.remplacement].libelle.toLowerCase()}</strong></p>}
          {commande.notes && <p className="whitespace-pre-line text-slate-600">Note : {commande.notes}</p>}
        </div>
      </section>

      <section className="carte p-5 text-sm sm:p-6">
        <h2 className="mb-2 text-base font-extrabold">Articles</h2>
        <ul className="divide-y divide-slate-100">
          {commande.lignes.map((l) => (
            <li key={l.id} className={`flex justify-between gap-3 py-2.5 ${l.indisponible ? "text-slate-400" : ""}`}>
              <span>
                <span className={l.indisponible ? "line-through" : ""}>{l.quantite} × {l.nom}</span>
                {l.options && <span className="block text-xs text-slate-500">{l.options}</span>}
                {l.indisponible && <span className="mt-0.5 block text-xs font-semibold text-amber-700">Indisponible, non facturé</span>}
              </span>
              <span className={`shrink-0 font-semibold ${l.indisponible ? "line-through" : ""}`}>{formatPrix(l.prixUnitaire * l.quantite)}</span>
            </li>
          ))}
        </ul>
        <RecapMontants
          className="mt-3 border-t border-slate-100 pt-3"
          totaux={commande}
          regroupes={reglages.fraisRegroupes}
          express={commande.express}
          tarifNom={commande.tarifNom}
          majorationPct={commande.majorationPct}
          libelleTotal="Total à payer"
          ville={commande.ville}
        />
      </section>

      <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
        <Link href="/commandes" className="text-marque hover:underline">Mes commandes</Link>
        <Link href="/" className="text-marque hover:underline">Retour au catalogue</Link>
      </div>
    </div>
  );
}
