// Le relevé de prix du 12 novembre (captures Wolt du gérant) : ce qu'il change, et ce qu'il ne touche jamais.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { ARTICLES_WOLT, enAgorot } from "../prisma/articles-wolt";
import { ARTICLES_DYNAMICA } from "../prisma/articles-dynamica";
import { ARTICLES_WOLT_FICHES } from "../prisma/articles-wolt-fiches";
import { ARTICLES_DE_LA_LISTE, ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import { LOTS_WOLT } from "../prisma/remplissage";
import { ARTICLES_WOLT_DU_12_NOVEMBRE, RELEVE_DU_12_NOVEMBRE, changementsDuReleve, type ProduitReleve } from "../prisma/releve-wolt-1112";

const HEBREU = /[֐-׿]/;
const DEJA_RELEVES = [...ARTICLES_WOLT, ...ARTICLES_DYNAMICA, ...ARTICLES_WOLT_FICHES];

describe("relevé de prix du 12 novembre", () => {
  it("chaque ligne vise un article que le code a installé, avec le prix qu'il lui avait posé", () => {
    for (const l of RELEVE_DU_12_NOVEMBRE) {
      const releve = DEJA_RELEVES.find((a) => a.nom === l.nom);
      const liste = ARTICLES_MIS_EN_VENTE.find((a) => a.nom === l.nom);
      expect(releve || liste, l.nom).toBeTruthy();
      // L'ancien prix : celui du relevé précédent, ou le prix de la liste du gérant.
      expect(l.ancien, l.nom).toBe(releve ? releve.prix : liste!.prixIndicatif);
      if (releve) expect(l.nomWolt, l.nom).toBe(releve.nomWolt);
      expect(l.prix).toBeGreaterThan(0);
      expect(l.nomWolt).toMatch(HEBREU);
      expect(VIANDE_ET_VOLAILLE).not.toContain(l.nom);
    }
    expect(new Set(RELEVE_DU_12_NOVEMBRE.map((l) => l.nom)).size).toBe(RELEVE_DU_12_NOVEMBRE.length);
    expect(new Set(RELEVE_DU_12_NOVEMBRE.map((l) => l.nomWolt)).size).toBe(RELEVE_DU_12_NOVEMBRE.length);
  });

  const produit = (p: Partial<ProduitReleve> & { nom: string }): ProduitReleve => ({ id: p.nom, nomWolt: "", prix: 0, prixAchat: null, ...p });

  it("un article de la liste resté au prix de la liste : prix de vente, prix d'achat et nom Wolt", () => {
    const c = changementsDuReleve([produit({ nom: "Pain à burger brioché × 4", prix: 1490 })]);
    expect(c).toEqual([{ id: "Pain à burger brioché × 4", nom: "Pain à burger brioché × 4", data: { prix: 2050, prixAchat: 2050, nomWolt: "לחמניות המבורגר בריוש - 4 יחידות" } }]);
  });

  it("un prix que le gérant a changé lui-même n'est jamais remplacé : seul le nom Wolt est noté", () => {
    const vente = changementsDuReleve([produit({ nom: "Pain à burger brioché × 4", prix: 1890 })]);
    expect(vente).toEqual([{ id: "Pain à burger brioché × 4", nom: "Pain à burger brioché × 4", data: { nomWolt: "לחמניות המבורגר בריוש - 4 יחידות" } }]);
    // Il a noté lui-même le prix d'achat : il a vérifié l'article, on ne repasse pas derrière lui.
    const achat = changementsDuReleve([produit({ nom: "Pain à burger brioché × 4", prix: 1490, prixAchat: 1990, nomWolt: "son propre repère" })]);
    expect(achat).toEqual([]);
  });

  it("un article du relevé précédent est reconnu à son nom sur Wolt, même renommé par le gérant", () => {
    const c = changementsDuReleve([produit({ id: "s", nom: "Saumon frais (grand filet)", nomWolt: "סלמון פילה נתחים טרי, ~650 g", prix: 9898, prixAchat: 9898 })]);
    expect(c).toEqual([{ id: "s", nom: "Saumon frais (grand filet)", data: { prix: 9900, prixAchat: 9900 } }]);
  });

  it("un article absent du relevé, ou resté « à compléter » (sans prix), n'est pas touché", () => {
    expect(changementsDuReleve([produit({ nom: "Lait Tnuva 3 % 1 L", prix: 735, prixAchat: 735, nomWolt: "חלב תנובה" })])).toEqual([]);
    const sansPrix = changementsDuReleve([produit({ nom: "Pains pitas fraîches × 5", prix: 0 })]);
    expect(sansPrix).toEqual([{ id: "Pains pitas fraîches × 5", nom: "Pains pitas fraîches × 5", data: { nomWolt: "פיתות עבודת יד - 5 יחידות" } }]);
  });

  it("les prix relevés sont en agorot entiers", () => {
    for (const l of RELEVE_DU_12_NOVEMBRE) expect(Number.isInteger(enAgorot(l.prix)) && Number.isInteger(enAgorot(l.ancien)), l.nom).toBe(true);
  });
});

describe("articles ajoutés d'après le relevé du 12 novembre", () => {
  it("un lot à part, qui ne reprend aucun nom ni aucun nom Wolt d'un autre lot ou de la liste", () => {
    const lot = LOTS_WOLT.find((l) => l.articles === ARTICLES_WOLT_DU_12_NOVEMBRE);
    expect(lot?.ordre).toBeGreaterThan(500);
    const autres = LOTS_WOLT.filter((l) => l !== lot).flatMap((l) => l.articles);
    for (const a of ARTICLES_WOLT_DU_12_NOVEMBRE) {
      expect(autres.some((x) => x.nomWolt === a.nomWolt || x.nom === a.nom), a.nom).toBe(false);
      expect(ARTICLES_DE_LA_LISTE.some((x) => x.nom === a.nom), a.nom).toBe(false);
      expect(a.nomWolt).toMatch(HEBREU);
      expect(a.prix).toBeGreaterThan(0);
      expect(VIANDE_ET_VOLAILLE).not.toContain(a.nom);
    }
  });
});

describe("mise en ligne", () => {
  it("le relevé passe après la mise en vente de la liste (les prix de la liste sont alors en place), une seule fois", () => {
    const preparer = readFileSync("prisma/preparer.ts", "utf8");
    expect(preparer.indexOf("appliquerLeReleveDePrix(prisma)")).toBeGreaterThan(preparer.indexOf("mettreEnVenteLaListe(prisma)"));
    const remplissage = readFileSync("prisma/remplissage.ts", "utf8");
    const corps = remplissage.slice(remplissage.indexOf("export async function appliquerLeReleveDePrix"), remplissage.indexOf("export const CLE_RETRAIT_VIANDE"));
    expect(corps).toContain("operationFaite(prisma, CLE_RELEVE_DU_12_NOVEMBRE)");
    expect(corps).toContain("noterOperation(prisma, CLE_RELEVE_DU_12_NOVEMBRE)");
  });
});
