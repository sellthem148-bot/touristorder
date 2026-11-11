import type { StatutCommande } from "@prisma/client";

export const ETAPES: StatutCommande[] = ["RECUE", "COMMANDEE", "EN_LIVRAISON", "LIVREE"];

export const LIBELLE_STATUT: Record<StatutCommande, string> = {
  RECUE: "Reçue",
  COMMANDEE: "En préparation",
  EN_LIVRAISON: "En livraison",
  LIVREE: "Livrée",
  ANNULEE: "Annulée",
};

// Ce que le client lit sur sa page de suivi. À l'étape « Reçue », la phrase dépend du paiement :
// la commande n'est préparée qu'une fois réglée.
export const EXPLICATION_STATUT: Record<StatutCommande, string> = {
  RECUE: "Nous avons bien reçu votre commande.",
  COMMANDEE: "Nous préparons votre commande.",
  EN_LIVRAISON: "Votre commande est en route.",
  LIVREE: "Votre commande a été livrée. Bon séjour !",
  ANNULEE: "Cette commande a été annulée.",
};

export const COULEUR_STATUT: Record<StatutCommande, string> = {
  RECUE: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200",
  COMMANDEE: "bg-sky-50 text-sky-900 ring-1 ring-inset ring-sky-200",
  EN_LIVRAISON: "bg-indigo-50 text-indigo-900 ring-1 ring-inset ring-indigo-200",
  LIVREE: "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200",
  ANNULEE: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300",
};

export const STATUTS_EN_COURS: StatutCommande[] = ["RECUE", "COMMANDEE", "EN_LIVRAISON"];

export function estStatut(x: unknown): x is StatutCommande {
  return typeof x === "string" && x in LIBELLE_STATUT;
}
