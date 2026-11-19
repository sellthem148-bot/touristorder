// « Enlève-moi tout ce qui est viande, poulet frais » (le gérant, 19 novembre 2026) : les sept articles de viande
// et de poulet frais revenus en vente le 16 novembre sont masqués. La charcuterie sous vide et les surgelés restent.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLE_RETRAIT_VIANDE_FRAICHE, VIANDE_FRAICHE } from "../prisma/retrait-viande-fraiche-1119";
import { VIANDES_REMISES } from "../prisma/remise-en-vente-1116";
import { VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import { LOTS_WOLT } from "../prisma/remplissage";
import { photoRepere } from "@/lib/reperes-wolt";

const lire = (f: string) => readFileSync(f, "utf8");
const articles = LOTS_WOLT.flatMap((l) => l.articles);

describe("viande et poulet frais retirés", () => {
  it("sept articles : toute la viande et tout le poulet FRAIS remis en vente le 16 novembre, et rien d'autre", () => {
    expect(VIANDE_FRAICHE).toHaveLength(7);
    expect(new Set(VIANDE_FRAICHE).size).toBe(7);
    // « Frais » est dans le nom : ce sont exactement ceux des treize viandes remises en vente qui le disent.
    expect([...VIANDE_FRAICHE].sort()).toEqual(VIANDES_REMISES.filter((n) => /\b(frais|fraîches?)\b/.test(n)).sort());
    for (const nom of VIANDE_FRAICHE) {
      expect(VIANDE_ET_VOLAILLE, nom).toContain(nom);
      const article = articles.find((a) => a.nom === nom);
      expect(article?.categorie, nom).toBe("Boucherie & poisson");
      expect(article?.nomWolt, nom).toMatch(/טרי/); // « frais », sur Wolt aussi
      // Masqués, pas supprimés : ils gardent leur photo de Wolt dans l'espace du gérant.
      expect(photoRepere(nom, article?.nomWolt), nom).not.toBeNull();
    }
  });

  it("restent en vente : la charcuterie sous vide et les deux surgelés (il n'a parlé que du frais)", () => {
    const restent = VIANDES_REMISES.filter((n) => !VIANDE_FRAICHE.includes(n));
    expect(restent.sort()).toEqual([
      "Blanc de poulet surgelé, environ 1 kg",
      "Bœuf haché surgelé 10 % MG 500 g",
      "Chiffonnade de pastrami au miel Tirat Zvi 120 g",
      "Chiffonnade de pastrami de dinde grillée Tirat Zvi 120 g",
      "Saucisses Kafri Tirat Zvi, lot de 2 (800 g)",
      "Saucisses de poulet Tirat Zvi 400 g",
    ]);
  });

  it("une seule fois, masqués et non supprimés, APRÈS la remise en vente du 16 novembre", () => {
    const remplissage = lire("prisma/remplissage.ts");
    const operation = remplissage.slice(remplissage.indexOf("export async function retirerLaViandeFraiche"));
    const corps = operation.slice(0, operation.indexOf("\n}\n"));
    expect(corps).toContain("where: { actif: true, OR: [{ nom: { in: VIANDE_FRAICHE } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false }");
    expect(corps).toContain("noterOperation(prisma, CLE_RETRAIT_VIANDE_FRAICHE)");
    expect(corps.indexOf("if (faite) return")).toBeLessThan(corps.indexOf("updateMany"));
    expect(corps).not.toMatch(/deleteMany|\.delete\(/);
    expect(CLE_RETRAIT_VIANDE_FRAICHE).toBe("retrait-viande-fraiche-2026-11-19");
    // Sur une base neuve, la remise en vente passe d'abord : sans cet ordre, elle les remettrait en vente.
    for (const fichier of ["prisma/preparer.ts", "tests/outils/base-complete.ts"]) {
      const source = lire(fichier);
      const remise = source.lastIndexOf("remettreEnVenteCeQuiAUnePhoto");
      const retrait = source.lastIndexOf("retirerLaViandeFraiche");
      expect(remise, fichier).toBeGreaterThan(-1);
      expect(retrait, fichier).toBeGreaterThan(remise);
    }
  });
});
