// Le catalogue dans les quatre autres langues : tout article, toute description, toute option et toute ville
// de départ a sa traduction, avec les mêmes quantités ; ce que le gérant écrit lui-même reste tel quel.
import { describe, expect, it } from "vitest";
import { CATALOGUE, PLAGES_EXEMPLE, VILLES_EXEMPLE } from "../prisma/catalogue";
import { ARTICLES_WOLT } from "../prisma/articles-wolt";
import { ARTICLES_DYNAMICA } from "../prisma/articles-dynamica";
import { ARTICLES_WOLT_FICHES, DESCRIPTIONS_ENRICHIES } from "../prisma/articles-wolt-fiches";
import { ARTICLES_DE_LA_LISTE } from "../prisma/articles-liste";
import { ARTICLES_WOLT_DES_CAPTURES } from "../prisma/articles-wolt-captures";
import { ARTICLES_WOLT_BOISSONS_ET_ELECTRONIQUE } from "../prisma/articles-wolt-captures-boissons";
import { ARTICLES_WOLT_DU_12_NOVEMBRE, REMPLACEMENTS_DU_12_NOVEMBRE } from "../prisma/releve-wolt-1112";
import { ARTICLES_DE_LA_LISTE_DYNAMICA } from "../prisma/articles-liste-dynamica";
import { CATALOGUES, chercherDansLaLangue, descriptionArticle, libelleChoix, libelleOptions, nomArticle, nomGroupe, nomTarif, nomVille, traduireGroupes } from "@/lib/i18n/catalogue";
import { libelleAffiche, lireOptionsSaisies, resoudreSelection } from "@/lib/options";
import { CREDITS_PHOTOS } from "@/lib/credits-photos";

const LANGUES = ["en", "ru", "he", "es"] as const;
type Article = { nom: string; description?: string; options?: string };
const ARTICLES = [...CATALOGUE, ...ARTICLES_WOLT, ...ARTICLES_DYNAMICA, ...ARTICLES_WOLT_FICHES, ...ARTICLES_WOLT_DU_12_NOVEMBRE, ...ARTICLES_WOLT_DES_CAPTURES, ...ARTICLES_WOLT_BOISSONS_ET_ELECTRONIQUE, ...REMPLACEMENTS_DU_12_NOVEMBRE, ...ARTICLES_DE_LA_LISTE, ...ARTICLES_DE_LA_LISTE_DYNAMICA] as Article[];
const NOMS = [...new Set(ARTICLES.map((a) => a.nom))];
const DESCRIPTIONS = [...new Set([
  ...ARTICLES.flatMap((a) => (a.description?.trim() ? [a.description.trim()] : [])),
  ...DESCRIPTIONS_ENRICHIES.flatMap((d) => [d.ancienne.trim(), d.nouvelle.trim()]),
])];
// Les options de départ : « Taille : 2 ans | 4 ans » → le groupe « Taille », les choix « 2 ans », « 4 ans ».
const GROUPES = ARTICLES.flatMap((a) => {
  const lu = a.options ? lireOptionsSaisies(a.options) : null;
  return lu?.ok ? lu.groupes : [];
});
const chiffres = (t: string) => (t.match(/\d/g) ?? []).sort().join("");

