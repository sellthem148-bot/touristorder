// L'affiche à imprimer (affiches/generer.mjs) : elle n'annonce que ce que le site annonce, et le logo de
// l'agence partenaire, fourni par le gérant, ne se retrouve jamais parmi les fichiers publiés du site.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ADRESSE_DU_SITE, PAIEMENTS_PAR_DEFAUT } from "@/lib/marque";
import { SIGLE } from "@/lib/sigle";
import { communesLivrees } from "@/lib/zones";
import { GRILLE_DES_ZONES } from "../prisma/zones-1123";

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

  it("les photos du bandeau sont libres de droits sans mention : domaine public ou CC0", () => {
    const photos = [...generateur.matchAll(/"([a-z-]+\.jpg)"/g)].map((m) => m[1]);
    expect(photos.length).toBeGreaterThanOrEqual(4);
    const credits = lire("lib/credits-photos.ts");
    for (const f of photos) {
      expect(existsSync(path.join(racine, "public/produits/frais", f)), f).toBe(true);
      const ligne = credits.split("\n").find((l) => l.includes(`fichier: "${f}"`)) ?? "";
      expect(ligne, f).toMatch(/licence: "(CC0|Domaine public)"/);
    }
  });

  it("en français et en anglais, sans emoji", () => {
    expect(generateur).toContain("Your groceries delivered to your door, the same evening.");
    expect(generateur).toContain("En partenariat avec");
    expect(generateur).toContain("In partnership with");
    expect(generateur).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});

// Le flyer A5, document de référence du gérant. Sa source est dans le dépôt depuis le 24 novembre 2026
// (affiches/flyer/generer.mjs, qui réécrit le PDF, une page par langue, les aperçus et `texte.txt`, le texte
// tel qu'il s'imprime) : n'importe quelle conversation peut le modifier.
describe("le flyer A5 (français, anglais)", () => {
  const dossier = path.join(racine, "affiches/flyer");
  const texte = lire("affiches/flyer/texte.txt");
  const generateur_du_flyer = lire("affiches/flyer/generer.mjs");

  it("le générateur, le PDF, une page par langue et leurs aperçus sont dans le dépôt, hors du site", () => {
    for (const f of ["generer.mjs", "flyer-tourist-order.pdf", "flyer-tourist-order-fr.pdf", "flyer-tourist-order-en.pdf", "flyer-tourist-order-fr.png", "flyer-tourist-order-en.png", "texte.txt"]) {
      expect(existsSync(path.join(dossier, f)), f).toBe(true);
    }
    expect(readFileSync(path.join(dossier, "flyer-tourist-order.pdf")).subarray(0, 5).toString("latin1")).toBe("%PDF-");
    const publies = readdirSync(path.join(racine, "public"), { recursive: true }).map(String);
    expect(publies.filter((f) => /flyer/i.test(f))).toEqual([]);
    expect(lire("affiches/README.md")).toContain("flyer/");
  });

  it("deux pages : le français puis l'anglais, avec l'agence partenaire sur chacune", () => {
    const [fr, en] = texte.split("\f");
    expect(fr).toContain("Vos courses livrées à votre");
    expect(fr).toContain("EN PARTENARIAT AVEC");
    expect(en).toContain("Your groceries delivered to");
    expect(en).toContain("IN PARTNERSHIP WITH");
    expect(texte).not.toMatch(/\p{Extended_Pictographic}/u);
  });

  it("il annonce ce que le site annonce : si l'un de ces points change, le flyer est à refaire", () => {
    // Le soir, de 19 h à minuit ; avant 17 h, livré le soir même.
    expect(lire("prisma/remplissage.ts")).toMatch(/creneaux: \["19:00 – 20:00".*"23:00 – 00:00"\]/);
    expect(texte).toContain("19h – 00h");
    expect(texte).toContain("7 pm – midnight");
    expect(lire("prisma/schema.prisma")).toMatch(/heureLimite\s+String\s+@default\("17:00"\)/);
    expect(texte).toContain("COMMANDEZ AVANT 17H");
    expect(texte).toContain("ORDER BEFORE 5 PM");
    // Aucun prix : le gérant a fait retirer les frais de livraison du flyer le 24 novembre 2026 (« ils n'ont pas
    // besoin de le voir ») — ils se lisent au panier. Deux encadrés sous le titre, plus trois.
    expect(texte).not.toMatch(/frais de livraison|delivery fee|₪|\bdès \d|from \d/i);
    expect(generateur_du_flyer.match(/faits: \[\[[^\n]*\]\],/g)?.map((l) => l.split('"], ["').length)).toEqual([2, 2]);
    // Les modes de paiement de départ.
    expect(PAIEMENTS_PAR_DEFAUT).toEqual(["Bit", "PayBox", "Virement"]);
    expect(texte).toContain("par Bit, PayBox ou virement");
    expect(texte).toContain("by Bit, PayBox or bank transfer");
    // Des VILLES, pas des zones : le quartier de Netanya n'en est pas une de plus.
    const villes = communesLivrees(GRILLE_DES_ZONES.map((z) => z.nom));
    expect(texte).toContain(`${villes.length} villes livrées`);
    expect(texte).toContain(`${villes.length} cities served`);
    for (const v of ["Netanya", "Herzliya", "Ra'anana", "Kfar Saba", "Hadera", "Césarée", "Tel Aviv"]) {
      expect(villes, v).toContain(v);
      expect(texte, v).toContain(v);
    }
    // Le numéro WhatsApp du gérant, celui de la page de contact.
    const numero = lire("prisma/remplissage.ts").match(/WHATSAPP_DU_GERANT = "([^"]+)"/)?.[1] ?? "";
    expect(numero).not.toBe("");
    expect(texte.split(numero).length - 1).toBe(2);
    // Il répond en français, en anglais et en hébreu — le russe et l'espagnol ne sont jamais promis.
    expect(texte).toContain("Nous répondons en français, en anglais et en hébreu.");
    expect(texte).toContain("We reply in English, French and Hebrew.");
    expect(texte).not.toMatch(/russe|espagnol|Russian|Spanish/);
    expect(texte).toContain("touristorder.com");
  });

  it("le texte vérifié est bien celui que le générateur écrit ; le QR mène au site avec le repère du flyer", () => {
    // Chaque phrase du générateur se retrouve dans le texte du PDF : texte.txt n'est pas resté en arrière.
    for (const phrase of ["Vos courses livrées à votre logement, le soir même.", "Un article introuvable ? Demandez-le nous : nous le cherchons pour vous.", "Can't find an item? Ask us and we'll look for it."]) {
      expect(generateur_du_flyer).toContain(phrase);
      expect(texte.replace(/\s+/g, " "), phrase).toContain(phrase);
    }
    const numero = lire("prisma/remplissage.ts").match(/WHATSAPP_DU_GERANT = "([^"]+)"/)?.[1] ?? "";
    expect(generateur_du_flyer).toContain(`const WHATSAPP = "${numero}";`);
    expect(generateur_du_flyer).toContain("https://www.touristorder.com/?via=flyer");
    expect(existsSync(path.join(racine, "affiches/elements/qr-flyer.svg"))).toBe(true);
    expect(generateur_du_flyer).toContain("elements/qr-flyer.svg");
    // Le logo de l'agence et la bannière : les fichiers du dépôt, rien d'autre ; pas d'emoji.
    expect(generateur_du_flyer).toContain("affiches/elements/elite-home-group-noir.png");
    expect(generateur_du_flyer).toContain("public/accueil/banniere.jpg");
    expect(generateur_du_flyer).not.toMatch(/\p{Extended_Pictographic}/u);
  });
});
