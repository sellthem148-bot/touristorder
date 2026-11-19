// « Enlève : Poisson surgelé - Poisson frais » (le gérant, 19 novembre 2026) : les deux sous-rayons de
// « Boucherie & poisson » qu'il a nommés sont masqués. Le fumé, le salé, la charcuterie, les sauces et le rayon
// « Surgelés & glaces » ne sont pas touchés.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CLE_RETRAIT_POISSON, POISSON_FRAIS_RETIRE, POISSON_RETIRE, POISSON_SURGELE_RETIRE } from "../prisma/retrait-poisson-1119";
import { POISSON_SURGELE, SANS_PHOTO_DE_WOLT } from "../prisma/masquages-1115";
import { POISSONS_SURGELES_REMIS } from "../prisma/remise-en-vente-1116";
import { INTROUVABLES_SUR_WOLT } from "../prisma/allegement-cremerie";
import { VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import { ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { LOTS_WOLT } from "../prisma/remplissage";
import { sousRayonDe } from "@/lib/sous-rayons";

const lire = (f: string) => readFileSync(f, "utf8");
const RAYONS_DU_POISSON = ["Boucherie & poisson", "Poisson"];
// Tout ce que le code a pu mettre en vente : les relevés de Wolt (sauf ceux installés masqués) et sa liste.
const sources: { nom: string; categorie: string }[] = [...LOTS_WOLT.flatMap((l) => l.articles).filter((a) => !a.horsLigne), ...ARTICLES_MIS_EN_VENTE];
const duRayon = sources.filter((a) => RAYONS_DU_POISSON.includes(a.categorie));

describe("poisson frais et poisson surgelé retirés", () => {
  it("22 articles : les 9 du sous-rayon « Poisson frais » et les 13 de « Poisson surgelé », au rayon « Boucherie & poisson »", () => {
    expect(POISSON_FRAIS_RETIRE).toHaveLength(9);
    expect(POISSON_SURGELE_RETIRE).toHaveLength(13);
    expect(new Set(POISSON_RETIRE).size).toBe(22);
    for (const nom of POISSON_FRAIS_RETIRE) expect(sousRayonDe("poisson", nom), nom).toBe("frais");
    for (const nom of POISSON_SURGELE_RETIRE) expect(sousRayonDe("poisson", nom), nom).toBe("surgele");
    // Chacun est un article de ce rayon, pas d'un autre.
    for (const nom of POISSON_RETIRE) expect(duRayon.some((a) => a.nom === nom), nom).toBe(true);
  });

  it("ce sont TOUS les articles de ces deux sous-rayons qui étaient en vente : aucun n'est oublié", () => {
    // Ceux qui n'étaient déjà plus en vente : jamais vus sur Wolt, poisson surgelé resté masqué, viande, introuvable.
    const dejaRetires = new Set([
      ...SANS_PHOTO_DE_WOLT.releves, ...SANS_PHOTO_DE_WOLT.deLaListe,
      ...[...POISSON_SURGELE.releves, ...POISSON_SURGELE.deLaListe].filter((n) => !POISSONS_SURGELES_REMIS.includes(n)),
      ...VIANDE_ET_VOLAILLE, ...INTROUVABLES_SUR_WOLT,
    ]);
    const enVente = duRayon.filter((a) => !dejaRetires.has(a.nom) && ["frais", "surgele"].includes(sousRayonDe("poisson", a.nom))).map((a) => a.nom);
    expect([...new Set(enVente)].sort()).toEqual([...POISSON_RETIRE].sort());
  });

  it("ne sont pas de cette liste : le fumé et le salé (même vendus surgelés), qui restent en vente, et les poissons du rayon « Surgelés & glaces » (retirés par la décision suivante)", () => {
    for (const nom of ["Saumon fumé norvégien 100 g", "Saumon fumé norvégien surgelé 100 g", "Truite de mer fumée surgelée, environ 100 g", "Filet de saumon salé prêt à manger, surgelé 200 g"]) {
      expect(sousRayonDe("poisson", nom), nom).toBe("fume-sale");
      expect(POISSON_RETIRE, nom).not.toContain(nom);
    }
    const surgeles = sources.filter((a) => a.categorie === "Surgelés & glaces").map((a) => a.nom);
    expect(POISSON_RETIRE.filter((n) => surgeles.includes(n))).toEqual([]);
    for (const nom of ["Filets de tilapia surgelés 800 g", "Bâtonnets de poisson pané Dagim 400 g"]) expect(surgeles, nom).toContain(nom);
  });

  it("une seule fois, masqués et non supprimés, APRÈS la remise en vente du 16 novembre", () => {
    const remplissage = lire("prisma/remplissage.ts");
    const operation = remplissage.slice(remplissage.indexOf("export async function retirerLePoissonFraisEtSurgele"));
    const corps = operation.slice(0, operation.indexOf("\n}\n"));
    expect(corps).toContain("where: { actif: true, OR: [{ nom: { in: POISSON_RETIRE } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false }");
    expect(corps).toContain("noterOperation(prisma, CLE_RETRAIT_POISSON)");
    expect(corps.indexOf("if (faite) return")).toBeLessThan(corps.indexOf("updateMany"));
    expect(corps).not.toMatch(/deleteMany|\.delete\(/);
    expect(CLE_RETRAIT_POISSON).toBe("retrait-poisson-frais-et-surgele-2026-11-19");
    for (const fichier of ["prisma/preparer.ts", "tests/outils/base-complete.ts"]) {
      const source = lire(fichier);
      const remise = source.lastIndexOf("remettreEnVenteCeQuiAUnePhoto");
      expect(remise, fichier).toBeGreaterThan(-1);
      expect(source.lastIndexOf("retirerLePoissonFraisEtSurgele"), fichier).toBeGreaterThan(remise);
    }
  });
});
