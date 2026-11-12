"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { clientConnecte } from "@/lib/client";
import { COOKIE_LANGUE, DUREE_COOKIE_LANGUE_S, estLangue } from "@/lib/langues";

/**
 * Le visiteur choisit sa langue : gardée un an dans un cookie, et dans son espace client
 * s'il est connecté (c'est aussi la langue de ses e-mails).
 */
export async function changerLangue(code: string): Promise<void> {
  if (!estLangue(code)) return;
  (await cookies()).set(COOKIE_LANGUE, code, {
    path: "/",
    maxAge: DUREE_COOKIE_LANGUE_S,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  const client = await clientConnecte();
  if (client) await prisma.client.update({ where: { id: client.id }, data: { langue: code } });
}
