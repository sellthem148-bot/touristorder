"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  COOKIE_ADMIN,
  DUREE_SESSION_MS,
  configurationAdminValide,
  creerJetonSession,
  motDePasseCorrect,
} from "@/lib/session-admin";
import { autoriser } from "@/lib/limite";
import { ipDuVisiteur } from "@/lib/ip";

export async function seConnecter(_avant: { erreur?: string }, form: FormData): Promise<{ erreur?: string }> {
  if (!configurationAdminValide()) {
    return { erreur: "ADMIN_PASSWORD (8 caractères min.) et SESSION_SECRET (32 min.) doivent être définis." };
  }
  const ip = await ipDuVisiteur();
  if (!autoriser(`connexion:${ip}`, 10, 15 * 60 * 1000)) {
    return { erreur: "Trop d'essais. Réessaie dans 15 minutes." };
  }
  if (!motDePasseCorrect(String(form.get("motDePasse") ?? ""))) {
    return { erreur: "Mot de passe incorrect." };
  }
  const jeton = creerJetonSession();
  if (!jeton) return { erreur: "Configuration incomplète." };
  (await cookies()).set(COOKIE_ADMIN, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_SESSION_MS / 1000,
  });
  redirect("/admin");
}

export async function seDeconnecter() {
  (await cookies()).delete(COOKIE_ADMIN);
  redirect("/admin/connexion");
}
