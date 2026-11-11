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
import { Bike, Check, CircleCheck, Clock, House, ReceiptText, ShoppingBag, Zap } from "lucide-react";
import { etatDuPaiement, messageDeReglement, paiementPourLeClient } from "@/lib/paiement";
import { IconeWhatsapp } from "@/components/Icones";
import { ViderPanier } from "./ViderPanier";
import { RecapMontants } from "@/components/RecapMontants";

export const dynamic = "force-dynamic";
export const metadata = { title: "Suivi de commande", robots: { index: false } };

const ICONES = { RECUE: ReceiptText, COMMANDEE: ShoppingBag, EN_LIVRAISON: Bike, LIVREE: House } as const;

export default async function Suivi({ params, searchParams }: PageProps<"/suivi/[jeton]">) {
  const { jeton } = await params;
  const nouvelle = (await searchParams).nouvelle === "1";
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(jeton)) notFound();

  // Ce que le client voit de SA commande : jamais les prix d'achat ni les boutiques.
  const commande = await prisma.commande.findUnique({
    where: { jeton },
    select: {
      numero: true, statut: true, nomClient: true, ville: true, adresse: true,
      dateLivraison: true, creneau: true, notes: true, demandeLibre: true, express: true, remplacement: true, paiement: true,
      montantPaye: true, payeLe: true,
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
  // Le paiement se fait avant la préparation : les coordonnées ne sont données que sur WhatsApp.
  const etat = etatDuPaiement(commande);
  const paiement = paiementPourLeClient(etat, commande.paiement);
  const resteARegler = etat.etat === "A_PAYER" || etat.etat === "COMPLEMENT";
  const lienReglement = resteARegler
    ? lienWhatsapp(reglages.whatsapp, messageDeReglement({ numero: commande.numero, montant: etat.montant, mode: commande.paiement, site: NOM_DU_SITE }))
    : null;
  // Une demande d'article hors catalogue, pas encore chiffrée par le gérant.
  const demandeEnCours = commande.demandeLibre !== "" && etat.etat === "RIEN" && commande.statut === "RECUE";
  const explication =
    commande.statut === "RECUE"
      ? demandeEnCours
        ? "Nous avons bien reçu votre demande. Nous recherchons l'article et vous confirmons son prix sur WhatsApp."
        : resteARegler
          ? "Nous avons bien reçu votre commande. Elle est préparée dès réception de votre paiement."
          : "Nous avons bien reçu votre commande et votre paiement. Nous nous occupons de vos achats."
      : EXPLICATION_STATUT[commande.statut];
  const TONS = {
    attente: "border-amber-200 bg-amber-50 text-amber-950",
    recu: "border-emerald-200 bg-emerald-50 text-emerald-950",
    info: "border-slate-200 bg-slate-50 text-slate-900",
  } as const;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <ViderPanier jeton={jeton} vider={nouvelle} />
      <Actualiser secondes={30} />

      {nouvelle && (
        <section className="flex gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5">
          <CircleCheck className="mt-0.5 h-7 w-7 shrink-0 text-emerald-700" strokeWidth={1.6} aria-hidden="true" />
          <div>
            <h1 className="text-xl font-bold text-emerald-950 sm:text-2xl">{demandeEnCours ? "Merci, votre demande est envoyée." : "Merci, votre commande est enregistrée."}</h1>
            <p className="mt-1 text-sm text-emerald-900 sm:text-base">
              Cette page se met à jour toute seule, et vous la retrouvez dans « Mes commandes ».
            </p>
          </div>
        </section>
      )}

      <section className="carte space-y-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-500">Commande n°{commande.numero}</p>
            <h2 className="text-xl font-extrabold">{LIBELLE_STATUT[commande.statut]}</h2>
          </div>
          {commande.express && (
            <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-sm font-semibold text-amber-900 ring-1 ring-inset ring-amber-200">
              <Zap className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> Express
            </span>
          )}
        </div>
        <p className="text-slate-700">{explication}</p>

        {paiement && commande.statut !== "ANNULEE" && (
          <div className={`space-y-3 rounded-2xl border p-4 ${TONS[paiement.ton]}`} role={paiement.ton === "attente" ? "status" : undefined}>
            <div className="flex gap-3">
              {paiement.ton === "recu" ? (
                <CircleCheck className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
              ) : (
                <Clock className="mt-0.5 h-5 w-5 shrink-0" strokeWidth={1.7} aria-hidden="true" />
              )}
              <div className="min-w-0 space-y-1">
                <p className="font-bold">{paiement.titre}</p>
                <p className="text-sm">{paiement.texte}</p>
              </div>
            </div>
            {lienReglement && (
              <a href={lienReglement} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp w-full text-sm">
                <IconeWhatsapp /> Recevoir les coordonnées de paiement
              </a>
            )}
          </div>
        )}
        {paiement && commande.statut === "ANNULEE" && etat.etat === "A_REMBOURSER" && (
          <p className={`rounded-2xl border p-4 text-sm ${TONS.info}`}><strong>{paiement.titre}.</strong> {paiement.texte}</p>
        )}

        {commande.statut === "ANNULEE" ? (
          <p className={`rounded-2xl px-4 py-3 font-semibold ${COULEUR_STATUT.ANNULEE}`}>Commande annulée</p>
        ) : (
          <ol className="relative grid grid-cols-4" aria-label="Avancement">
            <div aria-hidden="true" className="absolute left-[12.5%] right-[12.5%] top-5 h-1 rounded-full bg-slate-200" />
            <div
              aria-hidden="true"
              className="absolute left-[12.5%] top-5 h-1 rounded-full bg-encre transition-all"
              style={{ width: `${(Math.max(etapeActuelle, 0) / (ETAPES.length - 1)) * 75}%` }}
            />
            {ETAPES.map((e, i) => {
              const Icone = ICONES[e as keyof typeof ICONES];
              const faite = i <= etapeActuelle;
              return (
                <li key={e} className="relative flex flex-col items-center gap-2 text-center" aria-current={i === etapeActuelle ? "step" : undefined}>
                  <span
                    className={`flex h-11 w-11 items-center justify-center rounded-full ring-4 ring-white ${
                      i === etapeActuelle ? "bg-encre text-white" : faite ? "bg-slate-200 text-encre" : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {faite && i < etapeActuelle ? <Check className="h-5 w-5" strokeWidth={2} aria-hidden="true" /> : <Icone className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />}
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
          <h2 className="mb-1 text-base font-extrabold">Vos préférences</h2>
          {commande.paiement && <p>Mode de paiement : <strong>{commande.paiement}</strong></p>}
          {estRemplacement(commande.remplacement) && <p>Si un article manque : <strong>{REMPLACEMENTS[commande.remplacement].libelle.toLowerCase()}</strong></p>}
          {commande.notes && <p className="whitespace-pre-line text-slate-600">Note : {commande.notes}</p>}
        </div>
      </section>

      <section className="carte p-5 text-sm sm:p-6">
        <h2 className="mb-2 text-base font-extrabold">Articles</h2>
        {commande.demandeLibre && (
          <p className="mb-3 whitespace-pre-line rounded-2xl border border-slate-200 bg-slate-50 p-3 text-slate-700">
            <strong>Votre demande hors catalogue :</strong> {commande.demandeLibre}
            <span className="mt-1 block text-xs text-slate-500">Nous vous confirmons son prix sur WhatsApp avant de l&apos;ajouter à votre commande.</span>
          </p>
        )}
        <ul className="divide-y divide-slate-100">
          {commande.lignes.map((l) => (
            <li key={l.id} className={`flex justify-between gap-3 py-2.5 ${l.indisponible ? "text-slate-400" : ""}`}>
              <span>
                <span className={l.indisponible ? "line-through" : ""}>{l.quantite} × {l.nom}</span>
                {l.options && <span className="block text-xs text-slate-500">{l.options}</span>}
                {l.indisponible && <span className="mt-0.5 block text-xs font-semibold text-amber-700">{commande.montantPaye > 0 ? "Indisponible, remboursé" : "Indisponible, non facturé"}</span>}
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
          libelleTotal={resteARegler || etat.etat === "RIEN" ? "Total à payer" : "Total"}
          ville={commande.ville}
        />
      </section>

      <div className="flex flex-wrap justify-center gap-4 text-sm font-bold">
        <Link href="/commandes" className="text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">Mes commandes</Link>
        <Link href="/" className="text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">Retour au catalogue</Link>
      </div>
    </div>
  );
}
