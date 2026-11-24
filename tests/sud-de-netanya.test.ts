// Givat HaIrusim et la zone industrielle à 40 ₪ (réponse du gérant, 24 novembre 2026 : « 40 sh » pour l'un comme pour
// l'autre) — et, avec eux, tout le sud de Netanya. Les positions de ce test ont été relevées chez Google ce jour-là
// (prisma/sud-de-netanya-1124.ts, prisma/kiryat-nordau-1124.ts, prisma/limites-ir-yamim-1124.ts).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LONGUEUR_MAXIMALE_DES_LIMITES, LONGUEUR_MAXIMALE_DES_REPERES, RECTANGLES_AU_PLUS, REPERES_AU_PLUS, communeDe, communesLivrees, dansLesLimites, lireLimites, lireReperes, quartiersDe, zoneASignaler, zoneCitee, zonePourLieu, zoneReperee } from "@/lib/zones";
import { fraisDeLivraison } from "@/lib/villes";
import { nomVille } from "@/lib/i18n/catalogue";
import { LANGUES } from "@/lib/langues";
import { VILLES_EXEMPLE } from "../prisma/catalogue";
import { GRILLE_DES_ZONES, QUARTIER_IR_YAMIM } from "../prisma/zones-1123";
import { texteDesRues } from "../prisma/rues-ir-yamim-1124";
import { DANS_LA_ZONE, LIMITES_D_IR_YAMIM } from "../prisma/limites-ir-yamim-1124";
import { DANS_KIRYAT_NORDAU, LIMITES_DE_KIRYAT_NORDAU, QUARTIER_KIRYAT_NORDAU, reperesDeKiryatNordau } from "../prisma/kiryat-nordau-1124";
import {
  AU_NORD_DE_LA_LIGNE, CLE_GIVAT_HAIRUSIM, CLE_ZONE_INDUSTRIELLE, DANS_GIVAT_HAIRUSIM, DANS_LA_ZONE_INDUSTRIELLE, LIMITES_DE_GIVAT_HAIRUSIM, LIMITES_DE_LA_ZONE_INDUSTRIELLE,
  LIVRAISON_AU_SUD_DE_NETANYA, QUARTIER_GIVAT_HAIRUSIM, RUES_DE_GIVAT_HAIRUSIM, RUES_DE_LA_ZONE_INDUSTRIELLE, ZONE_INDUSTRIELLE, reperesDeGivatHaIrusim, reperesDeLaZoneIndustrielle,
} from "../prisma/sud-de-netanya-1124";

const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
const zone = (nom: string, reperes = "", limites = "") => zoneReperee(nom, reperes, LANGUES.map((l) => nomVille(nom, l)), limites);
const SUD = [QUARTIER_IR_YAMIM, QUARTIER_KIRYAT_NORDAU, QUARTIER_GIVAT_HAIRUSIM, ZONE_INDUSTRIELLE];
// Les zones telles qu'elles sont en service, dans l'ordre de la liste : Netanya, puis ses quatre secteurs du sud.
const ZONES = [
  zone("Netanya"),
  zone(QUARTIER_IR_YAMIM, texteDesRues(), LIMITES_D_IR_YAMIM),
  zone(QUARTIER_KIRYAT_NORDAU, reperesDeKiryatNordau(), LIMITES_DE_KIRYAT_NORDAU),
  zone(QUARTIER_GIVAT_HAIRUSIM, reperesDeGivatHaIrusim(), LIMITES_DE_GIVAT_HAIRUSIM),
  zone(ZONE_INDUSTRIELLE, reperesDeLaZoneIndustrielle(), LIMITES_DE_LA_ZONE_INDUSTRIELLE),
  zone("Even Yehuda"),
  zone("Herzliya"),
  zone("Tel Aviv"),
];
// … et sans aucune rue : seule la position peut dire le secteur.
const PAR_POSITION = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, "", LIMITES_D_IR_YAMIM), zone(QUARTIER_KIRYAT_NORDAU, "", LIMITES_DE_KIRYAT_NORDAU), zone(QUARTIER_GIVAT_HAIRUSIM, "", LIMITES_DE_GIVAT_HAIRUSIM), zone(ZONE_INDUSTRIELLE, "", LIMITES_DE_LA_ZONE_INDUSTRIELLE), zone("Even Yehuda"), zone("Tel Aviv")];
const aNetanya = (zones: typeof ZONES, lat: number, lng: number, ...rue: string[]) => zonePourLieu({ villes: ["Netanya", "נתניה"], precisions: rue, position: { lat, lng } }, zones).zone;

