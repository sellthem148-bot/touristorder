import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { ajouterJours, jourEnIsrael, libelleDuJour } from "@/lib/dates";
import { debutDuCreneau } from "@/lib/tarifs";
import { COULEUR_STATUT, LIBELLE_STATUT } from "@/lib/statuts";
import { estRemplacement, REMPLACEMENTS } from "@/lib/choix-commande";
import { lienWhatsapp } from "@/lib/whatsapp";
import { lienWaze, messageJArrive, messagePourLeClient, prenomDe } from "@/lib/messages-client";
import { COULEUR_PAIEMENT, estReglee, etatDuPaiement, libelleDuSolde, libellePaiement, resteAPayer } from "@/lib/paiement";
import { prixNonVerifie } from "@/lib/prix-indicatif";
import { lireReglages } from "@/lib/reglages";
import { adresseDuSite } from "@/lib/site";
import { NOM_DU_SITE } from "@/lib/marque";
import { BoutonCopier } from "@/components/admin/BoutonCopier";
import { IconeWhatsapp } from "@/components/Icones";
import { changerStatut, marquerCommandees, solderCommande } from "../actions";

export const metadata = { title: "Ma journée" };

export default async function MaJournee({ searchParams }: PageProps<"/admin/journee">) {
  await exigerAdmin();
  const params = await searchParams;
  const aujourdhui = jourEnIsrael();
  const demain = ajouterJours(aujourdhui, 1);
  const jour = typeof params.jour === "string" && /^\d{4}-\d{2}-\d{2}$/.test(params.jour) ? params.jour : aujourdhui;

  const [commandes, reglages, site] = await Promise.all([
    prisma.commande.findMany({
      where: { dateLivraison: jour, statut: { not: "ANNULEE" } },
      orderBy: [{ createdAt: "asc" }],
      include: { lignes: { orderBy: [{ boutique: "asc" }, { nom: "asc" }], include: { produit: { select: { id: true, nomWolt: true, prix: true, prixIndicatif: true, prixAchat: true } } } } },
    }),
    lireReglages(),
    adresseDuSite(),
  ]);
  // La tournée : par créneau (dans l'ordre des heures), puis par ville.
  const ordreCreneau = (c: string) => debutDuCreneau(c) ?? -1;
  commandes.sort((a, b) => ordreCreneau(a.creneau) - ordreCreneau(b.creneau) || a.ville.localeCompare(b.ville) || a.numero - b.numero);

  // Le paiement passe avant les achats : seules les commandes réglées vont sur Wolt.
  const aCommander = commandes.filter((c) => c.statut === "RECUE" && estReglee(c));
  // Ce qui attend le client : un paiement, ou le prix d'un article hors catalogue demandé.
  const enAttente = commandes.filter((c) => c.statut !== "LIVREE" && (resteAPayer(c) > 0 || (c.statut === "RECUE" && !estReglee(c))));
  const montantEnAttente = enAttente.reduce((s, c) => s + resteAPayer(c), 0);
  const aLivrer = commandes.filter((c) => c.statut !== "LIVREE");
  const livrees = commandes.filter((c) => c.statut === "LIVREE");

  // Liste de courses de toutes les commandes à passer, additionnée par boutique puis par article.
  const parBoutique = new Map<string, Map<string, { quantite: number; numeros: number[]; nomWolt: string; aVerifier: string }>>();
  for (const c of aCommander) {
    for (const l of c.lignes) {
      if (l.indisponible) continue;
      const boutique = l.boutique || "Boutique non précisée";
      const articles = parBoutique.get(boutique) ?? new Map();
      const cle = l.options ? `${l.nom} (${l.options})` : l.nom;
      // Vendu au prix de la liste du gérant, jamais vérifié : c'est en l'achetant qu'il voit le vrai prix.
      const a = articles.get(cle) ?? { quantite: 0, numeros: [], nomWolt: l.produit?.nomWolt ?? "", aVerifier: l.produit && prixNonVerifie(l.produit) ? l.produit.id : "" };
      articles.set(cle, { quantite: a.quantite + l.quantite, numeros: [...a.numeros, c.numero], nomWolt: a.nomWolt, aVerifier: a.aVerifier });
      parBoutique.set(boutique, articles);
    }
  }
  const listeTexte = [...parBoutique]
    .map(([b, articles]) => `${b}\n${[...articles].map(([nom, a]) => `- ${a.quantite} × ${nom}${a.nomWolt ? ` — ${a.nomWolt}` : ""}`).join("\n")}`)
    .join("\n\n");

  // Ce qui a été reçu pour ce jour, par mode de paiement.
  const parPaiement = new Map<string, number>();
  for (const c of commandes) {
    if (c.montantPaye > 0) parPaiement.set(c.paiement || "Non précisé", (parPaiement.get(c.paiement || "Non précisé") ?? 0) + c.montantPaye);
  }

  const creneaux = [...new Set(aLivrer.map((c) => c.creneau))];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Ma journée</h1>
        <nav aria-label="Jour" className="flex gap-2">
          {[
            { valeur: aujourdhui, libelle: "Aujourd'hui" },
            { valeur: demain, libelle: "Demain" },
          ].map((j) => (
            <Link
              key={j.valeur}
              href={j.valeur === aujourdhui ? "/admin/journee" : `/admin/journee?jour=${j.valeur}`}
              aria-current={j.valeur === jour ? "page" : undefined}
              className={`rounded-full px-4 py-2 text-sm font-bold ${j.valeur === jour ? "bg-slate-900 text-white" : "bg-white shadow-carte"}`}
            >
              {j.libelle}
            </Link>
          ))}
        </nav>
      </div>
      <p className="text-sm text-slate-600">{libelleDuJour(jour)} · {commandes.length} commande{commandes.length > 1 ? "s" : ""}</p>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Résumé">
        <div className="carte p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Paiement en attente</p>
          <p className="text-2xl font-extrabold">{enAttente.length}</p>
          {montantEnAttente > 0 && <p className="text-xs font-semibold tabular-nums text-slate-500">{formatPrix(montantEnAttente)} à recevoir</p>}
        </div>
        <div className="carte p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">À commander sur Wolt</p>
          <p className="text-2xl font-extrabold">{aCommander.length}</p>
        </div>
        <div className="carte p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">À livrer</p>
          <p className="text-2xl font-extrabold">{aLivrer.length}</p>
        </div>
        <div className="carte p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Livrées</p>
          <p className="text-2xl font-extrabold">{livrees.length}</p>
        </div>
      </section>
      {parPaiement.size > 0 && (
        <p className="text-sm text-slate-600">
          Reçu : {[...parPaiement].map(([p, t]) => `${p} ${formatPrix(t)}`).join(" · ")}
        </p>
      )}

      {/* 1. D'abord : recevoir les paiements */}
      <section className="carte space-y-3 p-5" aria-labelledby="t-paiements">
        <h2 id="t-paiements" className="text-lg font-extrabold">1. Paiements à recevoir</h2>
        {enAttente.length === 0 ? (
          <p className="text-sm text-slate-600">Rien en attente : toutes les commandes de ce jour sont réglées.</p>
        ) : (
          <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
            {enAttente.map((c) => {
              const paiement = etatDuPaiement(c);
              const solde = libelleDuSolde(paiement);
              const message = lienWhatsapp(
                c.telephone,
                messagePourLeClient(c.statut, {
                  prenom: prenomDe(c.nomClient), numero: c.numero, total: c.total, lienSuivi: `${site}/suivi/${c.jeton}`, site: NOM_DU_SITE,
                  paiement, mode: c.paiement, coordonnees: reglages.coordonneesPaiement,
                }),
              );
              return (
                <li key={c.id} className="space-y-2 p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/commandes/${c.id}`} className="font-extrabold hover:underline">n°{c.numero}</Link>
                    <span className="font-semibold">{c.nomClient}</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${COULEUR_PAIEMENT[paiement.etat]}`}>{libellePaiement(paiement)}</span>
                    {c.paiement && <span className="text-slate-600">par {c.paiement}</span>}
                  </div>
                  {c.demandeLibre && (
                    <p className="whitespace-pre-line rounded-lg bg-amber-50 p-2 text-amber-900">
                      Demande hors catalogue : {c.demandeLibre}
                      {paiement.etat === "RIEN" && <> — <Link href={`/admin/commandes/${c.id}`} className="font-semibold underline">ajouter l&apos;article et son prix</Link></>}
                    </p>
                  )}
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    {message && solde && (
                      <a href={message} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp py-2 text-sm">
                        <IconeWhatsapp className="h-4 w-4" /> Envoyer le montant
                      </a>
                    )}
                    {solde && (
                      <form action={solderCommande}>
                        <input type="hidden" name="id" value={c.id} />
                        <button type="submit" className="bouton w-full py-2 text-sm" aria-label={`Commande n°${c.numero} : ${solde}`}>{solde}</button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {enAttente.length > 0 && !reglages.coordonneesPaiement && (
          <p className="text-xs text-amber-800">
            Tes coordonnées de paiement ne sont pas enregistrées : <Link href="/admin/reglages" className="underline">ajoute-les dans Réglages</Link> pour qu&apos;elles partent dans le message WhatsApp.
          </p>
        )}
      </section>

      {/* 2. Dans la journée : passer les commandes Wolt (commandes réglées seulement) */}
      <section className="carte space-y-4 p-5" aria-labelledby="t-wolt">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="t-wolt" className="text-lg font-extrabold">2. À commander sur Wolt</h2>
          {parBoutique.size > 0 && <BoutonCopier texte={listeTexte} />}
        </div>
        {aCommander.length === 0 ? (
          <p className="text-sm text-slate-600">
            {enAttente.some((c) => c.statut === "RECUE")
              ? "Rien à commander pour l'instant : les commandes reçues attendent leur paiement."
              : "Rien à commander : toutes les commandes de ce jour sont déjà passées sur Wolt."}
          </p>
        ) : (
          <>
            {[...parBoutique].map(([boutique, articles]) => (
              <div key={boutique} className="space-y-1">
                <h3 className="font-bold text-marque-fonce">{boutique}</h3>
                <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200">
                  {[...articles].map(([nom, a]) => (
                    <li key={nom} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <strong>{a.quantite} ×</strong> {nom}
                        {a.nomWolt && <span dir="rtl" lang="he" className="block text-xs text-slate-500">{a.nomWolt}</span>}
                        {a.aVerifier && (
                          <span className="block text-xs font-semibold text-amber-700">
                            Prix de ta liste, pas vérifié sur Wolt —{" "}
                            <Link href={`/admin/produits/${a.aVerifier}`} className="underline">noter le vrai prix</Link>
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">n° {[...new Set(a.numeros)].join(", ")}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            <form action={marquerCommandees} className="space-y-2">
              <p className="text-sm font-semibold">Commandes concernées :</p>
              <div className="flex flex-wrap gap-2">
                {aCommander.map((c) => (
                  <label key={c.id} className="pastille">
                    <input type="checkbox" name="ids" value={c.id} defaultChecked className="sr-only" />
                    n°{c.numero} · {prenomDe(c.nomClient)}
                  </label>
                ))}
              </div>
              <button type="submit" className="bouton w-full sm:w-auto">Marquer « commandées sur Wolt »</button>
            </form>
          </>
        )}
      </section>

      {/* 3. Le soir : la tournée */}
      <section className="space-y-3" aria-labelledby="t-tournee">
        <h2 id="t-tournee" className="text-lg font-extrabold">3. Ma tournée</h2>
        {aLivrer.length === 0 && <p className="carte p-5 text-sm text-slate-600">Aucune livraison prévue pour ce jour.</p>}
        {creneaux.map((creneau) => (
          <div key={creneau} className="space-y-2">
            <h3 className="font-bold">
              {creneau}
              <span className="ml-2 text-sm font-normal text-slate-500">
                {commandes.filter((c) => c.creneau === creneau).length} commande{commandes.filter((c) => c.creneau === creneau).length > 1 ? "s" : ""}
                {reglages.commandesParCreneau > 0 && ` sur ${reglages.commandesParCreneau}`}
              </span>
            </h3>
            <ul className="space-y-2">
              {aLivrer
                .filter((c) => c.creneau === creneau)
                .map((c) => {
                  const nbArticles = c.lignes.filter((l) => !l.indisponible).reduce((s, l) => s + l.quantite, 0);
                  const paiement = etatDuPaiement(c);
                  const jArrive = lienWhatsapp(
                    c.telephone,
                    messageJArrive({ prenom: prenomDe(c.nomClient), numero: c.numero, reste: resteAPayer(c), mode: c.paiement, site: NOM_DU_SITE }),
                  );
                  return (
                    <li key={c.id} className="carte space-y-3 p-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/commandes/${c.id}`} className="font-extrabold hover:underline">n°{c.numero}</Link>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${COULEUR_STATUT[c.statut]}`}>{LIBELLE_STATUT[c.statut]}</span>
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${COULEUR_PAIEMENT[paiement.etat]}`}>{libellePaiement(paiement)}</span>
                        {c.express && <span className="rounded-full bg-soleil px-2.5 py-0.5 text-xs font-bold text-slate-900">Express</span>}
                        <span className="ml-auto text-lg font-extrabold tabular-nums">{formatPrix(c.total)}</span>
                      </div>
                      <div className="text-sm">
                        <p className="font-semibold">{c.nomClient} · {c.ville}</p>
                        <p className="whitespace-pre-line text-slate-700">{c.adresse}</p>
                        <p className="text-slate-500">
                          {nbArticles} article{nbArticles > 1 ? "s" : ""}
                          {c.paiement && <> · paiement <strong className="text-slate-700">{c.paiement}</strong></>}
                          {estRemplacement(c.remplacement) && c.remplacement !== "CONTACTER" && <> · {REMPLACEMENTS[c.remplacement].court.toLowerCase()}</>}
                        </p>
                        {c.notes && <p className="mt-1 rounded-lg bg-amber-50 p-2 text-amber-900">{c.notes}</p>}
                        {c.demandeLibre && <p className="mt-1 whitespace-pre-line rounded-lg bg-amber-50 p-2 text-amber-900">Demande hors catalogue : {c.demandeLibre}</p>}
                      </div>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                        <a href={lienWaze(c.adresse, c.ville)} target="_blank" rel="noopener noreferrer" className="bouton-secondaire py-2 text-sm">Waze</a>
                        {jArrive && (
                          <a href={jArrive} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp py-2 text-sm">
                            <IconeWhatsapp className="h-4 w-4" /> J&apos;arrive
                          </a>
                        )}
                        {c.statut !== "EN_LIVRAISON" && (
                          <form action={changerStatut}>
                            <input type="hidden" name="id" value={c.id} />
                            <input type="hidden" name="statut" value="EN_LIVRAISON" />
                            <button type="submit" className="bouton-secondaire w-full py-2 text-sm">En route</button>
                          </form>
                        )}
                        <form action={changerStatut}>
                          <input type="hidden" name="id" value={c.id} />
                          <input type="hidden" name="statut" value="LIVREE" />
                          <button type="submit" className="bouton w-full py-2 text-sm" aria-label={`Commande n°${c.numero} livrée`}>Livrée</button>
                        </form>
                      </div>
                      <p className="text-xs text-slate-500 break-all">Téléphone : {c.telephone}</p>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </section>

      {livrees.length > 0 && (
        <details className="carte p-5">
          <summary className="cursor-pointer font-bold">Déjà livrées ({livrees.length}) · {formatPrix(livrees.reduce((s, c) => s + c.total, 0))}</summary>
          <ul className="mt-3 space-y-1 text-sm">
            {livrees.map((c) => (
              <li key={c.id}>
                <Link href={`/admin/commandes/${c.id}`} className="hover:underline">n°{c.numero} · {c.nomClient} · {c.ville}</Link> — {formatPrix(c.total)}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
