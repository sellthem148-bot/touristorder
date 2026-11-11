import type { StatutCommande } from "@prisma/client";
import { formatPrix } from "./argent";
import type { EtatPaiement } from "./paiement";

type Infos = {
  prenom: string;
  numero: number;
  total: number;
  lienSuivi: string;
  site: string;
  /** Où en est le paiement (lib/paiement.ts). */
  paiement: EtatPaiement;
  /** Le mode choisi par le client (« Bit », « PayBox », « Virement »…). */
  mode: string;
  /** Les coordonnées de paiement du gérant (Réglages) : elles ne partent que dans ce message. */
  coordonnees: string;
};

const resteDu = (p: EtatPaiement) => (p.etat === "A_PAYER" || p.etat === "COMPLEMENT" ? p.montant : 0);

/** Le message WhatsApp pré-rempli que le gérant envoie au client, selon l'étape et le paiement. */
export function messagePourLeClient(statut: StatutCommande, i: Infos): string {
  const debut = `Bonjour ${i.prenom}, c'est ${i.site} !`;
  const reste = resteDu(i.paiement);
  const par = i.mode ? ` par ${i.mode}` : "";
  const coordonnees = i.coordonnees.trim();
  // Tant qu'il reste à payer : le montant, le mode et les coordonnées, quelle que soit l'étape.
  const reglement = reste > 0
    ? `\nMontant à régler : ${formatPrix(reste)}${par}.${coordonnees ? `\n${coordonnees}` : ""}`
    : "";
  switch (statut) {
    case "RECUE":
      if (reste > 0) {
        return `${debut} Nous avons bien reçu votre commande n°${i.numero}.${reglement}\nDès réception de votre paiement, nous lançons vos achats.\nSuivi : ${i.lienSuivi}`;
      }
      return `${debut} Nous avons bien reçu ${i.paiement.etat === "RIEN" ? "votre commande" : "votre paiement pour la commande"} n°${i.numero}${i.paiement.etat === "RIEN" ? "" : ", merci"}. Nous nous en occupons.\nSuivi : ${i.lienSuivi}`;
    case "COMMANDEE":
      return `${debut} Votre commande n°${i.numero} est en préparation. Nous vous prévenons dès notre départ.${reglement}\nSuivi : ${i.lienSuivi}`;
    case "EN_LIVRAISON":
      return `${debut} Votre commande n°${i.numero} est en route.${reglement}`;
    case "LIVREE":
      return `${debut} Merci pour votre commande n°${i.numero} ! N'hésitez pas si vous avez besoin d'autre chose pendant votre séjour.${reglement}`;
    case "ANNULEE":
      return `${debut} Votre commande n°${i.numero} a été annulée.${i.paiement.etat === "A_REMBOURSER" ? ` Nous vous remboursons ${formatPrix(i.paiement.montant)}.` : ""} Écrivez-nous si vous avez la moindre question.`;
  }
}

export function prenomDe(nom: string): string {
  return nom.trim().split(/\s+/)[0] || nom;
}

/** « J'arrive » : envoyé depuis la tournée du soir. Le montant n'est rappelé que s'il reste à régler. */
export function messageJArrive(i: { prenom: string; numero: number; reste: number; mode: string; site: string }): string {
  const reglement = i.reste > 0 ? ` Il reste ${formatPrix(i.reste)} à régler${i.mode ? ` (${i.mode})` : ""}.` : "";
  return `Bonjour ${i.prenom}, c'est ${i.site} ! Je suis en route avec votre commande n°${i.numero}, j'arrive dans une dizaine de minutes.${reglement}`;
}

/** Lien Waze vers l'adresse du client (ouvre l'appli sur téléphone). */
export function lienWaze(adresse: string, ville: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(`${adresse.replace(/\s+/g, " ").trim()}, ${ville}`)}&navigate=yes`;
}