describe("deux zones de plus, au prix des deux autres quartiers du sud", () => {
  it("40 ₪ au tarif de base ; quatre secteurs de Netanya, toujours 19 villes", () => {
    const prix = (nom: string) => GRILLE_DES_ZONES.find((z) => z.nom === nom)?.livraison;
    expect(LIVRAISON_AU_SUD_DE_NETANYA).toBe(4000);
    for (const nom of SUD) expect(prix(nom), nom).toBe(4000);
    expect(prix("Netanya")).toBe(3000);
    const noms = GRILLE_DES_ZONES.map((z) => z.nom);
    expect(noms.slice(0, 5)).toEqual(["Netanya", ...SUD]);
    expect(noms).toHaveLength(23);
    // Le flyer et l'accueil annoncent 19 villes : un quartier n'en est pas une.
    expect(communesLivrees(noms)).toHaveLength(19);
    for (const nom of SUD) expect(communeDe(nom), nom).toBe("Netanya");
    expect(quartiersDe(QUARTIER_GIVAT_HAIRUSIM)).toEqual(["Givat HaIrusim"]);
    expect(quartiersDe(ZONE_INDUSTRIELLE)).toEqual(["Zone industrielle Poleg"]);
  });

  it("au panier : livraison de base + supplément de la zone = 40 ₪", () => {
    const tarif = { nom: "", fraisService: 0, fraisLivraison: 3000, fraisExpress: 0, majorationPct: 0 };
    for (const nom of [QUARTIER_GIVAT_HAIRUSIM, ZONE_INDUSTRIELLE]) {
      const v = VILLES_EXEMPLE.find((x) => x.nom === nom);
      expect(v, nom).toMatchObject({ supplementLivraison: 1000, minimumCommande: 0 });
      expect(fraisDeLivraison(tarif, v!, false), nom).toBe(4000);
    }
  });

  it("leur nom dans les cinq langues", () => {
    expect(LANGUES.map((l) => nomVille(QUARTIER_GIVAT_HAIRUSIM, l))).toEqual(["Netanya – Givat HaIrusim", "Netanya – Givat HaIrusim", "Нетания – Гиват-ха-Ирусим", "נתניה – גבעת האירוסים", "Netanya – Givat HaIrusim"]);
    expect(LANGUES.map((l) => nomVille(ZONE_INDUSTRIELLE, l))).toEqual(["Netanya – Zone industrielle Poleg", "Netanya – Poleg industrial zone", "Нетания – Промзона Полег", "נתניה – אזור התעשייה פולג", "Netanya – Zona industrial Poleg"]);
    // Le nom du secteur, dans chaque langue, le désigne ; « Netanya » seul, non — et « Poleg » seul reste à Ir Yamim / Poleg.
    const gi = ZONES.find((z) => z.nom === QUARTIER_GIVAT_HAIRUSIM)!;
    const zi = ZONES.find((z) => z.nom === ZONE_INDUSTRIELLE)!;
    for (const mot of ["givat hairusim", "גבעת האירוסים", "гиват ха ирусим"]) expect(gi.reperes, mot).toContain(mot);
    for (const mot of ["zone industrielle poleg", "poleg industrial zone", "zona industrial poleg", "אזור התעשייה פולג", "промзона полег", "kiryat sapir", "קרית ספיר"]) expect(zi.reperes, mot).toContain(mot);
    for (const z of [gi, zi]) {
      expect(z.noms).toEqual([]);
      for (const interdit of ["netanya", "נתניה", "poleg", "פולג", "zone industrielle", "industrial zone", "אזור התעשייה"]) expect(z.reperes, `${z.nom} : ${interdit}`).not.toContain(interdit);
    }
  });
});

