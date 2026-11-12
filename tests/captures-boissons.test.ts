// Les articles ajoutés d'après les captures « boissons », « électronique » et « Nespresso » du gérant (12 novembre 2026).
import { describe, expect, it } from "vitest";
import { ARTICLES_WOLT_BOISSONS_ET_ELECTRONIQUE, RELEVE_DES_BOISSONS } from "../prisma/articles-wolt-captures-boissons";
import { ARTICLES_DE_LA_LISTE } from "../prisma/articles-liste";
import { ARTICLES_DE_LA_LISTE_DYNAMICA } from "../prisma/articles-liste-dynamica";
import { LOTS_WOLT, RELEVES_DE_PRIX } from "../prisma/remplissage";
import { PHOTOS_REPERE } from "@/lib/reperes-wolt";

const LOT = ARTICLES_WOLT_BOISSONS_ET_ELECTRONIQUE;
// « מ״ל » ou « מ"ל » : le même nom, aux guillemets près.
const norme = (t: string) => t.replace(/״/g, '"').replace(/׳/g, "'").trim();
const prixDe = (nom: string) => LOT.find((a) => a.nom === nom)?.prix;

describe("captures du 12 novembre : boissons, électronique, capsules Nespresso", () => {
  it("189 articles, rangés dans quatre rayons", () => {
    expect(LOT).toHaveLength(189);
    const parRayon = (rayon: string) => LOT.filter((a) => a.categorie === rayon).length;
    expect([parRayon("Boissons"), parRayon("Maison & entretien"), parRayon("Chargeurs & électronique"), parRayon("Courses & épicerie")]).toEqual([117, 9, 51, 12]);
    for (const a of LOT) {
      expect(a.nom.trim().length, a.nomWolt).toBeGreaterThan(5);
      expect(a.description.trim().length, a.nom).toBeGreaterThan(10);
      expect(a.nomWolt, a.nom).toMatch(/[֐-׿]/);
      expect(a.prix, a.nom).toBeGreaterThan(0);
      // Rien n'est installé hors ligne : aucune boisson alcoolisée dans ces captures.
      expect(a.horsLigne, a.nom).toBeUndefined();
    }
  });

  it("le prix est le prix NORMAL de Wolt : le prix barré quand la carte était en promotion", () => {
    expect(prixDe("Enceinte portable JBL Go 4 noir")).toBe(199); // affichée 149,00
    expect(prixDe("Tablette Xiaomi Redmi Pad 2 128 Go gris")).toBe(849); // affichée 749,00
    expect(prixDe("Machine à eau gazeuse SodaStream Terra blanche")).toBe(299); // affichée 199,00
    expect(prixDe("7UP 1,5 L")).toBe(8.5); // affiché 7,50
    expect(prixDe("Spring orange 1,5 L")).toBe(9.9); // affiché 8,90
    // Sans promotion : le prix affiché.
    expect(prixDe("Coca-Cola canette 33 cl")).toBe(7.5);
    expect(prixDe("Capsules Nespresso Volluto 45 g")).toBe(28.9);
    expect(prixDe("Apple AirTag × 1")).toBe(155); // la carte en promotion (129,00) et la carte normale : un seul article
  });

  it("aucun article que le site vendait déjà : ni par son nom sur Wolt (aux guillemets près), ni par son nom", () => {
    const autres = LOTS_WOLT.filter((l) => l.articles !== LOT).flatMap((l) => l.articles);
    expect(autres.length).toBe(556);
    const dejaSurWolt = new Set(autres.map((a) => norme(a.nomWolt)));
    expect(LOT.filter((a) => dejaSurWolt.has(norme(a.nomWolt))).map((a) => a.nom)).toEqual([]);
    expect(new Set(LOT.map((a) => norme(a.nomWolt))).size).toBe(LOT.length);
    const listes = new Set([...ARTICLES_DE_LA_LISTE, ...ARTICLES_DE_LA_LISTE_DYNAMICA].map((a) => a.nom));
    expect(LOT.filter((a) => listes.has(a.nom)).map((a) => a.nom)).toEqual([]);
  });

  it("les neuf boissons de la liste du gérant que la capture montre ne sont pas ajoutées en double : leur prix est relevé", () => {
    expect(RELEVE_DES_BOISSONS).toHaveLength(9);
    const liste = new Map(ARTICLES_DE_LA_LISTE.map((a) => [a.nom, a]));
    for (const l of RELEVE_DES_BOISSONS) {
      expect(liste.get(l.nom)?.categorie, l.nom).toBe("Boissons");
      expect(l.ancien, l.nom).toBe(liste.get(l.nom)!.prixIndicatif);
      expect(LOT.some((a) => norme(a.nomWolt) === norme(l.nomWolt)), l.nom).toBe(false);
    }
    expect(RELEVES_DE_PRIX.some((r) => r.lignes === RELEVE_DES_BOISSONS)).toBe(true);
  });

  it("chaque article a sa photo repère, sauf les huit dont la capture n'avait pas encore chargé la photo", () => {
    const avecPhoto = new Set(PHOTOS_REPERE.map((p) => p.nomWolt));
    const sansPhoto = LOT.filter((a) => !avecPhoto.has(a.nomWolt)).map((a) => a.nom);
    expect(sansPhoto.sort()).toEqual(
      [
        "Coca-Cola bouteille en verre 35 cl",
        "Sprite Zero 50 cl",
        "Tonic Fever-Tree 20 cl",
        "Sprite Zero canette 33 cl",
        "Nordic Mist soda menthe et zeste de citron 25 cl",
        "Coca-Cola cerise canette 35,5 cl",
        "Eau minérale gazeuse Borjomi 75 cl",
        "Eau minérale Ein Gedi 50 cl",
      ].sort(),
    );
    for (const l of RELEVE_DES_BOISSONS) expect(avecPhoto.has(l.nomWolt), l.nom).toBe(true);
  });
});
