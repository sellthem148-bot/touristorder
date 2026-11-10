import Link from "next/link";
import { exigerClient } from "@/lib/client";
import { prisma } from "@/lib/prisma";
import { produitsParIds } from "@/lib/catalogue";
import { lireReglages, villesActives } from "@/lib/reglages";
import { produitsPreferes, resumeDuClient } from "@/lib/espace-client";
import { formatPrix } from "@/lib/argent";
import { libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, ETAPES, EXPLICATION_STATUT, LIBELLE_STATUT, STATUTS_EN_COURS } from "@/lib/statuts";
import { prenomDe } from "@/lib/messages-client";
import { RailProduits } from "@/components/CarteProduit";
import { RecapMontants } from "@/components/RecapMontants";
import { BoutonRecommander } from "./BoutonRecommander";
import { FormulaireProfil } from "./FormulaireProfil";
import { seDeconnecterClient, supprimerMonEspace } from "./actions";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace client", robots: { index: false } };

const dateCourte = new Intl.DateTimeFormat("fr-FR", { timeZone: "Asia/Jerusalem", day: "numeric", month: "long", year: "numeric" });

export default async function EspaceClient({ searchParams }: PageProps<"/compte">) {
  const client = await exigerClient();
  const params = await searchParams;

  // Ses commandes : uniquement ce que le client a le droit de voir (ni prix d'achat, ni boutique).
  const [commandes, reglages, villes] = await Promise.all([
    prisma.commande.findMany({
      where: { clientId: client.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true, numero: true, jeton: true, statut: true, ville: true, adresse: true, dateLivraison: true, creneau: true,
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
  const preferes = await produitsParIds(produitsPreferes(commandes));

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] bg-marque px-6 py-7 text-white sm:px-9 sm:py-9">
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-soleil sm:h-48 sm:w-48" />
        <div className="relative space-y-5">
          <div>
            <p className="text-sm font-semibold text-blue-100">Mon espace client</p>
            <h1 className="text-2xl font-extrabold sm:text-4xl">Bonjour {prenomDe(client.nom) || "et bienvenue"} 👋</h1>
            <p className="mt-1 text-sm text-blue-100">{client.email} · client depuis le {dateCourte.format(client.createdAt)}</p>
          </div>
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { libelle: "Commandes", valeur: String(resume.commandes) },
              { libelle: "En cours", valeur: String(resume.enCours) },
              { libelle: "Articles commandés", valeur: String(resume.articles) },
              { libelle: "Total dépensé", valeur: formatPrix(resume.depense) },
            ].map((t) => (
              <div key={t.libelle} className="flex flex-col-reverse rounded-2xl bg-white/15 p-3">
                <dt className="text-xs font-semibold text-blue-100">{t.libelle}</dt>
                <dd className="text-xl font-extrabold tabular-nums sm:text-2xl">{t.valeur}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {enCours.length > 0 && (
        <section aria-labelledby="t-encours" className="space-y-3">
          <h2 id="t-encours" className="text-xl font-extrabold">En cours</h2>
          {enCours.map((c) => {
            const etape = ETAPES.indexOf(c.statut);
            return (
              <article key={c.id} className="carte space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500">Commande n°{c.numero} · {libelleDuJour(c.dateLivraison)}, {c.creneau}</p>
                    <p className="text-lg font-extrabold">{EXPLICATION_STATUT[c.statut]}</p>
                  </div>
                  <span className="text-lg font-extrabold tabular-nums">{formatPrix(c.total)}</span>
                </div>
                <ol className="grid grid-cols-4 gap-2" aria-label="Avancement">
                  {ETAPES.map((e, i) => (
                    <li key={e} className="space-y-1 text-center text-xs" aria-current={i === etape ? "step" : undefined}>
                      <div className={`h-2 rounded-full ${i <= etape ? "bg-marque" : "bg-slate-200"}`} />
                      <span className={i <= etape ? "font-bold text-slate-900" : "text-slate-500"}>{LIBELLE_STATUT[e]}</span>
                    </li>
                  ))}
                </ol>
                <Link href={`/suivi/${c.jeton}`} className="bouton-secondaire w-full py-2.5 text-sm sm:w-auto">Suivre cette commande</Link>
              </article>
            );
          })}
        </section>
      )}

      {preferes.length > 0 && (
        <section aria-labelledby="t-preferes" className="space-y-3">
          <h2 id="t-preferes" className="text-xl font-extrabold">Tes articles préférés</h2>
          <RailProduits produits={preferes} />
        </section>
      )}

      <section aria-labelledby="t-historique" className="space-y-3">
        <h2 id="t-historique" className="text-xl font-extrabold">Historique d&apos;achat</h2>
        {commandes.length === 0 ? (
          <div className="carte space-y-3 p-8 text-center">
            <p className="text-5xl" aria-hidden="true">🧾</p>
            <p className="font-bold">Pas encore de commande.</p>
            <Link href="/" className="bouton">Voir le catalogue</Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {commandes.map((c) => {
              const nombre = c.lignes.filter((l) => !l.indisponible).reduce((s, l) => s + l.quantite, 0);
              return (
                <li key={c.id}>
                  <details className="carte group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 p-4">
                      <span className="font-extrabold">n°{c.numero}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${COULEUR_STATUT[c.statut]}`}>{LIBELLE_STATUT[c.statut]}</span>
                      <span className="text-sm text-slate-600">{dateCourte.format(c.createdAt)} · {nombre} article{nombre > 1 ? "s" : ""}</span>
                      <span className="ml-auto font-extrabold tabular-nums">{formatPrix(c.total)}</span>
                      <span className="w-full text-sm font-bold text-marque group-open:hidden">Voir le détail</span>
                    </summary>
                    <div className="space-y-4 border-t border-slate-100 p-4">
                      <p className="text-sm text-slate-600">
                        Livraison : {libelleDuJour(c.dateLivraison)}, {c.creneau} · {c.adresse.replace(/\s+/g, " ")}, {c.ville}
                        {c.paiement && <> · paiement {c.paiement}</>}
                      </p>
                      <ul className="divide-y divide-slate-100 text-sm">
                        {c.lignes.map((l) => (
                          <li key={l.id} className={`flex justify-between gap-3 py-2 ${l.indisponible ? "text-slate-400" : ""}`}>
                            <span>
                              <span className={l.indisponible ? "line-through" : ""}>{l.quantite} × {l.nom}</span>
                              {l.options && <span className="block text-xs text-slate-500">{l.options}</span>}
                              {l.indisponible && <span className="block text-xs font-semibold text-amber-700">Indisponible, non facturé</span>}
                            </span>
                            <span className={`shrink-0 font-semibold tabular-nums ${l.indisponible ? "line-through" : ""}`}>{formatPrix(l.prixUnitaire * l.quantite)}</span>
                          </li>
                        ))}
                      </ul>
                      <RecapMontants
                        totaux={c}
                        regroupes={reglages.fraisRegroupes}
                        express={c.express}
                        tarifNom={c.tarifNom}
                        majorationPct={c.majorationPct}
                        ville={c.ville}
                      />
                      <div className="flex flex-wrap items-start gap-2">
                        <BoutonRecommander commandeId={c.id} />
                        <Link href={`/suivi/${c.jeton}`} className="bouton-secondaire py-2 text-sm">Voir le suivi</Link>
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
          <h2 id="t-infos" className="text-xl font-extrabold">Mes informations</h2>
          <p className="text-sm text-slate-600">Elles pré-remplissent ta prochaine commande. Ton adresse e-mail ({client.email}) sert à te connecter.</p>
        </div>
        <FormulaireProfil
          client={{ nom: client.nom, telephone: client.telephone, ville: client.ville, adresse: client.adresse }}
          villes={villes.map((v) => v.nom)}
        />
      </section>

      <section className="flex flex-wrap items-start justify-between gap-4">
        <form action={seDeconnecterClient}>
          <button type="submit" className="bouton-secondaire">Me déconnecter</button>
        </form>
        <details id="supprimer" className="max-w-md text-sm" open={params.erreur === "confirmation"}>
          <summary className="cursor-pointer text-slate-500 hover:underline">Supprimer mon espace client</summary>
          <form action={supprimerMonEspace} className="mt-3 space-y-2 rounded-2xl border border-red-200 bg-white p-4">
            <p>Ton espace et tes informations sont supprimés. Tes commandes passées restent chez nous pour la comptabilité, sans lien avec toi.</p>
            <label htmlFor="confirmation" className="etiquette">Écris « supprimer » pour confirmer</label>
            <input id="confirmation" name="confirmation" autoComplete="off" className={`champ ${params.erreur === "confirmation" ? "champ-erreur" : ""}`} />
            {params.erreur === "confirmation" && <p role="alert" className="text-sm font-medium text-red-700">Écris le mot « supprimer » pour confirmer.</p>}
            <button type="submit" className="bouton-danger py-2 text-sm">Supprimer définitivement</button>
          </form>
        </details>
      </section>
    </div>
  );
}
