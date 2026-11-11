/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { usePanier } from "@/components/panier/PanierProvider";
import { Minus, Plus, ShoppingCart, Trash2, Zap } from "lucide-react";
import { calculerTotaux } from "@/lib/calcul";
import { NOM_TARIF_DE_BASE, tarifDeLaLivraison } from "@/lib/tarifs";
import { RecapMontants } from "@/components/RecapMontants";
import { fraisDeLivraison, minimumPour } from "@/lib/villes";
import { formatPrix, formatPrixCourt } from "@/lib/argent";
import { REMPLACEMENTS, type Remplacement } from "@/lib/choix-commande";
import type { ReglagesPublics } from "@/lib/reglages";
import type { JourDeLivraison } from "@/lib/creneaux";
import { actualiserPanier, passerCommande, type EtatCommande } from "../actions";

type Props = {
  reglages: ReglagesPublics;
  jours: JourDeLivraison[];
  limitePassee: boolean; // l'heure limite pour être livré ce soir est passée
  client: { email: string; nom: string; telephone: string; ville: string; adresse: string } | null; // connecté à son espace
};

type Valeurs = {
  nomClient: string;
  telephone: string;
  email: string;
  ville: string;
  adresse: string;
  dateLivraison: string;
  creneau: string;
  notes: string;
  express: boolean;
  remplacement: Remplacement;
  paiement: string;
  pourboire: number;
};

