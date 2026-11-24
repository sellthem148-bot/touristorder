// La zone « Netanya – Kiryat Nordau » à 40 ₪ (demande du gérant, 24 novembre 2026 : « mets kiryat nordau à 40
// aussi »). Les positions de ce test ont été relevées chez Google ce jour-là (prisma/kiryat-nordau-1124.ts).
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
import { AUTOUR_DE_KIRYAT_NORDAU, CLE_KIRYAT_NORDAU, DANS_KIRYAT_NORDAU, LIMITES_DE_KIRYAT_NORDAU, LIVRAISON_A_KIRYAT_NORDAU, QUARTIER_KIRYAT_NORDAU, RUES_DE_KIRYAT_NORDAU, reperesDeKiryatNordau } from "../prisma/kiryat-nordau-1124";

const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
const zone = (nom: string, reperes = "", limites = "") => zoneReperee(nom, reperes, LANGUES.map((l) => nomVille(nom, l)), limites);
// Les zones telles qu'elles sont en service : les deux quartiers de Netanya avec leurs rues et leurs limites,
// dans l'ordre de la liste (Ir Yamim / Poleg d'abord).
const ZONES = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, texteDesRues(), LIMITES_D_IR_YAMIM), zone(QUARTIER_KIRYAT_NORDAU, reperesDeKiryatNordau(), LIMITES_DE_KIRYAT_NORDAU), zone("Herzliya"), zone("Tel Aviv")];
// … et sans aucune rue : seule la position peut dire le quartier.
const PAR_POSITION = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, "", LIMITES_D_IR_YAMIM), zone(QUARTIER_KIRYAT_NORDAU, "", LIMITES_DE_KIRYAT_NORDAU), zone("Tel Aviv")];
const aNetanya = (zones: typeof ZONES, lat: number, lng: number, ...rue: string[]) => zonePourLieu({ villes: ["Netanya", "נתניה"], precisions: rue, position: { lat, lng } }, zones).zone;

describe("la zone : un quartier de Netanya, au prix d'Ir Yamim / Poleg", () => {
  it("40 ₪ au tarif de base, comme l'autre quartier — et pas une ville de plus", () => {
    const prix = (nom: string) => GRILLE_DES_ZONES.find((z) => z.nom === nom)?.livraison;
    expect(LIVRAISON_A_KIRYAT_NORDAU).toBe(4000);
    expect(prix(QUARTIER_KIRYAT_NORDAU)).toBe(prix(QUARTIER_IR_YAMIM));
    expect(prix("Netanya")).toBe(3000);
    expect(communeDe(QUARTIER_KIRYAT_NORDAU)).toBe("Netanya");
    expect(quartiersDe(QUARTIER_KIRYAT_NORDAU)).toEqual(["Kiryat Nordau"]);
    // Le flyer et l'accueil annoncent 19 villes : un quartier n'en est pas une.
    expect(communesLivrees(GRILLE_DES_ZONES.map((z) => z.nom))).toHaveLength(19);
    // Dans la liste, juste sous l'autre quartier, lui-même juste sous Netanya.
    const noms = GRILLE_DES_ZONES.map((z) => z.nom);
    expect(noms.slice(0, 3)).toEqual(["Netanya", QUARTIER_IR_YAMIM, QUARTIER_KIRYAT_NORDAU]);
  });

  it("au panier : livraison de base + supplément de la zone = 40 ₪", () => {
    const v = VILLES_EXEMPLE.find((x) => x.nom === QUARTIER_KIRYAT_NORDAU);
    expect(v).toMatchObject({ supplementLivraison: 1000, minimumCommande: 0 });
    const tarif = { nom: "", fraisService: 0, fraisLivraison: 3000, fraisExpress: 0, majorationPct: 0 };
    expect(fraisDeLivraison(tarif, v!, false)).toBe(4000);
  });

  it("son nom dans les cinq langues ; l'hébreu et le russe ont le leur", () => {
    expect(nomVille(QUARTIER_KIRYAT_NORDAU, "fr")).toBe("Netanya – Kiryat Nordau");
    expect(nomVille(QUARTIER_KIRYAT_NORDAU, "en")).toBe("Netanya – Kiryat Nordau");
    expect(nomVille(QUARTIER_KIRYAT_NORDAU, "es")).toBe("Netanya – Kiryat Nordau");
    expect(nomVille(QUARTIER_KIRYAT_NORDAU, "he")).toBe("נתניה – קרית נורדאו");
    expect(nomVille(QUARTIER_KIRYAT_NORDAU, "ru")).toBe("Нетания – Кирьят-Нордау");
    // Le nom du quartier, dans chaque langue, la désigne ; « Netanya » seul, non.
    const z = ZONES.find((x) => x.nom === QUARTIER_KIRYAT_NORDAU)!;
    expect(z.noms).toEqual([]);
    for (const mot of ["kiryat nordau", "קרית נורדאו", "קריית נורדאו", "кирьят нордау"]) expect(z.reperes, mot).toContain(mot);
    expect(z.reperes).not.toContain("netanya");
  });
});

