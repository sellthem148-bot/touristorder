import type { StatutCommande } from "@prisma/client";
import { formatPrix } from "./argent";
import type { EtatPaiement } from "./paiement";
import { remplir, type Langue } from "./langues";
import frServeur, { type DictionnaireServeur } from "./i18n/serveur/fr";

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

type TextesMessages = DictionnaireServeur["messages"];

/** La langue des messages : le français par défaut, celle du client quand la commande la porte. */
export type LangueDesMessages = { langue: Langue; m: TextesMessages };
const FR: LangueDesMessages = { langue: "fr", m: frServeur.messages };

/**
 * Le message WhatsApp pré-rempli que le gérant envoie au client, selon l'étape et le paiement,
 * écrit dans la langue du client (`l`). Les coordonnées de paiement partent telles que le gérant les a saisies.
 */
export function messagePourLeClient(statut: StatutCommande, i: Infos, l: LangueDesMessages = FR): string {
  const { m, langue } = l;
  const debut = remplir(m.debut, { prenom: i.prenom, site: i.site });
  const reste = resteDu(i.paiement);
  const par = i.mode ? remplir(m.par, { mode: i.mode }) : "";
  const coordonnees = i.coordonnees.trim();
  const suivi = remplir(m.suivi, { lien: i.lienSuivi });
  const n = { numero: i.numero };
  // Tant qu'il reste à payer : le montant, le mode et les coordonnées, quelle que soit l'étape.
  const reglement = reste > 0
    ? `\n${remplir(m.montantARegler, { montant: formatPrix(reste, langue), par })}${coordonnees ? `\n${coordonnees}` : ""}`
    : "";
  switch (statut) {
    case "RECUE":
      if (reste > 0) {
        return `${debut} ${remplir(m.recueAPayer, n)}${reglement}\n${m.desReception}\n${suivi}`;
      }
      return `${debut} ${remplir(i.paiement.etat === "RIEN" ? m.recueSansPaiement : m.recuePayee, n)}\n${suivi}`;
    case "COMMANDEE":
      return `${debut} ${remplir(m.preparation, n)}${reglement}\n${suivi}`;
    case "EN_LIVRAISON":
      return `${debut} ${remplir(m.enRoute, n)}${reglement}`;
    case "LIVREE":
      return `${debut} ${remplir(m.merci, n)}${reglement}`;
    case "ANNULEE":
      return `${debut} ${remplir(m.annulee, n)}${i.paiement.etat === "A_REMBOURSER" ? ` ${remplir(m.remboursement, { montant: formatPrix(i.paiement.montant, langue) })}` : ""} ${m.question}`;
  }
}

export function prenomDe(nom: string): string {
  return nom.trim().split(/\s+/)[0] || nom;
}

/** « J'arrive » : envoyé depuis la tournée du soir. Le montant n'est rappelé que s'il reste à régler. */
export function messageJArrive(i: { prenom: string; numero: number; reste: number; mode: string; site: string }, l: LangueDesMessages = FR): string {
  const { m, langue } = l;
  const reglement = i.reste > 0 ? ` ${remplir(m.resteARegler, { montant: formatPrix(i.reste, langue), mode: i.mode ? ` (${i.mode})` : "" })}` : "";
  return `${remplir(m.debut, { prenom: i.prenom, site: i.site })} ${remplir(m.jArrive, { numero: i.numero })}${reglement}`;
}

/** Lien Waze vers l'adresse du client (ouvre l'appli sur téléphone). */
export function lienWaze(adresse: string, ville: string): string {
  return `https://waze.com/ul?q=${encodeURIComponent(`${adresse.replace(/\s+/g, " ").trim()}, ${ville}`)}&navigate=yes`;
}
