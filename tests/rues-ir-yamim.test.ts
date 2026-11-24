// Les rues d'Ir Yamim et de Ramat Poleg (prisma/rues-ir-yamim-1124.ts) : la liste du gérant, vérifiée chez Google
// le 24 novembre 2026, et ce qu'elle doit donner — au panier avec Google, pour une adresse tapée à la main, et
// sans jamais désigner Netanya à qui loge dans une autre ville.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LONGUEUR_MAXIMALE_DES_REPERES, REPERES_AU_PLUS, lireReperes, zoneASignaler, zoneCitee, zonePourLieu, zoneReperee } from "@/lib/zones";
import { nomVille } from "@/lib/i18n/catalogue";
import { LANGUES } from "@/lib/langues";
import { QUARTIER_IR_YAMIM } from "../prisma/zones-1123";
import { CLE_RUES_D_IR_YAMIM, LATITUDE_NORD_DU_QUARTIER, RUES_A_CONFIRMER, RUES_D_IR_YAMIM, reperesAvec, texteDesRues } from "../prisma/rues-ir-yamim-1124";

const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
const zone = (nom: string, reperes = "") => zoneReperee(nom, reperes, LANGUES.map((l) => nomVille(nom, l)));
const ZONES = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, texteDesRues()), zone("Kfar Yona"), zone("Herzliya"), zone("Tel Aviv")];
const HEBREU = /[֐-׿]/;

describe("la liste des rues", () => {
  it("47 rues de ses deux listes (13 d'Ir Yamim, 34 de Ramat Poleg), chacune en lettres latines et en hébreu", () => {
    expect(RUES_D_IR_YAMIM).toHaveLength(47);
    for (const rue of RUES_D_IR_YAMIM) {
      expect(rue.noms.some((n) => !HEBREU.test(n)), rue.noms[0]).toBe(true);
      expect(rue.noms.some((n) => HEBREU.test(n)), rue.noms[0]).toBe(true);
      // Chaque écriture est un repère utilisable (pas un simple mot de voie, pas trop courte).
      for (const nom of rue.noms) expect(lireReperes(nom), nom).toHaveLength(1);
    }
    // Aucune écriture ne sert à deux rues.
    const toutes = RUES_D_IR_YAMIM.flatMap((r) => r.noms.flatMap((n) => lireReperes(n)));
    expect(new Set(toutes).size).toBe(toutes.length);
  });

  it("que des rues que Google situe dans les deux quartiers, au sud d'Uzi Hitman ; les cinq douteuses n'y sont pas", () => {
    // Uzi Hitman, sa limite nord, est la plus au nord de la liste.
    const plusAuNord = [...RUES_D_IR_YAMIM].sort((a, b) => b.latitude - a.latitude)[0];
    expect(plusAuNord.noms[0]).toBe("Uzi Hitman");
    for (const rue of RUES_D_IR_YAMIM) {
      expect(rue.latitude, rue.noms[0]).toBeGreaterThan(32.26);
      expect(rue.latitude, rue.noms[0]).toBeLessThan(LATITUDE_NORD_DU_QUARTIER);
    }
    expect(RUES_A_CONFIRMER.map((r) => r.nom)).toEqual(["HaKalanit", "Zvi Moissescu", "Rotem", "Sderot Pinchas Lavon", "HaIrusim"]);
    const reperes = lireReperes(texteDesRues());
    for (const mot of ["hakalanit", "kalanit", "הכלנית", "rotem", "רותם", "pinchas lavon", "pinhas lavon", "פנחס לבון", "zvi moissescu", "צבי מויססקו", "hairusim", "האירוסים", "ben gurion", "בן גוריון"]) {
      expect(reperes, mot).not.toContain(mot);
    }
  });

  it("elle tient dans le champ de « Villes », une rue par ligne", () => {
    const texte = texteDesRues();
    expect(texte.split("\n")).toHaveLength(RUES_D_IR_YAMIM.length);
    expect(texte.length).toBeLessThan(LONGUEUR_MAXIMALE_DES_REPERES);
    expect(lireReperes(texte).length).toBeLessThan(REPERES_AU_PLUS);
    expect(lireReperes(texte)).toContain("זלמן שזר"); // « שז"ר » : le guillemet de l'abréviation ne compte pas
  });
});