describe("leurs limites, face aux adresses relevées chez Google", () => {
  const gi = lireLimites(LIMITES_DE_GIVAT_HAIRUSIM);
  const zi = lireLimites(LIMITES_DE_LA_ZONE_INDUSTRIELLE);

  it("lisibles, dans la place que le champ accepte", () => {
    expect(gi).toEqual([{ nord: 32.288, sud: 32.2831, est: 34.8527 }]);
    expect(zi).toHaveLength(5);
    expect(zi.length).toBeLessThanOrEqual(RECTANGLES_AU_PLUS);
    expect(LIMITES_DE_LA_ZONE_INDUSTRIELLE.length).toBeLessThan(LONGUEUR_MAXIMALE_DES_LIMITES);
    // La zone industrielle est ouverte vers l'est et vers le sud : aucun rectangle n'a de bord est.
    for (const r of zi) expect(r.est).toBeUndefined();
    expect(zi[0].sud).toBeUndefined();
  });

  it("Givat HaIrusim : ses rues aux noms de fleurs, de la limite d'Ir Yamim à Shalom Aleichem", () => {
    expect(DANS_GIVAT_HAIRUSIM.length).toBeGreaterThan(20);
    for (const [lieu, lat, lng] of DANS_GIVAT_HAIRUSIM) {
      expect(dansLesLimites({ lat, lng }, gi), lieu).toBe(true);
      expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe(QUARTIER_GIVAT_HAIRUSIM);
    }
    for (const rue of RUES_DE_GIVAT_HAIRUSIM) expect(aNetanya(PAR_POSITION, rue.lat, rue.lng), rue.noms[0]).toBe(QUARTIER_GIVAT_HAIRUSIM);
  });

  it("la zone industrielle : de l'autre côté de la route 2, d'IKEA au pont HaShalom", () => {
    expect(DANS_LA_ZONE_INDUSTRIELLE.length).toBeGreaterThan(35);
    for (const [lieu, lat, lng] of DANS_LA_ZONE_INDUSTRIELLE) {
      expect(dansLesLimites({ lat, lng }, zi), lieu).toBe(true);
      expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe(ZONE_INDUSTRIELLE);
    }
    for (const rue of RUES_DE_LA_ZONE_INDUSTRIELLE) expect(aNetanya(PAR_POSITION, rue.lat, rue.lng), rue.noms[0]).toBe(ZONE_INDUSTRIELLE);
  });

  it("au nord de la ligne Eisenhower – Shalom Aleichem – pont HaShalom : Netanya, à 30 ₪", () => {
    expect(AU_NORD_DE_LA_LIGNE.length).toBeGreaterThanOrEqual(20);
    for (const [lieu, lat, lng] of AU_NORD_DE_LA_LIGNE) {
      expect(dansLesLimites({ lat, lng }, gi), lieu).toBe(false);
      expect(dansLesLimites({ lat, lng }, zi), lieu).toBe(false);
      expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe("Netanya");
      expect(aNetanya(ZONES, lat, lng), lieu).toBe("Netanya");
    }
  });

  it("les deux autres quartiers gardent leurs adresses : leurs limites n'ont pas bougé, et ils passent avant", () => {
    expect(LIMITES_D_IR_YAMIM).toBe("nord 32.2832, est 34.8475\nnord 32.2772, est 34.8525");
    expect(lireLimites(LIMITES_DE_KIRYAT_NORDAU)).toHaveLength(5);
    for (const [lieu, lat, lng] of DANS_LA_ZONE) expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe(QUARTIER_IR_YAMIM);
    for (const [lieu, lat, lng] of DANS_KIRYAT_NORDAU) expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe(QUARTIER_KIRYAT_NORDAU);
    // Le rectangle de Givat HaIrusim déborde sur Kiryat Nordau (Katznelson, Shlonsky) : c'est Kiryat Nordau qui les nomme.
    const debordent = DANS_KIRYAT_NORDAU.filter(([, lat, lng]) => dansLesLimites({ lat, lng }, gi));
    expect(debordent.length).toBeGreaterThan(5);
  });
});

