// L'espace client : les chiffres du tableau de bord et le « commander à nouveau »,
// en fonctions pures (testables).
import type { Selection } from "./options";

export type CommandeDuClient = {
  statut: string;
  total: number;
  createdAt: Date;
  lignes: { produitId: string | null; nom: string; quantite: number; indisponible: boolean }[];
};

const EN_COURS = ["RECUE", "COMMANDEE", "EN_LIVRAISON"];

/** Les chiffres du tableau de bord. « Dépensé » = les commandes livrées seulement. */
export function resumeDuClient(commandes: CommandeDuClient[]) {
  const valides = commandes.filter((c) => c.statut !== "ANNULEE");
  const livrees = valides.filter((c) => c.statut === "LIVREE");
  return {
    commandes: valides.length,
    enCours: valides.filter((c) => EN_COURS.includes(c.statut)).length,
    depense: livrees.reduce((s, c) => s + c.total, 0),
    articles: valides.reduce((s, c) => s + c.lignes.filter((l) => !l.indisponible).reduce((n, l) => n + l.quantite, 0), 0),
  };
}

/** Les produits les plus commandés (par quantité), hors commandes annulées et articles indisponibles. */
export function produitsPreferes(commandes: CommandeDuClient[], nombre = 8): string[] {
  const quantites = new Map<string, number>();
  for (const c of commandes) {
    if (c.statut === "ANNULEE") continue;
    for (const l of c.lignes) {
      if (!l.produitId || l.indisponible) continue;
      quantites.set(l.produitId, (quantites.get(l.produitId) ?? 0) + l.quantite);
    }
  }
  return [...quantites].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, nombre).map(([id]) => id);
}

/**
 * « Taille : 4 ans · Couleur : Bleu » (le libellé gardé sur une ligne de commande)
 * → { Taille: "4 ans", Couleur: "Bleu" }. Le résultat est toujours revérifié contre
 * les options actuelles du produit avant d'entrer dans un panier.
 */
export function selectionDepuisLibelle(libelle: string): Selection | undefined {
  if (!libelle.trim()) return undefined;
  const selection: Selection = {};
  for (const morceau of libelle.split(" · ")) {
    const i = morceau.indexOf(" : ");
    if (i < 1) return undefined;
    selection[morceau.slice(0, i)] = morceau.slice(i + 3);
  }
  return selection;
}