describe("une adresse choisie dans les propositions de Google", () => {
  // Les formes que Google a réellement rendues le 24 novembre (rue : nom long, nom court, hébreu).
  const aNetanya = (...rue: string[]) => zonePourLieu({ villes: ["Netanya", "נתניה"], precisions: rue }, ZONES).zone;

  it("une rue de la liste, telle que Google l'écrit, donne la zone à 40 ₪", () => {
    expect(aNetanya("Zalman Shazar Street", "Zalman Shazar St", 'זלמן שז"ר')).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Mordekhai Gur Street", "Mordekhai Gur St", "מרדכי גור")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Tsiporen Street", "Tsiporen St", "ציפורן")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Sachlav Street", "Sachlav St", "רחוב סחלב")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Simtat HaLotem", "סמטת הלוטם")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Ha-Vradim Street", "Ha-Vradim St", "הורדים")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Yakinton Street", "Yakinton St", "יקינטון")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Shulamit Street", "Shulamit St", "שולמית")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Ehud Manor Street", "Ehud Manor St", "אהוד מנור")).toBe(QUARTIER_IR_YAMIM);
    // Ir Yamim : Google écrit « Arik Lavi », « עופרה חזה », et « אופיר שייקה » le nom d'abord, sans lettres latines.
    expect(aNetanya("Arik Lavi Street", "Arik Lavi St", "אריק לביא")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Ofra Haza Street", "Ofra Haza St", "עופרה חזה")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("אופיר שייקה")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Yisra'el Poliakov Street", "Yisra'el Poliakov St", "ישראל פוליאקוב")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya("Uzi Hitman Street", "Uzi Hitman St", "עוזי חיטמן")).toBe(QUARTIER_IR_YAMIM);
  });

  it("l'hébreu seul suffit : c'est lui que le site relit dans toutes les langues", () => {
    for (const rue of RUES_D_IR_YAMIM) {
      const hebreu = rue.noms.filter((n) => HEBREU.test(n));
      expect(aNetanya(hebreu[hebreu.length - 1]), rue.noms[0]).toBe(QUARTIER_IR_YAMIM);
    }
  });

  it("une autre rue de Netanya reste à Netanya — la rue Herzl, et HaKalanit, que Google situe au nord", () => {
    expect(aNetanya("Herzl Street", "Herzl St", "הרצל")).toBe("Netanya");
    expect(aNetanya("HaKalanit Street", "HaKalanit St", "הכלנית")).toBe("Netanya");
    expect(aNetanya("Rotem Street", "Rotem St", "רותם")).toBe("Netanya");
    expect(aNetanya("Sderot Pinhas Lavon", "שדרות פנחס לבון")).toBe("Netanya");
    expect(aNetanya("Sderot Ben Gurion", "שדרות בן גוריון")).toBe("Netanya");
  });

  it("la même rue dans une autre ville n'est pas celle du quartier", () => {
    expect(zonePourLieu({ villes: ["Tel Aviv-Yafo", "תל אביב-יפו"], precisions: ["Menachem Begin Road", "דרך מנחם בגין"] }, ZONES).zone).toBe("Tel Aviv");
    expect(zonePourLieu({ villes: ["Herzliya", "הרצליה"], precisions: ["Ha-Vradim Street", "הורדים"] }, ZONES).zone).toBe("Herzliya");
    expect(zonePourLieu({ villes: ["Jerusalem", "ירושלים"], precisions: ["Zalman Shazar Boulevard", 'שדרות זלמן שז"ר'] }, ZONES)).toEqual({ zone: null, villeNonLivree: "Jerusalem" });
  });

  it("le gérant est prévenu si le client a gardé Netanya à 30 ₪ pour une rue du quartier", () => {
    const commande = { adresse: "Zalman Shazar Street 5", ville: "Netanya", villeGoogle: "Netanya | נתניה", reperesGoogle: 'Zalman Shazar Street | Zalman Shazar St | זלמן שז"ר' };
    expect(zoneASignaler(commande, ZONES)).toEqual({ zone: QUARTIER_IR_YAMIM, horsZones: null });
    expect(zoneASignaler({ ...commande, ville: QUARTIER_IR_YAMIM }, ZONES)).toBeNull();
  });
});

