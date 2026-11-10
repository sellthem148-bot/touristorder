import "server-only";
import { prisma } from "./prisma";
import { statistiques } from "./statistiques";

/** Les commandes des 31 derniers jours, résumées. */
export async function lireStatistiques(maintenant = new Date()) {
  const depuis = new Date(maintenant.getTime() - 31 * 24 * 60 * 60 * 1000);
  const commandes = await prisma.commande.findMany({
    where: { createdAt: { gte: depuis } },
    select: {
      createdAt: true, statut: true, total: true, pourboire: true, express: true,
      lignes: { select: { nom: true, quantite: true, prixUnitaire: true, prixAchatUnitaire: true, indisponible: true } },
    },
  });
  return statistiques(commandes, maintenant);
}
