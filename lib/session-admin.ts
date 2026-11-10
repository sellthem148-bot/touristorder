import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// Session admin : un cookie signé « <expiration>.<signature> ».
// Un seul compte admin (toi), protégé par ADMIN_PASSWORD.

export const COOKIE_ADMIN = "admin_session";
export const DUREE_SESSION_MS = 14 * 24 * 60 * 60 * 1000;

function cle(): string | null {
  const s = process.env.SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

function signer(exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`admin.${exp}`).digest("base64url");
}

function egaux(a: string, b: string): boolean {
  // Comparer des empreintes de même longueur : ne dit rien de la longueur du secret.
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export function configurationAdminValide(): boolean {
  return cle() !== null && (process.env.ADMIN_PASSWORD ?? "").length >= 8;
}

export function motDePasseCorrect(saisi: string): boolean {
  const attendu = process.env.ADMIN_PASSWORD ?? "";
  if (attendu.length < 8) return false;
  return egaux(saisi, attendu);
}

export function creerJetonSession(maintenant = Date.now()): string | null {
  const secret = cle();
  if (!secret) return null;
  const exp = maintenant + DUREE_SESSION_MS;
  return `${exp}.${signer(exp, secret)}`;
}

export function jetonSessionValide(jeton: string | undefined, maintenant = Date.now()): boolean {
  const secret = cle();
  if (!secret || !jeton) return false;
  const [expTexte, signature] = jeton.split(".");
  const exp = Number(expTexte);
  if (!Number.isSafeInteger(exp) || !signature || exp <= maintenant) return false;
  return egaux(signature, signer(exp, secret));
}
