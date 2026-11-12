// Le rayon Boissons ramené à une courte sélection (demande du gérant, 12 novembre 2026). Rien n'est supprimé :
// le reste est masqué, une seule fois. L'alcool, que le code n'a jamais mis en vente, n'est pas concerné.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_DE_LA_LISTE, ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { BOISSONS_GARDEES, RAYON_BOISSONS } from "../prisma/allegement-boissons";
import { CREMERIE_GARDEE } from "../prisma/allegement-cremerie";
import { LOTS_WOLT, RELEVES_DE_PRIX, boissonsARetirer, rayonARetirer } from "../prisma/remplissage";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
const articlesWolt = LOTS_WOLT.flatMap((l) => l.articles);
const boissonsWolt = articlesWolt.filter((a) => a.categorie === RAYON_BOISSONS);

describe("rayon Boissons : une sélection courte", () => {
  it("une trentaine d'articles, sans doublon, tous au prix vérifié sur Wolt", () => {
    expect(BOISSONS_GARDEES.length).toBeGreaterThanOrEqual(20);
    expect(BOISSONS_GARDEES.length).toBeLessThanOrEqual(40);
    expect(new Set(BOISSONS_GARDEES).size).toBe(BOISSONS_GARDEES.length);
    // Prix vérifié : relevé sur Wolt avec l'article, ou article de la liste du gérant dont le prix a été relevé depuis.
    const relevesSurWolt = new Set(boissonsWolt.filter((a) => a.prix > 0 && a.nomWolt !== "" && !a.horsLigne).map((a) => a.nom));
    const prixReleves = new Set(RELEVES_DE_PRIX.flatMap((r) => r.lignes).map((l) => l.nom));
    const deLaListe = new Set(ARTICLES_MIS_EN_VENTE.filter((a) => a.categorie === RAYON_BOISSONS).map((a) => a.nom));
    for (const nom of BOISSONS_GARDEES) {
      expect(relevesSurWolt.has(nom) || (deLaListe.has(nom) && prixReleves.has(nom)), nom).toBe(true);
    }
  });

  it("de quoi boire pendant un séjour : eau, eau gazeuse, glaçons, colas, sodas, jus", () => {
    for (const famille of [/^Eau (minérale|Mei Eden|Neviot)/, /San Pellegrino|Perrier|soda/, /glaçons/, /Coca-Cola|Pepsi/, /Sprite|Fanta|7UP/, /Jus|Prigat|Spring/]) {
      expect(BOISSONS_GARDEES.filter((n) => famille.test(n)).length, String(famille)).toBeGreaterThanOrEqual(1);
    }
    expect(BOISSONS_GARDEES.filter((n) => /^Eau /.test(n)).length).toBeGreaterThanOrEqual(4);
    // Aucun alcool dans la sélection.
    const alcools = new Set([...ARTICLES_DE_LA_LISTE.filter((a) => a.alcool), ...articlesWolt.filter((a) => a.horsLigne)].map((a) => a.nom));
    expect(BOISSONS_GARDEES.filter((n) => alcools.has(n))).toEqual([]);
  });

  it("tout le reste du rayon que le code a mis en vente est retiré — jamais un article gardé, jamais l'alcool", () => {
    const { noms, nomsWolt } = boissonsARetirer();
    const gardes = new Set(BOISSONS_GARDEES);
    const misEnVente = [...boissonsWolt.filter((a) => !a.horsLigne), ...ARTICLES_MIS_EN_VENTE.filter((a) => a.categorie === RAYON_BOISSONS)];
    expect(misEnVente.length).toBeGreaterThan(160);
    expect(misEnVente.filter((a) => !gardes.has(a.nom) && !noms.includes(a.nom))).toEqual([]);
    expect(noms.filter((n) => gardes.has(n))).toEqual([]);
    expect(noms.length).toBe(misEnVente.length - BOISSONS_GARDEES.length);
    const woltGardes = new Set(boissonsWolt.filter((a) => gardes.has(a.nom)).map((a) => a.nomWolt));
    expect(nomsWolt.filter((n) => woltGardes.has(n))).toEqual([]);
    // L'alcool est installé masqué : s'il est en vente, c'est le gérant qui l'a décidé — on n'y touche pas.
    for (const alcool of ["Bière Corona 6 × 35,5 cl", "Vin blanc sec Segal 75 cl", "Bière Goldstar 6 × 33 cl", "Vodka Absolut Blue 70 cl"]) {
      expect(noms, alcool).not.toContain(alcool);
    }
    // Rien d'un autre rayon : ni la Crèmerie, ni les machines SodaStream rangées dans « Maison & entretien ».
    expect(noms.filter((n) => CREMERIE_GARDEE.includes(n))).toEqual([]);
    expect(noms).not.toContain("Machine à eau gazeuse SodaStream Terra blanche");
    expect(noms).toContain("Sirop SodaStream Pepsi 44 cl");
  });

  it("un rayon sans sélection ne perdrait rien de ce que le gérant a créé : seuls les articles du code sont visés", () => {
    const { noms } = rayonARetirer("Rayon inventé par le gérant", []);
    expect(noms).toEqual([]);
  });

  it("la mise en ligne l'applique une seule fois, après la Crèmerie, par l'opération commune", () => {
    const source = lire("prisma/remplissage.ts");
    const corps = source.slice(source.indexOf("export async function allegerLesBoissons"));
    expect(corps.slice(0, corps.indexOf("\n}\n"))).toContain("allegerUnRayon(prisma, { cle: CLE_ALLEGEMENT_BOISSONS");
    const preparer = lire("prisma/preparer.ts");
    expect(preparer.indexOf("await allegerLaCremerie(prisma)")).toBeGreaterThan(0);
    expect(preparer.indexOf("await allegerLesBoissons(prisma)")).toBeGreaterThan(preparer.indexOf("await allegerLaCremerie(prisma)"));
    // Après l'installation des lots et les relevés de prix : la sélection s'applique aux articles déjà en place.
    expect(preparer.indexOf("await allegerLesBoissons(prisma)")).toBeGreaterThan(preparer.indexOf("await appliquerLeReleveDePrix(prisma)"));
  });
});
