/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { usePanier } from "@/components/panier/PanierProvider";
import { useTraduction } from "@/components/LangueProvider";
import { Minus, Plus, ShoppingCart, Trash2, Zap } from "lucide-react";
import { calculerTotaux } from "@/lib/calcul";
import { NOM_TARIF_DE_BASE, tarifDeLaLivraison } from "@/lib/tarifs";
import { RecapMontants } from "@/components/RecapMontants";
import { fraisDeLivraison, minimumPour } from "@/lib/villes";
import { formatPrix, formatPrixCourt } from "@/lib/argent";
import { REMPLACEMENTS, type Remplacement } from "@/lib/choix-commande";
import { estLogement, LOGEMENTS, type Logement } from "@/lib/adresse";
import { compter, heureLisible, jourDansPhrase, remplir } from "@/lib/langues";
import { libelleDuMode } from "@/lib/i18n/rayons";
import type { ReglagesPublics } from "@/lib/reglages";
import type { JourDeLivraison } from "@/lib/creneaux";
import { actualiserPanier, passerCommande, type EtatCommande } from "../actions";

type Coordonnees = { email: string; nom: string; telephone: string; ville: string; logement: string; adresse: string; etage: string; appartement: string; codeEntree: string };

type Props = {
  reglages: ReglagesPublics;
  jours: JourDeLivraison[]; // leur libellé est déjà dans la langue du client
  limitePassee: boolean; // l'heure limite pour être livré ce soir est passée
  client: Coordonnees | null; // connecté à son espace
  /** « Je ne trouve pas mon article » : la page s'ouvre sur la demande libre, pré-remplie (recherche sans résultat). */
  demande: string | null;
  /** Les noms des villes et des tarifs dans la langue du client (clé : le nom saisi par le gérant). */
  affichage: { villes: Record<string, string>; tarifs: Record<string, string> };
};

type Valeurs = {
  nomClient: string;
  telephone: string;
  email: string;
  ville: string;
  logement: Logement | ""; // rien tant que le client n'a pas choisi
  adresse: string;
  etage: string;
  appartement: string;
  codeEntree: string;
  dateLivraison: string;
  creneau: string;
  notes: string;
  demandeLibre: string;
  express: boolean;
  remplacement: Remplacement;
  paiement: string;
  pourboire: number;
};

type ChampTexte = "nomClient" | "telephone" | "email" | "adresse" | "etage" | "appartement" | "codeEntree" | "notes" | "demandeLibre";

// L'ordre des champs à l'écran : après un refus, on amène le client sur le premier à corriger.
const ORDRE_DES_CHAMPS = ["demandeLibre", "nomClient", "telephone", "email", "ville", "logement", "adresse", "etage", "appartement", "codeEntree", "dateLivraison", "creneau", "express", "remplacement", "paiement", "pourboire", "notes"];

function Section({ titre, numero, children }: { titre: string; numero: number; children: React.ReactNode }) {
  return (
    <section className="carte space-y-4 p-5" aria-labelledby={`section-${numero}`}>
      <h2 id={`section-${numero}`} className="flex items-center gap-3 text-lg font-bold">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm font-semibold tabular-nums text-slate-700">{numero}</span>
        {titre}
      </h2>
      {children}
    </section>
  );
}

