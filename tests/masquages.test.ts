// Ce que le gérant a fait masquer « pour le moment » le 15 novembre 2026 : le poisson surgelé (« je ne fais pas »),
// sept boissons que Wolt n'affiche plus, et les 339 articles qu'aucune de ses captures de Wolt ne montrait.
// Masqués, jamais supprimés ; une seule fois ; ce qu'il remet en vente ensuite y reste.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { BOISSONS_PLUS_SUR_WOLT, MASQUAGES, POISSON_SURGELE, SANS_PHOTO_DE_WOLT } from "../prisma/masquages-1115";
import { ABSENTS_DE_WOLT } from "../prisma/absents-de-wolt";
import { ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import { LOTS_WOLT, RELEVES_DE_PRIX } from "../prisma/remplissage";
import { REMPLACEMENTS_DU_12_NOVEMBRE } from "../prisma/releve-wolt-1112";
import { photoRepere } from "@/lib/reperes-wolt";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
const wolt = new Map(LOTS_WOLT.flatMap((l) => l.articles).filter((a) => !a.horsLigne).map((a) => [a.nom, a]));
const liste = new Map(ARTICLES_MIS_EN_VENTE.map((a) => [a.nom, a]));
const releves = new Set(RELEVES_DE_PRIX.flatMap((r) => r.lignes).map((l) => l.nom));
const tous = (m: { releves: string[]; deLaListe: string[] }) => [...m.releves, ...m.deLaListe];

describe("masquages du 15 novembre", () => {
  it("chaque nom est celui d'un article que le code a mis en vente : relevé sur Wolt, ou de la liste du gérant", () => {
    const remplaces = new Map(REMPLACEMENTS_DU_12_NOVEMBRE.map((r) => [r.nom, r]));
    for (const m of MASQUAGES) {
      for (const nom of m.releves) expect(wolt.has(nom) || releves.has(nom) || remplaces.has(nom), `${m.titre} : ${nom}`).toBe(true);
      for (const nom of m.deLaListe) expect(liste.has(nom) && !releves.has(nom), `${m.titre} : ${nom}`).toBe(true);
      expect(new Set(tous(m)).size, m.titre).toBe(tous(m).length);
    }
    expect(new Set(MASQUAGES.map((m) => m.cle)).size).toBe(MASQUAGES.length);
    // Rien de ce qui est supprimé par ailleurs, ni de la viande (déjà retirée).
    const supprimes = new Set(ABSENTS_DE_WOLT.flatMap((l) => [...l.deLaListe, ...l.releves]));
    for (const nom of MASQUAGES.flatMap(tous)) {
      expect(supprimes.has(nom), nom).toBe(false);
      expect(VIANDE_ET_VOLAILLE, nom).not.toContain(nom);
    }
  });

  it("le poisson surgelé : 22 articles, tous surgelés ; le poisson frais, fumé ou en bocal reste en vente", () => {
    expect(tous(POISSON_SURGELE)).toHaveLength(22);
    const POISSON = /saumon|tilapia|dorade|bar\b|merlu|truite|cabillaud|rouget|poisson/i;
    for (const nom of tous(POISSON_SURGELE)) expect(POISSON.test(nom), nom).toBe(true);
    // Tout article de poisson dont le nom dit « surgelé » y est.
    const surgeles = [...wolt.keys(), ...liste.keys()].filter((n) => /surgel/i.test(n) && POISSON.test(n));
    expect(surgeles.filter((n) => !tous(POISSON_SURGELE).includes(n))).toEqual([]);
    for (const frais of ["Filet de saumon frais, environ 650 g", "Saumon fumé norvégien 100 g", "Filets de dorade frais × 2, environ 220 g", "Salade de hareng haché (forshmak) en bocal 270 g"]) {
      expect(MASQUAGES.flatMap(tous), frais).not.toContain(frais);
    }
    // Les autres surgelés que Wolt vend restent : glaces, pizzas.
    for (const garde of ["Pizza margherita Mamma Mia 470 g", "Mini pizzas Maadanot 650 g", "Glace Crunch vanille-nougat 100 g"]) expect(MASQUAGES.flatMap(tous), garde).not.toContain(garde);
  });

  it("sept boissons que Wolt n'affiche plus : elles gardent leur photo et leur prix, pour le jour où elles reviennent", () => {
    expect(tous(BOISSONS_PLUS_SUR_WOLT)).toHaveLength(7);
    const nomsWolt = new Map(RELEVES_DE_PRIX.flatMap((r) => r.lignes).map((l) => [l.nom, l.nomWolt]));
    for (const nom of BOISSONS_PLUS_SUR_WOLT.releves) {
      // Un article d'un lot de Wolt, ou un article de la liste dont le prix a été relevé sur Wolt le 12 novembre.
      const nomWolt = wolt.get(nom)?.nomWolt ?? nomsWolt.get(nom);
      expect(nomWolt, nom).toBeTruthy();
      expect((wolt.get(nom) ?? liste.get(nom))?.categorie, nom).toBe("Boissons");
      expect(photoRepere(nom, nomWolt), nom).not.toBeNull();
    }
  });

  it("les articles jamais vus sur ses captures : 339, dont 60 relevés sur Wolt et 279 de sa liste", () => {
    expect(SANS_PHOTO_DE_WOLT.releves).toHaveLength(60);
    expect(SANS_PHOTO_DE_WOLT.deLaListe).toHaveLength(279);
    // Aucun article qui a sa photo repère n'y est : ceux-là, Wolt les montre.
    for (const garde of ["Ketchup Heinz classique 700 g", "Canette Red Bull Energy Drink 25 cl", "Ferrero Rocher praliné × 16", "Bamba Osem classique 80 g"]) expect(tous(SANS_PHOTO_DE_WOLT), garde).not.toContain(garde);
    for (const masque of ["Pâtes Barilla Penne Rigate 500 g", "Lentilles corail rouges Sugat 500 g", "Barre chocolatée Snickers double 75 g"]) expect(SANS_PHOTO_DE_WOLT.deLaListe, masque).toContain(masque);
  });

  it("une seule fois par liste, dans la même transaction : on masque, on ne supprime pas ; un prix noté par le gérant protège l'article", () => {
    const source = lire("prisma/remplissage.ts");
    const debut = source.indexOf("export async function masquerCeQuiManque");
    const corps = source.slice(debut, source.indexOf("\n}\n", debut));
    for (const morceau of ["for (const m of MASQUAGES)", "operationFaite(prisma, m.cle)", "noterOperation(prisma, m.cle)", "$transaction",
      "where: { actif: true, OR: [{ nom: { in: m.releves } }, { nom: { in: m.deLaListe }, prixAchat: null }] }", "data: { actif: false }"]) expect(corps, morceau).toContain(morceau);
    expect(corps).not.toMatch(/delete|prix: \d/);
    const preparer = lire("prisma/preparer.ts");
    expect(preparer.indexOf("await masquerCeQuiManque(prisma)")).toBeGreaterThan(preparer.indexOf("await supprimerLesAbsentsDeWolt(prisma)"));
    expect(lire("tests/outils/base-complete.ts")).toContain("r.masquerCeQuiManque");
  });
});
