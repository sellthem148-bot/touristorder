// « Oui, renomme-le en Surgelés » (le gérant, 22 novembre 2026) : le rayon « Surgelés & glaces » ne vend plus de
// glaces depuis le 19 ; il change de nom dans les cinq langues, pas d'adresse.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLE_RENOMMAGE_SURGELES, RAYON_SURGELES } from "../prisma/renommage-surgeles-1122";
import { CATEGORIES_WOLT } from "../prisma/articles-wolt";
import { nomDuRayon } from "@/lib/i18n/rayons";
import { slugDe } from "@/lib/slug";
import fr from "@/lib/i18n/fr";
import en from "@/lib/i18n/en";
import ru from "@/lib/i18n/ru";
import he from "@/lib/i18n/he";
import es from "@/lib/i18n/es";

const lire = (f: string) => readFileSync(f, "utf8");

describe("le rayon « Surgelés »", () => {
  it("un nouveau nom dans les cinq langues, sans glaces ; la même adresse", () => {
    expect(RAYON_SURGELES).toEqual({ ancien: "Surgelés & glaces", nom: "Surgelés", slug: "surgeles-glaces" });
    expect(fr.rayons["surgeles-glaces"]).toBe(RAYON_SURGELES.nom);
    expect([en, ru, he, es].map((t) => t.rayons["surgeles-glaces"])).toEqual(["Frozen", "Заморозка", "קפואים", "Congelados"]);
    for (const t of [fr, en, ru, he, es]) expect(t.rayons["surgeles-glaces"]).not.toMatch(/glace|ice cream|морожен|גליד|helado/i);
    // Les fichiers d'articles gardent l'ancien nom pour l'installation : il mène à la même adresse.
    expect(CATEGORIES_WOLT.some((c) => c.nom === RAYON_SURGELES.ancien)).toBe(true);
    expect(slugDe(RAYON_SURGELES.ancien)).toBe(RAYON_SURGELES.slug);
  });

  it("le client lit le nouveau nom, que la base porte le nouveau ou encore l'ancien nom de départ ; un nom donné par le gérant reste", () => {
    expect(nomDuRayon({ slug: "surgeles-glaces", nom: "Surgelés" }, he)).toBe("קפואים");
    expect(nomDuRayon({ slug: "surgeles-glaces", nom: "Surgelés & glaces" }, fr)).toBe("Surgelés");
    expect(nomDuRayon({ slug: "surgeles-glaces", nom: "Surgelés & glaces" }, en)).toBe("Frozen");
    expect(nomDuRayon({ slug: "surgeles-glaces", nom: "Mes surgelés" }, en)).toBe("Mes surgelés");
    // Les autres rayons ne changent pas de règle.
    expect(nomDuRayon({ slug: "boissons", nom: "Boissons" }, en)).toBe(en.rayons.boissons);
    expect(nomDuRayon({ slug: "boissons", nom: "Surgelés & glaces" }, en)).toBe("Surgelés & glaces");
  });

  it("dans la base : renommé une seule fois, seulement s'il porte encore son nom de départ, jamais en double", () => {
    const remplissage = lire("prisma/remplissage.ts");
    const operation = remplissage.slice(remplissage.indexOf("export async function renommerLesSurgeles"));
    const corps = operation.slice(0, operation.indexOf("\n}\n"));
    expect(corps).toContain("{ slug: RAYON_SURGELES.slug, nom: RAYON_SURGELES.ancien }");
    expect(corps).toContain("data: { nom: RAYON_SURGELES.nom }");
    expect(corps).toContain("prisma.categorie.count({ where: { nom: RAYON_SURGELES.nom } })");
    expect(corps).toContain("noterOperation(prisma, CLE_RENOMMAGE_SURGELES)");
    expect(corps.indexOf("if (faite) return")).toBeLessThan(corps.indexOf("updateMany"));
    expect(corps).not.toMatch(/slug: [^R]|deleteMany|\.create\(/); // l'adresse ne change pas, rien n'est créé ni supprimé
    expect(CLE_RENOMMAGE_SURGELES).toBe("renommage-surgeles-2026-11-22");
    for (const fichier of ["prisma/preparer.ts", "tests/outils/base-complete.ts"]) expect(lire(fichier), fichier).toContain("renommerLesSurgeles");
  });
});
