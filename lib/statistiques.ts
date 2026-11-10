// Tes chiffres : une définition, calculée sur les commandes non annulées.
import { margeEstimee } from "./calcul";
import { ajouterJours, jourEnIsrael } from "./dates";

export type CommandePourStats = {
  createdAt: Date;
  statut: string;
  total: number;
  pourboire: number;
  express: boolean;
  ville?: string;
  lignes: { nom: string; quantite: number; prixUnitaire: number; prixAchatUnitaire: number | null; indisponible: boolean }[];
};

export type Periode = { commandes: number; chiffre: number; marge: number; panierMoyen: number };

function resumer(liste: CommandePourStats[]): Periode {
  const chiffre = liste.reduce((s, c) => s + c.total, 0);
  const marge = liste.reduce((s, c) => s + margeEstimee(c.lignes, c).marge, 0);
  return { commandes: liste.length, chiffre, marge, panierMoyen: liste.length ? Math.round(chiffre / liste.length) : 0 };
}

export function statistiques(toutes: CommandePourStats[], maintenant = new Date()) {
  const valides = toutes.filter((c) => c.statut !== "ANNULEE");
  const aujourdhui = jourEnIsrael(maintenant);
  const depuis = (jours: number) => {
    const debut = ajouterJours(aujourdhui, -(jours - 1));
    return valides.filter((c) => jourEnIsrael(c.createdAt) >= debut);
  };

  // Chiffre par jour sur 14 jours (jour israélien de la commande).
  const parJour = Array.from({ length: 14 }, (_, i) => {
    const jour = ajouterJours(aujourdhui, i - 13);
    const duJour = valides.filter((c) => jourEnIsrael(c.createdAt) === jour);
    return { jour, chiffre: duJour.reduce((s, c) => s + c.total, 0), commandes: duJour.length };
  });

  // Les plus vendus sur 30 jours (articles réellement livrés).
  const ventes = new Map<string, { quantite: number; chiffre: number }>();
  for (const c of depuis(30)) {
    for (const l of c.lignes) {
      if (l.indisponible) continue;
      const v = ventes.get(l.nom) ?? { quantite: 0, chiffre: 0 };
      ventes.set(l.nom, { quantite: v.quantite + l.quantite, chiffre: v.chiffre + l.quantite * l.prixUnitaire });
    }
  }
  const meilleures = [...ventes]
    .map(([nom, v]) => ({ nom, ...v }))
    .sort((a, b) => b.quantite - a.quantite || b.chiffre - a.chiffre || a.nom.localeCompare(b.nom))
    .slice(0, 5);

  const mois = depuis(30);
  // Commandes et chiffre par ville (30 jours), les plus actives d'abord.
  const villes = new Map<string, { commandes: number; chiffre: number }>();
  for (const c of mois) {
    const cle = c.ville || "—";
    const v = villes.get(cle) ?? { commandes: 0, chiffre: 0 };
    villes.set(cle, { commandes: v.commandes + 1, chiffre: v.chiffre + c.total });
  }
  const parVille = [...villes]
    .map(([ville, v]) => ({ ville, ...v }))
    .sort((a, b) => b.commandes - a.commandes || b.chiffre - a.chiffre || a.ville.localeCompare(b.ville));
  return {
    parVille,
    aujourdhui: resumer(depuis(1)),
    semaine: resumer(depuis(7)),
    mois: resumer(mois),
    parJour,
    meilleures,
    pourboiresMois: mois.reduce((s, c) => s + c.pourboire, 0),
    partExpress: mois.length ? Math.round((mois.filter((c) => c.express).length / mois.length) * 100) : 0,
    annulees: toutes.filter((c) => c.statut === "ANNULEE").length,
  };
}
