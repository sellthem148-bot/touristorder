import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, ETAPES, EXPLICATION_STATUT, LIBELLE_STATUT } from "@/lib/statuts";
import { lireReglages } from "@/lib/reglages";
import { lienWhatsapp } from "@/lib/whatsapp";
import { NOM_DU_SITE } from "@/lib/marque";
import { ViderPanier } from "./ViderPanier";
import { Actualiser } from "@/components/Actualiser";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suivi de commande", robots: { index: false } };

export default async function Suivi({ params, searchParams }: PageProps<"/suivi/[jeton]">) {
  const { jeton } = await params;
  const nouvelle = (await searchParams).nouvelle === "1";
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(jeton)) notFound();

  // Ce que le client voit de SA commande : jamais les prix d'achat ni les boutiques.
  const commande = await prisma.commande.findUnique({
    where: { jeton },
    select: {
      numero: true, statut: true, nomClient: true, ville: true, adresse: true,
      dateLivraison: true, creneau: true, notes: true,
      sousTotal: true, fraisService: true, fraisLivraison: true, total: true,
      lignes: { select: { id: true, nom: true, prixUnitaire: true, quantite: true, indisponible: true }, orderBy: { nom: "asc" } },
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
      {nouvelle && <ViderPanier />}
      <Actualiser secondes={30} />

      {nouvelle && (
        <section className="rounded-2xl bg-emerald-50 p-5 text-emerald-900">
          <h1 className="text-xl font-extrabold">Merci, ta commande est envoyée !</h1>
          <p className="mt-1 text-sm">
            Garde cette page en favori : elle se met à jour toute seule. Pour aller plus vite, envoie-nous un message WhatsApp.
          </p>
        </section>
      )}

      <section className="carte space-y-4 p-5">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Commande n°{commande.numero}</h2>
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${COULEUR_STATUT[commande.statut]}`}>
            {LIBELLE_STATUT[commande.statut]}
          </span>
        </div>
        <p className="text-slate-700">{EXPLICATION_STATUT[commande.statut]}</p>

        {commande.statut !== "ANNULEE" && (
          <ol className="grid grid-cols-4 gap-2" aria-label="Avancement">
            {ETAPES.map((e, i) => (
              <li key={e} className="space-y-1 text-center text-xs">
                <div className={`h-2 rounded-full ${i <= etapeActuelle ? "bg-marque" : "bg-slate-200"}`} />
                <span className={i <= etapeActuelle ? "font-semibold text-slate-900" : "text-slate-500"}>
                  {LIBELLE_STATUT[e]}
                </span>
              </li>
            ))}
          </ol>
        )}

        {messageGerant && (
          <a href={messageGerant} target="_blank" rel="noopener noreferrer" className="bouton w-full bg-[#1f9d55] hover:bg-[#177a42]">
            Nous écrire sur WhatsApp
          </a>
        )}
      </section>

      <section className="carte space-y-2 p-5 text-sm">
        <h2 className="text-base font-bold">Livraison</h2>
        <p>{commande.nomClient}</p>
        <p className="whitespace-pre-line">{commande.adresse}, {commande.ville}</p>
        <p>{libelleDuJour(commande.dateLivraison)} · {commande.creneau}</p>
        {commande.notes && <p className="whitespace-pre-line text-slate-600">Note : {commande.notes}</p>}
      </section>

      <section className="carte p-5 text-sm">
        <h2 className="mb-2 text-base font-bold">Articles</h2>
        <ul className="divide-y divide-slate-100">
          {commande.lignes.map((l) => (
            <li key={l.id} className={`flex justify-between gap-3 py-2 ${l.indisponible ? "text-slate-400 line-through" : ""}`}>
              <span>
                {l.quantite} × {l.nom}
                {l.indisponible && <span className="ml-2 no-underline">(indisponible, non facturé)</span>}
              </span>
              <span>{formatPrix(l.prixUnitaire * l.quantite)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 border-t border-slate-100 pt-3">
          <div className="flex justify-between"><dt>Articles</dt><dd>{formatPrix(commande.sousTotal)}</dd></div>
          <div className="flex justify-between"><dt>Frais de service</dt><dd>{formatPrix(commande.fraisService)}</dd></div>
          <div className="flex justify-between"><dt>Livraison</dt><dd>{formatPrix(commande.fraisLivraison)}</dd></div>
          <div className="flex justify-between text-base font-bold"><dt>Total à payer</dt><dd>{formatPrix(commande.total)}</dd></div>
        </dl>
      </section>

      <Link href="/" className="block text-center text-sm font-semibold text-marque hover:underline">
        Retour au catalogue
      </Link>
    </div>
  );
}
