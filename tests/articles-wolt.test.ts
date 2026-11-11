import { describe, expect, it } from "vitest";
import { ARTICLES_WOLT, CATEGORIES_WOLT, REMPLACES_PAR_WOLT, enAgorot } from "../prisma/articles-wolt";
import { CATALOGUE, CATEGORIES } from "../prisma/catalogue";
import { slugDe } from "@/lib/slug";

const prixDe = (nom: string) => {
  const a = ARTICLES_WOLT.find((x) => x.nom === nom);
  if (!a) throw new Error(`Article absent : ${nom}`);
  return enAgorot(a.prix);
};

describe("articles réels de Wolt Market", () => {
  it("177 articles, chacun avec un nom français, un nom Wolt (hébreu) et un prix", () => {
    expect(ARTICLES_WOLT).toHaveLength(177);
    for (const a of ARTICLES_WOLT) {
      expect(a.nom.trim().length, a.nom).toBeGreaterThanOrEqual(3);
      expect(a.nom.length, a.nom).toBeLessThanOrEqual(120);
      expect(a.nom, a.nom).not.toMatch(/[֐-׿]/); // le nom montré au client est en français
      expect(a.nomWolt, a.nom).toMatch(/[֐-׿]/);
      expect(a.description.trim().length, a.nom).toBeGreaterThan(0);
      expect(Number.isInteger(enAgorot(a.prix)), a.nom).toBe(true);
      expect(enAgorot(a.prix), a.nom).toBeGreaterThanOrEqual(300);
      expect(enAgorot(a.prix), a.nom).toBeLessThanOrEqual(20000);
    }
  });

  it("aucun doublon, ni de nom français ni de nom Wolt", () => {
    expect(new Set(ARTICLES_WOLT.map((a) => a.nom)).size).toBe(ARTICLES_WOLT.length);
    expect(new Set(ARTICLES_WOLT.map((a) => a.nomWolt)).size).toBe(ARTICLES_WOLT.length);
  });

  it("chaque article est rangé dans un rayon qui existe", () => {
    const rayons = new Set<string>([...CATEGORIES.map((c) => c.nom), ...CATEGORIES_WOLT.map((c) => c.nom)]);
    for (const a of ARTICLES_WOLT) expect(rayons.has(a.categorie), `${a.nom} → ${a.categorie}`).toBe(true);
    // Les quatre nouveaux rayons ont tous des articles, et une adresse lisible.
    for (const c of CATEGORIES_WOLT) expect(ARTICLES_WOLT.some((a) => a.categorie === c.nom), c.nom).toBe(true);
    expect(CATEGORIES_WOLT.map((c) => slugDe(c.nom))).toEqual(["cremerie-oeufs", "pain-patisserie", "boucherie-poisson", "surgeles-glaces"]);
  });

  it("les articles « à compléter » remplacés existent bien dans la base, et il ne reste aucun nom en double", () => {
    const base = new Set(CATALOGUE.map((a) => a.nom));
    for (const nom of REMPLACES_PAR_WOLT) expect(base.has(nom), nom).toBe(true);
    const restants = CATALOGUE.filter((a) => !REMPLACES_PAR_WOLT.has(a.nom)).map((a) => a.nom);
    const wolt = new Set(ARTICLES_WOLT.map((a) => a.nom));
    expect(restants.filter((nom) => wolt.has(nom))).toEqual([]);
  });

  it("les prix sont ceux du relevé Wolt", () => {
    expect(prixDe("Œufs calibre L × 12")).toBe(1454);
    expect(prixDe("Lait Tnuva 3 % 1 L")).toBe(735);
    expect(prixDe("Pain tranché Angel 900 g")).toBe(996);
    expect(prixDe("Fromage blanc Tnuva 5 % 500 g")).toBe(1174);
    expect(prixDe("Crème à fouetter Tnuva 38 % 50 cl")).toBe(1528);
    expect(prixDe("Coca-Cola 1,5 L")).toBe(950);
    expect(prixDe("Cheesecake Lotus Daniel Amit 1 kg")).toBe(16900);
    expect(prixDe("Nutella 400 g")).toBe(2390);
    expect(prixDe("Lait infantile Materna Extra Care 2e âge 700 g")).toBe(6990);
    expect(prixDe("Papier toilette Lily Mega Roll × 24")).toBe(4990);
  });

  it("un article en promotion chez Wolt garde son prix normal, pas le prix promo", () => {
    expect(prixDe("Concombres 1 kg")).toBe(1490); // promo du jour : 13,90
    expect(prixDe("Avocats mûrs × 2")).toBe(1590); // 12,90
    expect(prixDe("Filet de saumon frais, environ 650 g")).toBe(9898); // 84,14
    expect(prixDe("Entrecôte de bœuf fraîche, environ 500 g")).toBe(14864); // 126,35
    expect(prixDe("Sacs poubelle très grands Nicol × 20")).toBe(2990); // 21,90
    expect(prixDe("Vin blanc sec Segal 75 cl")).toBe(2690); // 25,90
  });

  it("les articles vendus au poids le disent au client", () => {
    const auPoids = ARTICLES_WOLT.filter((a) => a.environ);
    expect(auPoids).toHaveLength(13);
    for (const a of auPoids) {
      expect(a.nom, a.nom).toMatch(/environ/);
      expect(a.description, a.nom).toMatch(/Vendu au poids/);
    }
  });

  it("l'alcool est installé hors ligne : c'est le gérant qui décide de le vendre", () => {
    const horsLigne = ARTICLES_WOLT.filter((a) => a.horsLigne).map((a) => a.nom);
    expect(horsLigne).toEqual(["Bière Corona 6 × 35,5 cl", "Vin blanc sec Segal 75 cl"]);
  });
});

describe("slug", () => {
  it("les lettres liées sont dépliées", () => {
    expect(slugDe("Crèmerie & œufs")).toBe("cremerie-oeufs");
    expect(slugDe("Bébé & enfants")).toBe("bebe-enfants");
    expect(slugDe("Œufs × 12")).toBe("oeufs-12");
  });
});

describe("fiche produit : le nom sur Wolt", () => {
  it("accepte un nom en hébreu, refuse un nom démesuré", async () => {
    const { produitSchema } = await import("@/lib/admin-schemas");
    const base = { nom: "Lait Tnuva 3 % 1 L", description: "", prix: "7,35", prixAchat: "7,35", categorieId: "c1", boutique: "Wolt Market", lienWolt: "", ordre: "0", actif: true, epuise: false, badge: "", prixBarre: "", options: "" };
    const ok = produitSchema.safeParse({ ...base, nomWolt: "  חלב תנובה מהדרין 3% 1 ליטר  " });
    expect(ok.success).toBe(true);
    if (ok.success) expect(ok.data.nomWolt).toBe("חלב תנובה מהדרין 3% 1 ליטר");
    expect(produitSchema.safeParse({ ...base, nomWolt: "א".repeat(201) }).success).toBe(false);
  });
});