describe("ses limites, face aux adresses relevées chez Google", () => {
  const limites = lireLimites(LIMITES_DE_KIRYAT_NORDAU);
  const irYamim = lireLimites(LIMITES_D_IR_YAMIM);

  it("cinq rectangles lisibles, chacun fermé des quatre côtés, dans la place que le champ accepte", () => {
    expect(limites).toHaveLength(5);
    expect(limites.length).toBeLessThanOrEqual(RECTANGLES_AU_PLUS);
    expect(LIMITES_DE_KIRYAT_NORDAU.length).toBeLessThan(LONGUEUR_MAXIMALE_DES_LIMITES);
    for (const r of limites) {
      expect(Object.keys(r).sort()).toEqual(["est", "nord", "ouest", "sud"]);
      expect(r.nord!).toBeGreaterThan(r.sud!);
      expect(r.est!).toBeGreaterThan(r.ouest!);
    }
    // Du sud au nord, sans trou : chaque rectangle commence sous la fin du précédent.
    for (let i = 1; i < limites.length; i++) expect(limites[i].sud!, `rectangle ${i + 1}`).toBeLessThan(limites[i - 1].nord!);
  });

  it("tout le quartier est dedans, de Golda Meir à Shalom Aleichem et de Ben Gurion à Max Nordau", () => {
    expect(DANS_KIRYAT_NORDAU.length).toBeGreaterThan(40);
    for (const [lieu, lat, lng] of DANS_KIRYAT_NORDAU) expect(dansLesLimites({ lat, lng }, limites), lieu).toBe(true);
    for (const rue of RUES_DE_KIRYAT_NORDAU) expect(dansLesLimites({ lat: rue.lat, lng: rue.lng }, limites), rue.noms[0]).toBe(true);
  });

  // Givat HaIrusim et la zone industrielle ont chacun leur zone depuis (tests/sud-de-netanya.test.ts) : ici, on
  // vérifie seulement que les limites de Kiryat Nordau et d'Ir Yamim / Poleg ne les prennent pas.
  it("Givat HaIrusim, Agamim, Kiryat HaSharon et la zone industrielle sont dehors — des deux zones", () => {
    expect(AUTOUR_DE_KIRYAT_NORDAU.length).toBeGreaterThan(25);
    for (const [lieu, lat, lng] of AUTOUR_DE_KIRYAT_NORDAU) {
      expect(dansLesLimites({ lat, lng }, limites), lieu).toBe(false);
      expect(dansLesLimites({ lat, lng }, irYamim), lieu).toBe(false);
      expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe("Netanya");
    }
  });

  it("le bord est suit Max Nordau : la zone industrielle, 300 mètres plus loin, n'y entre à aucune hauteur", () => {
    const paires: [string, string][] = [["Max Nordau 44", "HaMelacha 20"], ["Max Nordau 20", "HaMelacha 26"], ["Max Nordau 1 (la plus à l'est)", "HaMelacha 34"], ["Arie Levin 4", "HaMelacha 4 (zone industrielle)"]];
    const point = (liste: [string, number, number][], nom: string) => liste.find((x) => x[0] === nom)!;
    for (const [dedans, dehors] of paires) {
      const [, lat, lng] = point(DANS_KIRYAT_NORDAU, dedans);
      const [, lat2, lng2] = point(AUTOUR_DE_KIRYAT_NORDAU, dehors);
      const bord = limites.find((r) => lat < r.nord! && lat > r.sud! && lng > r.ouest! && lng < r.est!)!.est!;
      // Au moins 40 mètres de marge de chaque côté (0,0004° de longitude).
      expect(bord - lng, dedans).toBeGreaterThan(0.0004);
      expect(lng2 - bord, dehors).toBeGreaterThan(0.0004);
      expect(Math.abs(lat2 - lat), `${dedans} / ${dehors}`).toBeLessThan(0.004);
    }
  });

  it("Rotem, dont Google range presque tous les numéros au même point, reste hors de la zone", () => {
    const [, lat, lng] = AUTOUR_DE_KIRYAT_NORDAU.find((x) => x[0].startsWith("Rotem, là où"))!;
    expect(dansLesLimites({ lat, lng }, limites)).toBe(false);
    // Zalman Shneur, la rue d'à côté (cent mètres au sud), est dedans.
    for (const [lieu, la, lo] of DANS_KIRYAT_NORDAU.filter((x) => x[0].startsWith("Zalman Shneur"))) expect(dansLesLimites({ lat: la, lng: lo }, limites), lieu).toBe(true);
  });

  it("aucun trou entre les deux quartiers : le long du boulevard Ben Gurion et de Golda Meir, tout est à 40 ₪", () => {
    // Une ligne de points de part et d'autre de la couture (longitude 34,8475 ; latitude 32,2772).
    for (let lat = 32.2765; lat < 32.2831; lat += 0.0003) {
      for (const lng of [34.8472, 34.8474, 34.8475, 34.8476, 34.8478]) {
        const z = aNetanya(PAR_POSITION, lat, lng);
        expect([QUARTIER_IR_YAMIM, QUARTIER_KIRYAT_NORDAU], `${lat.toFixed(4)}, ${lng}`).toContain(z);
      }
    }
    for (let lng = 34.848; lng < 34.8565; lng += 0.0004) {
      for (const lat of [32.277, 32.2772, 32.2774]) {
        const z = aNetanya(PAR_POSITION, lat, lng);
        expect([QUARTIER_IR_YAMIM, QUARTIER_KIRYAT_NORDAU], `${lat}, ${lng.toFixed(4)}`).toContain(z);
      }
    }
    // Là où les deux se recouvrent, c'est la première de la liste qui nomme l'adresse.
    expect(aNetanya(PAR_POSITION, 32.279, 34.84745)).toBe(QUARTIER_IR_YAMIM);
  });

  it("les limites d'Ir Yamim / Poleg n'ont pas bougé, et ses adresses restent à lui", () => {
    expect(LIMITES_D_IR_YAMIM).toBe("nord 32.2832, est 34.8475\nnord 32.2772, est 34.8525");
    for (const [lieu, lat, lng] of DANS_LA_ZONE) expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe(QUARTIER_IR_YAMIM);
  });
});

