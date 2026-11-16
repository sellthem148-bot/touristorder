// « Fais-moi le même site que Wolt, je n'aime pas le design » (le gérant, 16 novembre 2026). La boutique reprend
// la PRÉSENTATION du site de Wolt tel qu'il est sur ses captures — fond clair, bannière, bande d'informations,
// colonne des rayons, cartes d'articles — avec le nom, le logo et les textes de Tourist Order : rien de Wolt.
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CREDITS_PHOTOS, SOURCES_DE_LA_BANNIERE } from "@/lib/credits-photos";
import { FOND_DE_LA_BOUTIQUE } from "@/lib/fond";
import fr from "@/lib/i18n/fr";
import en from "@/lib/i18n/en";
import ru from "@/lib/i18n/ru";
import he from "@/lib/i18n/he";
import es from "@/lib/i18n/es";

const lire = (fichier: string) => readFileSync(fichier, "utf8");

describe("la boutique à la manière de Wolt", () => {
  it("le fond est clair, comme sur le site de Wolt ; le fond sombre reste à un interrupteur", () => {
    expect(FOND_DE_LA_BOUTIQUE).toBe("clair");
    expect(lire("lib/fond.ts")).toMatch(/"nuit" \| "ivoire" \| "clair"/);
  });

  it("toutes les cartes d'articles ont la même forme : zone d'image, « + » dans le coin haut gauche, prix puis nom", () => {
    const carte = lire("components/CarteProduit.tsx");
    // La photo de l'article ; sinon l'icône de son rayon sur sa couleur — jamais une image qui prétendrait le montrer.
    expect(carte).toContain("produit.photoUrl ? (");
    expect(carte).toContain("couleurDuRayon(produit.categorie.slug).zone");
    expect(carte).toContain("<IconeRayon slug={produit.categorie.slug}");
    expect(carte).toContain("data-sans-photo aria-hidden=\"true\"");
    // Le « + » : en haut à GAUCHE dans toutes les langues (décision du gérant du 12 novembre), sur toutes les cartes.
    expect(carte.match(/absolute left-0 top-0 z-10/g)).toHaveLength(1);
    expect(carte.match(/<BoutonRapide produit=\{produit\} ouvrir=\{\(\) => setOuvert\(true\)\} surPhoto \/>/g)).toHaveLength(1);
    // Sous l'image, l'ordre de Wolt : le prix, le nom, le format.
    const corps = carte.slice(carte.indexOf("Sous l'image, dans l'ordre de Wolt"));
    expect(corps.indexOf("<Prix ")).toBeGreaterThan(0);
    expect(corps.indexOf("<Prix ")).toBeLessThan(corps.indexOf("<h3 "));
    expect(corps.indexOf("<h3 ")).toBeLessThan(corps.indexOf("{detail && "));
    // Une carte blanche, sans trait, détachée du fond par son ombre.
    expect(carte).toContain("bg-white shadow-(--shadow-tuile)");
    expect(lire("app/globals.css")).toMatch(/--shadow-tuile: 0 1px 2px/);
  });

  it("le prix est en bleu ; l'étiquette jaune est réservée à une promotion, l'ancien prix barré à côté", () => {
    const prix = lire("components/Prix.tsx");
    expect(prix).toContain('etiquette && prixBarre ? `bg-soleil text-encre');
    expect(prix).toContain('etiquette ? "text-marque"');
    expect(prix).not.toContain("bg-soleil/25");
  });

  it("l'accueil est la page d'une boutique : bannière, bande d'informations, colonne des rayons", () => {
    const accueil = lire("app/(boutique)/page.tsx");
    for (const morceau of ["data-banniere", 'src="/accueil/banniere.jpg"', "<Sigle taille={52} clair />", "{NOM_DU_SITE}", "data-infos", 'id="rayons"', "lg:grid-cols-[14rem_minmax(0,1fr)]", 'id="livraison"', 'id="etapes"']) {
      expect(accueil, morceau).toContain(morceau);
    }
    // Le titre de la page reste le sien (il arrive mot à mot), et la bannière a son fond encre sous l'image.
    expect(accueil).toContain('<span className="apparait inline-block"');
    expect(accueil).toMatch(/data-banniere className="[^"]*\bbg-encre\b[^"]*\btext-white\b/);
    // La même liste de rayons sert de tuiles sur téléphone et de colonne sur grand écran : un seul `#rayons`.
    expect(accueil.match(/id="rayons"/g)).toHaveLength(1);
  });

  it("la bannière n'est faite que de photos du domaine public ou sous CC0", () => {
    expect(SOURCES_DE_LA_BANNIERE).toHaveLength(12);
    expect(new Set(SOURCES_DE_LA_BANNIERE).size).toBe(12);
    for (const fichier of SOURCES_DE_LA_BANNIERE) {
      const credit = CREDITS_PHOTOS.find((c) => c.fichier === fichier);
      expect(credit, fichier).toBeTruthy();
      expect(["CC0", "Domaine public"], fichier).toContain(credit!.licence);
    }
    const octets = readFileSync("public/accueil/banniere.jpg");
    expect([octets[0], octets[1], octets[2]]).toEqual([0xff, 0xd8, 0xff]);
    expect(statSync("public/accueil/banniere.jpg").size).toBeLessThan(250 * 1024);
  });

  it("c'est la présentation de Wolt, pas sa marque : aucun texte du site ne nomme Wolt, le logo reste celui de Tourist Order", () => {
    for (const [langue, t] of Object.entries({ fr, en, ru, he, es })) {
      expect(JSON.stringify(t), langue).not.toMatch(/wolt|וולט|вольт/i);
    }
    const accueil = lire("app/(boutique)/page.tsx");
    const sansCommentaires = accueil.replace(/\{\/\*[\s\S]*?\*\/\}/g, "").replace(/^\s*\/\/.*$/gm, "");
    expect(sansCommentaires).not.toMatch(/wolt/i);
    expect(lire("components/EnTete.tsx")).toContain("<Sigle ");
  });
});
