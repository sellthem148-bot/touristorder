// Deux décisions du gérant (12 novembre 2026) : le rayon Crèmerie ramené à une courte sélection, et cinq
// articles introuvables sur Wolt retirés de la vente. Rien n'est supprimé : tout est masqué, une seule fois.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_DE_LA_LISTE } from "../prisma/articles-liste";
import { CREMERIE_GARDEE, INTROUVABLES_SUR_WOLT, RAYON_CREMERIE } from "../prisma/allegement-cremerie";
import { LOTS_WOLT, cremerieARetirer } from "../prisma/remplissage";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
const source = lire("prisma/remplissage.ts");
const corpsDe = (nom: string) => {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut < 0) throw new Error(`Fonction absente : ${nom}`);
  const fin = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, fin < 0 ? undefined : fin);
};
const articlesWolt = LOTS_WOLT.flatMap((l) => l.articles);

describe("rayon Crèmerie : quelques articles, pas plus", () => {
  it("une courte sélection, sans doublon, faite d'articles relevés sur Wolt (prix vérifié)", () => {
    expect(CREMERIE_GARDEE.length).toBeGreaterThanOrEqual(20);
    expect(CREMERIE_GARDEE.length).toBeLessThanOrEqual(40);
    expect(new Set(CREMERIE_GARDEE).size).toBe(CREMERIE_GARDEE.length);
    const relevesSurWolt = new Map(articlesWolt.filter((a) => a.categorie === RAYON_CREMERIE).map((a) => [a.nom, a]));
    for (const nom of CREMERIE_GARDEE) {
      const article = relevesSurWolt.get(nom);
      expect(article, nom).toBeDefined();
      expect(article!.prix, nom).toBeGreaterThan(0);
      expect(article!.nomWolt, nom).not.toBe("");
    }
  });
  it("de quoi faire un petit-déjeuner : œufs, lait, beurre, crème, fromage, yaourts, desserts", () => {
    for (const famille of [/^Œufs/, /^Lait /, /^Beurre/, /^Crème/, /Cottage|Fromage|Mozzarella/, /^Yaourt/, /Milky|Dessert|Malabi/]) {
      expect(CREMERIE_GARDEE.filter((n) => famille.test(n)).length, String(famille)).toBeGreaterThanOrEqual(2);
    }
  });
  it("tout le reste du rayon est retiré — et jamais un article gardé", () => {
    const { noms, nomsWolt } = cremerieARetirer();
    const duRayon = [...articlesWolt, ...ARTICLES_DE_LA_LISTE].filter((a) => a.categorie === RAYON_CREMERIE);
    const gardes = new Set(CREMERIE_GARDEE);
    // Chaque article du rayon est soit gardé, soit retiré.
    expect(duRayon.filter((a) => !gardes.has(a.nom) && !noms.includes(a.nom))).toEqual([]);
    expect(noms.filter((n) => gardes.has(n))).toEqual([]);
    expect(noms.length).toBe(new Set(noms).size);
    expect(noms.length).toBeGreaterThan(200);
    // Un article gardé n'est jamais retiré par son nom sur Wolt non plus.
    const woltGardes = new Set(articlesWolt.filter((a) => gardes.has(a.nom)).map((a) => a.nomWolt));
    expect(nomsWolt.filter((n) => woltGardes.has(n))).toEqual([]);
    // Les articles de la liste remplacés le 12 novembre sont retirés sous leur nouveau nom.
    expect(noms).toContain("Beurre tartinable salé Lurpak 250 g");
    // Rien d'un autre rayon.
    const ailleurs = new Set([...articlesWolt, ...ARTICLES_DE_LA_LISTE].filter((a) => a.categorie !== RAYON_CREMERIE).map((a) => a.nom));
    expect(noms.filter((n) => ailleurs.has(n))).toEqual([]);
  });
});

describe("articles introuvables sur Wolt", () => {
  it("cinq articles de la liste du gérant, aucun dans la sélection gardée", () => {
    expect(INTROUVABLES_SUR_WOLT).toHaveLength(5);
    const liste = new Set(ARTICLES_DE_LA_LISTE.map((a) => a.nom));
    expect(INTROUVABLES_SUR_WOLT.filter((n) => !liste.has(n))).toEqual([]);
    expect(INTROUVABLES_SUR_WOLT.filter((n) => CREMERIE_GARDEE.includes(n))).toEqual([]);
  });
});

describe("masqués, une seule fois — jamais supprimés", () => {
  it.each(["allegerLaCremerie", "retirerLesIntrouvables"])("%s : une opération notée dans la même transaction, qui masque sans supprimer", (nom) => {
    const corps = corpsDe(nom);
    expect(corps).toContain("operationFaite(");
    expect(corps).toContain("noterOperation(");
    expect(corps).toContain("$transaction");
    expect(corps).toContain("actif: false");
    expect(corps).toContain("actif: true");
    expect(corps).not.toMatch(/delete|prix:/);
  });
  it("la mise en ligne les applique, après le retrait de la viande", () => {
    const preparer = lire("prisma/preparer.ts");
    const ordre = ["retirerLaViande(prisma)", "retirerLesIntrouvables(prisma)", "allegerLaCremerie(prisma)"].map((appel) => preparer.indexOf(`await ${appel}`));
    expect(ordre.every((i) => i > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  });
});
