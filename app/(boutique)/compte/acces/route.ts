import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { COOKIE_CLIENT, creerJetonClient, DUREE_SESSION_CLIENT_MS, lireJetonClient } from "@/lib/session-client";
import { COOKIE_LANGUE, DUREE_COOKIE_LANGUE_S, estLangue, lienPour } from "@/lib/langues";
import { langueActuelle } from "@/lib/traduction";

/**
 * Le lien reçu par e-mail : s'il est authentique et encore valable, il ouvre
 * la session de l'espace client (cookie signé) et envoie sur le tableau de bord.
 */
export async function GET(requete: NextRequest) {
  const clientId = lireJetonClient("lien", requete.nextUrl.searchParams.get("jeton"));
  const client = clientId ? await prisma.client.findUnique({ where: { id: clientId }, select: { id: true, langue: true } }) : null;
  const session = client ? creerJetonClient("session", client.id, DUREE_SESSION_CLIENT_MS) : null;
  if (!session) redirect(lienPour(await langueActuelle(), "/compte/connexion?erreur=lien"));

  (await cookies()).set(COOKIE_CLIENT, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SESSION_CLIENT_MS / 1000,
  });
  // La langue choisie dans l'espace client suit le client sur l'appareil où il se connecte.
  if (estLangue(client?.langue)) {
    (await cookies()).set(COOKIE_LANGUE, client.langue, { path: "/", maxAge: DUREE_COOKIE_LANGUE_S, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  // Vers l'espace client, à l'adresse de sa langue (celle de son compte, sinon celle de l'appareil).
  redirect(lienPour(estLangue(client?.langue) ? client.langue : await langueActuelle(), "/compte"));
}
