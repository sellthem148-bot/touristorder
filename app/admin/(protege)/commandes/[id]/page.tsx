import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { StatutCommande } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { formatDateHeure, libelleDuJour } from "@/lib/dates";
import { margeEstimee } from "@/lib/calcul";
import { COULEUR_STATUT, LIBELLE_STATUT } from "@/lib/statuts";
import { lienWhatsapp } from "@/lib/whatsapp";
import { messagePourLeClient, prenomDe } from "@/lib/messages-client";
import { langueDesMessages } from "@/lib/i18n";
import { NOM_DE_LA_LANGUE, prefixeDe } from "@/lib/langues";
import { precisionsAdresse } from "@/lib/adresse";
import { NOM_DU_SITE } from "@/lib/marque";
import { BoutonCopier } from "@/components/admin/BoutonCopier";
import { RepereWolt } from "@/components/admin/RepereWolt";
import { repereWolt } from "@/lib/repere-wolt";
import { RecapMontants } from "@/components/RecapMontants";
import { IconeEclair, IconeWhatsapp } from "@/components/Icones";
import { estRemplacement, REMPLACEMENTS } from "@/lib/choix-commande";
import { COULEUR_PAIEMENT, etatDuPaiement, libelleDuSolde, libellePaiement } from "@/lib/paiement";
import { lireReglages } from "@/lib/reglages";
import { ajouterLigneLibre, annulerPaiement, changerStatut, enregistrerNoteInterne, modifierLigne, solderCommande } from "../../actions";

export const metadata = { title: "Commande" };

const SUIVANT: Partial<Record<StatutCommande, { statut: StatutCommande; libelle: string }>> = {
  RECUE: { statut: "COMMANDEE", libelle: "Commandée sur Wolt" },
  COMMANDEE: { statut: "EN_LIVRAISON", libelle: "Je pars livrer" },
  EN_LIVRAISON: { statut: "LIVREE", libelle: "Livrée" },
};

async function adresseDuSite() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") ? "http" : "https");
  return `${proto}://${hote}`;
}

