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

describe("articles de Dynamica (électronique)", () => {
  it("30 articles, tous dans « Chargeurs & électronique », aux prix du relevé", async () => {
    const { ARTICLES_DYNAMICA } = await import("../prisma/articles-dynamica");
    expect(ARTICLES_DYNAMICA).toHaveLength(30);
    for (const a of ARTICLES_DYNAMICA) {
      expect(a.categorie, a.nom).toBe("Chargeurs & électronique");
      expect(a.nom, a.nom).not.toMatch(/[֐-׿]/);
      expect(a.nom.length, a.nom).toBeLessThanOrEqual(120);
      expect(a.nomWolt.trim().length, a.nom).toBeGreaterThan(5);
      expect(a.description.trim().length, a.nom).toBeGreaterThan(0);
    }
    // Chaque prix, tel qu'il est affiché sur la page Wolt de la boutique.
    expect(Object.fromEntries(ARTICLES_DYNAMICA.map((a) => [a.nom, enAgorot(a.prix)]))).toEqual({
      "Chargeur Apple 20 W USB-C": 11900,
      "Chargeur Samsung 25 W + câble USB-C noir": 9900,
      "Chargeur USB-C 25 W blanc": 9900,
      "Chargeur rapide PureGear 45 W USB-C noir": 13900,
      "Batterie externe magnétique Samsung blanc": 19900,
      "Alimentation pour routeur noir": 5000,
      "Écouteurs filaires Samsung AKG jack 3,5 mm noir": 6900,
      "Écouteurs filaires d'origine Samsung AKG noir": 11900,
      "Écouteurs filaires d'origine Samsung AKG blanc": 11900,
      "Écouteurs sans fil Samsung Galaxy Buds Core noir": 29900,
      "Écouteurs sans fil Samsung Galaxy Buds Core blanc": 29900,
      "Étui silicone pour AirPods 4 rose": 4900,
      "Enceinte Bluetooth JBL Grip noir": 23900,
      "Enceinte Bluetooth JBL Flip 7 rouge": 31900,
      "Enceinte Bluetooth JBL Charge 6 rouge": 45500,
      "Samsung Galaxy A07 64 Go noir": 52900,
      "Tablette Samsung Galaxy Tab A11 8,7 pouces Wi-Fi gris": 59900,
      "Verre trempé PG Glass iPhone 16/17/18 Pro Max": 9900,
      "Verre trempé anti-regards PG Glass iPhone 17 Pro": 11900,
      "Verre trempé anti-regards PG Glass iPhone 17/18 Pro": 11900,
      "Verre trempé anti-regards PG Glass iPhone 17/18 Pro Max": 11900,
      "Verre trempé OtterBox iPhone 17/18 Pro": 11900,
      "Verre trempé OtterBox iPhone 17/18 Pro Max": 11900,
      "Coque transparente Hard Shell iPhone 17/18 Pro": 9900,
      "Coque MagSafe transparente Dualtek iPhone 17 Pro Max": 14900,
      "Kit Samsung Galaxy S25 : coque React + verre trempé": 17900,
      "Manette PS5 DualSense rouge": 32900,
      "Casque sans fil PS5 Pulse Elite noir": 59900,
      "Manette Xbox sans fil rouge": 29900,
      "Télécommande MB Pro pour décodeur MasterBox": 5900,
    });
  });

  it("tous lots confondus : aucun nom en double, ni entre eux ni avec la base du catalogue", async () => {
    const { LOTS_WOLT } = await import("../prisma/remplissage");
    const tous = LOTS_WOLT.flatMap((l) => l.articles);
    expect(tous).toHaveLength(207);
    expect(new Set(tous.map((a) => a.nom)).size).toBe(tous.length);
    expect(new Set(tous.map((a) => a.nomWolt)).size).toBe(tous.length);
    const rayons = new Set<string>([...CATEGORIES.map((c) => c.nom), ...CATEGORIES_WOLT.map((c) => c.nom)]);
    for (const a of tous) expect(rayons.has(a.categorie), `${a.nom} → ${a.categorie}`).toBe(true);
    const restants = new Set(CATALOGUE.filter((a) => !REMPLACES_PAR_WOLT.has(a.nom)).map((a) => a.nom));
    expect(tous.filter((a) => restants.has(a.nom)).map((a) => a.nom)).toEqual([]);
    expect(new Set(LOTS_WOLT.map((l) => l.boutique)).size).toBe(LOTS_WOLT.length);
  });
});