describe("au panier : une adresse choisie chez Google", () => {
  it("par sa position seule (aucune rue notée) : Kiryat Nordau", () => {
    for (const [lieu, lat, lng] of DANS_KIRYAT_NORDAU) expect(aNetanya(PAR_POSITION, lat, lng), lieu).toBe(QUARTIER_KIRYAT_NORDAU);
  });

  it("avec les rues : le nom de la rue passe avant la position", () => {
    // Zalman Shneur 1 et 4 sont à l'ouest de 34,8475 — dans le rectangle d'Ir Yamim. La rue dit Kiryat Nordau.
    expect(aNetanya(PAR_POSITION, 32.28255, 34.84662)).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya(ZONES, 32.28255, 34.84662, "Zalman Shneur Street", "זלמן שניאור")).toBe(QUARTIER_KIRYAT_NORDAU);
    // Zalman Shazar 44 est au nord de 32,2772 — dans un rectangle de Kiryat Nordau. La rue dit Ir Yamim / Poleg.
    expect(aNetanya(PAR_POSITION, 32.27777, 34.84932)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(aNetanya(ZONES, 32.27777, 34.84932, "Zalman Shazar Street", "זלמן שז\"ר")).toBe(QUARTIER_IR_YAMIM);
    // Les écritures de Google, en lettres latines et en hébreu.
    expect(aNetanya(ZONES, 32.2862, 34.85602, "Ha-Rav Abu Khatsera Street", "Ha-Rav Abu Khatsera St", "הרב אבו חצירא")).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(aNetanya(ZONES, 32.28266, 34.85385, "Sderot Pinhas Lavon", "שדרות פנחס לבון")).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(aNetanya(ZONES, 32.28304, 34.85704, "Nordau Max Street", "נורדאו מקס")).toBe(QUARTIER_KIRYAT_NORDAU);
  });

  it("le quartier lui-même, choisi comme lieu", () => {
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Kiryat Nordau"] }, ZONES).zone).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zonePourLieu({ villes: ["נתניה"], precisions: ["קרית נורדאו"] }, ZONES).zone).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zonePourLieu({ villes: ["נתניה"], precisions: ["קריית נורדאו"] }, ZONES).zone).toBe(QUARTIER_KIRYAT_NORDAU);
  });

  it("ailleurs à Netanya, et dans une autre ville : rien ne change", () => {
    expect(aNetanya(ZONES, 32.3277, 34.8598, "Herzl Street", "הרצל")).toBe("Netanya");
    expect(aNetanya(ZONES, 32.28405, 34.84682, "Rotem Street", "רותם")).toBe("Netanya");
    expect(aNetanya(ZONES, 32.28026, 34.85895, "Ha-Melakha Street", "המלאכה")).toBe("Netanya");
    expect(aNetanya(ZONES, 32.2766, 34.8389, "Ehud Manor Street", "אהוד מנור")).toBe(QUARTIER_IR_YAMIM);
    // La rue Keren HaYesod de Tel Aviv n'est pas celle de Netanya.
    expect(zonePourLieu({ villes: ["Tel Aviv-Yafo", "תל אביב-יפו"], precisions: ["Keren HaYesod Street", "קרן היסוד"], position: { lat: 32.0775, lng: 34.7742 } }, ZONES).zone).toBe("Tel Aviv");
  });
});

