// Ce que Wolt ne vend pas est supprimé du site (décision du gérant, 15 novembre 2026 : « je ne peux pas faire des
// produits que Wolt n'a pas »). Seulement d'après la page ENTIÈRE d'un rayon ; une seule fois ; jamais un article
// que Wolt affichait lors d'un relevé et que le gérant n'a pas vu dans la liste.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ABSENTS_DE_WOLT, BOISSONS_ABSENTES } from "../prisma/absents-de-wolt";
import { ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { BOISSONS_GARDEES } from "../prisma/allegement-boissons";
import { INTROUVABLES_SUR_WOLT } from "../prisma/allegement-cremerie";
import { LOTS_WOLT, RELEVES_DE_PRIX } from "../prisma/remplissage";
import { photoRepere } from "@/lib/reperes-wolt";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
const wolt = LOTS_WOLT.flatMap((l) => l.articles);

describe("boissons que Wolt ne vend pas (page entière du rayon, 15 novembre)", () => {
  it("seize boissons : quinze de la liste du gérant, restées au prix de sa liste, et un pack du premier relevé", () => {
    expect(BOISSONS_ABSENTES.deLaListe).toHaveLength(15);
    expect(BOISSONS_ABSENTES.releves).toEqual(["Pepsi Zero canettes 6 × 33 cl"]);
    const liste = new Map(ARTICLES_MIS_EN_VENTE.map((a) => [a.nom, a]));
    for (const nom of BOISSONS_ABSENTES.deLaListe) expect(liste.get(nom)?.categorie, nom).toBe("Boissons");
    for (const nom of BOISSONS_ABSENTES.releves) expect(wolt.find((a) => a.nom === nom)?.categorie, nom).toBe("Boissons");
    const tous = [...BOISSONS_ABSENTES.deLaListe, ...BOISSONS_ABSENTES.releves];
    expect(new Set(tous).size).toBe(16);
  });

  it("aucune n'a été vue sur Wolt depuis : ni photo repère, ni prix relevé, ni place dans la sélection vérifiée", () => {
    const releves = new Set(RELEVES_DE_PRIX.flatMap((r) => r.lignes).map((l) => l.nom));
    for (const nom of [...BOISSONS_ABSENTES.deLaListe, ...BOISSONS_ABSENTES.releves]) {
      const nomWolt = wolt.find((a) => a.nom === nom)?.nomWolt ?? "";
      expect(photoRepere(nom, nomWolt), nom).toBeNull();
      expect(releves.has(nom), nom).toBe(false);
      expect(BOISSONS_GARDEES, nom).not.toContain(nom);
      expect(INTROUVABLES_SUR_WOLT, nom).not.toContain(nom);
    }
    // Un article de la liste que Wolt vend n'y est pas : les canettes relevées le même jour restent en vente.
    for (const garde of ["Canette Red Bull Sugarfree 25 cl", "Canette Monster Energy Ultra White 50 cl", "Canette Red Bull Energy Drink 25 cl"]) {
      expect(BOISSONS_ABSENTES.deLaListe, garde).not.toContain(garde);
    }
    // Ni une boisson que Wolt affichait le 12 novembre et plus le 15 (elle a son nom exact et sa photo) : signalée au gérant, pas supprimée.
    for (const signalee of ["Boisson maltée Nesher Malt 1,5 L", "Eau gazeuse San Pellegrino 75 cl", "Schweppes pêche légèrement pétillant 1,5 L"]) {
      expect([...BOISSONS_ABSENTES.deLaListe, ...BOISSONS_ABSENTES.releves], signalee).not.toContain(signalee);
    }
  });

  it("une seule fois par liste, dans la même transaction ; un article dont le gérant a noté le prix d'achat est gardé", () => {
    const source = lire("prisma/remplissage.ts");
    const debut = source.indexOf("export async function supprimerLesAbsentsDeWolt");
    const corps = source.slice(debut, source.indexOf("\n}\n", debut));
    for (const morceau of ["for (const liste of ABSENTS_DE_WOLT)", "operationFaite(prisma, liste.cle)", "noterOperation(prisma, liste.cle)", "$transaction",
      "prisma.produit.deleteMany({ where: { OR: [{ nom: { in: liste.deLaListe }, prixAchat: null }, { nom: { in: liste.releves } }] } })"]) expect(corps, morceau).toContain(morceau);
    expect(new Set(ABSENTS_DE_WOLT.map((l) => l.cle)).size).toBe(ABSENTS_DE_WOLT.length);
    // Une commande passée garde sa ligne : le lien vers l'article se vide, rien d'autre.
    expect(lire("prisma/schema.prisma")).toMatch(/produit\s+Produit\?\s+@relation\(fields: \[produitId\], references: \[id\], onDelete: SetNull\)/);
  });

  it("la mise en ligne l'applique en dernier, après les relevés et les remises en vente ; la base d'essai suit le même chemin", () => {
    const preparer = lire("prisma/preparer.ts");
    const ordre = ["appliquerLeReleveDePrix(prisma)", "remettreEnVenteLesRayons(prisma)", "supprimerLesIntrouvables(prisma)", "supprimerLesAbsentsDeWolt(prisma)"].map((appel) => preparer.indexOf(`await ${appel}`));
    expect(ordre.every((i) => i > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    expect(lire("tests/outils/base-complete.ts")).toContain("r.supprimerLesAbsentsDeWolt");
  });
});
