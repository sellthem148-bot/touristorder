import { createHmac } from "node:crypto";

// La clé qui signe les sessions (gérant et clients). Pur : lu par lib/session-admin.ts et lib/session-client.ts.
//
// - SESSION_SECRET, quand elle est posée (32 caractères au moins) ;
// - sinon, sur Vercel avec la base Supabase créée depuis Vercel, une clé DÉRIVÉE d'un secret que
//   l'intégration pose déjà (SUPABASE_JWT_SECRET, sinon POSTGRES_PASSWORD) : rien à inventer ni à
//   recopier. Dérivée par HMAC, jamais le secret lui-même : connaître une session ne dit rien de la base.
//   Si ce secret change (rotation chez Supabase), tout le monde se reconnecte — rien d'autre.
//
// Une SESSION_SECRET posée mais trop courte reste une erreur de réglage (null), on ne la remplace pas en silence.

type Env = Record<string, string | undefined>;

const USAGE = "touristorder/cle-de-session/v1";

export function cleDeSession(env: Env = process.env): string | null {
  const posee = env.SESSION_SECRET ?? "";
  if (posee.length >= 32) return posee;
  if (posee.length > 0) return null;
  const source = env.SUPABASE_JWT_SECRET || env.POSTGRES_PASSWORD || "";
  if (source.length < 16) return null;
  return createHmac("sha256", source).update(USAGE).digest("base64url");
}