function Section({ titre, numero, children }: { titre: string; numero: number; children: React.ReactNode }) {
  return (
    <section className="carte space-y-4 p-5" aria-labelledby={`section-${numero}`}>
      <h2 id={`section-${numero}`} className="flex items-center gap-3 text-lg font-bold">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold tabular-nums text-slate-700">{numero}</span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

export function PageDuPanier({ reglages, jours, limitePassee, client }: Props) {
  const panier = usePanier();
  const [etat, envoyer, enCours] = useActionState<EtatCommande, FormData>(passerCommande, {});
  const [v, setV] = useState<Valeurs>({
    // Un client connecté retrouve ses coordonnées (s'il habite toujours une ville livrée).
    nomClient: client?.nom ?? "",
    telephone: client?.telephone ?? "",
    email: client?.email ?? "",
    ville: client && reglages.villes.some((x) => x.nom === client.ville) ? client.ville : reglages.villes.length === 1 ? reglages.villes[0].nom : "",
    adresse: client?.adresse ?? "",
    dateLivraison: jours[0]?.valeur ?? "",
    creneau: jours[0]?.creneaux[0] ?? "",
    notes: "",
    express: false,
    remplacement: "CONTACTER",
    paiement: reglages.paiements[0] ?? "",
    pourboire: 0,
  });
  const [avis, setAvis] = useState("");
  const dejaSynchronise = useRef(false);

  // Un champ corrigé après un refus ne garde pas son message d'erreur.
  const [corriges, setCorriges] = useState<{ pour: EtatCommande; champs: string[] }>({ pour: etat, champs: [] });
  const erreur = (nom: string) =>
    corriges.pour === etat && corriges.champs.includes(nom) ? undefined : etat.champs?.[nom];
  function changer<K extends keyof Valeurs>(nom: K, valeur: Valeurs[K]) {
    setV((x) => ({ ...x, [nom]: valeur }));
    setCorriges((c) => ({ pour: etat, champs: [...(c.pour === etat ? c.champs : []), nom] }));
  }

  // À l'ouverture du panier (et si le serveur dit qu'il est périmé) :
  // prix et options actuels, et on retire ce qui n'existe plus.
  const { pret, articles, synchroniser } = panier;
  useEffect(() => {
    if (!pret || (dejaSynchronise.current && !etat.panierPerime)) return;
    dejaSynchronise.current = true;
    if (articles.length === 0) return;
    let annule = false;
    actualiserPanier(articles.map((a) => a.produitId))
      .then((actuels) => {
        if (annule) return;
        const retires = synchroniser(actuels);
        if (retires > 0) {
          setAvis(
            retires > 1
              ? `${retires} articles n'étaient plus disponibles (ou leurs options ont changé) et ont été retirés.`
              : "Un article n'était plus disponible (ou ses options ont changé) et a été retiré.",
          );
        }
      })
      .catch(() => {
        // Pas de réseau : le serveur revérifiera tout à la commande.
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une fois au chargement, puis sur panier périmé
  }, [pret, etat]);

  const creneauxDuJour = jours.find((j) => j.valeur === v.dateLivraison)?.creneaux ?? [];

  // Le tarif du moment choisi (journée, nuit, week-end…) : recalculé à chaque changement de jour ou de créneau.
  const tarif = tarifDeLaLivraison(v.dateLivraison, v.creneau, reglages.plages, reglages);
  const expressPossible = tarif.fraisExpress > 0;
  const express = v.express && expressPossible;
  // La ville choisie ajoute son supplément de livraison (et peut avoir son minimum).
  const ville = reglages.villes.find((x) => x.nom === v.ville);
  const livraison = fraisDeLivraison(tarif, ville, false);
  const minimum = minimumPour(ville, reglages.minimumCommande);
  const totaux = calculerTotaux(
    panier.articles.map((a) => ({ prixUnitaire: a.prix, quantite: a.quantite })),
    {
      fraisService: tarif.fraisService,
      fraisLivraison: fraisDeLivraison(tarif, ville, express),
      pourboire: v.pourboire,
      majorationPct: tarif.majorationPct,
    },
  );
  const sousLeMinimum = totaux.sousTotal < minimum;

  const texte = (nom: "nomClient" | "telephone" | "email" | "adresse" | "notes") => ({
    id: nom,
    name: nom,
    value: v[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => changer(nom, e.target.value),
    "aria-invalid": erreur(nom) ? true : undefined,
    "aria-describedby": erreur(nom) ? `${nom}-erreur` : undefined,
    className: `champ ${erreur(nom) ? "champ-erreur" : ""}`,
  });
  const messageErreur = (nom: string) =>
    erreur(nom) ? <p id={`${nom}-erreur`} className="mt-1.5 text-sm font-medium text-red-700">{erreur(nom)}</p> : null;

  if (!panier.pret) {
    return <p className="py-16 text-center text-slate-500">Chargement du panier…</p>;
  }

  if (panier.articles.length === 0) {
    return (
      <div className="carte mx-auto max-w-md space-y-4 p-10 text-center">
        <ShoppingCart className="mx-auto h-9 w-9 text-slate-400" strokeWidth={1.4} aria-hidden="true" />
        <h1 className="text-xl font-bold">Ton panier est vide</h1>
        {avis && <p className="text-sm text-amber-800">{avis}</p>}
        <Link href="/" className="bouton">Voir le catalogue</Link>
      </div>
    );
  }

  return (
    <form action={envoyer} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
        <h1 className="text-2xl font-bold sm:text-3xl">Finaliser ma commande</h1>
        {avis && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{avis}</p>}

        <Section titre="Ton panier" numero={1}>
          <ul className="divide-y divide-slate-100">
            {panier.articles.map((a) => (
              <li key={a.cle} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {a.photoUrl && <img src={a.photoUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug">{a.nom}</p>
                  {a.optionsLibelle && <p className="truncate text-xs text-slate-500">{a.optionsLibelle}</p>}
                  <p className="text-sm tabular-nums text-slate-600">{formatPrix(a.prix * a.quantite)}</p>
                </div>
                <div className="flex shrink-0 items-center rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => panier.changerQuantite(a.cle, a.quantite - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                    aria-label={a.quantite === 1 ? `Retirer ${a.nom}` : `Un ${a.nom} de moins`}
                  >
                    {a.quantite === 1 ? <Trash2 className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> : <Minus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                  </button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{a.quantite}</span>
                  <button
                    type="button"
                    onClick={() => panier.changerQuantite(a.cle, a.quantite + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                    aria-label={`Un ${a.nom} de plus`}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre"><Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Ajouter d&apos;autres articles</Link>
        </Section>

        <Section titre="Livraison" numero={2}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nomClient" className="etiquette">Ton nom</label>
              <input {...texte("nomClient")} autoComplete="name" required />
              {messageErreur("nomClient")}
            </div>
            <div>
              <label htmlFor="telephone" className="etiquette">Ton numéro WhatsApp</label>
              <input {...texte("telephone")} type="tel" autoComplete="tel" placeholder="+33 6 12 34 56 78" required />
              {messageErreur("telephone")}
            </div>
          </div>
          <div>
            <label htmlFor="email" className="etiquette">Ton adresse e-mail</label>
            <input {...texte("email")} type="email" autoComplete="email" inputMode="email" placeholder="prenom@exemple.fr" required readOnly={!!client} />
            {messageErreur("email")}
            <p className="mt-1 text-xs text-slate-500">
              {client ? "Tu es connecté à ton espace client : la commande y sera ajoutée." : "Pour recevoir la confirmation et retrouver tes commandes dans ton espace client."}
            </p>
          </div>
          <div>
            <label htmlFor="ville" className="etiquette">Ville</label>
            <select
              id="ville"
              name="ville"
              value={v.ville}
              onChange={(e) => changer("ville", e.target.value)}
              aria-invalid={erreur("ville") ? true : undefined}
              aria-describedby={erreur("ville") ? "ville-erreur" : undefined}
              className={`champ ${erreur("ville") ? "champ-erreur" : ""}`}
            >
              <option value="">Choisir…</option>
              {reglages.villes.map((x) => (
                <option key={x.nom} value={x.nom}>
                  {x.nom}
                  {x.supplementLivraison > 0 ? ` (livraison +${formatPrixCourt(x.supplementLivraison)})` : ""}
                </option>
              ))}
            </select>
            {messageErreur("ville")}
          </div>
          <div>
            <label htmlFor="adresse" className="etiquette">Adresse ou hôtel (avec n° de chambre)</label>
            <textarea {...texte("adresse")} rows={2} autoComplete="street-address" placeholder="Hôtel Dan, chambre 512" required />
            {messageErreur("adresse")}
          </div>

          <fieldset>
            <legend className="etiquette">Jour</legend>
            <div className="rail">
              {jours.map((j) => (
                <label key={j.valeur} className="pastille shrink-0 snap-start">
                  <input
                    type="radio"
                    name="dateLivraison"
                    value={j.valeur}
                    checked={v.dateLivraison === j.valeur}
                    onChange={() => {
                      changer("dateLivraison", j.valeur);
                      // Le créneau choisi n'existe peut-être pas ce jour-là (soir même déjà entamé).
                      if (!j.creneaux.includes(v.creneau)) changer("creneau", j.creneaux[0] ?? "");
                    }}
                    className="sr-only"
                  />
                  {j.libelle}
                </label>
              ))}
            </div>
            {limitePassee && (
              <p className="mt-2 text-sm text-slate-600">
                Les commandes pour ce soir sont closes depuis {reglages.heureLimite.replace(":", "h")} : prochaine livraison {jours[0]?.libelle.toLowerCase() ?? "bientôt"}.
              </p>
            )}
            {messageErreur("dateLivraison")}
          </fieldset>

          <fieldset>
            <legend className="etiquette">Créneau</legend>
            <div className="flex flex-wrap gap-2">
              {creneauxDuJour.map((c) => (
                <label key={c} className="pastille">
                  <input type="radio" name="creneau" value={c} checked={v.creneau === c} onChange={() => changer("creneau", c)} className="sr-only" />
                  {c}
                </label>
              ))}
            </div>
            {messageErreur("creneau")}
          </fieldset>

          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" aria-live="polite">
            <strong>{tarif.nom === NOM_TARIF_DE_BASE ? "Tarif normal" : `Tarif ${tarif.nom.toLowerCase()}`}</strong>
            {" · "}
            {reglages.fraisRegroupes
              ? `service et livraison ${formatPrixCourt(tarif.fraisService + livraison)}`
              : `service ${formatPrixCourt(tarif.fraisService)}, livraison ${formatPrixCourt(livraison)}`}
            {ville && ville.supplementLivraison > 0 && ` (dont +${formatPrixCourt(ville.supplementLivraison)} pour ${ville.nom})`}
            {tarif.majorationPct > 0 && `, articles +${tarif.majorationPct} %`}
          </p>

          {expressPossible && (
            <fieldset>
              <legend className="etiquette">Rapidité</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-encre has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-encre">
                  <input type="radio" name="express" value="0" checked={!express} onChange={() => changer("express", false)} className="mt-1 accent-encre" />
                  <span>
                    <span className="block font-bold">Standard</span>
                    <span className="text-sm text-slate-600">Dans le créneau choisi</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-encre has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-encre">
                  <input type="radio" name="express" value="1" checked={express} onChange={() => changer("express", true)} className="mt-1 accent-encre" />
                  <span>
                    <span className="flex items-center gap-1.5 font-bold"><Zap className="h-4 w-4 text-slate-600" strokeWidth={1.8} aria-hidden="true" /> Express · +{formatPrixCourt(tarif.fraisExpress)}</span>
                    <span className="text-sm text-slate-600">Ta commande passe en priorité</span>
                  </span>
                </label>
              </div>
            </fieldset>
          )}
        </Section>

        <Section titre="Préférences" numero={3}>
          <fieldset>
            <legend className="etiquette">Si un article manque</legend>
            <div className="grid gap-2">
              {(Object.keys(REMPLACEMENTS) as Remplacement[]).map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 has-[:checked]:border-encre has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-encre">
                  <input type="radio" name="remplacement" value={r} checked={v.remplacement === r} onChange={() => changer("remplacement", r)} className="accent-encre" />
                  <span className="font-medium">{REMPLACEMENTS[r].libelle}</span>
                </label>
              ))}
            </div>
            {messageErreur("remplacement")}
          </fieldset>

          {reglages.paiements.length > 0 && (
            <fieldset>
              <legend className="etiquette">Paiement à la livraison</legend>
              <div className="flex flex-wrap gap-2">
                {reglages.paiements.map((p) => (
                  <label key={p} className="pastille">
                    <input type="radio" name="paiement" value={p} checked={v.paiement === p} onChange={() => changer("paiement", p)} className="sr-only" />
                    {p}
                  </label>
                ))}
              </div>
              {messageErreur("paiement")}
            </fieldset>
          )}

          {reglages.pourboires.some((p) => p > 0) && (
            <fieldset>
              <legend className="etiquette">Pourboire pour le livreur</legend>
              <div className="flex flex-wrap gap-2">
                {[0, ...reglages.pourboires.filter((p) => p > 0)].map((p) => (
                  <label key={p} className="pastille">
                    <input type="radio" name="pourboire" value={p} checked={v.pourboire === p} onChange={() => changer("pourboire", p)} className="sr-only" />
                    {p === 0 ? "Non merci" : formatPrixCourt(p)}
                  </label>
                ))}
              </div>
              {messageErreur("pourboire")}
            </fieldset>
          )}

          <div>
            <label htmlFor="notes" className="etiquette">Note (facultatif)</label>
            <textarea {...texte("notes")} rows={2} placeholder="Marque préférée, un produit introuvable dans le catalogue, code de l'immeuble…" />
            {messageErreur("notes")}
          </div>
        </Section>
      </div>

      <aside className="lg:pt-[3.25rem]">
        <div className="carte space-y-4 p-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">Récapitulatif</h2>
          <RecapMontants
            totaux={totaux}
            regroupes={reglages.fraisRegroupes}
            express={express}
            tarifNom={tarif.nom}
            majorationPct={tarif.majorationPct}
            nombreArticles={panier.nombre}
            ville={ville?.nom}
          />
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-600">
            Tu paies à la livraison. Un article qui manque n&apos;est pas facturé.
          </p>

          {/* Piège à robots : invisible pour les humains. */}
          <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
            <label htmlFor="site">Ne pas remplir</label>
            <input id="site" name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <input
            type="hidden"
            name="lignes"
            value={JSON.stringify(panier.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite, options: a.options })))}
          />
          {!expressPossible && <input type="hidden" name="express" value="0" />}

          {etat.erreur && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-800">{etat.erreur}</p>}
          {sousLeMinimum && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              Minimum de commande{ville && ville.minimumCommande > reglages.minimumCommande ? ` pour ${ville.nom}` : ""} : {formatPrix(minimum)} d&apos;articles.
            </p>
          )}
          {!reglages.ouvert && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Les commandes sont fermées pour le moment. Réessaie un peu plus tard.</p>
          )}
          {jours.length === 0 && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Aucun créneau de livraison disponible pour le moment. Réessaie plus tard.</p>
          )}
          <button type="submit" className="bouton w-full py-4 text-base" disabled={enCours || sousLeMinimum || !reglages.ouvert || jours.length === 0}>
            {enCours ? "Envoi…" : `Commander · ${formatPrix(totaux.total)}`}
          </button>
        </div>
      </aside>
    </form>
  );
}
