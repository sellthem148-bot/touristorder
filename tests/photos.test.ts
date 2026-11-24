import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";
import { describe, expect, it } from "vitest";
import { CREDITS_PHOTOS, DOSSIER_PHOTOS_FRAIS, LICENCES_ACCEPTEES } from "@/lib/credits-photos";
import { PHOTOS_FRAIS } from "../prisma/photos-frais";
import { ARTICLES_WOLT } from "../prisma/articles-wolt";

// Les photos libres de droits des produits frais : chaque fichier a son crédit (auteur, licence, source),
// chaque article illustré existe, et aucun article de marque ne reçoit une photo d'illustration.
const DOSSIER = join(process.cwd(), "public", DOSSIER_PHOTOS_FRAIS);
const fichiers = readdirSync(DOSSIER).filter((f) => f.endsWith(".jpg")).sort();

describe("photos libres des produits frais", () => {
  it("chaque fichier a exactement un crédit, et chaque crédit son fichier", () => {
    expect(CREDITS_PHOTOS.map((c) => c.fichier).sort()).toEqual(fichiers);
    expect(new Set(CREDITS_PHOTOS.map((c) => c.fichier)).size).toBe(CREDITS_PHOTOS.length);
    expect(readdirSync(DOSSIER).filter((f) => !f.endsWith(".jpg"))).toEqual([]);
  });
  it("chaque crédit nomme un auteur, une licence acceptée et la page d'origine", () => {
    for (const c of CREDITS_PHOTOS) {
      expect(c.auteur.trim().length, c.fichier).toBeGreaterThan(1);
      expect(c.sujet.trim().length, c.fichier).toBeGreaterThan(1);
      expect(c.licence, c.fichier).toMatch(LICENCES_ACCEPTEES);
      expect(c.source, c.fichier).toMatch(/^https:\/\/commons\.wikimedia\.org\/wiki\/File:/);
      // Une licence Creative Commons porte son lien ; le domaine public n'en a pas.
      if (c.licence === "Domaine public") expect(c.lienLicence, c.fichier).toBe("");
      else expect(c.lienLicence, c.fichier).toMatch(/^https:\/\/creativecommons\.org\//);
    }
  });
  it("les fichiers sont de vrais JPEG, légers", () => {
    for (const f of fichiers) {
      const octets = readFileSync(join(DOSSIER, f));
      expect([octets[0], octets[1], octets[2]], f).toEqual([0xff, 0xd8, 0xff]);
      expect(statSync(join(DOSSIER, f)).size, f).toBeLessThan(130 * 1024);
    }
  });
  it("une photo détourée par le gérant est sur fond blanc, et la page des crédits le dit dans les cinq langues", async () => {
    // 24 novembre 2026 : il a renvoyé le rayon « Fruits & légumes » avec sept photos du site détourées. Les
    // licences (CC BY, CC BY-SA) permettent de modifier une photo à condition de le dire : `detouree` → /credits.
    const detourees = CREDITS_PHOTOS.filter((c) => c.detouree).map((c) => c.fichier).sort();
    expect(detourees).toEqual(["aubergines.jpg", "citrons.jpg", "oignons-verts.jpg", "poivrons-tricolores.jpg", "pommes-de-terre-rouges.jpg", "pommes-granny.jpg", "romaine.jpg"]);
    for (const f of detourees) {
      const { data, info } = await sharp(join(DOSSIER, f)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
      expect([info.width, info.height], f).toEqual([600, 600]);
      // Le haut de l'image, à gauche et à droite : du blanc, plus de jardin ni de planche à découper.
      for (const [x, y] of [[4, 4], [info.width - 5, 4]]) {
        const i = (y * info.width + x) * 3;
        expect(Math.min(data[i], data[i + 1], data[i + 2]), `${f} (${x}, ${y})`).toBeGreaterThan(240);
      }
    }
    const page = readFileSync("app/(boutique)/credits/page.tsx", "utf8");
    expect(page).toContain("{p.detouree ? <span data-detouree>");
    for (const langue of ["fr", "en", "ru", "he", "es"]) {
      const textes = readFileSync(`lib/i18n/serveur/${langue}.ts`, "utf8");
      expect(textes, langue).toMatch(/fondRetire: "[^"]{4,}",/);
    }
  });

  it("chaque photo va à un article qui existe, et chaque fichier sert au moins une fois", () => {
    const noms = new Set(ARTICLES_WOLT.map((a) => a.nom));
    for (const [nom, fichier] of Object.entries(PHOTOS_FRAIS)) {
      expect(noms.has(nom), `article inconnu : ${nom}`).toBe(true);
      expect(fichiers, `fichier absent : ${fichier}`).toContain(fichier);
    }
    expect([...new Set(Object.values(PHOTOS_FRAIS))].sort()).toEqual(fichiers);
  });
  it("seulement des produits frais sans marque : fruits, légumes, œufs, viande et poisson à la coupe", () => {
    const parNom = new Map(ARTICLES_WOLT.map((a) => [a.nom, a]));
    const rayons = new Set(Object.keys(PHOTOS_FRAIS).map((nom) => parNom.get(nom)!.categorie));
    expect([...rayons].sort()).toEqual(["Boucherie & poisson", "Crèmerie & œufs", "Fruits & légumes"]);
    // En crèmerie, seuls les œufs ; aucune marque du relevé Wolt ne reçoit une photo d'illustration.
    for (const nom of Object.keys(PHOTOS_FRAIS)) {
      if (parNom.get(nom)!.categorie === "Crèmerie & œufs") expect(nom).toMatch(/^Œufs /);
      expect(nom, nom).not.toMatch(/Tnuva|Tara|Yotvata|Strauss|Tirat Zvi|Angel|Mama Of|Danone|Emek/);
    }
  });
});
