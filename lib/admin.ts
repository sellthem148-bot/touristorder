import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_ADMIN, jetonSessionValide } from "./session-admin";

export async function estAdmin(): Promise<boolean> {
  const c = await cookies();
  return jetonSessionValide(c.get(COOKIE_ADMIN)?.value);
}

/** À appeler en tête de CHAQUE page et action admin : le layout ne protège pas les actions. */
export async function exigerAdmin(): Promise<void> {
  if (!(await estAdmin())) redirect("/admin/connexion");
}
