// L'affiche à imprimer (affiches/generer.mjs) : elle n'annonce que ce que le site annonce, et le logo de
// l'agence partenaire, fourni par le gérant, ne se retrouve jamais parmi les fichiers publiés du site.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADRESSE_DU_SITE, PAIEMENTS_PAR_DEFAUT } from "@/lib/marque";
import { SIGLE } from "@/lib/sigle";

const racine = process.cwd();
const lire = (f: string) => readFileSync(path.join(racine, f), "utf8");
const generateur = lire("affiches/generer.mjs");

describe("l'affiche partenaire", () => {
  it("ses éléments et ses sorties sont dans le dépôt : une autre conversation la retrouve", () => {
    for (const f of ["elements/elite-home-group-noir.png", "elements/elite-home-group-blanc.png", "elements/qr-touristorder.svg", "sortie/affiche-elite-home-group.pdf", "sortie/affiche-elite-home-group.png"]) {
      expect(existsSync(path.join(racine, "affiches", f)), f).toBe(true);
    }
  });

  it("le logo de l'agence n'est pas publié avec le site", () => {
    const publies = readdirSync(path.join(racine, "public"), { recursive: true }).map(String);
    expect(publies.filter((f) => /elite|home-group/i.test(f))).toEqual([]);
  });

  it("le QR code mène au site, et le sigle est celui de la marque", () => {
    expect(ADRESSE_DU_SITE).toBe("https://www.touristorder.com");
    expect(generateur).toContain("https://www.touristorder.com");
    expect(generateur).toContain(SIGLE.t);
    expect(generateur).toContain(SIGLE.soleil);
    expect(generateur).toContain(SIGLE.encre);
  });

  it("elle annonce ce que le site annonce : le soir, les modes de paiement, les langues où l'on répond", () => {
    // Les créneaux de départ vont de 19 h à minuit (prisma/remplissage.ts).
    expect(lire("prisma/remplissage.ts")).toMatch(/creneaux: \["19:00 – 20:00".*"23:00 – 00:00"\]/);
    expect(generateur).toContain("de 19 h à minuit");
    expect(generateur).toContain("7 pm to midnight");
    expect(PAIEMENTS_PAR_DEFAUT).toEqual(["Bit", "PayBox", "Virement"]);
    expect(generateur).toContain("Paiement par Bit, PayBox ou virement");
    // Le gérant répond en français, en anglais ou en hébreu — jamais promis : le russe, l'espagnol.
    expect(generateur).toContain("Réponses en français, anglais et hébreu");
    expect(generateur).not.toMatch(/russe|espagnol|Russian|Spanish/);
  });

  it("en français et en anglais, sans emoji", () => {
    expect(generateur).toContain("Your groceries delivered to your door, the same evening.");
    expect(generateur).toContain("En partenariat avec");
    expect(generateur).toContain("In partnership with");
    expect(generateur).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
