"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { usePanier } from "@/components/panier/PanierProvider";
import { Vignette } from "@/components/Vignette";
import { calculerTotaux } from "@/lib/calcul";
import { formatPrix } from "@/lib/argent";
import type { ReglagesPublics } from "@/lib/reglages";
import { actualiserPanier, passerCommande, type EtatCommande } from "../actions";

type Props = {
  reglages: ReglagesPublics;
  jours: { valeur: string; libelle: string }[];
};

const VIDE = { nomClient: "", telephone: "", ville: "", adresse: "", dateLivraison: "", creneau: "", notes: "" };

export function PageDuPanier({ reglages, jours }: Props) {
  const panier = usePanier();
  const [etat, envoyer, enCours] = useActionState<EtatCommande, FormData>(passerCommande, {});
  const [valeurs, setValeurs] = useState({
    ...VIDE,
    ville: reglages.villes.length === 1 ? reglages.villes[0] : "",
    dateLivraison: jours[0]?.valeur ?? "",
    creneau: reglages.creneaux[0] ?? "",
  });
  const [avis, setAvis] = useState("");
  // Un champ corrigé après un refus ne garde pas son message d'erreur.
  const [corriges, setCorriges] = useState<{ pour: EtatCommande; champs: string[] }>({ pour: etat, champs: [] });
  const erreurAffichee = (nom: string) =>
    corriges.pour === etat && corriges.champs.includes(nom) ? undefined : etat.champs?.[nom];
  const dejaSynchronise = useRef(false);

  // À l'ouverture du panier (et si le serveur dit qu'il est périmé) :
  // on applique les prix actuels et on retire ce qui n'existe plus.
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
          setAvis(`${retires} article${retires > 1 ? "s" : ""} n'${retires > 1 ? "étaient" : "était"} plus disponible${retires > 1 ? "s" : ""} et ${retires > 1 ? "ont été retirés" : "a été retiré"} de ton panier.`);
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

  const totaux = calculerTotaux(
    panier.articles.map((a) => ({ prixUnitaire: a.prix, quantite: a.quantite })),
    reglages,
  );
  const sousLeMinimum = totaux.sousTotal < reglages.minimumCommande;
  const champ = (nom: keyof typeof VIDE) => ({
    id: nom,
    name: nom,
    value: valeurs[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValeurs((v) => ({ ...v, [nom]: e.target.value }));
      setCorriges((c) => ({ pour: etat, champs: [...(c.pour === etat ? c.champs : []), nom] }));
    },
    "aria-invalid": erreurAffichee(nom) ? true : undefined,
    "aria-describedby": erreurAffichee(nom) ? `${nom}-erreur` : undefined,
    className: `champ ${erreurAffichee(nom) ? "champ-erreur" : ""}`,
  });
  const erreurDe = (nom: string) =>
    erreurAffichee(nom) ? (
      <p id={`${nom}-erreur`} className="mt-1 text-sm text-red-700">
        {erreurAffichee(nom)}
      </p>
    ) : null;

  if (!panier.pret) {
    return <p className="py-10 text-center text-slate-500">Chargement du panier…</p>;
  }

  if (panier.articles.length === 0) {
    return (
      <div className="carte mx-auto max-w-md space-y-4 p-8 text-center">
        <h1 className="text-xl font-bold">Ton panier est vide</h1>
        {avis && <p className="text-sm text-amber-800">{avis}</p>}
        <Link href="/" className="bouton">
          Voir le catalogue
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
      <section aria-labelledby="titre-panier" className="min-w-0 space-y-3">
        <h1 id="titre-panier" className="text-2xl font-extrabold">
          Mon panier
        </h1>
        {avis && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">{avis}</p>}
        <ul className="carte divide-y divide-slate-100">
          {panier.articles.map((a) => (
            <li key={a.produitId} className="flex items-center gap-3 p-3">
              <Vignette url={a.photoUrl} emoji={a.emoji} alt="" className="h-16 w-16 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{a.nom}</p>
                <p className="text-sm text-slate-500">{formatPrix(a.prix)} l&apos;unité</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => panier.changerQuantite(a.produitId, a.quantite - 1)}
                  className="h-8 w-8 rounded-lg border border-slate-300 font-bold"
                  aria-label={`Retirer un ${a.nom}`}
                >
                  −
                </button>
                <span className="w-7 text-center font-semibold">{a.quantite}</span>
                <button
                  type="button"
                  onClick={() => panier.changerQuantite(a.produitId, a.quantite + 1)}
                  className="h-8 w-8 rounded-lg border border-slate-300 font-bold"
                  aria-label={`Ajouter un ${a.nom}`}
                >
                  +
                </button>
              </div>
              <p className="w-20 text-right font-semibold">{formatPrix(a.prix * a.quantite)}</p>
            </li>
          ))}
        </ul>
        <Link href="/" className="inline-block text-sm font-semibold text-marque hover:underline">
          + Ajouter d&apos;autres articles
        </Link>
      </section>

      <form action={envoyer} className="carte h-fit space-y-4 p-4 sm:p-5" noValidate>
        <h2 className="text-lg font-bold">Livraison</h2>

        <div>
          <label htmlFor="nomClient" className="etiquette">Ton nom</label>
          <input {...champ("nomClient")} autoComplete="name" required />
          {erreurDe("nomClient")}
        </div>

        <div>
          <label htmlFor="telephone" className="etiquette">Ton numéro WhatsApp</label>
          <input {...champ("telephone")} type="tel" autoComplete="tel" placeholder="+33 6 12 34 56 78" required />
          {erreurDe("telephone")}
        </div>

        <div>
          <label htmlFor="ville" className="etiquette">Ville</label>
          <select {...champ("ville")} required>
            <option value="">Choisir…</option>
            {reglages.villes.map((v) => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          {erreurDe("ville")}
        </div>

        <div>
          <label htmlFor="adresse" className="etiquette">Adresse ou hôtel (avec n° de chambre)</label>
          <textarea {...champ("adresse")} rows={2} autoComplete="street-address" placeholder="Hôtel Dan, chambre 512" required />
          {erreurDe("adresse")}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="dateLivraison" className="etiquette">Jour</label>
            <select {...champ("dateLivraison")}>
              {jours.map((j) => (
                <option key={j.valeur} value={j.valeur}>{j.libelle}</option>
              ))}
            </select>
            {erreurDe("dateLivraison")}
          </div>
          <div>
            <label htmlFor="creneau" className="etiquette">Créneau</label>
            <select {...champ("creneau")}>
              {reglages.creneaux.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            {erreurDe("creneau")}
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="etiquette">Note (facultatif)</label>
          <textarea {...champ("notes")} rows={2} placeholder="Taille des couches, marque préférée, un produit introuvable dans le catalogue…" />
          {erreurDe("notes")}
        </div>

        {/* Piège à robots : invisible pour les humains. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 overflow-hidden">
          <label htmlFor="site">Ne pas remplir</label>
          <input id="site" name="site" tabIndex={-1} autoComplete="off" defaultValue="" />
        </div>
        <input
          type="hidden"
          name="lignes"
          value={JSON.stringify(panier.articles.map((a) => ({ produitId: a.produitId, quantite: a.quantite })))}
        />

        <dl className="space-y-1 border-t border-slate-100 pt-3 text-sm">
          <div className="flex justify-between"><dt>Articles</dt><dd>{formatPrix(totaux.sousTotal)}</dd></div>
          <div className="flex justify-between"><dt>Frais de service</dt><dd>{formatPrix(totaux.fraisService)}</dd></div>
          <div className="flex justify-between"><dt>Livraison</dt><dd>{formatPrix(totaux.fraisLivraison)}</dd></div>
          <div className="flex justify-between pt-1 text-base font-bold"><dt>Total</dt><dd>{formatPrix(totaux.total)}</dd></div>
        </dl>
        <p className="text-xs text-slate-500">
          Paiement à la livraison (espèces ou Bit). Si un article manque, on te prévient sur WhatsApp et il n&apos;est pas facturé.
        </p>

        {etat.erreur && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{etat.erreur}</p>
        )}
        {sousLeMinimum && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Minimum de commande : {formatPrix(reglages.minimumCommande)} d&apos;articles.
          </p>
        )}
        {!reglages.ouvert && (
          <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Les commandes sont fermées pour le moment. Réessaie un peu plus tard.
          </p>
        )}

        <button type="submit" className="bouton w-full py-3.5 text-base" disabled={enCours || sousLeMinimum || !reglages.ouvert}>
          {enCours ? "Envoi…" : `Commander · ${formatPrix(totaux.total)}`}
        </button>
      </form>
    </div>
  );
}