export default async function PageCommande({ params, searchParams }: PageProps<"/admin/commandes/[id]">) {
  await exigerAdmin();
  const { id } = await params;
  const { ok, erreur } = await searchParams;
  const [c, reglages] = await Promise.all([
    prisma.commande.findUnique({
      where: { id },
      include: { lignes: { orderBy: [{ boutique: "asc" }, { nom: "asc" }], include: { produit: { select: { nomWolt: true } } } } },
    }),
    lireReglages(),
  ]);
  if (!c) notFound();

  const lienSuivi = `${await adresseDuSite()}/suivi/${c.jeton}`;
  const paiement = etatDuPaiement(c);
  const solde = libelleDuSolde(paiement);
  const resteAPayer = paiement.etat === "A_PAYER" || paiement.etat === "COMPLEMENT";
  // Le message porte le montant, le mode et les coordonnées de paiement tant qu'il reste à régler.
  // Il est écrit dans la langue du client (celle du site quand il a commandé).
  const langueClient = langueDesMessages(c.langue);
  const whatsappClient = lienWhatsapp(
    c.telephone,
    messagePourLeClient(c.statut, {
      // Le lien envoyé au client mène à sa page de suivi dans SA langue ; celui affiché plus bas, pour toi, reste sans langue.
      prenom: prenomDe(c.nomClient), numero: c.numero, total: c.total, lienSuivi: lienSuivi.replace("/suivi/", `${prefixeDe(langueClient.langue)}/suivi/`), site: NOM_DU_SITE,
      paiement, mode: langueClient.mode(c.paiement), coordonnees: reglages.coordonneesPaiement,
    }, langueClient),
  );
  const precisions = precisionsAdresse(c);
  const marge = margeEstimee(c.lignes, c);
  const suivant = SUIVANT[c.statut];

  // La liste de courses, regroupée par boutique Wolt.
  const parBoutique = new Map<string, typeof c.lignes>();
  for (const l of c.lignes) {
    const cle = l.boutique || "Boutique non précisée";
    parBoutique.set(cle, [...(parBoutique.get(cle) ?? []), l]);
  }
  // Le repère de chaque article : son nom en hébreu à chercher sur Wolt (le nom relevé, sinon une traduction).
  const reperes = new Map(c.lignes.map((l) => [l.id, repereWolt(l.nom, l.produit?.nomWolt)]));
  const hebreu = (ligneId: string) => reperes.get(ligneId)?.hebreu ?? "";
  const listeTexte = [...parBoutique]
    .map(([b, lignes]) => `${b}\n${lignes.filter((l) => !l.indisponible).map((l) => `- ${l.quantite} × ${l.nom}${l.options ? ` (${l.options})` : ""}${hebreu(l.id) ? ` — ${hebreu(l.id)}` : ""}`).join("\n")}`)
    .join("\n\n");

  return (
    <div className="space-y-5">
      <Link href="/admin" className="text-sm font-semibold text-marque hover:underline">← Commandes</Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-extrabold">Commande n°{c.numero}</h1>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${COULEUR_STATUT[c.statut]}`}>{LIBELLE_STATUT[c.statut]}</span>
        {c.express && (
          <span className="inline-flex items-center gap-1 rounded-full bg-soleil px-3 py-1 text-sm font-bold text-slate-900">
            <IconeEclair className="h-4 w-4" /> Express
          </span>
        )}
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${COULEUR_PAIEMENT[paiement.etat]}`}>{libellePaiement(paiement)}</span>
        <span className="text-sm text-slate-500">passée le {formatDateHeure(c.createdAt)}</span>
      </div>

      {typeof ok === "string" && <p role="status" className="rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900">{ok}</p>}
      {typeof erreur === "string" && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-800">{erreur}</p>}

      {(estRemplacement(c.remplacement) || c.paiement || c.pourboire > 0) && (
        <ul className="flex flex-wrap gap-2 text-sm">
          {estRemplacement(c.remplacement) && (
            <li className="rounded-full bg-white px-3 py-1.5 shadow-carte">Si un article manque : <strong>{REMPLACEMENTS[c.remplacement].court}</strong></li>
          )}
          {c.paiement && <li className="rounded-full bg-white px-3 py-1.5 shadow-carte">Paiement : <strong>{c.paiement}</strong></li>}
          {c.pourboire > 0 && <li className="rounded-full bg-white px-3 py-1.5 shadow-carte">Pourboire : <strong>{formatPrix(c.pourboire)}</strong></li>}
        </ul>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-5">
          <section className="carte space-y-4 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-bold">Liste de courses</h2>
              <BoutonCopier texte={listeTexte} />
            </div>
            {[...parBoutique].map(([boutique, lignes]) => (
              <div key={boutique} className="space-y-2">
                <h3 className="font-semibold text-marque-fonce">{boutique}</h3>
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {lignes.map((l) => (
                    <li key={l.id} className="flex flex-col gap-2 p-3 sm:flex-row sm:items-center sm:gap-3">
                      <div className={`min-w-0 sm:flex-1 ${l.indisponible ? "text-slate-400 line-through" : ""}`}>
                        <p className="font-medium">{l.quantite} × {l.nom}</p>
                        {l.options && <p className="text-sm font-semibold text-marque-fonce">{l.options}</p>}
                        <p className="text-xs text-slate-500">
                          {formatPrix(l.prixUnitaire)} l&apos;unité
                          {l.prixAchatUnitaire != null && <> · achat {formatPrix(l.prixAchatUnitaire)}</>}
                          {l.lienWolt && (
                            <> · <a href={l.lienWolt} target="_blank" rel="noopener noreferrer" className="text-marque underline">voir sur Wolt</a></>
                          )}
                        </p>
                        {!l.indisponible && <RepereWolt nom={l.nom} {...reperes.get(l.id)!} />}
                      </div>
                      <form action={modifierLigne} className="flex items-center gap-2 text-sm">
                        <input type="hidden" name="ligneId" value={l.id} />
                        <label className="sr-only" htmlFor={`q-${l.id}`}>Quantité</label>
                        <input id={`q-${l.id}`} name="quantite" type="number" min={1} max={50} defaultValue={l.quantite} className="champ w-16 px-2 py-1.5" />
                        <label className="flex items-center gap-1">
                          <input type="checkbox" name="indisponible" value="1" defaultChecked={l.indisponible} />
                          Indispo
                        </label>
                        <button type="submit" className="bouton-secondaire px-2.5 py-1.5 text-sm">OK</button>
                      </form>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {c.lignes.length === 0 && <p className="text-sm text-slate-600">Aucun article pour l&apos;instant.</p>}
            <p className="text-xs text-slate-500">
              Un article indisponible n&apos;est plus facturé ; le total et la page de suivi du client se mettent à jour.
            </p>
          </section>

          <section className="carte space-y-3 p-4" aria-labelledby="t-hors-catalogue">
            <h2 id="t-hors-catalogue" className="text-lg font-bold">Article hors catalogue</h2>
            {c.demandeLibre ? (
              <p className="whitespace-pre-line rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
                <strong>Le client demande :</strong> {c.demandeLibre}
              </p>
            ) : (
              <p className="text-sm text-slate-600">Le client n&apos;a rien demandé hors catalogue. Tu peux quand même ajouter un article.</p>
            )}
            <form action={ajouterLigneLibre} className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-[minmax(0,2fr)_70px_minmax(0,1fr)_minmax(0,1fr)]">
              <input type="hidden" name="id" value={c.id} />
              <div className="col-span-2 sm:col-span-1">
                <label htmlFor="libre-nom" className="etiquette">Article</label>
                <input id="libre-nom" name="nom" required maxLength={120} className="champ" placeholder="Crème solaire enfant SPF 50" />
              </div>
              <div>
                <label htmlFor="libre-quantite" className="etiquette">Qté</label>
                <input id="libre-quantite" name="quantite" type="number" min={1} max={50} defaultValue={1} required className="champ px-2" />
              </div>
              <div>
                <label htmlFor="libre-prix" className="etiquette">Prix de vente</label>
                <input id="libre-prix" name="prix" inputMode="decimal" required className="champ" placeholder="59,90" />
              </div>
              <div>
                <label htmlFor="libre-achat" className="etiquette">Prix Wolt</label>
                <input id="libre-achat" name="prixAchat" inputMode="decimal" className="champ" placeholder="59,90" />
              </div>
              <div className="col-span-2 sm:col-span-3">
                <label htmlFor="libre-boutique" className="etiquette">Boutique (facultatif)</label>
                <input id="libre-boutique" name="boutique" maxLength={80} className="champ" placeholder="Wolt Market Netanya Center" />
              </div>
              <div className="col-span-2 flex items-end sm:col-span-1">
                <button type="submit" className="bouton-secondaire w-full">Ajouter</button>
              </div>
            </form>
            <p className="text-xs text-slate-500">
              Le total est recalculé (frais compris). Si la commande était déjà payée, un complément apparaît ; envoie le nouveau montant au client sur WhatsApp.
            </p>
          </section>

          <section className="carte p-4 text-sm">
            <h2 className="mb-2 text-lg font-bold">Montants</h2>
            {c.tarifNom && <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{c.tarifNom}</p>}
            <RecapMontants
              totaux={c}
              regroupes={false}
              express={c.express}
              tarifNom={c.tarifNom}
              majorationPct={c.majorationPct}
              libelleTotal="Total de la commande"
              ville={c.ville}
            />
            <dl className="mt-2 space-y-1">
              {c.supplementVille > 0 && (
                <div className="flex justify-between text-slate-600"><dt>dont supplément {c.ville}</dt><dd>{formatPrix(c.supplementVille)}</dd></div>
              )}
              <div className="flex justify-between text-slate-600"><dt>Coût des articles sur Wolt</dt><dd>{formatPrix(marge.cout)}</dd></div>
              <div className="flex justify-between font-semibold text-emerald-700">
                <dt>Ta marge estimée</dt>
                <dd>{formatPrix(marge.marge)}</dd>
              </div>
            </dl>
            {!marge.complete && (
              <p className="mt-2 text-xs text-amber-800">
                Estimation incomplète : certains produits n&apos;ont pas de prix d&apos;achat. Hors frais de livraison Wolt.
              </p>
            )}
          </section>
        </div>

        <aside className="space-y-5">
          <section className="carte space-y-3 p-4" aria-labelledby="t-paiement">
            <h2 id="t-paiement" className="text-lg font-bold">Paiement</h2>
            <p className="text-sm">
              <span className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ${COULEUR_PAIEMENT[paiement.etat]}`}>{libellePaiement(paiement)}</span>
              {c.paiement && <span className="ml-2 text-slate-600">par {c.paiement}</span>}
            </p>
            {c.payeLe && <p className="text-xs text-slate-500">Reçu : {formatPrix(c.montantPaye)}, le {formatDateHeure(c.payeLe)}.</p>}
            <Link href={`/admin/commandes/${c.id}/recu`} className="block text-sm font-semibold text-marque hover:underline">Reçu à imprimer ou à envoyer</Link>
            {resteAPayer && whatsappClient && (
              <a href={whatsappClient} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp w-full">
                <IconeWhatsapp /> Envoyer le montant et les coordonnées
              </a>
            )}
            {resteAPayer && !reglages.coordonneesPaiement && (
              <p className="text-xs text-amber-800">
                Tes coordonnées de paiement ne sont pas enregistrées : <Link href="/admin/reglages" className="underline">ajoute-les dans Réglages</Link> pour qu&apos;elles partent dans le message.
              </p>
            )}
            {solde && (
              <form action={solderCommande}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="bouton w-full">{solde}</button>
              </form>
            )}
            {c.payeLe && (
              <details className="text-sm">
                <summary className="cursor-pointer text-slate-600">Erreur ? Annuler ce paiement</summary>
                <form action={annulerPaiement} className="mt-2">
                  <input type="hidden" name="id" value={c.id} />
                  <button type="submit" className="bouton-secondaire w-full py-2 text-sm">Remettre « à payer »</button>
                </form>
              </details>
            )}
          </section>

          <section className="carte space-y-3 p-4">
            <h2 className="text-lg font-bold">Étape</h2>
            {resteAPayer && c.statut === "RECUE" && (
              <p className="rounded-xl bg-amber-50 p-2.5 text-sm text-amber-900">Pas encore payée : ne commande sur Wolt qu&apos;après le paiement.</p>
            )}
            {suivant && (
              <form action={changerStatut}>
                <input type="hidden" name="id" value={c.id} />
                <input type="hidden" name="statut" value={suivant.statut} />
                <button type="submit" className="bouton w-full">→ {suivant.libelle}</button>
              </form>
            )}
            {whatsappClient && (
              <a href={whatsappClient} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp w-full">
                <IconeWhatsapp /> Écrire au client sur WhatsApp
              </a>
            )}
            <details className="text-sm">
              <summary className="cursor-pointer text-slate-600">Changer l&apos;étape à la main</summary>
              <form action={changerStatut} className="mt-2 flex gap-2">
                <input type="hidden" name="id" value={c.id} />
                <label htmlFor="statut" className="sr-only">Étape</label>
                <select id="statut" name="statut" defaultValue={c.statut} className="champ py-1.5">
                  {(Object.keys(LIBELLE_STATUT) as StatutCommande[]).map((s) => (
                    <option key={s} value={s}>{LIBELLE_STATUT[s]}</option>
                  ))}
                </select>
                <button type="submit" className="bouton-secondaire px-3 py-1.5">OK</button>
              </form>
            </details>
          </section>

          <section className="carte space-y-1 p-4 text-sm">
            <h2 className="mb-1 text-lg font-bold">Client</h2>
            <p className="font-medium">{c.nomClient}</p>
            <p><a href={`tel:${c.telephone.replace(/[^\d+]/g, "")}`} className="text-marque underline">{c.telephone}</a></p>
            {c.email && <p className="break-all text-slate-600">{c.email}</p>}
            <p className="whitespace-pre-line">{c.adresse}</p>
            {precisions && <p className="font-medium">{precisions}</p>}
            <p>{c.ville}</p>
            {langueClient.langue !== "fr" && (
              <p className="rounded-lg bg-sky-50 p-2 text-sky-900">
                Langue du client : <strong>{NOM_DE_LA_LANGUE[langueClient.langue]}</strong>. Ton message WhatsApp et son e-mail sont écrits dans sa langue.
              </p>
            )}
            <p className="pt-1 font-medium">{libelleDuJour(c.dateLivraison)} · {c.creneau}</p>
            {c.notes && <p className="whitespace-pre-line rounded-lg bg-amber-50 p-2 text-amber-900">Note du client : {c.notes}</p>}
            <p className="pt-2 text-xs text-slate-500 break-all">
              Lien de suivi : <a href={lienSuivi} className="underline" target="_blank" rel="noopener noreferrer">{lienSuivi}</a>
            </p>
          </section>

          <section className="carte p-4">
            <form action={enregistrerNoteInterne} className="space-y-2">
              <input type="hidden" name="id" value={c.id} />
              <label htmlFor="noteInterne" className="text-lg font-bold">Note interne</label>
              <textarea id="noteInterne" name="noteInterne" rows={3} defaultValue={c.noteInterne} className="champ text-sm" placeholder="N° de commande Wolt, remplacement…" />
              <button type="submit" className="bouton-secondaire w-full py-2 text-sm">Enregistrer la note</button>
            </form>
          </section>
        </aside>
      </div>
    </div>
  );
}
