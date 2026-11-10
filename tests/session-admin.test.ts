import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { creerJetonSession, jetonSessionValide, motDePasseCorrect, DUREE_SESSION_MS } from "@/lib/session-admin";

describe("session admin", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "x".repeat(40);
    process.env.ADMIN_PASSWORD = "mot-de-passe-solide";
  });
  afterEach(() => {
    delete process.env.SESSION_SECRET;
    delete process.env.ADMIN_PASSWORD;
  });

  it("un jeton signé est valide jusqu'à son expiration", () => {
    const t = 1_700_000_000_000;
    const j = creerJetonSession(t)!;
    expect(jetonSessionValide(j, t + 1000)).toBe(true);
    expect(jetonSessionValide(j, t + DUREE_SESSION_MS + 1)).toBe(false);
  });
  it("un jeton modifié ou signé avec une autre clé est refusé", () => {
    const t = Date.now();
    const j = creerJetonSession(t)!;
    const [exp, sig] = j.split(".");
    expect(jetonSessionValide(`${Number(exp) + 1}.${sig}`)).toBe(false);
    expect(jetonSessionValide("n.importe.quoi")).toBe(false);
    expect(jetonSessionValide(undefined)).toBe(false);
    process.env.SESSION_SECRET = "y".repeat(40);
    expect(jetonSessionValide(j)).toBe(false);
  });
  it("sans clé assez longue, pas de session", () => {
    process.env.SESSION_SECRET = "court";
    expect(creerJetonSession()).toBeNull();
  });
  it("mot de passe", () => {
    expect(motDePasseCorrect("mot-de-passe-solide")).toBe(true);
    expect(motDePasseCorrect("mot-de-passe-solid")).toBe(false);
    expect(motDePasseCorrect("")).toBe(false);
    process.env.ADMIN_PASSWORD = "";
    expect(motDePasseCorrect("")).toBe(false);
  });
});
