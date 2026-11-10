import { headers } from "next/headers";

/** L'adresse du visiteur. Sur Vercel, x-forwarded-for est posé par la plateforme. */
export async function ipDuVisiteur(): Promise<string> {
  const h = await headers();
  const premiere = h.get("x-forwarded-for")?.split(",")[0]?.trim();
  return premiere || h.get("x-real-ip") || "inconnue";
}
