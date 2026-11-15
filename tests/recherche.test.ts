// La recherche du site : ce qu'un visiteur tape sans accents ni tirets doit trouver ses articles, les noms d'abord.
import { describe, expect, it } from "vitest";
import { LONGUEUR_MINIMALE, adresseDesResultats, classer, ficheDe, motsDeRecherche, rangDe, simplifier } from "@/lib/recherche";
import { LOTS_WOLT } from "../prisma/remplissage";
import { ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { descriptionArticle, nomArticle } from "@/lib/i18n/catalogue";

type Article = { nom: string; description: string; categorie: string };
const CATALOGUE: Article[] = [...LOTS_WOLT.flatMap((l) => l.articles), ...ARTICLES_MIS_EN_VENTE];
const fiche = (langue: "fr" | "en" | "ru" | "he" | "es") => (a: Article) =>
  ficheDe([a.nom, nomArticle(a.nom, langue)], [a.description, descriptionArticle(a.description, langue), a.categorie]);
const chercher = (q: string, langue: "fr" | "en" | "ru" | "he" | "es" = "fr", maximum = 60) => classer(CATALOGUE, fiche(langue), motsDeRecherche(q), maximum).map((a) => a.nom);

describe("recherche : ce qu'on tape", () => {
  it("ni majuscules, ni accents, ni signes", () => {
    expect(simplifier("Café glacé Yotvata 1 L")).toBe("cafe glace yotvata 1 l");
    expect(simplifier("Œufs calibre L × 12")).toBe("oeufs calibre l 12");
    expect(simplifier("Coca-Cola Zero 1,5 L")).toBe("coca cola zero 1 5 l");
    expect(simplifier("Jus d'orange pressé 100 %")).toBe("jus d orange presse 100");
    // L'hébreu : avec ou sans guéresh, c'est le même mot.
    expect(simplifier("תפוצ׳יפס")).toBe(simplifier("תפוצ'יפס"));
    expect(simplifier("תפוצ׳יפס")).toBe("תפוציפס");
    expect(simplifier("מ״ל")).toBe("מל");
    expect(simplifier("  ")).toBe("");
  });

  it("les mots d'une recherche ; rien en dessous de deux lettres", () => {
    expect(LONGUEUR_MINIMALE).toBe(2);
    expect(motsDeRecherche("  Coca   zéro ")).toEqual(["coca", "zero"]);
    expect(motsDeRecherche("c")).toEqual([]);
    expect(motsDeRecherche("-")).toEqual([]);
    expect(motsDeRecherche("")).toEqual([]);
    expect(motsDeRecherche("lait 3")).toEqual(["lait", "3"]);
    expect(motsDeRecherche("a b c d e f g h i j k")).toHaveLength(8);
    expect(motsDeRecherche("x".repeat(500))[0]).toHaveLength(80);
  });

  it("l'adresse des résultats garde le préfixe de la langue et protège le texte", () => {
    expect(adresseDesResultats("/recherche", "coca zero")).toBe("/recherche?q=coca%20zero");
    expect(adresseDesResultats("/he/recherche", " חלב ")).toBe(`/he/recherche?q=${encodeURIComponent("חלב")}`);
    expect(adresseDesResultats("/recherche", "a&b=c#d")).toBe("/recherche?q=a%26b%3Dc%23d");
    expect(adresseDesResultats("/recherche", "   ")).toBe("/recherche");
  });
});

describe("recherche : ce qu'on trouve", () => {
  it("chaque mot tapé doit se retrouver ; un mot de trop ne trouve rien", () => {
    const f = ficheDe(["Coca-Cola Zero 1,5 L"], ["Boisson gazeuse sans sucres", "Boissons"]);
    expect(rangDe(f, motsDeRecherche("coca zero"))).toBe(0);
    expect(rangDe(f, motsDeRecherche("zero coca"))).toBe(0);
    expect(rangDe(f, motsDeRecherche("coc zer"))).toBe(1); // le début d'un mot : on est en train de taper
    expect(rangDe(f, motsDeRecherche("ola"))).toBe(2); // dans le nom, mais pas au début d'un mot
    expect(rangDe(f, motsDeRecherche("coca gazeuse"))).toBe(3); // un mot dans la description
    expect(rangDe(f, motsDeRecherche("coca fraise"))).toBeNull();
    expect(rangDe(f, [])).toBeNull();
  });

  it("sur le vrai catalogue : sans accents, sans tirets, plusieurs mots", () => {
    expect(chercher("coca zero")).toContain("Coca-Cola Zero 1,5 L");
    expect(chercher("coca zero").every((n) => /coca/i.test(n) && /zero/i.test(n))).toBe(true);
    expect(chercher("oeufs")).toContain("Œufs calibre L × 12");
    expect(chercher("cafe").some((n) => /Café/.test(n))).toBe(true);
    expect(chercher("lait 3")).toContain("Lait Tnuva 3 % 1 L");
    expect(chercher("LAIT TNUVA")).toContain("Lait Tnuva 3 % 1 L");
    expect(chercher("ketchup heinz")).toContain("Ketchup Heinz classique 700 g");
    expect(chercher("zzzzqqq")).toEqual([]);
    expect(chercher("x")).toEqual([]);
  });

  it("les noms d'abord : ce qui commence par le mot tapé passe avant ce qui ne fait que le contenir ou le décrire", () => {
    const resultats = chercher("coca", "fr", 200);
    const premierHorsNom = resultats.findIndex((n) => !/coca/i.test(n));
    // Tous les « Coca-Cola » passent avant un article qui n'a « coca » que dans sa description.
    if (premierHorsNom >= 0) expect(resultats.slice(premierHorsNom).some((n) => /^Coca/.test(n))).toBe(false);
    expect(resultats[0]).toMatch(/coca/i);
    expect(chercher("coca", "fr", 5)).toHaveLength(5);
  });

  it("le mot entier avant le début d'un mot : « lait » montre le lait avant la laitue", () => {
    const resultats = chercher("lait", "fr", 200);
    const lait = resultats.indexOf("Lait Tnuva 3 % 1 L");
    const laitue = resultats.findIndex((n) => /^Laitue/.test(n));
    expect(lait).toBeGreaterThanOrEqual(0);
    expect(laitue).toBeGreaterThan(lait);
    // En cours de frappe, le début du mot suffit.
    expect(chercher("lai")).toContain("Lait Tnuva 3 % 1 L");
    expect(chercher("coc")[0]).toMatch(/^Coca/);
  });

  it("dans la langue du client : un mot de sa langue retrouve l'article, le français aussi", () => {
    expect(chercher("milk", "en")).toContain("Lait Tnuva 3 % 1 L");
    expect(chercher("MILK", "en")).toEqual(chercher("milk", "en"));
    expect(chercher("молок", "ru")).toContain("Lait Tnuva 3 % 1 L");
    expect(chercher("חלב", "he")).toContain("Lait Tnuva 3 % 1 L");
    expect(chercher("leche", "es")).toContain("Lait Tnuva 3 % 1 L");
    // Un visiteur anglais qui tape le nom français le trouve aussi.
    expect(chercher("lait tnuva", "en")).toContain("Lait Tnuva 3 % 1 L");
    // En français, on ne cherche pas dans les autres langues.
    expect(chercher("milk", "fr")).not.toContain("Lait Tnuva 3 % 1 L");
  });
});
