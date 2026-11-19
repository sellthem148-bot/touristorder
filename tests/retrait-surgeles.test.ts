// « Supprime : Viande & volaille - Poisson - Glaces » (le gérant, 19 novembre 2026) : trois des quatre sous-rayons
// de « Surgelés & glaces » sont masqués ; le rayon garde ses pizzas et plats.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLE_RETRAIT_SURGELES, GLACES_RETIREES, POISSON_DES_SURGELES_RETIRE, SURGELES_RETIRES, VIANDE_SURGELEE_RETIREE } from "../prisma/retrait-surgeles-1119";
import { POISSON_RETIRE } from "../prisma/retrait-poisson-1119";
import { VIANDE_FRAICHE } from "../prisma/retrait-viande-fraiche-1119";
import { POISSON_SURGELE, SANS_PHOTO_DE_WOLT } from "../prisma/masquages-1115";
import { POISSONS_SURGELES_REMIS, VIANDES_REMISES } from "../prisma/remise-en-vente-1116";
import { VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import { ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { LOTS_WOLT } from "../prisma/remplissage";
import { sousRayonDe } from "@/lib/sous-rayons";

const lire = (f: string) => readFileSync(f, "utf8");
const SLUG = "surgeles-glaces";
const sources: { nom: string; categorie: string }[] = [...LOTS_WOLT.flatMap((l) => l.articles).filter((a) => !a.horsLigne), ...ARTICLES_MIS_EN_VENTE];
const duRayon = sources.filter((a) => a.categorie === "Surgelés & glaces");
// Ceux qui n'étaient déjà plus en vente dans ce rayon avant cette décision.
const dejaRetires = new Set([
  ...SANS_PHOTO_DE_WOLT.releves, ...SANS_PHOTO_DE_WOLT.deLaListe,
  ...[...POISSON_SURGELE.releves, ...POISSON_SURGELE.deLaListe].filter((n) => !POISSONS_SURGELES_REMIS.includes(n)),
  ...VIANDE_ET_VOLAILLE.filter((n) => !VIANDES_REMISES.includes(n)),
]);
const enVente = [...new Set(duRayon.filter((a) => !dejaRetires.has(a.nom)).map((a) => a.nom))];

describe("surgelés : viande, poisson et glaces retirés", () => {
  it("onze articles, chacun dans le sous-rayon que le gérant a nommé", () => {
    expect(VIANDE_SURGELEE_RETIREE).toHaveLength(2);
    expect(POISSON_DES_SURGELES_RETIRE).toHaveLength(6);
    expect(GLACES_RETIREES).toHaveLength(3);
    expect(new Set(SURGELES_RETIRES).size).toBe(11);
    for (const nom of VIANDE_SURGELEE_RETIREE) expect(sousRayonDe(SLUG, nom), nom).toBe("viande");
    for (const nom of POISSON_DES_SURGELES_RETIRE) expect(sousRayonDe(SLUG, nom), nom).toBe("poisson");
    for (const nom of GLACES_RETIREES) expect(sousRayonDe(SLUG, nom), nom).toBe("glaces");
    for (const nom of SURGELES_RETIRES) expect(duRayon.some((a) => a.nom === nom), nom).toBe(true);
    // Aucun n'était déjà parti le matin (viande fraîche) ni dans le message d'avant (poisson de « Boucherie & poisson »).
    expect(SURGELES_RETIRES.filter((n) => VIANDE_FRAICHE.includes(n) || POISSON_RETIRE.includes(n))).toEqual([]);
  });

  it("ce sont TOUS les articles de ces trois sous-rayons qui étaient en vente ; il ne reste que les pizzas et plats", () => {
    const vises = enVente.filter((n) => ["viande", "poisson", "glaces"].includes(sousRayonDe(SLUG, n)));
    expect(vises.sort()).toEqual([...SURGELES_RETIRES].sort());
    const restent = enVente.filter((n) => !SURGELES_RETIRES.includes(n));
    expect(restent.sort()).toEqual(["Burekas aux pommes de terre Maadanot 800 g", "Mini pizzas Maadanot 650 g", "Pizza margherita Mamma Mia 470 g"]);
    for (const nom of restent) expect(sousRayonDe(SLUG, nom), nom).toBe("pizzas-plats");
  });

  it("la charcuterie de « Boucherie & poisson » (même nom de sous-rayon) n'est pas touchée : il ne l'a pas nommée dans ce rayon-là", () => {
    const charcuterie = VIANDES_REMISES.filter((n) => !VIANDE_FRAICHE.includes(n) && !VIANDE_SURGELEE_RETIREE.includes(n));
    expect(charcuterie).toHaveLength(4);
    for (const nom of charcuterie) {
      expect(nom).toMatch(/Tirat Zvi/);
      expect(SURGELES_RETIRES, nom).not.toContain(nom);
    }
  });

  it("une seule fois, masqués et non effacés, APRÈS la remise en vente du 16 novembre", () => {
    const remplissage = lire("prisma/remplissage.ts");
    const operation = remplissage.slice(remplissage.indexOf("export async function retirerLesSurgeles"));
    const corps = operation.slice(0, operation.indexOf("\n}\n"));
    expect(corps).toContain("where: { actif: true, OR: [{ nom: { in: SURGELES_RETIRES } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false }");
    expect(corps).toContain("noterOperation(prisma, CLE_RETRAIT_SURGELES)");
    expect(corps.indexOf("if (faite) return")).toBeLessThan(corps.indexOf("updateMany"));
    expect(corps).not.toMatch(/deleteMany|\.delete\(/);
    expect(CLE_RETRAIT_SURGELES).toBe("retrait-surgeles-viande-poisson-glaces-2026-11-19");
    for (const fichier of ["prisma/preparer.ts", "tests/outils/base-complete.ts"]) {
      const source = lire(fichier);
      const remise = source.lastIndexOf("remettreEnVenteCeQuiAUnePhoto");
      expect(remise, fichier).toBeGreaterThan(-1);
      expect(source.lastIndexOf("retirerLesSurgeles"), fichier).toBeGreaterThan(remise);
    }
  });
});