describe("tout le sud de Netanya est à 40 ₪", () => {
  it("au sud de la ligne, aucune adresse de Netanya ne reste à 30 ₪ — ni trou, ni couture", () => {
    let points = 0;
    for (let lat = 32.26; lat < 32.2879; lat += 0.00023) {
      for (let lng = 34.834; lng < 34.87; lng += 0.00037) {
        points++;
        const z = aNetanya(PAR_POSITION, lat, lng);
        if (!SUD.includes(z ?? "")) throw new Error(`${lat.toFixed(5)}, ${lng.toFixed(5)} : ${z}`);
      }
    }
    expect(points).toBeGreaterThan(10000);
    // Les coutures elles-mêmes : les bords de chaque rectangle, à la valeur exacte.
    const bords = [LIMITES_D_IR_YAMIM, LIMITES_DE_KIRYAT_NORDAU, LIMITES_DE_GIVAT_HAIRUSIM, LIMITES_DE_LA_ZONE_INDUSTRIELLE].flatMap(lireLimites);
    const latitudes = [...new Set(bords.flatMap((r) => [r.nord, r.sud]).filter((x): x is number => x !== undefined && x < 32.2879))];
    const longitudes = [...new Set(bords.flatMap((r) => [r.est, r.ouest]).filter((x): x is number => x !== undefined))];
    for (const lat of latitudes) for (let lng = 34.834; lng < 34.87; lng += 0.0001) expect(SUD, `${lat}, ${lng.toFixed(4)}`).toContain(aNetanya(PAR_POSITION, lat, lng));
    for (const lng of longitudes) for (let lat = 32.26; lat < 32.2879; lat += 0.0001) expect(SUD, `${lat.toFixed(4)}, ${lng}`).toContain(aNetanya(PAR_POSITION, lat, lng));
  });

  it("au nord de 32,2890, rien n'a changé : Netanya, d'un bord à l'autre de la ville", () => {
    for (let lat = 32.289; lat < 32.35; lat += 0.0011) {
      for (let lng = 34.834; lng < 34.875; lng += 0.0013) expect(aNetanya(PAR_POSITION, lat, lng), `${lat.toFixed(4)}, ${lng.toFixed(4)}`).toBe("Netanya");
    }
  });

  it("les limites ne valent que dans Netanya : Kfar Netter et Even Yehuda sont à l'est, Tel Aviv au sud", () => {
    const evenYehuda = { lat: 32.2707, lng: 34.8795 };
    expect(dansLesLimites(evenYehuda, lireLimites(LIMITES_DE_LA_ZONE_INDUSTRIELLE))).toBe(true); // le rectangle est ouvert vers l'est…
    expect(zonePourLieu({ villes: ["Even Yehuda", "אבן יהודה"], precisions: ["Tsurit Street"], position: evenYehuda }, ZONES).zone).toBe("Even Yehuda"); // … mais c'est la ville qui décide d'abord
    expect(zonePourLieu({ villes: ["Kfar Netter", "כפר נטר"], precisions: ["HaAlon Street"], position: { lat: 32.281, lng: 34.8753 } }, ZONES)).toEqual({ zone: null, villeNonLivree: "Kfar Netter" });
    expect(zonePourLieu({ villes: ["Tel Aviv-Yafo", "תל אביב-יפו"], precisions: ["Ha-Melakha Street", "המלאכה"], position: { lat: 32.0625, lng: 34.7806 } }, ZONES).zone).toBe("Tel Aviv");
  });
});