export function PageDuPanier({ reglages, jours, limitePassee, client, demande, affichage }: Props) {
  const panier = usePanier();
  const { langue, t, lien } = useTraduction();
  const p = t.panier;
  const [etat, envoyer, enCours] = useActionState<EtatCommande, FormData>(passerCommande, {});
  const [v, setV] = useState<Valeurs>({
    // Un client connecté retrouve ses coordonnées (s'il habite toujours une ville livrée).
    nomClient: client?.nom ?? "",
    telephone: client?.telephone ?? "",
    email: client?.email ?? "",
    ville: client && reglages.villes.some((x) => x.nom === client.ville) ? client.ville : reglages.villes.length === 1 ? reglages.villes[0].nom : "",
    logement: estLogement(client?.logement) ? client.logement : "",
    adresse: client?.adresse ?? "",
    etage: client?.etage ?? "",
    appartement: client?.appartement ?? "",
    codeEntree: client?.codeEntree ?? "",
    dateLivraison: jours[0]?.valeur ?? "",
    creneau: jours[0]?.creneaux[0] ?? "",
    notes: "",
    demandeLibre: demande ?? "",
    express: false,
    remplacement: "CONTACTER",
    paiement: reglages.paiements[0] ?? "",
    pourboire: 0,
  });
  const [avis, setAvis] = useState("");
  // Une demande sans article du catalogue : le formulaire s'affiche même avec un panier vide.
  const [demandeSeule, setDemandeSeule] = useState(demande !== null);
  // La langue dans laquelle le panier a été remis à jour (noms et options) ; il l'est de nouveau si elle change.
  const langueSynchronisee = useRef<string | null>(null);
  const nomDeVille = (nom: string) => affichage.villes[nom] ?? nom;
  const nomDeTarif = (nom: string) => affichage.tarifs[nom] ?? nom;

  // Un champ corrigé après un refus ne garde pas son message d'erreur.
  const [corriges, setCorriges] = useState<{ pour: EtatCommande; champs: string[] }>({ pour: etat, champs: [] });
  const erreur = (nom: string) =>
    corriges.pour === etat && corriges.champs.includes(nom) ? undefined : etat.champs?.[nom];
  function changer<K extends keyof Valeurs>(nom: K, valeur: Valeurs[K]) {
    setV((x) => ({ ...x, [nom]: valeur }));
    setCorriges((c) => ({ pour: etat, champs: [...(c.pour === etat ? c.champs : []), nom] }));
  }

  // La commande est refusée tant qu'il manque un renseignement (nom, téléphone, adresse, étage…) :
  // on amène le client sur le premier champ à corriger, souvent hors de l'écran sur téléphone.
  useEffect(() => {
    const champs = etat.champs;
    if (!champs) return;
    const premier = ORDRE_DES_CHAMPS.find((nom) => champs[nom]);
    if (!premier) return;
    const cible = document.getElementById(premier) ?? document.querySelector<HTMLElement>(`[name="${premier}"]`);
    if (!cible) return;
    cible.scrollIntoView({ block: "center", behavior: "smooth" });
    cible.focus({ preventScroll: true });
  }, [etat]);

  // À l'ouverture du panier (et si le serveur dit qu'il est périmé) :
  // prix et options actuels, et on retire ce qui n'existe plus.
  const { pret, articles, synchroniser } = panier;
  useEffect(() => {
    if (!pret || (langueSynchronisee.current === langue && !etat.panierPerime)) return;
    langueSynchronisee.current = langue;
    if (articles.length === 0) return;
    let annule = false;
    actualiserPanier(articles.map((a) => a.produitId))
      .then((actuels) => {
        if (annule) return;
        const retires = synchroniser(actuels);
        if (retires > 0) setAvis(compter(langue, retires, t.panier.retires));
      })
      .catch(() => {
        // Pas de réseau : le serveur revérifiera tout à la commande.
      });
    return () => {
      annule = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- au chargement, sur panier périmé, et quand la langue change
  }, [pret, etat, langue]);

  // Les créneaux du jour choisi, dans l'ordre des réglages ; ceux qui sont complets restent affichés, grisés.
  const jourChoisi = jours.find((j) => j.valeur === v.dateLivraison);
  const creneauxDuJour = jourChoisi ? reglages.creneaux.filter((c) => jourChoisi.creneaux.includes(c) || jourChoisi.complets.includes(c)) : [];
  const complet = (c: string) => jourChoisi?.complets.includes(c) ?? false;

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
  const prix = (agorot: number) => formatPrix(agorot, langue);
  const prixCourt = (agorot: number) => formatPrixCourt(agorot, langue);

  const texte = (nom: ChampTexte) => ({
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
  // Un numéro ou une adresse e-mail s'écrit de gauche à droite, même dans une page en hébreu.
  const latin = { dir: "ltr" as const };

  if (!panier.pret) {
    return <p className="py-16 text-center text-slate-500">{p.chargement}</p>;
  }

  const panierVide = panier.articles.length === 0;
  if (panierVide && !demandeSeule) {
    return (
      <div className="carte mx-auto max-w-md space-y-4 p-10 text-center">
        <ShoppingCart className="mx-auto h-9 w-9 text-slate-400" strokeWidth={1.4} aria-hidden="true" />
        <h1 className="text-xl font-bold">{p.videTitre}</h1>
        {avis && <p className="text-sm text-amber-800">{avis}</p>}
        <Link href={lien("/")} className="bouton">{t.commun.voirCatalogue}</Link>
        <p className="text-sm text-slate-600">
          {t.commun.introuvableQuestion}{" "}
          <button type="button" onClick={() => setDemandeSeule(true)} className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">
            {t.commun.demandezLe}
          </button>
        </p>
      </div>
    );
  }
  const demandeRemplie = v.demandeLibre.trim().length > 0;
  const modes = reglages.paiements.map((m) => libelleDuMode(m, t));

  return (
    <form action={envoyer} noValidate className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="min-w-0 space-y-5">
        <h1 className="text-2xl font-bold sm:text-3xl">{panierVide ? p.titreDemande : p.titreCommande}</h1>
        {avis && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{avis}</p>}

        <Section titre={panierVide ? p.sectionDemande : p.sectionPanier} numero={1}>
          {!panierVide && <ul className="divide-y divide-slate-100">
            {panier.articles.map((a) => (
              <li key={a.cle} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                {a.photoUrl && <img src={a.photoUrl} alt="" loading="lazy" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold leading-snug"><bdi>{a.nom}</bdi></p>
                  {a.optionsLibelle && <p className="truncate text-xs text-slate-500"><bdi>{a.optionsLibelle}</bdi></p>}
                  <p className="text-sm tabular-nums text-slate-600">{prix(a.prix * a.quantite)}</p>
                </div>
                <div className="flex shrink-0 items-center rounded-xl border border-slate-300">
                  <button
                    type="button"
                    onClick={() => panier.changerQuantite(a.cle, a.quantite - 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                    aria-label={remplir(a.quantite === 1 ? p.retirer : p.unDeMoins, { nom: a.nom })}
                  >
                    {a.quantite === 1 ? <Trash2 className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> : <Minus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />}
                  </button>
                  <span className="w-6 text-center text-sm font-bold tabular-nums">{a.quantite}</span>
                  <button
                    type="button"
                    onClick={() => panier.changerQuantite(a.cle, a.quantite + 1)}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100"
                    aria-label={remplir(p.unDePlus, { nom: a.nom })}
                  >
                    <Plus className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>}
          <Link href={lien("/")} className="inline-flex items-center gap-1.5 text-sm font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre"><Plus className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> {panierVide ? t.commun.voirCatalogue : p.ajouterAutres}</Link>
          <div className={panierVide ? "" : "border-t border-slate-100 pt-4"}>
            <label htmlFor="demandeLibre" className="etiquette">{panierVide ? p.demandeLabelSeule : p.demandeLabel}</label>
            <textarea
              {...texte("demandeLibre")}
              rows={panierVide ? 4 : 2}
              maxLength={600}
              placeholder={p.demandePlaceholder}
              required={panierVide}
            />
            {messageErreur("demandeLibre")}
            <p className="mt-1 text-xs text-slate-500">{p.demandeAide}</p>
          </div>
        </Section>

        <Section titre={p.sectionCoordonnees} numero={2}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nomClient" className="etiquette">{p.nom}</label>
              <input {...texte("nomClient")} autoComplete="name" required />
              {messageErreur("nomClient")}
            </div>
            <div>
              <label htmlFor="telephone" className="etiquette">{p.telephone}</label>
              <input {...texte("telephone")} {...latin} type="tel" autoComplete="tel" placeholder={p.telephonePlaceholder} required className={`${texte("telephone").className} rtl:text-right`} />
              {messageErreur("telephone")}
              <p className="mt-1 text-xs text-slate-500">{p.telephoneAide}</p>
            </div>
          </div>
          <div>
            <label htmlFor="email" className="etiquette">{p.email}</label>
            <input {...texte("email")} {...latin} type="email" autoComplete="email" inputMode="email" placeholder={p.emailPlaceholder} required readOnly={!!client} className={`${texte("email").className} rtl:text-right`} />
            {messageErreur("email")}
            <p className="mt-1 text-xs text-slate-500">{client ? p.emailAideConnecte : p.emailAide}</p>
          </div>
        </Section>

        <Section titre={p.sectionAdresse} numero={3}>
          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">{p.adresseObligatoire}</p>
          <div>
            <label htmlFor="ville" className="etiquette">{p.ville}</label>
            <select
              id="ville"
              name="ville"
              value={v.ville}
              onChange={(e) => changer("ville", e.target.value)}
              required
              aria-invalid={erreur("ville") ? true : undefined}
              aria-describedby={erreur("ville") ? "ville-erreur" : undefined}
              className={`champ ${erreur("ville") ? "champ-erreur" : ""}`}
            >
              <option value="">{p.choisir}</option>
              {reglages.villes.map((x) => (
                <option key={x.nom} value={x.nom}>
                  {x.supplementLivraison > 0 ? remplir(p.villeSupplement, { ville: nomDeVille(x.nom), prix: prixCourt(x.supplementLivraison) }) : nomDeVille(x.nom)}
                </option>
              ))}
            </select>
            {messageErreur("ville")}
          </div>
          <fieldset>
            <legend className="etiquette">{p.logement}</legend>
            <div className="flex flex-wrap gap-2">
              {LOGEMENTS.map((x) => (
                <label key={x} className="pastille">
                  <input type="radio" name="logement" value={x} checked={v.logement === x} onChange={() => changer("logement", x)} className="sr-only" />
                  {p.logements[x]}
                </label>
              ))}
            </div>
            {/* Rien de choisi : le serveur le demande (un champ absent vaudrait « appartement »). */}
            {v.logement === "" && <input type="hidden" name="logement" value="" />}
            {messageErreur("logement")}
          </fieldset>
          {v.logement === "HOTEL" && (
            <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950" role="note">{p.hotelAvis}</p>
          )}
          {v.logement !== "" && (
            <div>
              <label htmlFor="adresse" className="etiquette">{v.logement === "HOTEL" ? p.hotelNom : p.adresse}</label>
              <input {...texte("adresse")} autoComplete={v.logement === "HOTEL" ? "organization" : "address-line1"} maxLength={200} placeholder={v.logement === "HOTEL" ? p.hotelNomPlaceholder : p.adressePlaceholder} required />
              {messageErreur("adresse")}
            </div>
          )}
          {v.logement === "APPARTEMENT" && (
            <>
              <div className="grid grid-cols-2 items-end gap-4">
                <div>
                  <label htmlFor="etage" className="etiquette">{p.etage}</label>
                  <input {...texte("etage")} autoComplete="off" maxLength={20} placeholder={p.etagePlaceholder} required />
                </div>
                <div>
                  <label htmlFor="appartement" className="etiquette">{p.appartement}</label>
                  <input {...texte("appartement")} autoComplete="address-line2" maxLength={20} placeholder={p.appartementPlaceholder} required />
                </div>
              </div>
              {messageErreur("etage")}
              {messageErreur("appartement")}
              <p className="-mt-2 text-xs text-slate-500">{p.etageAide}</p>
            </>
          )}
          {v.logement === "HOTEL" && (
            <div>
              <label htmlFor="appartement" className="etiquette">{p.chambre}</label>
              <input {...texte("appartement")} autoComplete="off" maxLength={20} placeholder={p.appartementPlaceholder} />
              {messageErreur("appartement")}
            </div>
          )}
          {(v.logement === "APPARTEMENT" || v.logement === "MAISON") && (
            <div>
              <label htmlFor="codeEntree" className="etiquette">{p.codeEntree}</label>
              <input {...texte("codeEntree")} autoComplete="off" maxLength={40} placeholder={p.codeEntreePlaceholder} />
              {messageErreur("codeEntree")}
            </div>
          )}
        </Section>

        <Section titre={p.sectionMoment} numero={4}>
          <fieldset>
            <legend className="etiquette">{p.jour}</legend>
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
                {remplir(p.closes, { heure: heureLisible(reglages.heureLimite, langue), jour: jours[0] ? jourDansPhrase(jours[0].libelle, langue) : p.bientot })}
              </p>
            )}
            {messageErreur("dateLivraison")}
          </fieldset>

          <fieldset>
            <legend className="etiquette">{p.creneau}</legend>
            <div className="flex flex-wrap gap-2">
              {creneauxDuJour.map((c) => (
                <label key={c} className={`pastille ${complet(c) ? "cursor-not-allowed opacity-50" : ""}`}>
                  <input type="radio" name="creneau" value={c} checked={v.creneau === c} disabled={complet(c)} onChange={() => changer("creneau", c)} className="sr-only" />
                  {c}
                  {complet(c) && <span className="ms-1.5 text-xs font-semibold">· {p.complet}</span>}
                </label>
              ))}
            </div>
            {messageErreur("creneau")}
          </fieldset>

          <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700" aria-live="polite">
            <strong>{tarif.nom === NOM_TARIF_DE_BASE ? p.tarifNormal : remplir(p.tarifNom, { nom: nomDeTarif(tarif.nom).toLowerCase() })}</strong>
            {" · "}
            {reglages.fraisRegroupes
              ? remplir(p.serviceEtLivraison, { prix: prixCourt(tarif.fraisService + livraison) })
              : remplir(p.serviceLivraisonDetail, { service: prixCourt(tarif.fraisService), livraison: prixCourt(livraison) })}
            {ville && ville.supplementLivraison > 0 && remplir(p.dontVille, { prix: prixCourt(ville.supplementLivraison), ville: nomDeVille(ville.nom) })}
            {tarif.majorationPct > 0 && remplir(p.articlesPlus, { pct: tarif.majorationPct })}
          </p>

          {expressPossible && (
            <fieldset>
              <legend className="etiquette">{p.rapidite}</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-encre has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-encre">
                  <input type="radio" name="express" value="0" checked={!express} onChange={() => changer("express", false)} className="mt-1 accent-encre" />
                  <span>
                    <span className="block font-bold">{p.standard}</span>
                    <span className="text-sm text-slate-600">{p.standardAide}</span>
                  </span>
                </label>
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-300 p-4 has-[:checked]:border-encre has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-encre">
                  <input type="radio" name="express" value="1" checked={express} onChange={() => changer("express", true)} className="mt-1 accent-encre" />
                  <span>
                    <span className="flex items-center gap-1.5 font-bold"><Zap className="h-4 w-4 text-slate-600" strokeWidth={1.8} aria-hidden="true" /> {p.express} · <span dir="ltr">+{prixCourt(tarif.fraisExpress)}</span></span>
                    <span className="text-sm text-slate-600">{p.expressAide}</span>
                  </span>
                </label>
              </div>
            </fieldset>
          )}
        </Section>

        <Section titre={p.sectionPreferences} numero={5}>
          {reglages.paiements.length > 0 && (
            <fieldset>
              <legend className="etiquette">{p.modePaiement}</legend>
              <div className="flex flex-wrap gap-2">
                {reglages.paiements.map((m) => (
                  <label key={m} className="pastille">
                    <input type="radio" name="paiement" value={m} checked={v.paiement === m} onChange={() => changer("paiement", m)} className="sr-only" />
                    {libelleDuMode(m, t)}
                  </label>
                ))}
              </div>
              {messageErreur("paiement")}
              <p className="mt-2 text-xs text-slate-500">{p.paiementAide}</p>
            </fieldset>
          )}

          <fieldset>
            <legend className="etiquette">{p.siManque}</legend>
            <div className="grid gap-2">
              {(Object.keys(REMPLACEMENTS) as Remplacement[]).map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-300 px-4 py-3 has-[:checked]:border-encre has-[:checked]:bg-slate-50 has-[:checked]:ring-1 has-[:checked]:ring-encre">
                  <input type="radio" name="remplacement" value={r} checked={v.remplacement === r} onChange={() => changer("remplacement", r)} className="accent-encre" />
                  <span className="font-medium">{p.remplacements[r]}</span>
                </label>
              ))}
            </div>
            {messageErreur("remplacement")}
          </fieldset>

          {reglages.pourboires.some((x) => x > 0) && (
            <fieldset>
              <legend className="etiquette">{p.pourboire}</legend>
              <div className="flex flex-wrap gap-2">
                {[0, ...reglages.pourboires.filter((x) => x > 0)].map((x) => (
                  <label key={x} className="pastille">
                    <input type="radio" name="pourboire" value={x} checked={v.pourboire === x} onChange={() => changer("pourboire", x)} className="sr-only" />
                    {x === 0 ? p.nonMerci : prixCourt(x)}
                  </label>
                ))}
              </div>
              {messageErreur("pourboire")}
            </fieldset>
          )}

          <div>
            <label htmlFor="notes" className="etiquette">{p.note}</label>
            <textarea {...texte("notes")} rows={2} placeholder={p.notePlaceholder} />
            {messageErreur("notes")}
          </div>
        </Section>
      </div>

      <aside className="lg:pt-[3.25rem]">
        <div className="carte space-y-4 p-5 lg:sticky lg:top-20">
          <h2 className="text-lg font-bold">{panierVide ? p.sectionDemande : p.recap}</h2>
          {!panierVide && (
            <RecapMontants
              totaux={totaux}
              regroupes={reglages.fraisRegroupes}
              express={express}
              tarifNom={nomDeTarif(tarif.nom)}
              majorationPct={tarif.majorationPct}
              nombreArticles={panier.nombre}
              ville={ville ? nomDeVille(ville.nom) : undefined}
              langue={langue}
              libelles={t.montants}
              libelleTotal={t.montants.total}
            />
          )}
          <p className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[13px] text-slate-600">
            {panierVide ? p.rienARegler : remplir(p.paiementCommande, { modes: modes.length > 0 ? ` (${modes.join(", ")})` : "" })}
          </p>

          {/* Piège à robots : invisible pour les humains. (« start » : hors de l'écran sans élargir une page en hébreu.) */}
          <div aria-hidden="true" className="absolute -start-[9999px] h-0 overflow-hidden">
            <label htmlFor="site">{p.nePasRemplir}</label>
            <input id="site" name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
          </div>
          <input
            type="hidden"
            name="lignes"
            value={JSON.stringify(panier.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite, options: a.options })))}
          />
          {!expressPossible && <input type="hidden" name="express" value="0" />}

          {etat.erreur && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-medium text-red-800">{etat.erreur}</p>}
          {!panierVide && sousLeMinimum && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
              {ville && ville.minimumCommande > reglages.minimumCommande
                ? remplir(p.minimumVille, { ville: nomDeVille(ville.nom), prix: prix(minimum) })
                : remplir(p.minimum, { prix: prix(minimum) })}
            </p>
          )}
          {!reglages.ouvert && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{p.ferme}</p>
          )}
          {jours.length === 0 && (
            <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{p.aucunCreneau}</p>
          )}
          <button
            type="submit"
            className="bouton w-full py-4 text-base"
            disabled={enCours || (!panierVide && sousLeMinimum) || (panierVide && !demandeRemplie) || !reglages.ouvert || jours.length === 0}
          >
            {enCours ? p.envoi : panierVide ? p.envoyerDemande : remplir(p.commander, { prix: prix(totaux.total) })}
          </button>
          <p className="text-center text-xs text-slate-500">
            {p.conditionsAvant}<Link href={lien("/conditions")} className="underline underline-offset-2 hover:text-encre">{p.conditionsLien}</Link>{p.conditionsApres}
          </p>
        </div>
      </aside>
    </form>
  );
}
