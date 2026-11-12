"use client";

import { createContext, useContext, useMemo, useSyncExternalStore } from "react";
import { QUANTITE_MAX } from "@/lib/calcul";
import { cleDeVariante, libelleAffiche, resoudreSelection, type GroupeOptions, type Selection } from "@/lib/options";
import { useTraduction } from "../LangueProvider";

export type ArticlePanier = {
  cle: string; // produit + options choisies
  produitId: string;
  nom: string;
  options?: Selection;
  optionsLibelle: string; // « Taille : 4 ans · Couleur : bleu »
  prix: number; // agorot, options comprises — indicatif : le serveur recalcule
  photoUrl: string;
  emoji: string;
  quantite: number;
};

type ProduitActuel = { id: string; nom: string; prix: number; photoUrl: string; options: GroupeOptions[] };

type Panier = {
  articles: ArticlePanier[];
  pret: boolean;
  nombre: number;
  sousTotal: number;
  quantiteDuProduit: (produitId: string) => number;
  ajouter: (a: Omit<ArticlePanier, "quantite" | "cle">, quantite?: number) => void;
  changerQuantite: (cle: string, quantite: number) => void;
  vider: () => void;
  /** Applique les prix et options actuels du serveur ; retire ce qui n'existe plus. Rend le nombre d'articles retirés. */
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
      .map((a) => {
        const options: Selection | undefined =
          a.options && typeof a.options === "object" && !Array.isArray(a.options) ? a.options : undefined;
        return {
          cle: cleDeVariante(a.produitId, options),
          produitId: a.produitId,
          nom: a.nom,
          options,
          optionsLibelle: typeof a.optionsLibelle === "string" ? a.optionsLibelle : "",
          prix: a.prix,
          photoUrl: typeof a.photoUrl === "string" ? a.photoUrl : "",
          emoji: typeof a.emoji === "string" ? a.emoji : "🛍️",
          quantite: Math.min(a.quantite, QUANTITE_MAX),
        };
      });
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

function modifier(f: (a: ArticlePanier[]) => ArticlePanier[]) {
  const apres = f(instantane().articles);
  etatClient = { articles: apres, pret: true };
  ecrire(apres);
  auditeurs.forEach((a) => a());
}

export function PanierProvider({ children }: { children: React.ReactNode }) {
  const { articles, pret } = useSyncExternalStore(abonner, instantane, () => SERVEUR);
  const { langue } = useTraduction();
  // « : » entre une option et son choix — avec une espace devant en français seulement.
  const deuxPoints = langue === "fr" ? " : " : ": ";

  const valeur = useMemo<Panier>(
    () => ({
      articles,
      pret,
      nombre: articles.reduce((s, a) => s + a.quantite, 0),
      sousTotal: articles.reduce((s, a) => s + a.prix * a.quantite, 0),
      quantiteDuProduit: (produitId) =>
        articles.filter((a) => a.produitId === produitId).reduce((s, a) => s + a.quantite, 0),
      ajouter: (a, quantite = 1) =>
        modifier((liste) => {
          const cle = cleDeVariante(a.produitId, a.options);
          const existant = liste.find((x) => x.cle === cle);
          if (existant) {
            return liste.map((x) => (x.cle === cle ? { ...x, quantite: Math.min(x.quantite + quantite, QUANTITE_MAX) } : x));
          }
          return [...liste, { ...a, cle, quantite: Math.min(quantite, QUANTITE_MAX) }];
        }),
      changerQuantite: (cle, quantite) =>
        modifier((liste) =>
          quantite <= 0
            ? liste.filter((x) => x.cle !== cle)
            : liste.map((x) => (x.cle === cle ? { ...x, quantite: Math.min(quantite, QUANTITE_MAX) } : x)),
        ),
      vider: () => modifier(() => []),
      synchroniser: (actuels) => {
        const parId = new Map(actuels.map((p) => [p.id, p]));
        let retires = 0;
        modifier((liste) =>
          liste.flatMap((a) => {
            const p = parId.get(a.produitId);
            const choix = p ? resoudreSelection(p.options, a.options) : null;
            if (!p || !choix?.ok) {
              retires += 1;
              return [];
            }
            return [{ ...a, nom: p.nom, prix: p.prix + choix.supplement, optionsLibelle: libelleAffiche(p.options, a.options, deuxPoints) || choix.libelle, photoUrl: p.photoUrl }];
          }),
        );
        return retires;
      },
    }),
    [articles, pret, deuxPoints],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function usePanier(): Panier {
  const p = useContext(Contexte);
  if (!p) throw new Error("usePanier hors de PanierProvider");
  return p;
}