describe("par le nom de la rue : une adresse choisie chez Google, ou tapée à la main", () => {
  it("la rue passe avant la position", () => {
    // Dwight Eisenhower 1, au carrefour, est à deux mètres au nord de la ligne : la rue dit Givat HaIrusim.
    expect(aNetanya(PAR_POSITION, 32.28802, 34.84844)).toBe("Netanya");
    expect(aNetanya(ZONES, 32.28802, 34.84844, "Dwight Eisenhower Street", "דווייט אייזנהאואר")).toBe(QUARTIER_GIVAT_HAIRUSIM);
    // Les écritures de Google, en lettres latines et en hébreu.
    expect(aNetanya(ZONES, 32.28481, 34.84928, "Rotem Street", "רותם")).toBe(QUARTIER_GIVAT_HAIRUSIM);
    expect(aNetanya(ZONES, 32.28631, 34.84962, "Khartsit Street", "חרצית")).toBe(QUARTIER_GIVAT_HAIRUSIM);
    expect(aNetanya(ZONES, 32.28026, 34.85895, "Ha-Melakha Street", "Ha-Melakha St", "המלאכה")).toBe(ZONE_INDUSTRIELLE);
    expect(aNetanya(ZONES, 32.27948, 34.86024, "Sderot Giborei Israel", "שדרות גיבורי ישראל")).toBe(ZONE_INDUSTRIELLE);
    // Le lieu lui-même, tel que Google le nomme.
    expect(zonePourLieu({ villes: ["נתניה"], precisions: ["גבעת האירוסים"] }, ZONES).zone).toBe(QUARTIER_GIVAT_HAIRUSIM);
    expect(zonePourLieu({ villes: ["נתניה"], precisions: ["אזור התעשייה פולג", "הבונים"] }, ZONES).zone).toBe(ZONE_INDUSTRIELLE);
    // « Poleg » seul reste le quartier de Ramat Poleg : le nom le plus long l'emporte.
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Ramat Poleg"] }, ZONES).zone).toBe(QUARTIER_IR_YAMIM);
  });

  it("les rues : écrites comme Google, en hébreu et en lettres latines, sans doublon d'une zone à l'autre", () => {
    expect(RUES_DE_GIVAT_HAIRUSIM).toHaveLength(5);
    expect(RUES_DE_LA_ZONE_INDUSTRIELLE).toHaveLength(12);
    for (const rue of [...RUES_DE_GIVAT_HAIRUSIM, ...RUES_DE_LA_ZONE_INDUSTRIELLE]) {
      expect(rue.noms.some((n) => /[א-ת]/.test(n)), rue.noms[0]).toBe(true);
      expect(rue.noms.some((n) => /^[A-Za-z' .-]+$/.test(n)), rue.noms[0]).toBe(true);
    }
    const listes = [texteDesRues(), reperesDeKiryatNordau(), reperesDeGivatHaIrusim(), reperesDeLaZoneIndustrielle()].map((t) => {
      expect(t.length).toBeLessThan(LONGUEUR_MAXIMALE_DES_REPERES);
      const r = lireReperes(t);
      expect(r.length).toBeLessThan(REPERES_AU_PLUS);
      return r;
    });
    const tous = listes.flat();
    expect(new Set(tous).size).toBe(tous.length);
    // Shalom Aleichem borde Givat HaIrusim et se poursuit à Kiryat Nordau ; HaGavish et HaTzoran traversent le pont : la position décide.
    for (const interdit of ["shalom aleichem", "שלום עליכם", "הגביש", "הצורן", "ben gurion", "בן גוריון"]) expect(tous, interdit).not.toContain(interdit);
  });

  it("le client de Netanya qui tape une de ces rues : la bonne zone lui est proposée, et le gérant est prévenu", () => {
    expect(zoneCitee("Rotem 12", "Netanya", ZONES)).toBe(QUARTIER_GIVAT_HAIRUSIM);
    expect(zoneCitee("חבצלת החוף 8", "Netanya", ZONES)).toBe(QUARTIER_GIVAT_HAIRUSIM);
    expect(zoneCitee("Hartzit 20, Givat HaIrusim", "Netanya", ZONES)).toBe(QUARTIER_GIVAT_HAIRUSIM);
    expect(zoneCitee("HaMelacha 10", "Netanya", ZONES)).toBe(ZONE_INDUSTRIELLE);
    expect(zoneCitee("אזור התעשייה פולג, הבונים 4", "Netanya", ZONES)).toBe(ZONE_INDUSTRIELLE);
    expect(zoneCitee("Kiryat Sapir, Yad Harutzim 12", QUARTIER_KIRYAT_NORDAU, ZONES)).toBe(ZONE_INDUSTRIELLE);
    expect(zoneASignaler({ adresse: "Giborei Israel 5", ville: "Netanya" }, ZONES)).toMatchObject({ zone: ZONE_INDUSTRIELLE });
    // Il a choisi la bonne zone : rien à signaler.
    expect(zoneCitee("Rotem 12", QUARTIER_GIVAT_HAIRUSIM, ZONES)).toBeNull();
    expect(zoneASignaler({ adresse: "HaMelacha 10", ville: ZONE_INDUSTRIELLE }, ZONES)).toBeNull();
    // Ces noms de rues existent dans d'autres villes : hors de Netanya, ils ne désignent rien.
    expect(zoneCitee("HaMelacha 10", "Tel Aviv", ZONES)).toBeNull();
    expect(zoneCitee("Rotem 12", "Herzliya", ZONES)).toBeNull();
  });

  it("une commande : l'adresse que Google situe dans le secteur, choisie à 30 ₪, est signalée au gérant", () => {
    const rotem = { adresse: "Rotem Street 5", ville: "Netanya", villeGoogle: "Netanya | נתניה", reperesGoogle: "", latitudeGoogle: 32.284178, longitudeGoogle: 34.847364 };
    expect(zoneASignaler(rotem, PAR_POSITION)).toMatchObject({ zone: QUARTIER_GIVAT_HAIRUSIM });
    expect(zoneASignaler({ ...rotem, ville: QUARTIER_GIVAT_HAIRUSIM }, PAR_POSITION)).toBeNull();
    const melacha = { adresse: "Ha-Melakha Street 20", ville: "Netanya", villeGoogle: "Netanya", reperesGoogle: "", latitudeGoogle: 32.280255, longitudeGoogle: 34.858951 };
    expect(zoneASignaler(melacha, PAR_POSITION)).toMatchObject({ zone: ZONE_INDUSTRIELLE });
    // Au nord de la ligne, choisie à 30 ₪ : rien à dire.
    expect(zoneASignaler({ adresse: "Herzl Street 10", ville: "Netanya", villeGoogle: "Netanya", reperesGoogle: "Herzl Street | הרצל", latitudeGoogle: 32.329479, longitudeGoogle: 34.853879 }, ZONES)).toBeNull();
  });
});

describe("la mise en ligne : une seule fois chacune, sans rien écraser", () => {
  const code = lire("prisma/remplissage.ts");
  const fonction = (nom: string) => code.slice(code.indexOf(nom), code.indexOf("\n}\n", code.indexOf(nom)));

  it("chacune sa clé, son nom, ses limites et ses rues — par le même geste que Kiryat Nordau", () => {
    expect(CLE_GIVAT_HAIRUSIM).toBe("zone-givat-hairusim-1124");
    expect(CLE_ZONE_INDUSTRIELLE).toBe("zone-industrielle-poleg-1124");
    const gi = fonction("export async function ajouterGivatHaIrusim");
    for (const morceau of ["creerUnQuartier(prisma", "cle: CLE_GIVAT_HAIRUSIM", "nom: QUARTIER_GIVAT_HAIRUSIM", "livraison: LIVRAISON_AU_SUD_DE_NETANYA", "limites: LIMITES_DE_GIVAT_HAIRUSIM", "reperes: reperesDeGivatHaIrusim()", "apres: [QUARTIER_IR_YAMIM, QUARTIER_KIRYAT_NORDAU]"]) expect(gi, morceau).toContain(morceau);
    const zi = fonction("export async function ajouterLaZoneIndustrielle");
    for (const morceau of ["creerUnQuartier(prisma", "cle: CLE_ZONE_INDUSTRIELLE", "nom: ZONE_INDUSTRIELLE", "livraison: LIVRAISON_AU_SUD_DE_NETANYA", "limites: LIMITES_DE_LA_ZONE_INDUSTRIELLE", "reperes: reperesDeLaZoneIndustrielle()", "apres: [QUARTIER_IR_YAMIM, QUARTIER_KIRYAT_NORDAU, QUARTIER_GIVAT_HAIRUSIM]"]) expect(zi, morceau).toContain(morceau);
  });

  it("lancées à la mise en ligne, après Kiryat Nordau, dans l'ordre de la liste", () => {
    const preparer = lire("prisma/preparer.ts");
    const ordre = ["poserLesLimitesDIrYamim(prisma)", "ajouterKiryatNordau(prisma)", "ajouterGivatHaIrusim(prisma)", "ajouterLaZoneIndustrielle(prisma)", "mettreLesReglagesANiveau(prisma)"].map((x) => preparer.indexOf(`dire(await ${x})`));
    expect(ordre.every((i) => i > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  });
});
