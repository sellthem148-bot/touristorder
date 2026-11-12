import { Receipt } from "lucide-react";
import Link from "next/link";
import { exigerClient } from "@/lib/client";
import { prisma } from "@/lib/prisma";
import { produitsParIds } from "@/lib/catalogue";
import { lireReglages, villesActives } from "@/lib/reglages";
import { produitsPreferes, resumeDuClient } from "@/lib/espace-client";
import { formatPrix } from "@/lib/argent";
import type { Metadata } from "next";
import { dateLongue, libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, ETAPES, STATUTS_EN_COURS } from "@/lib/statuts";
import { compter, remplir } from "@/lib/langues";
import { libelleDuMode } from "@/lib/i18n/rayons";
import { adresseComplete } from "@/lib/adresse";
import { traduction } from "@/lib/traduction";
import { libelleOptions, nomArticle, nomTarif, nomVille } from "@/lib/i18n/catalogue";
import { ChoixLangue } from "@/components/ChoixLangue";
import { prenomDe } from "@/lib/messages-client";
import { RailProduits } from "@/components/CarteProduit";
import { RecapMontants } from "@/components/RecapMontants";
import { BoutonRecommander } from "./BoutonRecommander";
import { FormulaireProfil } from "./FormulaireProfil";
import { seDeconnecterClient, supprimerMonEspace } from "./actions";

export const dynamic = "force-dynamic";
export async function generateMetadata(): Promise<Metadata> {
  const { t } = await traduction();
  return { title: t.compte.metaTitre, robots: { index: false } };
}

