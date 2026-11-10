// Où est la base ? Pur (sans import) : lu par l'application, par `prisma/seed.ts`
// et par `prisma/preparer.ts`.
//
// - En local, ou si on les pose à la main : DATABASE_URL (et DIRECT_URL).
// - Sur Vercel, quand la base Supabase est créée depuis Vercel (Storage → Supabase),
//   l'intégration pose toute seule POSTGRES_PRISMA_URL (connexions partagées, port 6543)
//   et POSTGRES_URL_NON_POOLING (session, port 5432) : aucun mot de passe à recopier.

type Env = Record<string, string | undefined>;

/**
 * Le « transaction pooler » de Supabase (port 6543) ne garde pas les requêtes préparées :
 * Prisma doit le savoir (`pgbouncer=true`), sinon « prepared statement already exists ».
 */
export function pourPrisma(adresse: string): string {
  let url: URL;
  try {
    url = new URL(adresse);
  } catch {
    return adresse;
  }
  if (url.port === "6543" && !url.searchParams.has("pgbouncer")) {
    url.searchParams.set("pgbouncer", "true");
    return url.toString();
  }
  return adresse;
}

/** L'adresse que l'application utilise pour ses requêtes. */
export function adresseDeLaBase(env: Env = process.env): string | undefined {
  const adresse = env.DATABASE_URL || env.POSTGRES_PRISMA_URL || env.POSTGRES_URL;
  return adresse ? pourPrisma(adresse) : undefined;
}

/** L'adresse pour modifier la structure (`prisma db push`) : une vraie session, pas le port 6543. */
export function adresseDirecte(env: Env = process.env): string | undefined {
  return env.DIRECT_URL || env.POSTGRES_URL_NON_POOLING || adresseDeLaBase(env);
}

/** Supabase (photos) : l'adresse du projet et la clé secrète, sous leurs anciens et nouveaux noms. */
export function accesSupabase(env: Env = process.env): { url: string; cle: string } | null {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
  const cle = env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SECRET_KEY;
  return url && cle ? { url: url.replace(/\/$/, ""), cle } : null;
}

export const BUCKET_PHOTOS = (env: Env = process.env) => env.SUPABASE_BUCKET || "produits";
