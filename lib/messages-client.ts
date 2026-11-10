import type { StatutCommande } from "@prisma/client";
import { formatPrix } from "./argent";

type Infos = { prenom: string; numero: number; total: number; lienSuivi: string; site: string };

/** Le message WhatsApp pré-rempli que tu envoies au client, selon l'étape. */
export function messagePourLeClient(statut: StatutCommande, i: Infos): string {
  const debut = `Bonjour ${i.prenom}, c'est ${i.site} !`;
  switch (statut) {
    case "RECUE":
      return `${debut} On a bien reçu ta commande n°${i.numero} (${formatPrix(i.total)}). On s'en occupe 👍\nSuivi : ${i.lienSuivi}`;
    case "COMMANDEE":
      return `${debut} Ta commande n°${i.numero} est en préparation. On te prévient dès qu'on part la livrer.\nSuivi : ${i.lienSuivi}`;
    case "EN_LIVRAISON":
      return `${debut} Ta commande n°${i.numero} est en route 🚗 Total à régler à la livraison : ${formatPrix(i.total)} (espèces ou Bit).`;
    case "LIVREE":
      return `${debut} Merci pour ta commande n°${i.numero} ! N'hésite pas si tu as besoin d'autre chose pendant ton séjour ☀️`;
    case "ANNULEE":
      return `${debut} Ta commande n°${i.numero} a été annulée. Écris-nous si tu as la moindre question.`;
  }
}

export function prenomDe(nom: string): string {
  return nom.trim().split(/\s+/)[0] || nom;
}
