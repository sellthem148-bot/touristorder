// Le paiement d'une commande. Règle du site : le client paie AVANT que le gérant
// commande sur Wolt (Bit, PayBox, virement — les coordonnées ne sont données que sur WhatsApp).
// Pur : sert à l'espace gérant, à la page de suivi, aux messages et aux exports.
import { formatPrix } from "./argent";

export type CommandePayable = {
  total: number;
  montantPaye: number;
  payeLe: Date | null;
  statut: string;
};

export type EtatPaiement =
  | { etat: "RIEN"; montant: 0 } // rien à régler pour l'instant (commande vide ou annulée, jamais payée)
  | { etat: "A_PAYER"; montant: number } // pas encore payée
  | { etat: "PAYEE"; montant: 0 }
  | { etat: "COMPLEMENT"; montant: number } // payée, puis le total a augmenté (article ajouté)
  | { etat: "A_REMBOURSER"; montant: number }; // payée, puis le total a baissé (article manquant, annulation)

/** Ce que la commande doit : rien si elle est annulée. */
const du = (c: CommandePayable) => (c.statut === "ANNULEE" ? 0 : c.total);

export function etatDuPaiement(c: CommandePayable): EtatPaiement {
  const solde = du(c) - c.montantPaye;
  if (solde < 0) return { etat: "A_REMBOURSER", montant: -solde };
  if (!c.payeLe && c.montantPaye === 0) return solde > 0 ? { etat: "A_PAYER", montant: solde } : { etat: "RIEN", montant: 0 };
  if (solde > 0) return { etat: "COMPLEMENT", montant: solde };
  return { etat: "PAYEE", montant: 0 };
}

/** Entièrement réglée : la seule commande dont les achats partent sur Wolt. */
export function estReglee(c: CommandePayable): boolean {
  const e = etatDuPaiement(c).etat;
  return e === "PAYEE" || e === "A_REMBOURSER";
}

/** Il reste de l'argent à recevoir du client. */
export function resteAPayer(c: CommandePayable): number {
  const e = etatDuPaiement(c);
  return e.etat === "A_PAYER" || e.etat === "COMPLEMENT" ? e.montant : 0;
}

/** L'étiquette de l'espace gérant. */
export function libellePaiement(e: EtatPaiement): string {
  switch (e.etat) {
    case "RIEN": return "Rien à régler";
    case "A_PAYER": return `À payer · ${formatPrix(e.montant)}`;
    case "PAYEE": return "Payée";
    case "COMPLEMENT": return `Reste ${formatPrix(e.montant)}`;
    case "A_REMBOURSER": return `À rembourser ${formatPrix(e.montant)}`;
  }
}

export const COULEUR_PAIEMENT: Record<EtatPaiement["etat"], string> = {
  RIEN: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300",
  A_PAYER: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200",
  PAYEE: "bg-emerald-50 text-emerald-900 ring-1 ring-inset ring-emerald-200",
  COMPLEMENT: "bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200",
  A_REMBOURSER: "bg-rose-50 text-rose-800 ring-1 ring-inset ring-rose-200",
};

/** Le bouton qui solde la commande dans l'espace gérant ; rien si elle est à jour. */
export function libelleDuSolde(e: EtatPaiement): string | null {
  switch (e.etat) {
    case "A_PAYER": return `Paiement reçu · ${formatPrix(e.montant)}`;
    case "COMPLEMENT": return `Complément reçu · ${formatPrix(e.montant)}`;
    case "A_REMBOURSER": return `Remboursement fait · ${formatPrix(e.montant)}`;
    default: return null;
  }
}

/** Ce que le client lit sur sa page de suivi (rien à dire tant qu'il n'y a rien à régler). */
export function paiementPourLeClient(e: EtatPaiement, mode: string): { ton: "attente" | "recu" | "info"; titre: string; texte: string } | null {
  const par = mode ? ` par ${mode}` : "";
  switch (e.etat) {
    case "RIEN":
      return null;
    case "A_PAYER":
      return {
        ton: "attente",
        titre: `Paiement en attente · ${formatPrix(e.montant)}`,
        texte: `Votre commande est préparée dès réception de votre paiement${par}. Les coordonnées de paiement vous sont envoyées sur WhatsApp.`,
      };
    case "COMPLEMENT":
      return {
        ton: "attente",
        titre: `Reste à régler · ${formatPrix(e.montant)}`,
        texte: `Votre commande a été complétée : il reste ce montant à régler${par}.`,
      };
    case "PAYEE":
      return { ton: "recu", titre: "Paiement reçu", texte: "Merci, votre paiement est bien enregistré." };
    case "A_REMBOURSER":
      return {
        ton: "info",
        titre: `Remboursement à venir · ${formatPrix(e.montant)}`,
        texte: "Ce montant vous est remboursé : un article n'était pas disponible ou la commande a été annulée.",
      };
  }
}

/** Le message WhatsApp que le client envoie au gérant pour régler. */
export function messageDeReglement(i: { numero: number; montant: number; mode: string; site: string }): string {
  return `Bonjour ! Je souhaite régler ma commande n°${i.numero} sur ${i.site} (${formatPrix(i.montant)})${i.mode ? ` par ${i.mode}` : ""}.`;
}
