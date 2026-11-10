"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { QUANTITE_MAX } from "@/lib/calcul";

export type ArticlePanier = {
  produitId: string;
  nom: string;
  prix: number; // agorot, indicatif : le serveur recalcule
  photoUrl: string;
  emoji: string;
  quantite: number;
};

type ProduitActuel = { id: string; nom: string; prix: number; photoUrl: string };

type Panier = {
  articles: ArticlePanier[];
  pret: boolean;
  nombre: number;
  sousTotal: number;
  ajouter: (a: Omit<ArticlePanier, "quantite">) => void;
  changerQuantite: (produitId: string, quantite: number) => void;
  retirer: (produitId: string) => void;
  vider: () => void;
  /** Applique les prix actuels du serveur ; retire ce qui n'existe plus. Rend le nombre d'articles retirés. */
  synchroniser: (actuels: ProduitActuel[]) => number;
};

const CLE = "panier-v1";
const Contexte = createContext<Panier | null>(null);

function lire(): ArticlePanier[] {
  try {
    const brut = window.localStorage.getItem(CLE);
    if (!brut) return [];
    const data = JSON.parse(brut);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (a) =>
          a && typeof a.produitId === "string" && typeof a.nom === "string" &&
          Number.isInteger(a.prix) && Number.isInteger(a.quantite) && a.quantite > 0,
      )
      .map((a) => ({
        produitId: a.produitId,
        nom: a.nom,
        prix: a.prix,
        photoUrl: typeof a.photoUrl === "string" ? a.photoUrl : "",
        emoji: typeof a.emoji === "string" ? a.emoji : "🛍️",
        quantite: Math.min(a.quantite, QUANTITE_MAX),
      }));
  } catch {
    return [];
  }
}

function ecrire(articles: ArticlePanier[]) {
  try {
    window.localStorage.setItem(CLE, JSON.stringify(articles));
  } catch {
    // Navigation privée ou stockage plein : le panier vit en mémoire.
  }
}

// Le panier vit dans le navigateur (localStorage). Côté serveur et pendant
// l'hydratation, il est vide et « pas prêt » : pas de différence de rendu.
type Etat = { articles: ArticlePanier[]; pret: boolean };
const SERVEUR: Etat = { articles: [], pret: false };
let etatClient: Etat = SERVEUR;
const auditeurs = new Set<() => void>();

function instantane(): Etat {
  if (!etatClient.pret) etatClient = { articles: lire(), pret: true };
  return etatClient;
}

function abonner(rappel: () => void) {
  auditeurs.add(rappel);
  // Un autre onglet a modifié le panier.
  const surStockage = (e: StorageEvent) => {
    if (e.key !== CLE) return;
    etatClient = { articles: lire(), pret: true };
    auditeurs.forEach((a) => a());
  };
  window.addEventListener("storage", surStockage);
  return () => {
    auditeurs.delete(rappel);
    window.removeEventListener("storage", surStockage);
  };
}

function modifierLePanier(f: (a: ArticlePanier[]) => ArticlePanier[]) {
  const apres = f(instantane().articles);
  etatClient = { articles: apres, pret: true };
  ecrire(apres);
  auditeurs.forEach((a) => a());
}

export function PanierProvider({ children }: { children: React.ReactNode }) {
  const { articles, pret } = useSyncExternalStore(abonner, instantane, () => SERVEUR);
  const modifier = modifierLePanier;

  const valeur = useMemo<Panier>(
    () => ({
      articles,
      pret,
      nombre: articles.reduce((s, a) => s + a.quantite, 0),
      sousTotal: articles.reduce((s, a) => s + a.prix * a.quantite, 0),
      ajouter: (a) =>
        modifier((liste) => {
          const existant = liste.find((x) => x.produitId === a.produitId);
          if (existant) {
            return liste.map((x) =>
              x.produitId === a.produitId ? { ...x, quantite: Math.min(x.quantite + 1, QUANTITE_MAX) } : x,
            );
          }
          return [...liste, { ...a, quantite: 1 }];
        }),
      changerQuantite: (produitId, quantite) =>
        modifier((liste) =>
          quantite <= 0
            ? liste.filter((x) => x.produitId !== produitId)
            : liste.map((x) => (x.produitId === produitId ? { ...x, quantite: Math.min(quantite, QUANTITE_MAX) } : x)),
        ),
      retirer: (produitId) => modifier((liste) => liste.filter((x) => x.produitId !== produitId)),
      vider: () => modifier(() => []),
      synchroniser: (actuels) => {
        const parId = new Map(actuels.map((p) => [p.id, p]));
        const retires = articles.filter((a) => !parId.has(a.produitId)).length;
        modifier((liste) =>
          liste
            .filter((a) => parId.has(a.produitId))
            .map((a) => {
              const p = parId.get(a.produitId)!;
              return { ...a, nom: p.nom, prix: p.prix, photoUrl: p.photoUrl };
            }),
        );
        return retires;
      },
    }),
    [articles, pret, modifier],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function usePanier(): Panier {
  const p = useContext(Contexte);
  if (!p) throw new Error("usePanier hors de PanierProvider");
  return p;
}
