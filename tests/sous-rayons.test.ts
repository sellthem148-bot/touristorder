// Les sous-rayons : ce qui permet à un rayon de plusieurs centaines d'articles de rester facile à parcourir.
// Un article est rangé d'après son nom français ; chaque sous-rayon a son nom dans les cinq langues.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AUTRES, RAYONS_A_SOUS_RAYONS, clesDesRegles, grouperParSousRayon, photosDAbord, sansAccents, sousRayonDe, sousRayonsDe } from "@/lib/sous-rayons";
import { DICTIONNAIRES, dictionnaire } from "@/lib/i18n";
import { nomDuSousRayon } from "@/lib/i18n/rayons";
import { LANGUES } from "@/lib/langues";
import { slugDe } from "@/lib/slug";
import { ARTICLES_DE_LA_LISTE } from "../prisma/articles-liste";
import { CATALOGUE } from "../prisma/catalogue";
import { LOTS_WOLT } from "../prisma/remplissage";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
// Tous les articles que le code installe, avec l'adresse de leur rayon.
const ARTICLES = [...LOTS_WOLT.flatMap((l) => l.articles), ...ARTICLES_DE_LA_LISTE, ...CATALOGUE].map((a) => ({ nom: a.nom, rayon: slugDe(a.categorie) }));

