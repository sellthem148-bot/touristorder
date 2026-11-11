// Les exports comptables du gérant (pur : testé sans base).
// Deux fichiers : les ventes (ce que les clients paient — les entrées) et les achats Wolt
// (ce que les articles coûtent — les sorties). Format CSV lisible par Excel en français :
// séparateur « ; », montants à virgule, encodage UTF-8 signalé.
import { margeEstimee } from "./calcul";
import { etatDuPaiement } from "./paiement";
import { LIBELLE_STATUT } from "./statuts";
import type { StatutCommande } from "@prisma/client";

/** Une cellule : guillemets doublés, et une valeur qui commence comme une formule est neutralisée. */
export function cellule(valeur: string | number): string {
  let texte = String(valeur);
  // Un tableur exécute ce qui commence par = + - @ : un nom de client ne doit jamais devenir une formule.
  if (typeof valeur === "string" && /^[=+\-@\t\r]/.test(texte)) texte = `'${texte}`;
  return `"${texte.replace(/"/g, '""')}"`;
}

export function csv(entetes: string[], lignes: (string | number)[][]): string {
  const rangs = [entetes, ...lignes].map((l) => l.map(cellule).join(";"));
  return `﻿${rangs.join("\r\n")}\r\n`;
}

/** 17790 → « 177,90 » (un nombre pour Excel en français). */
export function montantCsv(agorot: number | null | undefined): string {
  if (agorot == null) return "";
  return (agorot / 100).toFixed(2).replace(".", ",");
}

const jourFr = (jour: string) => jour.split("-").reverse().join("/"); // 2026-11-12 → 12/11/2026
const horodatage = new Intl.DateTimeFormat("fr-FR", { timeZone: "Asia/Jerusalem", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
const dateHeure = (d: Date | null) => (d ? horodatage.format(d).replace(",", "") : "");

/** « 2026-11 », ou « tout » ; rien si la valeur n'est pas un mois. */
export function moisValide(valeur: unknown): string | null {
  if (valeur === "tout") return "tout";
  return typeof valeur === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(valeur) ? valeur : null;
}

const NOMS_DES_MOIS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];

/** Les `nombre` derniers mois, le mois en cours d'abord (d'après un jour israélien AAAA-MM-JJ). */
export function derniersMois(aujourdhui: string, nombre = 12): { valeur: string; libelle: string }[] {
  const [annee, mois] = aujourdhui.split("-").map(Number);
  return Array.from({ length: nombre }, (_, i) => {
    const d = new Date(Date.UTC(annee, mois - 1 - i, 1));
    return { valeur: d.toISOString().slice(0, 7), libelle: `${NOMS_DES_MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}` };
  });
}

export type CommandeAExporter = {
  numero: number;
  statut: StatutCommande;
  createdAt: Date;
  dateLivraison: string;
  nomClient: string;
  ville: string;
  paiement: string;
  payeLe: Date | null;
  montantPaye: number;
  sousTotal: number;
  majoration: number;
  fraisService: number;
  fraisLivraison: number;
  pourboire: number;
  total: number;
  lignes: {
    nom: string;
    options: string;
    boutique: string;
    quantite: number;
    prixUnitaire: number;
    prixAchatUnitaire: number | null;
    indisponible: boolean;
    produit: { nomWolt: string } | null;
  }[];
};

/** Les entrées : une ligne par commande, annulées comprises (leur statut le dit). */
export function exportDesVentes(commandes: CommandeAExporter[]): string {
  const entetes = [
    "N° commande", "Commandée le", "Livraison", "Client", "Ville", "Statut", "Mode de paiement", "Payée le",
    "Articles", "Supplément horaire", "Frais de service", "Frais de livraison", "Pourboire", "Total",
    "Encaissé", "Reste à recevoir", "À rembourser", "Achats Wolt estimés", "Marge estimée",
  ];
  const lignes = commandes.map((c) => {
    const paiement = etatDuPaiement(c);
    const annulee = c.statut === "ANNULEE";
    const { cout, marge } = margeEstimee(c.lignes, c);
    return [
      c.numero, dateHeure(c.createdAt), jourFr(c.dateLivraison), c.nomClient, c.ville, LIBELLE_STATUT[c.statut], c.paiement, dateHeure(c.payeLe),
      montantCsv(c.sousTotal), montantCsv(c.majoration), montantCsv(c.fraisService), montantCsv(c.fraisLivraison), montantCsv(c.pourboire), montantCsv(c.total),
      montantCsv(c.montantPaye),
      montantCsv(paiement.etat === "A_PAYER" || paiement.etat === "COMPLEMENT" ? paiement.montant : 0),
      montantCsv(paiement.etat === "A_REMBOURSER" ? paiement.montant : 0),
      // Une commande annulée n'a rien coûté sur Wolt.
      montantCsv(annulee ? 0 : cout), montantCsv(annulee ? 0 : marge),
    ];
  });
  return csv(entetes, lignes);
}

/**
 * Les sorties : une ligne par article réellement acheté sur Wolt — les commandes passées sur Wolt
 * (en préparation, en livraison, livrées), sans les articles indisponibles.
 */
export function exportDesAchats(commandes: CommandeAExporter[]): string {
  const entetes = [
    "Livraison", "N° commande", "Boutique", "Article", "Nom sur Wolt", "Options", "Quantité",
    "Prix d'achat unitaire", "Total achat", "Prix de vente unitaire", "Total vente",
  ];
  const lignes: (string | number)[][] = [];
  for (const c of commandes) {
    if (c.statut === "RECUE" || c.statut === "ANNULEE") continue;
    for (const l of c.lignes) {
      if (l.indisponible) continue;
      lignes.push([
        jourFr(c.dateLivraison), c.numero, l.boutique, l.nom, l.produit?.nomWolt ?? "", l.options, l.quantite,
        montantCsv(l.prixAchatUnitaire), montantCsv(l.prixAchatUnitaire == null ? null : l.prixAchatUnitaire * l.quantite),
        montantCsv(l.prixUnitaire), montantCsv(l.prixUnitaire * l.quantite),
      ]);
    }
  }
  return csv(entetes, lignes);
}
