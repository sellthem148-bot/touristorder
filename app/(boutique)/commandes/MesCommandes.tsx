"use client";

import { ReceiptText, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { lireMesJetons } from "@/components/MesCommandesLocales";
import { formatPrix } from "@/lib/argent";
import { libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, LIBELLE_STATUT } from "@/lib/statuts";
import { mesCommandes } from "../actions";

type Commandes = Awaited<ReturnType<typeof mesCommandes>>;
type Etat = { etape: "chargement" } | { etape: "erreur" } | { etape: "pret"; commandes: Commandes };

export function MesCommandes() {
  const [etat, setEtat] = useState<Etat>({ etape: "chargement" });

  useEffect(() => {
    let annule = false;
    const jetons = lireMesJetons();
    (jetons.length ? mesCommandes(jetons) : Promise.resolve([] as Commandes))
      .then((commandes) => !annule && setEtat({ etape: "pret", commandes }))
      .catch(() => !annule && setEtat({ etape: "erreur" }));
    return () => {
      annule = true;
    };
  }, []);

  if (etat.etape === "chargement") return <p className="py-10 text-center text-slate-500">Chargement…</p>;
  if (etat.etape === "erreur") {
    return <p className="carte p-6 text-center text-slate-700">Impossible de charger tes commandes. Vérifie ta connexion et réessaie.</p>;
  }
  if (etat.commandes.length === 0) {
    return (
      <div className="carte space-y-3 p-8 text-center">
        <ReceiptText className="mx-auto h-9 w-9 text-slate-400" strokeWidth={1.4} aria-hidden="true" />
        <p className="font-bold">Aucune commande sur cet appareil.</p>
        <p className="text-sm text-slate-600">Tes commandes apparaissent ici, sur le téléphone ou l&apos;ordinateur qui les a passées.</p>
        <Link href="/" className="bouton">Voir le catalogue</Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {etat.commandes.map((c) => (
        <li key={c.jeton}>
          <Link href={`/suivi/${c.jeton}`} className="carte flex items-center gap-4 p-4 transition hover:border-slate-400">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-700" aria-hidden="true"><ShoppingBag className="h-5 w-5" strokeWidth={1.6} /></span>
            <span className="min-w-0 flex-1">
              <span className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold">Commande n°{c.numero}</span>
                <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${COULEUR_STATUT[c.statut]}`}>{LIBELLE_STATUT[c.statut]}</span>
              </span>
              <span className="block text-sm text-slate-600">
                {libelleDuJour(c.dateLivraison)} · {c.creneau} · {c._count.lignes} article{c._count.lignes > 1 ? "s" : ""}
              </span>
            </span>
            <span className="font-extrabold">{formatPrix(c.total)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
