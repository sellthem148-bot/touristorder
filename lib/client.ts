import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { COOKIE_CLIENT, lireJetonClient } from "./session-client";
import { lienPour } from "./langues";
import { langueActuelle } from "./traduction";

// Ce que les pages lisent du client connecté.
const CHAMPS = { id: true, email: true, nom: true, telephone: true, ville: true, logement: true, adresse: true, etage: true, appartement: true, codeEntree: true, langue: true, createdAt: true } as const;

/** Le client connecté (cookie signé + compte toujours existant), ou null. */
export async function clientConnecte() {
  const c = await cookies();
  const id = lireJetonClient("session", c.get(COOKIE_CLIENT)?.value);
  if (!id) return null;
  return prisma.client.findUnique({ where: { id }, select: CHAMPS });
}

export type ClientConnecte = NonNullable<Awaited<ReturnType<typeof clientConnecte>>>;

/** À appeler en tête de chaque page et action de l'espace client. */
export async function exigerClient(): Promise<ClientConnecte> {
  const client = await clientConnecte();
  // Vers la page de connexion, à l'adresse de la langue du visiteur.
  if (!client) redirect(lienPour(await langueActuelle(), "/compte/connexion"));
  return client;
}
