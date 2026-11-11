import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_DE_LA_LISTE, ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { prixNonVerifie } from "@/lib/prix-indicatif";
import { CATEGORIES_WOLT, enAgorot } from "../prisma/articles-wolt";
import { CATALOGUE, CATEGORIES } from "../prisma/catalogue";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");

describe("liste de produits dressée par le gérant", () => {
  it("395 articles : un nom français unique, un rayon qui existe, une description, un prix indicatif", () => {
    expect(ARTICLES_DE_LA_LISTE).toHaveLength(395);
    expect(new Set(ARTICLES_DE_LA_LISTE.map((a) => a.nom)).size).toBe(395);
    const rayons = new Set<string>([...CATEGORIES.map((c) => c.nom), ...CATEGORIES_WOLT.map((c) => c.nom)]);
    for (const a of ARTICLES_DE_LA_LISTE) {
      expect(rayons.has(a.categorie), `${a.nom} → ${a.categorie}`).toBe(true);
      expect(a.nom.trim().length, a.nom).toBeGreaterThanOrEqual(3);
      expect(a.nom.length, a.nom).toBeLessThanOrEqual(120);
      expect(a.nom, a.nom).not.toMatch(/[֐-׿]/);
      expect(a.nom, a.nom).not.toMatch(/~|\d(g|kg|ml|L)\b|\d%/); // format rangé et typographié : « 250 g », « 1,5 L », « 5 % »
      expect(a.description, a.nom).toMatch(/[.!?]$/);
      expect(a.description, a.nom).not.toMatch(/prix régulé/i); // une note pour le gérant, pas pour le client
      expect(a.description, a.nom).not.toMatch(/(?<!\p{L})(tu|ton|ta|tes|toi)(?!\p{L})/iu); // le site vouvoie
      expect(a.description.length, a.nom).toBeLessThanOrEqual(160);
      expect(Number.isInteger(enAgorot(a.prixIndicatif)), a.nom).toBe(true);
      expect(enAgorot(a.prixIndicatif), a.nom).toBeGreaterThanOrEqual(300);
      expect(enAgorot(a.prixIndicatif), a.nom).toBeLessThanOrEqual(20000);
    }
  });

  it("aucun nom ne reprend un article déjà au catalogue : ni un article de Wolt, ni la base « à compléter »", async () => {
    const { LOTS_WOLT } = await import("../prisma/remplissage");
    const dejaLa = new Set([...LOTS_WOLT.flatMap((l) => l.articles.map((a) => a.nom)), ...CATALOGUE.map((a) => a.nom)]);
    expect(ARTICLES_DE_LA_LISTE.filter((a) => dejaLa.has(a.nom)).map((a) => a.nom)).toEqual([]);
    // Les produits que le site vend déjà ne sont pas repris de la liste (même article, au vrai prix de Wolt).
    const noms = new Set(ARTICLES_DE_LA_LISTE.map((a) => a.nom));
    for (const absent of ["Lait frais Tnuva 3 % 1 L", "Pilons de poulet frais, environ 1 kg", "Coca-Cola Zero 1,5 L", "Biscuits Oreo Original 176 g"]) expect(noms.has(absent), absent).toBe(false);
  });

  it("à l'installation, le prix de la liste n'est pas un prix de vente : l'article arrive sans prix, masqué", () => {
    const installation = lire("prisma/remplissage.ts");
    const corps = installation.slice(installation.indexOf("export async function installerLaListeDuGerant"), installation.indexOf("export async function installerLesPhotosFrais"));
    expect(corps).toMatch(/prix: 0,/);
    expect(corps).toMatch(/actif: false,/);
    expect(corps).toMatch(/prixIndicatif: enAgorot\(a\.prixIndicatif\)/);
    expect(corps).not.toMatch(/prix: enAgorot/);
    expect(corps).not.toMatch(/prixAchat/); // pas davantage un prix d'achat : il fausserait la marge
    // Une seule fois : un article supprimé par le gérant ne revient pas.
    expect(corps).toMatch(/prixIndicatif: \{ not: null \}/);
    expect(corps).toMatch(/déjà installée/);
  });

  it("le prix indicatif reste chez le gérant : aucune page publique ne le lit", () => {
    const publique = lire("lib/catalogue.ts");
    expect(publique).not.toMatch(/prixIndicatif/);
    // Seule la page « Prix rapides » de l'espace gérant l'affiche.
    expect(lire("app/admin/(protege)/produits/prix/page.tsx")).toMatch(/prixIndicatif/);
  });

  it("l'alcool de la liste est repéré (34 articles) et rangé à la fin des boissons", () => {
    const alcool = ARTICLES_DE_LA_LISTE.filter((a) => a.alcool);
    expect(alcool).toHaveLength(34);
    for (const a of alcool) expect(a.categorie, a.nom).toBe("Boissons");
    const boissons = ARTICLES_DE_LA_LISTE.filter((a) => a.categorie === "Boissons");
    const premier = boissons.findIndex((a) => a.alcool);
    expect(boissons.slice(premier).every((a) => a.alcool)).toBe(true);
  });

  it("la mise en vente décidée par le gérant : tout sauf l'alcool et la mélatonine, une seule fois, sans toucher à ce qu'il a modifié", () => {
    expect(ARTICLES_MIS_EN_VENTE).toHaveLength(360);
    expect(ARTICLES_MIS_EN_VENTE.some((a) => a.alcool || a.masque)).toBe(false);
    const gardes = ARTICLES_DE_LA_LISTE.filter((a) => !ARTICLES_MIS_EN_VENTE.includes(a));
    expect(gardes.filter((a) => !a.alcool).map((a) => a.nom)).toEqual(["Mélatonine végétale gommes pour le sommeil × 60"]);
    // Aucun nom d'alcool n'a échappé au repérage.
    expect(ARTICLES_MIS_EN_VENTE.filter((a) => /bi[èe]re|\bvin\b|vodka|whisk|rhum|gin\b|tequila|liqueur|cidre|prosecco|arak|bourbon|aperol|campari|baileys|breezer|sauvignon|chardonnay|chianti|cabernet|marselan/i.test(a.nom)).map((a) => a.nom)).toEqual([]);

    const source = lire("prisma/remplissage.ts");
    const corps = source.slice(source.indexOf("export async function mettreEnVenteLaListe"), source.indexOf("export async function installerLesPhotosFrais"));
    // Une seule fois : le repère est lu d'abord, et posé dans la même transaction que la mise en vente.
    expect(corps).toMatch(/if \(r\.listeEnVenteLe\) return/);
    expect(corps).toMatch(/\$transaction\(\[/);
    expect(corps).toMatch(/listeEnVenteLe: new Date\(\)/);
    // Seulement les articles restés tels qu'installés : sans prix, masqués, avec leur prix de liste.
    expect(corps).toMatch(/"prix" = 0 AND "actif" = false AND "prixIndicatif" > 0/);
    expect(corps).toMatch(/ARTICLES_MIS_EN_VENTE\.map/);
    // Le prix d'achat reste vide : on ne sait pas ce que l'article coûte sur Wolt.
    expect(corps).not.toMatch(/"prixAchat"\s*=/);
    // La mise en ligne de production l'appelle après l'installation de la liste.
    const preparer = lire("prisma/preparer.ts");
    expect(preparer.indexOf("mettreEnVenteLaListe(prisma)")).toBeGreaterThan(preparer.indexOf("installerLaListeDuGerant(prisma)"));
  });

  it("un article vendu au prix de la liste reste repéré « prix non vérifié » tant que le prix d'achat n'est pas noté", () => {
    expect(prixNonVerifie({ prix: 1490, prixIndicatif: 1490, prixAchat: null })).toBe(true);
    expect(prixNonVerifie({ prix: 1690, prixIndicatif: 1490, prixAchat: null })).toBe(true); // prix corrigé, achat pas encore noté
    expect(prixNonVerifie({ prix: 1690, prixIndicatif: 1490, prixAchat: 1690 })).toBe(false); // vérifié sur Wolt
    expect(prixNonVerifie({ prix: 0, prixIndicatif: 1490, prixAchat: null })).toBe(false); // à compléter : pas en vente
    expect(prixNonVerifie({ prix: 735, prixIndicatif: null, prixAchat: 735 })).toBe(false); // un article relevé sur Wolt
    expect(prixNonVerifie({ prix: 735, prixIndicatif: null, prixAchat: null })).toBe(false); // un article du gérant, sans liste
  });

  it("les prix sont ceux de la liste, sans arrondi", () => {
    const prix = (nom: string) => enAgorot(ARTICLES_DE_LA_LISTE.find((a) => a.nom === nom)!.prixIndicatif);
    expect(prix("Lait frais Tara 1 % 1 L")).toBe(735);
    expect(prix("Halloumi Gad 250 g")).toBe(2290);
    expect(prix("Cuisses de poulet fraîches, environ 1 kg")).toBe(3800);
    expect(prix("Pâte à tartiner Nutella 750 g")).toBe(2790);
    expect(prix("Bière Goldstar 6 × 33 cl")).toBe(3800);
    expect(prix("Litière agglomérante sans odeur chat 5 kg")).toBe(3990);
  });
});