describe("sous-rayons", () => {
  it("les règles s'écrivent sans accents ni lettres liées", () => {
    expect(sansAccents("Œufs bio à la crème FRAÎCHE")).toBe("oeufs bio a la creme fraiche");
  });

  it.each([
    ["boissons", "Eau minérale Neviot 1,5 L", "eaux"],
    ["boissons", "Sac de glaçons 2 kg", "eaux"],
    ["boissons", "Schweppes soda 1,5 L", "eaux"],
    ["boissons", "Eau aromatisée pêche Neviot+ 1,5 L", "eaux-aromatisees"],
    ["boissons", "Coca-Cola Zero canette 33 cl", "colas"],
    ["boissons", "Schweppes Eau Tonique 1,5 L", "sodas"],
    ["boissons", "Soda pamplemousse Fever-Tree 20 cl", "sodas"],
    ["boissons", "Prigat orange 1,5 L", "jus"],
    ["boissons", "Fuze Tea pêche 1,5 L", "thes-glaces"],
    ["boissons", "Canette Red Bull Energy Drink 25 cl", "energie"],
    ["boissons", "Sirop SodaStream Pepsi 44 cl", "sirops"],
    ["boissons", "Bière Corona 6 × 35,5 cl", "alcools"],
    ["boissons", "Mogu Mogu litchi 32 cl", AUTRES],
    // La première règle qui reconnaît le nom l'emporte.
    ["cremerie-oeufs", "Lait chocolaté Yotvata 1 L", "boissons-lactees"],
    ["cremerie-oeufs", "Lait Tnuva 3 % 1 L", "lait"],
    ["cremerie-oeufs", "Sauce rosée au mascarpone Gad 250 g", "beurre-creme"],
    ["cremerie-oeufs", "Crème dessert HaGolan vanille 125 g", "desserts"],
    ["cremerie-oeufs", "Dessert au fromage Daniela fraise", "desserts"],
    ["cremerie-oeufs", "Fromage blanc Tnuva 5 % 500 g", "fromages"],
    ["cremerie-oeufs", "Yaourt à boire protéiné GO nature 500 g", "yaourts"],
    ["cremerie-oeufs", "Œufs bio calibre L × 12", "oeufs"],
    ["courses-epicerie", "Maïs doux en grains sans sucre ajouté 340 g", "conserves"],
    ["courses-epicerie", "Sucre blanc 1 kg", "petit-dejeuner"],
    ["courses-epicerie", "Capsules Nespresso Volluto 45 g", "cafe-the"],
    ["courses-epicerie", "Feuilles de vigne farcies au riz Willi Food 360 g", "conserves"],
    ["fruits-legumes", "Pommes de terre Butter 1,3 kg", "legumes"],
    ["fruits-legumes", "Pommes Granny Smith 1 kg", "fruits"],
    ["fruits-legumes", "Menthe fraîche Nana, la botte", "herbes-salades"],
    ["apero-snacks", "Rouleaux gaufrettes noix de coco 150 g", "biscuits"],
    ["apero-snacks", "Noix de cajou crues 150 g", "fruits-secs"],
    ["chargeurs-electronique", "Câble d'origine pour iPhone USB-C vers Lightning 2 m", "chargeurs-cables"],
    ["chargeurs-electronique", "Support magnétique à ventouse pour smartphone Magic Mount", "accessoires"],
    ["chargeurs-electronique", "Verre trempé OtterBox iPhone 17/18 Pro", "protection"],
    ["chargeurs-electronique", "Enceinte portable JBL Go 4 noir", "audio"],
    // Le rayon « Boucherie & poisson » d'une base ancienne se range comme « Poisson ».
    ["poisson", "Filet de saumon fumé 200 g", "fume-sale"],
    ["boucherie-poisson", "Filet de saumon fumé 200 g", "fume-sale"],
    // Un petit rayon, ou un rayon créé par le gérant : pas de sous-rayons.
    ["bebe-enfants", "Couches Huggies", AUTRES],
    ["rayon-du-gerant", "N'importe quoi", AUTRES],
  ])("%s · %s → %s", (rayon, nom, attendu) => {
    expect(sousRayonDe(rayon, nom)).toBe(attendu);
  });

  it("chaque sous-rayon qu'une règle peut rendre a sa place dans l'ordre d'affichage, et inversement", () => {
    for (const [rayon, ordre] of Object.entries(RAYONS_A_SOUS_RAYONS)) {
      expect(new Set(ordre).size, rayon).toBe(ordre.length);
      expect([...clesDesRegles(rayon)].sort(), rayon).toEqual([...ordre].sort());
      expect(ordre, rayon).not.toContain(AUTRES);
    }
  });

  it.each(LANGUES)("%s : chaque sous-rayon a son nom, et aucun nom ne traîne", (langue) => {
    const noms = DICTIONNAIRES[langue].sousRayons as Record<string, Record<string, string>>;
    const attendus = Object.fromEntries(Object.entries(RAYONS_A_SOUS_RAYONS).filter(([rayon]) => rayon !== "boucherie-poisson").map(([rayon, cles]) => [rayon, [...cles].sort()]));
    expect(Object.fromEntries(Object.entries(noms).map(([rayon, n]) => [rayon, Object.keys(n).sort()]))).toEqual(attendus);
    for (const n of Object.values(noms)) for (const nom of Object.values(n)) expect(nom.trim().length).toBeGreaterThan(2);
    const t = dictionnaire(langue);
    expect(nomDuSousRayon("boissons", "colas", t)).toBe(noms.boissons.colas);
    expect(nomDuSousRayon("boucherie-poisson", "frais", t)).toBe(noms.poisson.frais);
    // « Autres », et tout ce qu'on ne connaît pas.
    expect(nomDuSousRayon("boissons", AUTRES, t)).toBe(t.categorie.autres);
    expect(nomDuSousRayon("rayon-du-gerant", "truc", t)).toBe(t.categorie.autres);
  });

  it("presque tous les articles du catalogue sont rangés : « Autres » reste une exception", () => {
    for (const rayon of Object.keys(RAYONS_A_SOUS_RAYONS).filter((r) => r !== "boucherie-poisson")) {
      const duRayon = ARTICLES.filter((a) => a.rayon === rayon || (rayon === "poisson" && a.rayon === "boucherie-poisson"));
      expect(duRayon.length, rayon).toBeGreaterThan(10);
      const autres = duRayon.filter((a) => sousRayonDe(rayon, a.nom) === AUTRES).map((a) => a.nom);
      expect(autres.length / duRayon.length, `${rayon} : ${autres.join(" | ")}`).toBeLessThan(0.05);
      // Chaque sous-rayon sert à quelque chose.
      for (const cle of sousRayonsDe(rayon)) expect(duRayon.some((a) => sousRayonDe(rayon, a.nom) === cle), `${rayon} / ${cle}`).toBe(true);
    }
  });

  it("grouper : l'ordre d'affichage du rayon, « Autres » en dernier, chaque article à sa place dans son groupe", () => {
    const articles = [
      { nom: "a", sousRayon: "sodas" }, { nom: "b", sousRayon: AUTRES }, { nom: "c", sousRayon: "eaux" },
      { nom: "d", sousRayon: "sodas" }, { nom: "e", sousRayon: "inconnu" },
    ];
    expect(grouperParSousRayon("boissons", articles).map((g) => [g.cle, g.articles.map((a) => a.nom).join("")])).toEqual([["eaux", "c"], ["sodas", "ad"], [AUTRES, "be"]]);
    // Un rayon sans sous-rayons : un seul groupe.
    expect(grouperParSousRayon("bebe-enfants", [{ nom: "x", sousRayon: AUTRES }]).map((g) => g.cle)).toEqual([AUTRES]);
    expect(grouperParSousRayon("boissons", [])).toEqual([]);
  });

  it("les articles avec photo passent d'abord, sans changer l'ordre de chaque groupe", () => {
    const articles = [{ nom: "a", photoUrl: "" }, { nom: "b", photoUrl: "/b.jpg" }, { nom: "c", photoUrl: "" }, { nom: "d", photoUrl: "/d.jpg" }];
    expect(photosDAbord(articles).map((a) => a.nom).join("")).toBe("bdac");
    expect(articles.map((a) => a.nom).join("")).toBe("abcd");
  });

  it("le sous-rayon se lit sur le nom FRANÇAIS de la base, avant sa traduction", () => {
    const source = lire("lib/catalogue.ts");
    const versPublic = source.slice(source.indexOf("function versPublic"), source.indexOf("// En ligne, avec un prix"));
    expect(versPublic).toContain("sousRayon: sousRayonDe(p.categorie.slug, p.nom)");
  });
});
