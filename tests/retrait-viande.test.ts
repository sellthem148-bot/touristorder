import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_DE_LA_LISTE, ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { ARTICLES_DE_LA_LISTE_DYNAMICA } from "../prisma/articles-liste-dynamica";
import { ARTICLES_DYNAMICA } from "../prisma/articles-dynamica";
import { enAgorot } from "../prisma/articles-wolt";
import { CATALOGUE } from "../prisma/catalogue";
import { POISSONS_GARDES, RAYON_BOUCHERIE, VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";

const source = readFileSync(path.join(__dirname, "..", "prisma/remplissage.ts"), "utf8");
const corpsDe = (nom: string) => {
  const debut = source.indexOf(`export async function ${nom}`);
  if (debut < 0) throw new Error(`Fonction absente : ${nom}`);
  const fin = source.indexOf("\nexport ", debut + 1);
  return source.slice(debut, fin < 0 ? undefined : fin);
};
const leCatalogue = async () => {
  const { LOTS_WOLT } = await import("../prisma/remplissage");
  return [...LOTS_WOLT.flatMap((l) => l.articles), ...ARTICLES_DE_LA_LISTE];
};

describe("plus de viande ni de volaille (décision du gérant : cacherout)", () => {
  it("40 articles retirés, tous présents au catalogue, aucun en double", async () => {
    const noms = new Set((await leCatalogue()).map((a) => a.nom));
    expect(VIANDE_ET_VOLAILLE).toHaveLength(40);
    expect(new Set(VIANDE_ET_VOLAILLE).size).toBe(40);
    expect(VIANDE_ET_VOLAILLE.filter((n) => !noms.has(n))).toEqual([]);
  });

  it("au rayon boucherie il ne reste que du poisson", async () => {
    const rayon = (await leCatalogue()).filter((a) => a.categorie === RAYON_BOUCHERIE).map((a) => a.nom);
    const retires = new Set(VIANDE_ET_VOLAILLE);
    expect(rayon.filter((n) => !retires.has(n)).sort()).toEqual([...POISSONS_GARDES].sort());
    for (const p of POISSONS_GARDES) expect(p, p).toMatch(/saumon|truite/i);
  });

  it("aucun autre article du catalogue n'est de la viande : ce qui y ressemble est végétarien, du pain, du poisson ou pour un animal", async () => {
    const retires = new Set(VIANDE_ET_VOLAILLE);
    const suspects = (await leCatalogue())
      .filter((a) => !retires.has(a.nom))
      .filter((a) => /poulet|b(œ|oe)uf|viande|dinde|agneau|veau|saucisse|pastrami|salami|jambon|bacon|schnitzel|burger|nugget|boulette|kabana|pargit|steak|foie|merguez|kebab|entrec[ôo]te|volaille|canard/i.test(a.nom))
      .map((a) => a.nom);
    expect(suspects.sort()).toEqual(
      [
        "Pains à hamburger × 6",
        "Mini pains à hamburger Angel × 8",
        "Pain à burger brioché × 4",
        "Steaks végétaux Beyond Burger Beyond Meat × 4",
        "Schnitzel de maïs végétarien Tivall 750 g",
        "Boulettes de falafel surgelées Tivall 500 g",
        "Croquettes chien adulte Purina One bœuf 1,5 kg",
        "Croquettes chat adulte Purina One poulet 800 g",
        // Du poisson (captures du rayon poisson, 12 novembre) : le poisson reste au catalogue.
        "Merlu pané surgelé façon schnitzel, environ 480 g",
        "Nuggets de merlu en tempura surgelés, environ 500 g",
        "Kebabs de poisson 400 g",
        "Schnitzel de filet de tilapia pané 450 g",
        "Nuggets de filet de poisson en tempura 450 g",
      ].sort(),
    );
  });

  it("les articles sont masqués, jamais supprimés, et une seule fois : ce que le gérant remet en ligne y reste", () => {
    const corps = corpsDe("retirerLaViande");
    expect(corps).toMatch(/if \(faite\) return/);
    expect(corps).toMatch(/data: \{ actif: false \}/);
    expect(corps).toMatch(/noterOperation\(prisma, CLE_RETRAIT_VIANDE\)/);
    expect(corps).toMatch(/\$transaction\(\[/);
    expect(corps).not.toMatch(/delete/i);
    // Un article de Wolt est retrouvé par son nom sur Wolt : le gérant a pu le renommer.
    expect(corps).toMatch(/nomWolt: \{ in: nomsWolt \}/);
    // Le rayon n'est renommé que s'il porte encore son nom de départ, et si « Poisson » est libre.
    expect(corps).toMatch(/where: \{ nom: RAYON_BOUCHERIE \}/);
    expect(corps).toMatch(/pris === 0/);
  });

  it("un rayon que le gérant renomme ne revient pas en double : les rayons ne sont créés qu'au moment d'installer", () => {
    const corps = corpsDe("installerLesArticlesWolt");
    expect(corps).not.toMatch(/categorie\.upsert/);
    expect(corps.indexOf("rayonsDe(prisma")).toBeGreaterThan(corps.indexOf("if (dejaLa > 0)"));
  });
});

describe("liste « Dynamica Store » du gérant", () => {
  it("148 articles d'électronique, « à compléter » : un nom unique, un prix indicatif, une description", async () => {
    const { LOTS_WOLT } = await import("../prisma/remplissage");
    expect(ARTICLES_DE_LA_LISTE_DYNAMICA).toHaveLength(148);
    expect(new Set(ARTICLES_DE_LA_LISTE_DYNAMICA.map((a) => a.nom)).size).toBe(148);
    const dejaLa = new Set([...LOTS_WOLT.flatMap((l) => l.articles.map((a) => a.nom)), ...CATALOGUE.map((a) => a.nom), ...ARTICLES_DE_LA_LISTE.map((a) => a.nom)]);
    expect(ARTICLES_DE_LA_LISTE_DYNAMICA.filter((a) => dejaLa.has(a.nom)).map((a) => a.nom)).toEqual([]);
    for (const a of ARTICLES_DE_LA_LISTE_DYNAMICA) {
      expect(a.categorie, a.nom).toBe("Chargeurs & électronique");
      expect(a.nom.length, a.nom).toBeLessThanOrEqual(120);
      expect(a.nom, a.nom).not.toMatch(/\d(GB|TB)\b|"/); // « 128 Go », « 11 pouces »
      expect(a.description, a.nom).toMatch(/[.!?]$/);
      expect(a.description.length, a.nom).toBeLessThanOrEqual(200);
      expect(a.description, a.nom).not.toMatch(/(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu);
      expect(Number.isInteger(a.prixIndicatif), a.nom).toBe(true);
      expect(a.prixIndicatif, a.nom).toBeGreaterThanOrEqual(89);
      expect(a.prixIndicatif, a.nom).toBeLessThanOrEqual(8299);
      expect(a.garantie?.length, a.nom).toBeGreaterThan(5);
      // La garantie annoncée, invérifiable, n'est écrite nulle part où un client la lirait.
      expect(a.description, a.nom).not.toMatch(/importateur|garantie (dynamica|apple|samsung|puregear|otterbox)|\(\d+ ans?\)/i);
    }
  });

  it("les deux chargeurs que le site vend déjà au prix de la boutique ne sont pas repris", () => {
    const vendus = ARTICLES_DYNAMICA.map((a) => a.nom);
    expect(vendus).toContain("Chargeur Apple 20 W USB-C");
    expect(vendus).toContain("Chargeur USB-C 25 W blanc");
    const noms = ARTICLES_DE_LA_LISTE_DYNAMICA.map((a) => a.nom);
    expect(noms.filter((n) => /adaptateur secteur usb-c 20/i.test(n) || /chargeur secteur standard 25/i.test(n))).toEqual([]);
    // Ce que la liste annonçait pour eux : 99 et 89 ₪, contre 119 et 99 ₪ relevés en boutique.
    expect(enAgorot(ARTICLES_DYNAMICA.find((a) => a.nom === "Chargeur Apple 20 W USB-C")!.prix)).toBe(11900);
  });

  it("elle est installée sans prix de vente, masquée, une seule fois — et rien ne la met en vente", () => {
    const corps = corpsDe("installerLaListeDynamica");
    expect(corps).toMatch(/if \(faite\) return/);
    expect(corps).toMatch(/articlesACompleter\(prisma, ARTICLES_DE_LA_LISTE_DYNAMICA/);
    expect(corps).toMatch(/noterOperation\(prisma, CLE_LISTE_DYNAMICA\)/);
    // « à compléter » : prix 0, masqué, le prix de la liste gardé à part (fonction partagée avec la première liste).
    const pose = corpsDe("installerLaListeDuGerant");
    expect(pose).toMatch(/prix: 0,/);
    expect(pose).toMatch(/actif: false,/);
    // La mise en vente décidée pour la liste d'épicerie ne concerne aucun article de celle-ci.
    const enVente = new Set(ARTICLES_MIS_EN_VENTE.map((a) => a.nom));
    expect(ARTICLES_DE_LA_LISTE_DYNAMICA.filter((a) => enVente.has(a.nom))).toEqual([]);
    expect(corpsDe("mettreEnVenteLaListe")).not.toMatch(/DYNAMICA/);
  });
});