export default async function EspaceClient({ searchParams }: PageProps<"/compte">) {
  const client = await exigerClient();
  const params = await searchParams;
  const { langue, t, lien } = await traduction();
  const c0 = t.compte;
  const prix = (agorot: number) => formatPrix(agorot, langue);
  const jour = (valeur: string) => libelleDuJour(valeur, undefined, langue);

  // Ses commandes : uniquement ce que le client a le droit de voir (ni prix d'achat, ni boutique).
  const [commandes, reglages, villes] = await Promise.all([
    prisma.commande.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, numero: true, jeton: true, statut: true, ville: true, adresse: true, etage: true, appartement: true, codeEntree: true, dateLivraison: true, creneau: true,
        express: true, paiement: true, tarifNom: true, majorationPct: true, createdAt: true,
        sousTotal: true, majoration: true, fraisService: true, fraisLivraison: true, pourboire: true, total: true,
        lignes: { orderBy: { nom: "asc" }, select: { id: true, produitId: true, nom: true, options: true, quantite: true, prixUnitaire: true, indisponible: true } },
      },
    }),
    lireReglages(),
    villesActives(),
  ]);
  const resume = resumeDuClient(commandes);
  const enCours = commandes.filter((c) => STATUTS_EN_COURS.includes(c.statut));
  const preferes = await produitsParIds(produitsPreferes(commandes), langue);

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <div>
          <p className="surtitre">{c0.surtitre}</p>
          <h1 className="mt-1 text-2xl font-bold sm:text-4xl">{prenomDe(client.nom) ? remplir(c0.bonjour, { prenom: prenomDe(client.nom) }) : c0.bienvenue}</h1>
          <p className="mt-1 text-sm text-slate-500"><bdi dir="ltr">{client.email}</bdi> · {remplir(c0.clientDepuis, { date: dateLongue(client.createdAt, langue) })}</p>
        </div>
        <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-4">
          {[
            { libelle: c0.statCommandes, valeur: String(resume.commandes) },
            { libelle: c0.statEnCours, valeur: String(resume.enCours) },
            { libelle: c0.statArticles, valeur: String(resume.articles) },
            { libelle: c0.statDepense, valeur: prix(resume.depense) },
          ].map((x) => (
            <div key={x.libelle} className="flex flex-col-reverse bg-white p-4">
              <dt className="text-[13px] text-slate-500">{x.libelle}</dt>
              <dd className="text-xl font-bold tabular-nums sm:text-2xl">{x.valeur}</dd>
            </div>
          ))}
        </dl>
      </section>

      {enCours.length > 0 && (
        <section aria-labelledby="t-encours" className="space-y-3">
          <h2 id="t-encours" className="text-xl font-extrabold">{c0.enCours}</h2>
          {enCours.map((c) => {
            const etape = ETAPES.indexOf(c.statut);
            return (
              <article key={c.id} className="carte space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">{remplir(c0.ligneCommande, { numero: c.numero, jour: jour(c.dateLivraison), creneau: c.creneau })}</p>
                    <p className="font-semibold leading-snug">{t.statuts.explication[c.statut]}</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums">{prix(c.total)}</span>
                </div>
                <ol className="grid grid-cols-4 gap-2" aria-label={t.suivi.avancement}>
                  {ETAPES.map((e, i) => (
                    <li key={e} className="space-y-1 text-center text-xs" aria-current={i === etape ? "step" : undefined}>
                      <div className={`h-1.5 rounded-full ${i <= etape ? "bg-encre" : "bg-slate-200"}`} />
                      <span className={i <= etape ? "font-bold text-slate-900" : "text-slate-500"}>{t.statuts.libelle[e]}</span>
                    </li>
                  ))}
                </ol>
                <Link href={lien(`/suivi/${c.jeton}`)} className="bouton-secondaire w-full py-2.5 text-sm sm:w-auto">{c0.suivre}</Link>
              </article>
            );
          })}
        </section>
      )}

      {preferes.length > 0 && (
        <section aria-labelledby="t-preferes" className="space-y-3">
          <h2 id="t-preferes" className="text-xl font-extrabold">{c0.preferes}</h2>
          <RailProduits produits={preferes} />
        </section>
      )}

      <section aria-labelledby="t-historique" className="space-y-3">
        <h2 id="t-historique" className="text-xl font-extrabold">{c0.historique}</h2>
        {commandes.length === 0 ? (
          <div className="carte space-y-3 p-8 text-center">
            <Receipt className="mx-auto h-9 w-9 text-slate-400" strokeWidth={1.4} aria-hidden="true" />
            <p className="font-bold">{c0.aucune}</p>
            <Link href={lien("/")} className="bouton">{t.commun.voirCatalogue}</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {commandes.map((c) => {
              const nombre = c.lignes.filter((l) => !l.indisponible).reduce((s, l) => s + l.quantite, 0);
              return (
                <li key={c.id}>
                  <details className="carte group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 p-4">
                      <span className="font-extrabold">{remplir(t.commun.numero, { numero: c.numero })}</span>
                      <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${COULEUR_STATUT[c.statut]}`}>{t.statuts.libelle[c.statut]}</span>
                      <span className="text-sm text-slate-600">{dateLongue(c.createdAt, langue)} · {compter(langue, nombre, t.commun.articles)}</span>
                      <span className="ms-auto font-extrabold tabular-nums">{prix(c.total)}</span>
                      <span className="w-full text-sm font-semibold text-encre underline decoration-slate-300 underline-offset-4 group-open:hidden">{c0.voirDetail}</span>
                    </summary>
                    <div className="space-y-4 border-t border-slate-100 p-4">
                      <p className="text-sm text-slate-600">
                        {remplir(c0.livraison, { jour: jour(c.dateLivraison), creneau: c.creneau, adresse: adresseComplete(c, t.adresse).replace(/\s+/g, " "), ville: nomVille(c.ville, langue) })}
                        {c.paiement && remplir(c0.paiementMode, { mode: libelleDuMode(c.paiement, t) })}
                      </p>
                      <ul className="divide-y divide-slate-100 text-sm">
                        {c.lignes.map((l) => (
                          <li key={l.id} className={`flex justify-between gap-3 py-2 ${l.indisponible ? "text-slate-400" : ""}`}>
                            <span>
                              <span className={l.indisponible ? "line-through" : ""}>{l.quantite} × <bdi>{nomArticle(l.nom, langue)}</bdi></span>
                              {l.options && <span className="block text-xs text-slate-500"><bdi>{libelleOptions(l.options, langue)}</bdi></span>}
                              {l.indisponible && <span className="block text-xs font-semibold text-amber-700">{c0.indispo}</span>}
                            </span>
                            <span className={`shrink-0 font-semibold tabular-nums ${l.indisponible ? "line-through" : ""}`}>{prix(l.prixUnitaire * l.quantite)}</span>
                          </li>
                        ))}
                      </ul>
                      <RecapMontants
                        totaux={c}
                        regroupes={reglages.fraisRegroupes}
                        express={c.express}
                        tarifNom={nomTarif(c.tarifNom, langue)}
                        majorationPct={c.majorationPct}
                        ville={nomVille(c.ville, langue)}
                        langue={langue}
                        libelles={t.montants}
                        libelleTotal={t.montants.total}
                      />
                      <div className="flex flex-wrap items-start gap-2">
                        <BoutonRecommander commandeId={c.id} />
                        <Link href={lien(`/suivi/${c.jeton}`)} className="bouton-secondaire py-2 text-sm">{c0.voirSuivi}</Link>
                      </div>
                    </div>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section aria-labelledby="t-infos" className="carte space-y-4 p-5">
        <div>
          <h2 id="t-infos" className="text-xl font-extrabold">{c0.infosTitre}</h2>
          {/* L'adresse e-mail reste écrite de gauche à droite, d'un seul tenant, au milieu d'une phrase en hébreu. */}
          <p className="text-sm text-slate-600">{c0.infosAide.split("{email}")[0]}<bdi dir="ltr" className="break-all">{client.email}</bdi>{c0.infosAide.split("{email}")[1] ?? ""}</p>
        </div>
        <FormulaireProfil
          client={{ nom: client.nom, telephone: client.telephone, ville: client.ville, adresse: client.adresse, etage: client.etage, appartement: client.appartement, codeEntree: client.codeEntree }}
          villes={villes.map((v) => ({ nom: v.nom, affiche: nomVille(v.nom, langue) }))}
        />
      </section>

      {/* La langue du site et des e-mails : le choix s'applique tout de suite et reste attaché à l'espace client. */}
      <section aria-labelledby="t-langue" className="carte space-y-3 p-5">
        <div>
          <h2 id="t-langue" className="text-xl font-extrabold">{t.langue.titre}</h2>
          <p className="text-sm text-slate-600">{t.langue.aide}</p>
        </div>
        <ChoixLangue id="langue-compte" sansEtiquette />
      </section>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <form action={seDeconnecterClient}>
          <button type="submit" className="bouton-secondaire">{c0.deconnexion}</button>
        </form>
        <details id="supprimer" className="max-w-md text-sm" open={params.erreur === "confirmation"}>
          <summary className="cursor-pointer text-slate-500 hover:underline">{c0.supprimer}</summary>
          <form action={supprimerMonEspace} className="mt-3 space-y-2 rounded-2xl border border-red-200 bg-white p-4">
            <p>{c0.supprimerTexte}</p>
            <label htmlFor="confirmation" className="etiquette">{remplir(c0.supprimerLabel, { mot: c0.motSupprimer })}</label>
            <input id="confirmation" name="confirmation" autoComplete="off" className={`champ ${params.erreur === "confirmation" ? "champ-erreur" : ""}`} />
            {params.erreur === "confirmation" && <p role="alert" className="text-sm font-medium text-red-700">{remplir(c0.supprimerErreur, { mot: c0.motSupprimer })}</p>}
            <button type="submit" className="bouton-danger py-2 text-sm">{c0.supprimerBouton}</button>
          </form>
        </details>
      </section>
    </div>
  );
}
