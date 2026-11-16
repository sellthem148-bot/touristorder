// « Mets-moi même les produits que tu as supprimés, si tu as les images » (le gérant, 16 novembre 2026).
// Les 21 articles supprimés n'ont aucune image ; 40 articles MASQUÉS avaient leur photo de Wolt, et il a choisi
// de les remettre en vente tous : sept boissons que Wolt n'affiche plus, vingt poissons surgelés, treize viandes.
// Seulement ceux-là — ce qui n'a pas de photo reste masqué —, une seule fois, sans rien créer ni changer un prix.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  BOISSONS_REMISES_AVEC_PHOTO, CLE_REMISE_EN_VENTE_AVEC_PHOTO, POISSONS_SURGELES_REMIS, REMIS_EN_VENTE_AVEC_PHOTO, VIANDES_REMISES,
} from "../prisma/remise-en-vente-1116";
import { BOISSONS_PLUS_SUR_WOLT, MASQUAGES, POISSON_SURGELE, SANS_PHOTO_DE_WOLT } from "../prisma/masquages-1115";
import { ABSENTS_DE_WOLT } from "../prisma/absents-de-wolt";
import { INTROUVABLES_SUR_WOLT } from "../prisma/allegement-cremerie";
import { RAYON_BOUCHERIE, RAYON_POISSON, VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import { ARTICLES_DE_LA_LISTE } from "../prisma/articles-liste";
import { ARTICLES_DE_LA_LISTE_DYNAMICA } from "../prisma/articles-liste-dynamica";
import { LOTS_WOLT, RELEVES_DE_PRIX } from "../prisma/remplissage";
import { photoRepere } from "@/lib/reperes-wolt";
import { sousRayonDe } from "@/lib/sous-rayons";
import { nomDuRayon } from "@/lib/i18n/rayons";
import fr from "@/lib/i18n/fr";
import en from "@/lib/i18n/en";
import ru from "@/lib/i18n/ru";
import he from "@/lib/i18n/he";
import es from "@/lib/i18n/es";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
const tous = (m: { releves: string[]; deLaListe: string[] }) => [...m.releves, ...m.deLaListe];
const lots = new Map(LOTS_WOLT.flatMap((l) => l.articles).map((a) => [a.nom, a]));
const liste = new Map(ARTICLES_DE_LA_LISTE.map((a) => [a.nom, a]));
const releves = new Map(RELEVES_DE_PRIX.flatMap((r) => r.lignes).map((l) => [l.nom, l.nomWolt]));
const nomWoltDe = (nom: string) => lots.get(nom)?.nomWolt ?? releves.get(nom) ?? "";
const aSaPhoto = (nom: string) => photoRepere(nom, nomWoltDe(nom)) !== null;
const rayonDe = (nom: string) => (lots.get(nom) ?? liste.get(nom))?.categorie;

describe("les articles masqués qui ont leur photo de Wolt reviennent en vente", () => {
  it("40 articles, sans doublon : 7 boissons, 20 poissons surgelés, 13 viandes et volailles", () => {
    expect(BOISSONS_REMISES_AVEC_PHOTO).toHaveLength(7);
    expect(POISSONS_SURGELES_REMIS).toHaveLength(20);
    expect(VIANDES_REMISES).toHaveLength(13);
    expect(REMIS_EN_VENTE_AVEC_PHOTO).toHaveLength(40);
    expect(new Set(REMIS_EN_VENTE_AVEC_PHOTO).size).toBe(40);
    // Chacun est un article du catalogue, dans son rayon.
    for (const nom of REMIS_EN_VENTE_AVEC_PHOTO) expect(rayonDe(nom), nom).toBeTruthy();
  });

  it("« si tu as les images » : chacun a sa photo, et tout article de ces trois groupes qui a sa photo y est", () => {
    for (const nom of REMIS_EN_VENTE_AVEC_PHOTO) expect(aSaPhoto(nom), nom).toBe(true);
    expect([...BOISSONS_REMISES_AVEC_PHOTO].sort()).toEqual(tous(BOISSONS_PLUS_SUR_WOLT).filter(aSaPhoto).sort());
    expect([...POISSONS_SURGELES_REMIS].sort()).toEqual(tous(POISSON_SURGELE).filter(aSaPhoto).sort());
    expect([...VIANDES_REMISES].sort()).toEqual(VIANDE_ET_VOLAILLE.filter(aSaPhoto).sort());
  });

  it("ce qui n'a pas de photo reste masqué : 27 viandes, 2 poissons surgelés, les 339 articles jamais vus", () => {
    const remis = new Set(REMIS_EN_VENTE_AVEC_PHOTO);
    expect(VIANDE_ET_VOLAILLE.filter((n) => !remis.has(n))).toHaveLength(27);
    expect(tous(POISSON_SURGELE).filter((n) => !remis.has(n))).toHaveLength(2);
    for (const nom of [...VIANDE_ET_VOLAILLE, ...tous(POISSON_SURGELE)].filter((n) => !remis.has(n))) expect(aSaPhoto(nom), nom).toBe(false);
    expect(tous(SANS_PHOTO_DE_WOLT).filter((n) => remis.has(n))).toEqual([]);
    // Ni l'alcool (« à réfléchir »), ni la liste Dynamica, ni un article que le code n'a jamais mis en vente.
    const jamais = new Set([...ARTICLES_DE_LA_LISTE.filter((a) => a.alcool || a.masque).map((a) => a.nom), ...LOTS_WOLT.flatMap((l) => l.articles).filter((a) => a.horsLigne).map((a) => a.nom), ...ARTICLES_DE_LA_LISTE_DYNAMICA.map((a) => a.nom)]);
    expect(REMIS_EN_VENTE_AVEC_PHOTO.filter((n) => jamais.has(n))).toEqual([]);
  });

  it("les 21 articles supprimés n'ont aucune image : aucun ne revient", () => {
    const supprimes = [...INTROUVABLES_SUR_WOLT, ...ABSENTS_DE_WOLT.flatMap(tous)];
    expect(supprimes).toHaveLength(21);
    for (const nom of supprimes) {
      expect(aSaPhoto(nom), nom).toBe(false);
      expect(REMIS_EN_VENTE_AVEC_PHOTO, nom).not.toContain(nom);
    }
  });

  it("une seule fois, dans la même transaction : seulement un article encore masqué, qui a un prix", () => {
    const source = lire("prisma/remplissage.ts");
    const debut = source.indexOf("export async function remettreEnVenteCeQuiAUnePhoto");
    expect(debut).toBeGreaterThan(0);
    const corps = source.slice(debut, source.indexOf("\n}\n", debut));
    for (const morceau of [
      "operationFaite(prisma, CLE_REMISE_EN_VENTE_AVEC_PHOTO)", "noterOperation(prisma, CLE_REMISE_EN_VENTE_AVEC_PHOTO)", "$transaction",
      "where: { actif: false, prix: { gt: 0 }, OR: [{ nom: { in: REMIS_EN_VENTE_AVEC_PHOTO } }, { nomWolt: { in: nomsWolt } }] }", "data: { actif: true }",
    ]) expect(corps, morceau).toContain(morceau);
    // Rien n'est créé ni supprimé, aucun prix n'est touché.
    expect(corps).not.toMatch(/delete|create|prix: \d|prixAchat|prixIndicatif/);
    // Une clé à elle : les masquages restent notés comme faits et ne se rejouent pas par-dessus.
    expect([...MASQUAGES.map((m) => m.cle), "retrait-viande-2026-11-11"]).not.toContain(CLE_REMISE_EN_VENTE_AVEC_PHOTO);
  });

  it("la mise en ligne l'applique après les masquages, et la base d'essai suit le même chemin", () => {
    const preparer = lire("prisma/preparer.ts");
    const ordre = ["retirerLaViande(prisma)", "masquerCeQuiManque(prisma)", "remettreEnVenteCeQuiAUnePhoto(prisma)"].map((appel) => preparer.indexOf(`await ${appel}`));
    expect(ordre.every((position) => position > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    const base = lire("tests/outils/base-complete.ts");
    expect(base.indexOf("r.remettreEnVenteCeQuiAUnePhoto")).toBeGreaterThan(base.indexOf("r.masquerCeQuiManque"));
  });
});

describe("la viande revient : le rayon reprend son nom, les articles se rangent tout seuls", () => {
  it("« Poisson » redevient « Boucherie & poisson », à la même adresse, dans les cinq langues", () => {
    expect(RAYON_POISSON.slug).toBe("poisson");
    expect(fr.rayons.poisson).toBe(RAYON_BOUCHERIE);
    const rayon = { slug: "poisson", nom: RAYON_BOUCHERIE };
    expect(nomDuRayon(rayon, en)).toBe("Meat & fish");
    expect(nomDuRayon(rayon, ru)).toBe("Мясо и рыба");
    expect(nomDuRayon(rayon, he)).toBe("בשר ודגים");
    expect(nomDuRayon(rayon, es)).toBe("Carne y pescado");
    // Seulement s'il porte encore le nom donné par le retrait de la viande, et si l'autre nom est libre.
    const source = lire("prisma/remplissage.ts");
    const debut = source.indexOf("export async function remettreEnVenteCeQuiAUnePhoto");
    const corps = source.slice(debut, source.indexOf("\n}\n", debut));
    expect(corps).toContain("prisma.categorie.findFirst({ where: RAYON_POISSON");
    expect(corps).toContain("where: { nom: RAYON_BOUCHERIE }");
    expect(corps).toContain("pris === 0");
    expect(corps).toContain("data: { nom: RAYON_BOUCHERIE }");
  });

  it("viande et volaille ont leur sous-rayon, au rayon frais comme aux surgelés ; le poisson surgelé aussi", () => {
    for (const nom of VIANDES_REMISES) {
      const rayon = rayonDe(nom) === "Surgelés & glaces" ? "surgeles-glaces" : "poisson";
      expect(sousRayonDe(rayon, nom), nom).toBe("viande");
    }
    for (const nom of POISSONS_SURGELES_REMIS) {
      if (rayonDe(nom) === "Surgelés & glaces") expect(sousRayonDe("surgeles-glaces", nom), nom).toBe("poisson");
      else expect(["surgele", "fume-sale"], nom).toContain(sousRayonDe("poisson", nom));
    }
    for (const t of [fr, en, ru, he, es]) {
      expect(t.sousRayons.poisson.viande.length).toBeGreaterThan(3);
      expect(t.sousRayons["surgeles-glaces"].viande.length).toBeGreaterThan(3);
    }
  });
});
