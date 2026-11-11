import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
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