describe("une adresse tapée à la main : les rues du quartier", () => {
  it("27 rues, chacune avec son écriture en hébreu et en lettres latines, dans la place du champ", () => {
    expect(RUES_DE_KIRYAT_NORDAU).toHaveLength(27);
    for (const rue of RUES_DE_KIRYAT_NORDAU) {
      expect(rue.noms.some((n) => /[א-ת]/.test(n)), rue.noms[0]).toBe(true);
      expect(rue.noms.some((n) => /^[A-Za-z' .-]+$/.test(n)), rue.noms[0]).toBe(true);
    }
    const texte = reperesDeKiryatNordau();
    expect(texte.length).toBeLessThan(LONGUEUR_MAXIMALE_DES_REPERES);
    const reperes = lireReperes(texte);
    expect(reperes.length).toBeLessThan(REPERES_AU_PLUS);
    // Tout ce qui est écrit est lu : rien de trop court pour être un repère.
    expect(reperes.length).toBe(new Set(texte.split(/[,\n]/).map((t) => t.trim()).filter(Boolean).map((t) => lireReperes(t)[0])).size);
  });

  it("aucune rue n'est aussi une rue d'Ir Yamim / Poleg, ni une rue qui borde le quartier, ni un mot trop courant", () => {
    const autres = new Set(lireReperes(texteDesRues()));
    const reperes = lireReperes(reperesDeKiryatNordau());
    for (const r of reperes) expect(autres.has(r), r).toBe(false);
    for (const interdit of ["shalom aleichem", "שלום עליכם", "golda meir", "גולדה מאיר", "ben gurion", "בן גוריון", "peretz", "פרץ", "מאנה", "מיכל", "רופין", "netanya", "נתניה"]) expect(reperes, interdit).not.toContain(interdit);
  });

  it("le client de Netanya qui tape une rue du quartier : « Choisir Kiryat Nordau » — et le gérant est prévenu", () => {
    expect(zoneCitee("Keren HaYesod 5", "Netanya", ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zoneCitee("קרן היסוד 5", "Netanya", ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zoneCitee("rue Max Nordau 12, Kiryat Nordau", "Netanya", ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zoneCitee("Abu Hatzeira 3", "Netanya", ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zoneCitee("הרב אבו חצירא 3", "Netanya", ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zoneCitee("Sderot Pinchas Lavon 20", QUARTIER_IR_YAMIM, ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
    expect(zoneASignaler({ adresse: "Bar Yehuda 8", ville: "Netanya" }, ZONES)).toMatchObject({ zone: QUARTIER_KIRYAT_NORDAU });
    // Il a choisi la bonne zone : rien à signaler.
    expect(zoneCitee("Keren HaYesod 5", QUARTIER_KIRYAT_NORDAU, ZONES)).toBeNull();
    expect(zoneASignaler({ adresse: "Keren HaYesod 5", ville: QUARTIER_KIRYAT_NORDAU }, ZONES)).toBeNull();
  });

  it("ces noms de rues existent dans toutes les villes : hors de Netanya, ils ne désignent rien", () => {
    expect(zoneCitee("Keren HaYesod 5", "Tel Aviv", ZONES)).toBeNull();
    expect(zoneCitee("Agnon 12", "Herzliya", ZONES)).toBeNull();
    // … sauf si l'adresse nomme Netanya.
    expect(zoneCitee("Keren HaYesod 5, Netanya", "Tel Aviv", ZONES)).toBe(QUARTIER_KIRYAT_NORDAU);
  });

  it("une commande : l'adresse que Google situe dans le quartier, choisie à 30 ₪, est signalée au gérant", () => {
    const commande = { adresse: "Keren HaYesod Street 10", ville: "Netanya", villeGoogle: "Netanya | נתניה", reperesGoogle: "Keren HaYesod Street | קרן היסוד", latitudeGoogle: 32.28338, longitudeGoogle: 34.85037 };
    expect(zoneASignaler(commande, PAR_POSITION)).toMatchObject({ zone: QUARTIER_KIRYAT_NORDAU });
    expect(zoneASignaler({ ...commande, ville: QUARTIER_KIRYAT_NORDAU }, PAR_POSITION)).toBeNull();
    // Une adresse de la zone industrielle choisie à 30 ₪ : rien à dire.
    expect(zoneASignaler({ adresse: "Ha-Melakha Street 20", ville: "Netanya", villeGoogle: "Netanya", reperesGoogle: "Ha-Melakha Street | המלאכה", latitudeGoogle: 32.28026, longitudeGoogle: 34.85895 }, ZONES)).toBeNull();
  });
});

describe("la mise en ligne : une seule fois, sans rien écraser", () => {
  const code = lire("prisma/remplissage.ts");
  const fonction = (nom: string) => code.slice(code.indexOf(nom), code.indexOf("\n}\n", code.indexOf(nom)));
  // Ce qui crée un quartier — le même geste pour Kiryat Nordau, Givat HaIrusim et la zone industrielle.
  const corps = fonction("async function creerUnQuartier");
  const appel = fonction("export async function ajouterKiryatNordau");

  it("une clé à elle, posée dans la même transaction", () => {
    expect(CLE_KIRYAT_NORDAU).toBe("zone-kiryat-nordau-1124");
    expect(appel).toContain("cle: CLE_KIRYAT_NORDAU");
    expect(appel).toContain("nom: QUARTIER_KIRYAT_NORDAU");
    expect(appel).toContain("livraison: LIVRAISON_A_KIRYAT_NORDAU");
    expect(appel).toContain("limites: LIMITES_DE_KIRYAT_NORDAU");
    expect(appel).toContain("reperes: reperesDeKiryatNordau()");
    expect(corps).toContain("operationFaite(prisma, q.cle)");
    expect(corps.match(/noterOperation\(prisma, q\.cle\)/g)).toHaveLength(3);
    expect(corps).not.toMatch(/delete|deleteMany|updateMany/);
  });

  it("une zone qui existe déjà garde son prix : elle ne reçoit que ce qui lui manque", () => {
    expect(corps).toContain('zone.limites.trim() === "" ? { limites: q.limites }');
    expect(corps).toContain('zone.reperes.trim() === "" ? { reperes: q.reperes }');
    const siElleExiste = corps.slice(corps.indexOf("if (zone) {"), corps.indexOf("if (!ville)"));
    expect(siElleExiste).not.toContain("supplementLivraison");
  });

  it("le prix : 40 ₪ moins la livraison de base de SES réglages ; rangée à la suite de l'autre quartier", () => {
    expect(corps).toContain("Math.max(0, q.livraison - reglages.fraisLivraison)");
    expect(corps).toContain("Math.max(ville.ordre, ...q.apres.map((nom) => parNom.get(nom)?.ordre ?? ville.ordre)) + 1");
    expect(appel).toContain("apres: [QUARTIER_IR_YAMIM]");
  });

  it("lancée à la mise en ligne, après la grille et les limites d'Ir Yamim", () => {
    const preparer = lire("prisma/preparer.ts");
    const ordre = ["appliquerLaGrilleDesZones(prisma)", "corrigerLaGrilleDesZones(prisma)", "ajouterLesRuesDIrYamim(prisma)", "poserLesLimitesDIrYamim(prisma)", "ajouterKiryatNordau(prisma)", "mettreLesReglagesANiveau(prisma)"].map((x) => preparer.indexOf(`dire(await ${x})`));
    expect(ordre.every((i) => i > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
  });

  it("le panier reçoit les limites de chaque quartier", () => {
    expect(lire("app/(boutique)/panier/page.tsx")).toContain("...(limites ? { limites } : {})");
  });
});
