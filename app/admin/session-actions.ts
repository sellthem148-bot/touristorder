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
import { bloque, noterEchec } from "@/lib/limite";
import { ipDuVisiteur } from "@/lib/ip";

export async function seConnecter(_avant: { erreur?: string }, form: FormData): Promise<{ erreur?: string }> {
  if (!configurationAdminValide()) {
    return { erreur: "ADMIN_PASSWORD (8 caractères min.) et SESSION_SECRET (32 min.) doivent être définis." };
  }
  // Seuls les essais ratés comptent : 10 dans les 15 minutes bloquent cette adresse.
  const cle = `connexion:${await ipDuVisiteur()}`;
  if (bloque(cle, 10)) {
    return { erreur: "Trop d'essais ratés. Réessaie dans 15 minutes." };
  }
  if (!motDePasseCorrect(String(form.get("motDePasse") ?? ""))) {
    noterEchec(cle, 15 * 60 * 1000);
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
