import { describe, expect, it } from "vitest";
import { accesSupabase, adresseDeLaBase, adresseDirecte, BUCKET_PHOTOS, pourPrisma } from "@/lib/adresses-base";

const POOLER = "postgres://postgres.abcd:secret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require";
const SESSION = "postgres://postgres.abcd:secret@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?sslmode=require";
const LOCALE = "postgresql://livraison:livraison@localhost:5432/livraison";

describe("adresse de la base", () => {
  it("en local : DATABASE_URL, telle quelle", () => {
    expect(adresseDeLaBase({ DATABASE_URL: LOCALE })).toBe(LOCALE);
    expect(adresseDirecte({ DATABASE_URL: LOCALE })).toBe(LOCALE);
  });

  it("DATABASE_URL posée à la main passe avant ce que Vercel pose", () => {
    expect(adresseDeLaBase({ DATABASE_URL: LOCALE, POSTGRES_PRISMA_URL: POOLER })).toBe(LOCALE);
    expect(adresseDirecte({ DIRECT_URL: LOCALE, POSTGRES_URL_NON_POOLING: SESSION })).toBe(LOCALE);
  });

  it("sur Vercel : les variables de l'intégration Supabase", () => {
    const env = { POSTGRES_PRISMA_URL: `${POOLER}&pgbouncer=true`, POSTGRES_URL_NON_POOLING: SESSION };
    expect(adresseDeLaBase(env)).toBe(`${POOLER}&pgbouncer=true`);
    expect(adresseDirecte(env)).toBe(SESSION);
  });

  it("port 6543 sans pgbouncer=true : ajouté (sinon Prisma échoue sur les requêtes préparées)", () => {
    expect(adresseDeLaBase({ POSTGRES_URL: POOLER })).toBe(`${POOLER}&pgbouncer=true`);
    expect(pourPrisma(`${POOLER}&pgbouncer=true`)).toBe(`${POOLER}&pgbouncer=true`);
    expect(pourPrisma(SESSION)).toBe(SESSION);
  });

  it("le mot de passe n'est pas abîmé par l'ajout", () => {
    const special = "postgres://postgres.abcd:p%40ss%2Fw%3Ard@hote.exemple:6543/postgres";
    expect(pourPrisma(special)).toBe(`${special}?pgbouncer=true`);
  });

  it("rien de branché : undefined, et une adresse illisible est rendue telle quelle", () => {
    expect(adresseDeLaBase({})).toBeUndefined();
    expect(adresseDirecte({})).toBeUndefined();
    expect(pourPrisma("pas une adresse")).toBe("pas une adresse");
  });

  it("sans adresse directe, on retombe sur l'adresse de l'application", () => {
    expect(adresseDirecte({ POSTGRES_PRISMA_URL: `${POOLER}&pgbouncer=true` })).toBe(`${POOLER}&pgbouncer=true`);
  });
});

describe("accès Supabase (photos)", () => {
  it("anciens noms", () => {
    expect(accesSupabase({ NEXT_PUBLIC_SUPABASE_URL: "https://abcd.supabase.co/", SUPABASE_SERVICE_ROLE_KEY: "cle" })).toEqual({ url: "https://abcd.supabase.co", cle: "cle" });
  });

  it("noms posés par l'intégration Supabase de Vercel", () => {
    expect(accesSupabase({ SUPABASE_URL: "https://abcd.supabase.co", SUPABASE_SECRET_KEY: "sb_secret_x" })).toEqual({ url: "https://abcd.supabase.co", cle: "sb_secret_x" });
  });

  it("jamais la clé publique : sans clé secrète, pas d'accès", () => {
    expect(accesSupabase({ SUPABASE_URL: "https://abcd.supabase.co", SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x", NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_x" })).toBeNull();
    expect(accesSupabase({ SUPABASE_SECRET_KEY: "sb_secret_x" })).toBeNull();
  });

  it("le dossier des photos", () => {
    expect(BUCKET_PHOTOS({})).toBe("produits");
    expect(BUCKET_PHOTOS({ SUPABASE_BUCKET: "photos" })).toBe("photos");
  });
});
