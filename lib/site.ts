import "server-only";
import { headers } from "next/headers";

/** L'adresse publique du site, pour les liens des e-mails et des messages (sans barre finale). */
export async function adresseDuSite(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  const h = await headers();
  const hote = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (hote.startsWith("localhost") || hote.startsWith("127.") ? "http" : "https");
  return `${proto}://${hote}`;
}
