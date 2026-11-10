import { afterEach, describe, expect, it } from "vitest";
import { cleDeSession } from "@/lib/cle-session";
import { creerJetonSession, jetonSessionValide, reglageManquant } from "@/lib/session-admin";

const JWT = "secret-jwt-de-supabase-tres-long-0123456789abcdef";
const MOT_DE_PASSE_BASE = "Xk29fLmQp7RstUv4";

describe("clé de session", () => {
  it("SESSION_SECRET posée (32 caractères au moins) : utilisée telle quelle, avant tout le reste", () => {
    const posee = "s".repeat(40);
    expect(cleDeSession({ SESSION_SECRET: posee })).toBe(posee);
    expect(cleDeSession({ SESSION_SECRET: posee, SUPABASE_JWT_SECRET: JWT })).toBe(posee);
  });

  it("SESSION_SECRET trop courte : erreur de réglage, jamais remplacée en silence", () => {
    expect(cleDeSession({ SESSION_SECRET: "court" })).toBeNull();
    expect(cleDeSession({ SESSION_SECRET: "court", SUPABASE_JWT_SECRET: JWT })).toBeNull();
  });

  it("sans SESSION_SECRET : dérivée du secret posé par l'intégration Supabase de Vercel", () => {
    const cle = cleDeSession({ SUPABASE_JWT_SECRET: JWT })!;
    expect(cle).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cle).toBe(cleDeSession({ SUPABASE_JWT_SECRET: JWT })); // stable d'un démarrage à l'autre
    expect(cle).not.toContain(JWT); // jamais le secret lui-même
    expect(cleDeSession({ SUPABASE_JWT_SECRET: JWT + "x" })).not.toBe(cle);
  });

  it("à défaut, le mot de passe de la base ; le secret JWT passe avant", () => {
    const parMotDePasse = cleDeSession({ POSTGRES_PASSWORD: MOT_DE_PASSE_BASE })!;
    expect(parMotDePasse).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(cleDeSession({ SUPABASE_JWT_SECRET: JWT, POSTGRES_PASSWORD: MOT_DE_PASSE_BASE })).toBe(cleDeSession({ SUPABASE_JWT_SECRET: JWT }));
  });

  it("rien, ou un secret trop court pour être sûr : pas de clé", () => {
    expect(cleDeSession({})).toBeNull();
    expect(cleDeSession({ SESSION_SECRET: "" })).toBeNull();
    expect(cleDeSession({ POSTGRES_PASSWORD: "tropcourt" })).toBeNull();
  });
});

describe("connexion du gérant avec la clé dérivée", () => {
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    delete process.env.ADMIN_PASSWORD;
  });

  it("dit ce qui manque, dans l'ordre : le mot de passe, puis la clé", () => {
    expect(reglageManquant()).toMatch(/ADMIN_PASSWORD/);
    process.env.ADMIN_PASSWORD = "mot-de-passe-solide";
    expect(reglageManquant()).toMatch(/base Supabase/);
    process.env.SUPABASE_JWT_SECRET = JWT;
    expect(reglageManquant()).toBeNull();
  });

  it("une session signée avec la clé dérivée est valide, et tombe si le secret change", () => {
    process.env.SUPABASE_JWT_SECRET = JWT;
    const jeton = creerJetonSession()!;
    expect(jetonSessionValide(jeton)).toBe(true);
    process.env.SUPABASE_JWT_SECRET = JWT + "-autre";
    expect(jetonSessionValide(jeton)).toBe(false);
  });
});