describe("une adresse tapée à la main", () => {
  const citee = (adresse: string, choisie = "Netanya") => zoneCitee(adresse, choisie, ZONES);

  it("à Netanya, une rue de la liste désigne le quartier — quelle que soit l'écriture", () => {
    expect(citee("Zalman Shazar 5")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("12 rue Savyon, apt 3")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Motta Gur 8")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Ofra Haza 4, apt 12")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("עפרה חזה 4")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Shaike Ophir 3")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("הציפורן 4")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("רחוב הוורדים 7, נתניה")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Herzl 12")).toBeNull();
    // Qui a déjà choisi le quartier n'est pas renvoyé ailleurs.
    expect(citee("Savyon 3", QUARTIER_IR_YAMIM)).toBeNull();
  });

  it("dans une AUTRE ville, ces noms de rues ne désignent pas Netanya : toutes les villes ont les leurs", () => {
    expect(citee("Menachem Begin 132", "Tel Aviv")).toBeNull();
    expect(citee("דרך מנחם בגין 132", "Tel Aviv")).toBeNull();
    expect(citee("HaVradim 5", "Herzliya")).toBeNull();
    expect(citee("Savyon 3", "Kfar Yona")).toBeNull();
    expect(citee("Ir Yamim tower", "Tel Aviv")).toBeNull();
  });

  it("… sauf si l'adresse nomme Netanya : alors c'est bien le quartier", () => {
    expect(citee("Menachem Begin 5, Netanya", "Tel Aviv")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("הוורדים 7 נתניה", "Herzliya")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Ir Yamim, Netanya", "Tel Aviv")).toBe(QUARTIER_IR_YAMIM);
    // Netanya nommée sans rue de la liste : la ville, pas le quartier.
    expect(citee("Herzl 12, Netanya", "Tel Aviv")).toBe("Netanya");
  });
});

describe("posées une seule fois, sans rien retirer de ce que le gérant a écrit", () => {
  const remplissage = lire("prisma/remplissage.ts");
  const corps = remplissage.slice(remplissage.indexOf("export async function ajouterLesRuesDIrYamim"));
  const fonction = corps.slice(0, corps.indexOf("\n}\n") + 3);

  it("la mise en ligne l'appelle après la grille des zones, qui crée le quartier", () => {
    const preparer = lire("prisma/preparer.ts");
    expect(preparer.indexOf("ajouterLesRuesDIrYamim(prisma)")).toBeGreaterThan(preparer.indexOf("corrigerLaGrilleDesZones(prisma)"));
    expect(preparer.indexOf("ajouterLesRuesDIrYamim(prisma)")).toBeLessThan(preparer.indexOf("mettreLesReglagesANiveau(prisma)"));
  });

  it("ce que le gérant a écrit reste en tête, tel quel ; seules les écritures absentes s'ajoutent", () => {
    const { texte, rues } = reperesAvec("Ehud Manor, Résidence Lagoon\nרחוב סביון", RUES_D_IR_YAMIM, lireReperes, LONGUEUR_MAXIMALE_DES_REPERES);
    expect(texte.startsWith("Ehud Manor, Résidence Lagoon\nרחוב סביון\n")).toBe(true);
    expect(rues).toBe(47);
    // « Ehud Manor » y était : seule son écriture en hébreu est ajoutée ; « סביון » y était : seul « Savyon » l'est.
    expect(texte.split("\n")).toContain("אהוד מנור");
    expect(texte.split("\n")).toContain("Savyon");
    expect(lireReperes(texte)).toContain("residence lagoon");
    // Une seconde fois : plus rien à ajouter. Et jamais au-delà de la place du champ.
    expect(reperesAvec(texte, RUES_D_IR_YAMIM, lireReperes, LONGUEUR_MAXIMALE_DES_REPERES)).toEqual({ texte, rues: 0 });
    expect(reperesAvec("", RUES_D_IR_YAMIM, lireReperes, 40).texte.length).toBeLessThanOrEqual(40);
  });

  it("une clé à elle ; elle ajoute à la suite du texte du gérant et ne supprime rien", () => {
    expect(CLE_RUES_D_IR_YAMIM).toBe("rues-ir-yamim-1124");
    expect(fonction).toContain("operationFaite(prisma, CLE_RUES_D_IR_YAMIM)");
    expect(fonction).toContain("noterOperation(prisma, CLE_RUES_D_IR_YAMIM)");
    expect(fonction).toContain("reperesAvec(zone.reperes, RUES_D_IR_YAMIM, lireReperes, LONGUEUR_MAXIMALE_DES_REPERES)");
    expect(fonction).not.toMatch(/delete|deleteMany|create\(/);
    expect(fonction).toContain("where: { nom: QUARTIER_IR_YAMIM }");
  });
});
