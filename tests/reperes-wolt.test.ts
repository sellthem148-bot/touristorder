// Les photos repère du gérant (photos de Wolt, tirées de ses captures) : privées, jamais côté client.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DOSSIER_DES_REPERES, PHOTOS_REPERE, estPhotoRepere, photoRepere } from "@/lib/reperes-wolt";
import { repereWolt } from "@/lib/repere-wolt";
import { LOTS_WOLT } from "../prisma/remplissage";
import { RELEVE_DU_12_NOVEMBRE, RELEVE_DU_POISSON_SURGELE, REMPLACEMENTS_DU_12_NOVEMBRE } from "../prisma/releve-wolt-1112";
import { RELEVE_DES_BOISSONS } from "../prisma/articles-wolt-captures-boissons";

const fichiersDe = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiersDe(path.join(dossier, e.name)) : [path.join(dossier, e.name)]));

describe("photos repère", () => {
  it("chaque photo de la liste existe, est un petit JPEG, et rien d'autre ne traîne dans le dossier", () => {
    for (const p of PHOTOS_REPERE) {
      const fichier = path.join(DOSSIER_DES_REPERES, p.fichier);
      expect(existsSync(fichier), p.fichier).toBe(true);
      expect(statSync(fichier).size, p.fichier).toBeLessThan(40_000);
      expect(readFileSync(fichier).subarray(0, 3).toString("hex"), p.fichier).toBe("ffd8ff");
      expect(p.fichier).toMatch(/^[a-z0-9-]+\.jpg$/);
    }
    expect(readdirSync(DOSSIER_DES_REPERES).sort()).toEqual(PHOTOS_REPERE.map((p) => p.fichier).sort());
    expect(new Set(PHOTOS_REPERE.map((p) => p.fichier)).size).toBe(PHOTOS_REPERE.length);
    expect(new Set(PHOTOS_REPERE.map((p) => p.nomWolt)).size).toBe(PHOTOS_REPERE.length);
  });

  it("chaque photo est celle d'un article du site, avec son nom exact sur Wolt", () => {
    const connus = new Map<string, string>();
    for (const a of [...LOTS_WOLT.flatMap((l) => l.articles), ...RELEVE_DU_12_NOVEMBRE, ...RELEVE_DU_POISSON_SURGELE, ...RELEVE_DES_BOISSONS, ...REMPLACEMENTS_DU_12_NOVEMBRE]) connus.set(a.nom, a.nomWolt);
    for (const p of PHOTOS_REPERE) expect(connus.get(p.nom), p.nom).toBe(p.nomWolt);
  });

  it("un article est reconnu à son nom sur Wolt (même renommé), sinon à son nom ; un autre n'a pas de photo", () => {
    const lait = PHOTOS_REPERE.find((p) => p.nom === "Lait Tnuva 3 % 1 L")!;
    expect(photoRepere("Mon lait préféré", lait.nomWolt)).toBe(`/admin/repere/${lait.fichier}`);
    expect(photoRepere("Lait Tnuva 3 % 1 L", "")).toBe(`/admin/repere/${lait.fichier}`);
    expect(photoRepere("Parasol géant du gérant", null)).toBeNull();
    expect(repereWolt("Lait Tnuva 3 % 1 L", lait.nomWolt).photo).toBe(`/admin/repere/${lait.fichier}`);
    expect(repereWolt("Parasol géant du gérant", "").photo).toBeNull();
  });

  it("la route ne sert que les fichiers de la liste, et seulement au gérant", () => {
    expect(estPhotoRepere(PHOTOS_REPERE[0].fichier)).toBe(true);
    for (const mechant of ["../../.env", "..%2F.env", "autre.jpg", "", "lait.jpg/../../x"]) expect(estPhotoRepere(mechant), mechant).toBe(false);
    const route = readFileSync("app/admin/(protege)/repere/[fichier]/route.ts", "utf8");
    expect(route.indexOf("await exigerAdmin()")).toBeGreaterThan(-1);
    expect(route.indexOf("await exigerAdmin()")).toBeLessThan(route.indexOf("readFile("));
    expect(route.indexOf("estPhotoRepere(fichier)")).toBeLessThan(route.indexOf("readFile("));
    expect(route).toContain("private");
  });

  it("ces photos appartiennent à Wolt et aux marques : aucune dans public/, aucune page client ne les connaît", () => {
    const publics = new Set(fichiersDe("public").map((f) => path.basename(f)));
    for (const p of PHOTOS_REPERE) expect(publics.has(p.fichier), p.fichier).toBe(false);
    const cotéClient = [...fichiersDe("app/(boutique)"), ...fichiersDe("components").filter((f) => !f.includes(`${path.sep}admin${path.sep}`)), "lib/catalogue.ts"];
    for (const f of cotéClient.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const source = readFileSync(f, "utf8");
      expect(/reperes-wolt|repere-wolt|admin\/repere/.test(source), f).toBe(false);
    }
    // Le dossier part bien avec la route qui les sert (sinon elles manquent en production).
    expect(readFileSync("next.config.ts", "utf8")).toContain("./prive/reperes-wolt/*.jpg");
  });
});
