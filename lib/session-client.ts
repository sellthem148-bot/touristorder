import { createHash, createHmac, timingSafeEqual } from "node:crypto";

// L'espace client, sans mot de passe : un lien signé envoyé par e-mail ouvre
// une session (cookie signé). Deux usages, deux signatures : un lien de
// connexion ne vaut pas cookie de session, et inversement — et aucun des deux
// ne vaut session admin (préfixe « client. », lib/session-admin.ts signe « admin. »).

export const COOKIE_CLIENT = "client_session";
export const DUREE_SESSION_CLIENT_MS = 60 * 24 * 60 * 60 * 1000;
/** Lien demandé sur la page de connexion. */
export const DUREE_LIEN_CONNEXION_MS = 30 * 60 * 1000;
/** Lien « Mon espace client » de l'e-mail de confirmation de commande. */
export const DUREE_LIEN_CONFIRMATION_MS = 7 * 24 * 60 * 60 * 1000;

export type UsageJeton = "session" | "lien";

const ID = /^[a-z0-9]{10,40}$/;

function cle(): string | null {
  const s = process.env.SESSION_SECRET ?? "";
  return s.length >= 32 ? s : null;
}

function signer(usage: UsageJeton, clientId: string, exp: number, secret: string): string {
  return createHmac("sha256", secret).update(`client.${usage}.${clientId}.${exp}`).digest("base64url");
}

function egaux(a: string, b: string): boolean {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** « <clientId>.<expiration>.<signature> », ou null sans clé de signature. */
export function creerJetonClient(usage: UsageJeton, clientId: string, dureeMs: number, maintenant = Date.now()): string | null {
  const secret = cle();
  if (!secret || !ID.test(clientId)) return null;
  const exp = maintenant + dureeMs;
  return `${clientId}.${exp}.${signer(usage, clientId, exp, secret)}`;
}

/** L'identifiant du client si le jeton est authentique, du bon usage et non expiré ; sinon null. */
export function lireJetonClient(usage: UsageJeton, jeton: string | undefined | null, maintenant = Date.now()): string | null {
  const secret = cle();
  if (!secret || !jeton || jeton.length > 200) return null;
  const [clientId, expTexte, signature, ...reste] = jeton.split(".");
  const exp = Number(expTexte);
  if (reste.length > 0 || !ID.test(clientId ?? "") || !signature || !Number.isSafeInteger(exp) || exp <= maintenant) return null;
  return egaux(signature, signer(usage, clientId, exp, secret)) ? clientId : null;
}
