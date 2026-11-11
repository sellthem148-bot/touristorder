import "server-only";
import { prisma } from "./prisma";
import { ajouterJours, jourEnIsrael } from "./dates";
import { cleDuCreneau, joursDeLivraison, NOMBRE_DE_JOURS, type JourDeLivraison, type Occupation, type ReglesDeLivraison } from "./creneaux";

/** Le nombre de commandes non annulées par créneau, pour les jours donnés. */
export async function occupationDesCreneaux(jours: string[]): Promise<Occupation> {
  const groupes = await prisma.commande.groupBy({
    by: ["dateLivraison", "creneau"],
    where: { dateLivraison: { in: jours }, statut: { not: "ANNULEE" } },
    _count: { _all: true },
  });
  return Object.fromEntries(groupes.map((g) => [cleDuCreneau(g.dateLivraison, g.creneau), g._count._all]));
}

/**
 * Les jours et créneaux qu'un client peut choisir maintenant : ceux de `joursDeLivraison`,
 * moins les créneaux qui ont atteint la limite de commandes (Réglages). Une seule définition
 * pour l'accueil, le panier et le serveur qui accepte la commande.
 */
export async function joursOuverts(regles: ReglesDeLivraison, maintenant: Date = new Date()): Promise<JourDeLivraison[]> {
  if (!(regles.commandesParCreneau && regles.commandesParCreneau > 0)) return joursDeLivraison(regles, maintenant);
  const aujourdhui = jourEnIsrael(maintenant);
  const fenetre = Array.from({ length: NOMBRE_DE_JOURS }, (_, i) => ajouterJours(aujourdhui, i));
  return joursDeLivraison(regles, maintenant, NOMBRE_DE_JOURS, await occupationDesCreneaux(fenetre));
}
