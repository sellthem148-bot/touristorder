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
    expect(tous).toHaveLength(745); // 207 + 73 + les 3 du relevé du 12 novembre + les 273 des premières captures du gérant + les 189 des suivantes
    expect(new Set(tous.map((a) => a.nom)).size).toBe(tous.length);
    expect(new Set(tous.map((a) => a.nomWolt)).size).toBe(tous.length);
    // « Poisson » : le rayon « Boucherie & poisson » renommé quand la viande a été retirée.
    const rayons = new Set<string>([...CATEGORIES.map((c) => c.nom), ...CATEGORIES_WOLT.map((c) => c.nom), "Poisson"]);
    for (const a of tous) expect(rayons.has(a.categorie), `${a.nom} → ${a.categorie}`).toBe(true);
    const restants = new Set(CATALOGUE.filter((a) => !REMPLACES_PAR_WOLT.has(a.nom)).map((a) => a.nom));
    expect(tous.filter((a) => restants.has(a.nom)).map((a) => a.nom)).toEqual([]);
    expect(new Set(LOTS_WOLT.map((l) => l.nom)).size).toBe(LOTS_WOLT.length);
  });
});

describe("fiches produit de Wolt Market (11 novembre)", () => {
  it("73 articles, au prix normal de la fiche (le prix barré), jamais au prix promo", async () => {
    const { ARTICLES_WOLT_FICHES } = await import("../prisma/articles-wolt-fiches");
    expect(ARTICLES_WOLT_FICHES).toHaveLength(73);
    expect(Object.fromEntries(ARTICLES_WOLT_FICHES.map((a) => [a.nom, enAgorot(a.prix)]))).toEqual({
      "Pepsi 1,5 L": 850, // promo du jour : 7,50
      "Pepsi canettes 6 × 33 cl": 2190,
      "7UP Zero canettes 6 × 33 cl": 2190,
      "Prigat citron-menthe 1,5 L": 1050,
      "Prigat orange 1,5 L": 1050,
      "Prigat raisin 1,5 L": 1050,
      "Prigat fraise-banane 1,5 L": 1050,
      "Spring mangue 1,5 L": 990,
      "Spring raisin 1,5 L": 990,
      "Spring fruits tropicaux 1,5 L": 990,
      "San Pellegrino 1 L": 1150,
      "Lait chocolaté Tnuva 2,7 % 1 L": 1290,
      "Lait chocolaté sans sucre ajouté Tara 1 L": 1550, // 9,70
      "Lait sans lactose goût vanille Tara 2 % 1 L": 1430,
      "Boisson au soja Alpro Barista sans sucres 1 L": 1450,
      "Yaourt Müller Protein cacahuètes caramélisées 170 g": 900,
      "Mini Babybel × 5 (100 g)": 2590,
      "Mozzarella râpée Gad 22 % 300 g": 2990,
      "Burrata Gad 125 g": 2790,
      "Boule de mozzarella Piraeus 100 g": 1390,
      "Billes de mozzarella Meshek Yaakobs 18 % 150 g": 1640,
      "Fromage tzfatit doux Gad 5 % 200 g": 2090,
      "Fromage bulgare doux Piraeus 5 % 250 g": 2890,
      "Pains à hot-dog × 6": 1790,
      "Mini pains à hamburger Angel × 8": 1790,
      "Baguette blanche 340 g": 1500,
      "Pâte feuilletée Shimrit 300 g": 1950, // 15,00
      "Pâte filo Shimrit 300 g": 1950,
      "Pâte à pizza fine Shimrit 415 g": 1890,
      "Pastrami de dinde grillée Zoglobek 330 g": 3690, // 29,00
      "Pastrami au miel Zoglobek 330 g": 3690,
      "Chiffonnade de pastrami de dinde grillée Tirat Zvi 120 g": 1950,
      "Chiffonnade de pastrami au miel Tirat Zvi 120 g": 1950,
      "Houmous piquant Achla 400 g": 1350,
      "Salade d'aubergines piquante Achla 400 g": 1430,
      "Salade de thon du traiteur 250 g": 3080,
      "Salade d'aubergines à la mayonnaise du traiteur 250 g": 2640,
      "Feuilles de vigne farcies au riz Willi Food 360 g": 1750,
      "Pois chiches cuits Taam HaTeva 380 g": 990,
      "Tofu nature Alternative 300 g": 1470,
      "Pâtes Barilla conchiglie rigate 500 g": 990,
      "Sauce tomate Pomodoro Barilla 400 g": 1890, // 12,90
      "Mayonnaise hollandaise Master Chef 435 g": 1650,
      "Oreo vanille 176 g": 1190,
      "Oreo Double Crème 115 g": 1190,
      "Biscuits Milka au chocolat au lait 150 g": 1790,
      "Cookies Milka Sensations fourrés Oreo 156 g": 1790,
      "Gaufrettes Milka au cacao × 5 (150 g)": 1790,
      "Gâteaux moelleux Milka Soft Moo 140 g": 1790,
      "Cookies aux pépites de chocolat parvé 150 g": 850,
      "Biscuits roulés à la fraise Osem 300 g": 1450,
      "Chocolat au lait Elite Crunch biscuit 100 g": 1050,
      "Chocolat noir Elite Splendid 70 % 100 g": 1990,
      "Barres de céréales Slim Delice chocolat au lait × 6": 1650,
      "Barres de céréales Slim Delice chocolat blanc × 6": 1650,
      "Barres de céréales Slim Delice Kids chocolat blanc × 6": 1650,
      "Triangles soufflés betterave et sel de mer 30 g": 690,
      "Triangles soufflés pomme de terre et petits pois 30 g": 690,
      "Pop-corn Popco beurre et miel 80 g": 690,
      "Bonbons Yogueta rubans acidulés multifruits 50 g": 550,
      "Bonbons Yogueta rubans acidulés fraise 50 g": 550,
      "Bonbons Yogueta bâtonnets acidulés cola 50 g": 550,
      "Bonbons Yogueta serpents acidulés 150 g": 1390,
      "Magnum mini amandes × 5": 3690,
      "Magnum mini Duet chocolat-nougat 310 g": 3690,
      "Glace Crunch vanille-nougat 100 g": 1390,
      "Glace Crunch America nougat-cacahuète 100 g": 1390,
      "Couches Pampers Premium Care taille 5 × 24": 3950,
      "Papier toilette humide Lily × 4 paquets": 2550,
      "Lessive Ariel capsules taches difficiles × 23": 4090,
      "Lessive Ariel capsules parfum Lenor × 23": 4090,
      "Sacs poubelle XL extra-résistants Nicol × 20": 2990, // 21,90
      "Savon mains Palmolive lait et miel 300 ml": 1350,
    });
  });

  it("chaque fiche : un nom français, le nom sur Wolt, et une description qui commence par une phrase courte", async () => {
    const { ARTICLES_WOLT_FICHES } = await import("../prisma/articles-wolt-fiches");
    for (const a of ARTICLES_WOLT_FICHES) {
      expect(a.nom, a.nom).not.toMatch(/[֐-׿]/);
      expect(a.nom.length, a.nom).toBeLessThanOrEqual(120);
      expect(a.nomWolt, a.nom).toMatch(/[֐-׿]/);
      expect(a.nomWolt, a.nom).not.toMatch(/['"]/); // guérech et guerchaïm hébreux, comme dans les autres lots
      expect(a.description, a.nom).not.toMatch(/[֐-׿]/);
      expect(a.description, a.nom).not.toMatch(/\p{Extended_Pictographic}/u);
      expect(a.description, a.nom).toMatch(/[.!]$/);
      expect(a.description.length, a.nom).toBeLessThanOrEqual(220);
      // La liste n'affiche qu'une ligne : la première phrase doit y tenir.
      expect(a.description.split(/(?<=[.:]) /)[0].length, a.nom).toBeLessThanOrEqual(110);
      // Le site vouvoie : aucune fiche ne tutoie.
      expect(a.description, a.nom).not.toMatch(/(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu);
      expect(a.populaire, a.nom).toBeUndefined();
      expect(a.horsLigne, a.nom).toBeUndefined();
    }
  });

  it("« casher » n'est écrit que si la fiche le montre : jamais sur un article du traiteur ou de la boulangerie de Wolt", async () => {
    const { ARTICLES_WOLT_FICHES } = await import("../prisma/articles-wolt-fiches");
    const traiteur = ARTICLES_WOLT_FICHES.filter((a) => a.nomWolt.includes("דליקטסן"));
    expect(traiteur.map((a) => a.nom)).toEqual(["Baguette blanche 340 g", "Salade de thon du traiteur 250 g", "Salade d'aubergines à la mayonnaise du traiteur 250 g"]);
    for (const a of traiteur) expect(a.description, a.nom).not.toMatch(/casher/i);
    // Les fiches sans étiquette « casher » relevées le 11 novembre.
    const sansEtiquette = ARTICLES_WOLT_FICHES.filter((a) => !/casher/i.test(a.description)).map((a) => a.nom);
    expect(sansEtiquette).toHaveLength(22);
  });

  it("ce lot s'ajoute à la même boutique, après les articles déjà là, sans jamais passer pour déjà installé", async () => {
    const { LOTS_WOLT } = await import("../prisma/remplissage");
    const { ARTICLES_WOLT_FICHES } = await import("../prisma/articles-wolt-fiches");
    const lot = LOTS_WOLT.find((l) => l.articles === ARTICLES_WOLT_FICHES);
    expect(lot?.boutique).toBe(LOTS_WOLT[0].boutique);
    expect(lot?.ordre).toBeGreaterThan(ARTICLES_WOLT.length);
    // Un lot est tenu pour installé dès qu'un de ses noms Wolt existe : aucun ne doit venir d'un autre lot.
    const ailleurs = new Set(LOTS_WOLT.filter((l) => l !== lot).flatMap((l) => l.articles.map((a) => a.nomWolt)));
    expect(ARTICLES_WOLT_FICHES.filter((a) => ailleurs.has(a.nomWolt)).map((a) => a.nom)).toEqual([]);
  });

  it("les cinq articles déjà au catalogue reçoivent leur description enrichie, retrouvés par leur nom sur Wolt", async () => {
    const { DESCRIPTIONS_ENRICHIES } = await import("../prisma/articles-wolt-fiches");
    expect(DESCRIPTIONS_ENRICHIES).toHaveLength(5);
    for (const d of DESCRIPTIONS_ENRICHIES) {
      const article = ARTICLES_WOLT.find((a) => a.nomWolt === d.nomWolt);
      // Une base neuve reçoit le nouveau texte ; la production, restée à l'ancien, est mise à niveau.
      expect(article?.description, d.nomWolt).toBe(d.nouvelle);
      expect(d.ancienne, d.nomWolt).not.toBe(d.nouvelle);
      expect(d.nouvelle, d.nomWolt).not.toMatch(/(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu);
    }
    expect(new Set(DESCRIPTIONS_ENRICHIES.map((d) => d.nomWolt)).size).toBe(5);
  });
});