describe("catalogue traduit", () => {
  it("le catalogue de départ compte des articles, des descriptions et des options", () => {
    expect(NOMS.length).toBeGreaterThan(900);
    expect(DESCRIPTIONS.length).toBeGreaterThan(800);
    expect(GROUPES.length).toBeGreaterThan(40);
  });

  it.each(LANGUES)("%s : chaque article de départ a son nom traduit, avec les mêmes quantités", (langue) => {
    const table = CATALOGUES[langue]!.noms;
    expect(NOMS.filter((nom) => !table[nom]?.trim())).toEqual([]);
    expect(NOMS.filter((nom) => chiffres(table[nom]) !== chiffres(nom))).toEqual([]);
    // Aucune entrée périmée : chaque nom traduit est celui d'un article de départ.
    expect(Object.keys(table).filter((nom) => !NOMS.includes(nom))).toEqual([]);
  });

  it.each(LANGUES)("%s : chaque description de départ est traduite, avec les mêmes quantités", (langue) => {
    const table = CATALOGUES[langue]!.descriptions;
    expect(DESCRIPTIONS.filter((d) => !table[d]?.trim())).toEqual([]);
    expect(DESCRIPTIONS.filter((d) => chiffres(table[d]) !== chiffres(d))).toEqual([]);
    expect(Object.keys(table).filter((d) => !DESCRIPTIONS.includes(d))).toEqual([]);
  });

  it("hébreu et russe : les descriptions sont bien dans l'écriture de la langue", () => {
    expect(Object.values(CATALOGUES.he!.descriptions).filter((d) => !/[֐-׿]/.test(d))).toEqual([]);
    expect(Object.values(CATALOGUES.ru!.descriptions).filter((d) => !/[Ѐ-ӿ]/.test(d))).toEqual([]);
  });

  it.each(LANGUES)("%s : options, villes et tarifs de départ", (langue) => {
    // Les options : en russe et en hébreu, tout nom d'option change d'écriture ; ailleurs un mot peut être le même (« Version »).
    const groupes = [...new Set(GROUPES.map((g) => g.nom))];
    expect(groupes.filter((g) => !nomGroupe(g, langue).trim())).toEqual([]);
    if (langue === "ru" || langue === "he") expect(groupes.filter((g) => nomGroupe(g, langue) === g)).toEqual([]);
    expect(groupes.filter((g) => nomGroupe(g, langue) === g).length).toBeLessThan(4);
    // Un choix peut être universel (« S », « USB-C », « 36-37 ») ; un mot français ordinaire est traduit.
    const mots = ["Garçon", "Fille", "Adulte", "Enfant", "Homme", "Femme", "Blanc", "Noir", "Rouge", "Vert", "Petit", "Grand", "Moyen", "Fraise", "Vanille", "Chocolat", "Légumes", "Nuit", "2 ans", "6 parts", "1er âge"];
    const choix = new Set(GROUPES.flatMap((g) => g.choix.map((c) => c.libelle)));
    expect(mots.filter((c) => !choix.has(c))).toEqual([]);
    expect(mots.filter((c) => libelleChoix(c, langue) === c)).toEqual([]);
    for (const v of VILLES_EXEMPLE) expect(nomVille(v.nom, langue).trim(), v.nom).not.toBe("");
    if (langue === "ru" || langue === "he") for (const v of VILLES_EXEMPLE) expect(nomVille(v.nom, langue), v.nom).not.toBe(v.nom);
    for (const p of PLAGES_EXEMPLE) expect(nomTarif(p.nom, langue), p.nom).not.toBe(p.nom);
    // La page des crédits : ce que montre chaque photo.
    expect(CREDITS_PHOTOS.filter((c) => !CATALOGUES[langue]!.sujets[c.sujet]?.trim()).map((c) => c.sujet)).toEqual([]);
  });

  it("en français, ou pour un texte que le gérant a écrit lui-même : rien ne change", () => {
    expect(nomArticle("Lait 3 % 1 L", "fr")).toBe("Lait 3 % 1 L");
    expect(nomArticle("Mon article à moi", "en")).toBe("Mon article à moi");
    expect(descriptionArticle("Une description écrite par le gérant", "he")).toBe("Une description écrite par le gérant");
    expect(nomVille("Ashdod-sur-Mer", "ru")).toBe("Ashdod-sur-Mer");
    expect(nomTarif("Tarif de base", "en")).toBe("Tarif de base");
    expect(nomArticle("constructor", "en")).toBe("constructor");
    expect(nomArticle("Lait 3 % 1 L", "en")).not.toBe("Lait 3 % 1 L");
  });

  it("options : le client lit sa langue, le choix envoyé reste celui du gérant", () => {
    const lu = lireOptionsSaisies("Taille : 2 ans | 4 ans +10\nModèle : Garçon | Fille");
    if (!lu.ok) throw new Error("options illisibles");
    const groupes = traduireGroupes(lu.groupes, "en");
    expect(groupes.map((g) => g.nom)).toEqual(["Taille", "Modèle"]);
    expect(groupes[0].choix.map((c) => c.libelle)).toEqual(["2 ans", "4 ans"]);
    expect(groupes[0].affiche).toBe(nomGroupe("Taille", "en"));
    expect(groupes[0].affiche).not.toBe("Taille");
    const selection = { Taille: "4 ans", Modèle: "Fille" };
    // La ligne de commande garde le libellé du gérant ; le panier montre celui du client.
    expect(resoudreSelection(groupes, selection)).toEqual({ ok: true, supplement: 1000, libelle: "Taille : 4 ans · Modèle : Fille" });
    const affiche = libelleAffiche(groupes, selection, ": ");
    expect(affiche).toBe(`${nomGroupe("Taille", "en")}: ${libelleChoix("4 ans", "en")} · ${nomGroupe("Modèle", "en")}: ${libelleChoix("Fille", "en")}`);
    expect(libelleAffiche(groupes, { Taille: "4 ans" })).toBe("");
    expect(libelleAffiche(lu.groupes, selection)).toBe("Taille : 4 ans · Modèle : Fille");
    expect(traduireGroupes(lu.groupes, "fr")).toBe(lu.groupes);
    // Le libellé d'une ligne de commande, relu dans la langue du client.
    expect(libelleOptions("Taille : 4 ans · Modèle : Fille", "en")).toBe(affiche);
    expect(libelleOptions("Taille : 4 ans", "fr")).toBe("Taille : 4 ans");
    expect(libelleOptions("texte libre du gérant", "en")).toBe("texte libre du gérant");
    expect(libelleOptions("", "en")).toBe("");
  });

  it("recherche : un mot dans la langue du client retrouve les articles par leur nom français", () => {
    const lait = chercherDansLaLangue("milk", "en");
    expect(lait.noms).toContain("Lait 3 % 1 L");
    expect(chercherDansLaLangue("молок", "ru").noms).toContain("Lait 3 % 1 L");
    expect(chercherDansLaLangue("חלב", "he").noms).toContain("Lait 3 % 1 L");
    expect(chercherDansLaLangue("leche", "es").noms).toContain("Lait 3 % 1 L");
    expect(chercherDansLaLangue("MILK", "en").noms).toEqual(lait.noms);
    expect(chercherDansLaLangue("lait", "fr")).toEqual({ noms: [], descriptions: [] });
    expect(chercherDansLaLangue("x", "en")).toEqual({ noms: [], descriptions: [] });
    expect(chercherDansLaLangue("zzzzqqq", "en")).toEqual({ noms: [], descriptions: [] });
  });
});
