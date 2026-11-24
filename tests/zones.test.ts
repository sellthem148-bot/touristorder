// Les zones de livraison définies par les adresses (lib/zones.ts) et la grille de prix du gérant
// (prisma/zones-1123.ts) : ce qu'une adresse désigne, ce que le gérant corrige, ce que le client paie.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { communeDe, communesLivrees, lireReperes, quartiersDe, zoneCitee, zoneReperee } from "@/lib/zones";
import { fraisDeLivraison, livraisonApresChangementDeZone } from "@/lib/villes";
import { lienWaze } from "@/lib/messages-client";
import { texteDeLAlerte } from "@/lib/telegram";
import { nomVille } from "@/lib/i18n/catalogue";
import { DICTIONNAIRES } from "@/lib/i18n";
import { LANGUES } from "@/lib/langues";
import { VILLES_EXEMPLE } from "../prisma/catalogue";
import { GRILLE_DES_ZONES, QUARTIER_IR_YAMIM, ZONES_CORRIGEES, supplementsDeLaGrille } from "../prisma/zones-1123";

const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

// Les zones telles que le serveur les prépare : le nom dans les cinq langues, et les repères du gérant.
const zone = (nom: string, reperes = "") => zoneReperee(nom, reperes, LANGUES.map((l) => nomVille(nom, l)));
const ZONES = [
  zone("Netanya"),
  zone(QUARTIER_IR_YAMIM, "Ehud Manor, Résidence Lagoon\nSea Opera"),
  zone("Even Yehuda"),
  zone("Kadima-Tsoran"),
  zone("Herzliya"),
  zone("Tel Aviv"),
];
const citee = (adresse: string, choisie = "Netanya") => zoneCitee(adresse, choisie, ZONES);

describe("une zone : une ville, ou un quartier à son propre prix", () => {
  it("« Ville – Quartier » : avant le tiret la ville, après lui les quartiers", () => {
    expect(communeDe("Netanya – Ir Yamim / Poleg")).toBe("Netanya");
    expect(quartiersDe("Netanya – Ir Yamim / Poleg")).toEqual(["Ir Yamim", "Poleg"]);
    // Le gérant tape le tiret de son clavier : il compte aussi, entouré d'espaces.
    expect(communeDe("Netanya - Ir Yamim")).toBe("Netanya");
    expect(quartiersDe("Netanya — Ir Yamim, Poleg")).toEqual(["Ir Yamim", "Poleg"]);
    // Un trait d'union dans un nom de ville n'en fait pas un quartier.
    expect(communeDe("Kadima-Tsoran")).toBe("Kadima-Tsoran");
    expect(quartiersDe("Kadima-Tsoran")).toEqual([]);
    expect(quartiersDe("Tel Aviv")).toEqual([]);
  });

  it("un quartier n'est pas une ville de plus : 23 zones, 19 villes livrées (l'accueil, le contact, le flyer)", () => {
    const zones = GRILLE_DES_ZONES.map((z) => z.nom);
    // 19 villes et quatre secteurs du sud de Netanya vendus à leur prix : Ir Yamim / Poleg, puis, le 24 novembre,
    // Kiryat Nordau, Givat HaIrusim et la zone industrielle.
    expect(zones).toHaveLength(23);
    const villes = communesLivrees(zones);
    expect(villes).toHaveLength(19);
    expect(villes.slice(0, 2)).toEqual(["Netanya", "Even Yehuda"]);
    expect(villes).not.toContain(QUARTIER_IR_YAMIM);
    // L'accueil et la page de contact comptent et listent des villes, jamais des zones.
    const lireSource = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
    expect(lireSource("app/(boutique)/page.tsx")).toContain("communesLivrees(reglages.villes.map((v) => v.nom))");
    expect(lireSource("app/(boutique)/contact/page.tsx")).toContain("communesLivrees(i.villes)");
  });

  it("les repères du gérant : un par virgule ou par ligne, simplifiés, sans doublon ni mot trop court", () => {
    expect(lireReperes("Ehud Manor, Résidence Lagoon\nSea Opera;  ehud manor , 12, de")).toEqual(["ehud manor", "residence lagoon", "sea opera"]);
    expect(lireReperes("")).toEqual([]);
  });

  it("une ville est désignée par son nom dans chaque langue, un quartier par ses quartiers et ses repères", () => {
    const telAviv = zone("Tel Aviv");
    expect(telAviv.noms).toContain("tel aviv");
    expect(telAviv.noms).toContain("תל אביב");
    expect(telAviv.noms).toContain("тель авив");
    const quartier = ZONES[1];
    // Le nom de sa ville ne désigne pas le quartier : « Netanya » est écrit dans toutes les adresses de Netanya.
    expect(quartier.noms).toEqual([]);
    expect(quartier.reperes).toEqual(expect.arrayContaining(["ir yamim", "poleg", "עיר ימים", "פולג", "ehud manor", "sea opera"]));
    expect(quartier.reperes).not.toContain("netanya");
  });
});

describe("la zone qu'une adresse désigne", () => {
  it("une adresse sans rien de particulier : la zone choisie", () => {
    expect(citee("12 rue Herzl")).toBeNull();
    expect(citee("12 rue Herzl, Netanya")).toBeNull();
    expect(citee("")).toBeNull();
    expect(citee("   ")).toBeNull();
  });

  it("le nom d'une autre ville, dans n'importe quelle langue : cette ville", () => {
    expect(citee("Dizengoff 50, Tel Aviv")).toBe("Tel Aviv");
    expect(citee("dizengoff 50 TEL-AVIV")).toBe("Tel Aviv");
    expect(citee("דיזנגוף 50 תל אביב")).toBe("Tel Aviv");
    expect(citee("Дизенгоф 50, Тель-Авив")).toBe("Tel Aviv");
    expect(citee("Sokolov 3 Herzliya")).toBe("Herzliya");
    // L'anglais écrit « Kadima-Zoran ».
    expect(citee("Hadar 4, Kadima Zoran")).toBe("Kadima-Tsoran");
  });

  it("un mot qui contient le nom d'une ville n'est pas cette ville", () => {
    // « Herzl » n'est pas « Herzliya », « Tel Avivim » n'est pas « Tel Aviv ».
    expect(citee("Herzl 12")).toBeNull();
    expect(citee("Résidence Tel Avivim 3")).toBeNull();
  });

  it("une rue qui porte le nom d'une autre ville, dans une adresse qui nomme la sienne : rien", () => {
    expect(citee("Rue Tel Aviv 5, Netanya")).toBeNull();
    expect(citee("רחוב תל אביב 5 נתניה")).toBeNull();
  });

  it("un quartier vendu à son propre prix : son nom ou un repère du gérant le désigne, même dans sa ville", () => {
    expect(citee("Ehud Manor 12")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Résidence Sea Opera, apt 4, Netanya")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Ir Yamim, tour B, Netanya")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("עיר ימים, מגדל ב")).toBe(QUARTIER_IR_YAMIM);
    expect(citee("Poleg beach hotel")).toBe(QUARTIER_IR_YAMIM);
  });

  it("qui a choisi le quartier et écrit « Netanya » n'est pas signalé : c'est sa ville", () => {
    expect(citee("Ehud Manor 12, Netanya", QUARTIER_IR_YAMIM)).toBeNull();
    expect(citee("Herzl 5, Netanya", QUARTIER_IR_YAMIM)).toBeNull();
    // Mais une autre ville l'est toujours.
    expect(citee("Dizengoff 50 Tel Aviv", QUARTIER_IR_YAMIM)).toBe("Tel Aviv");
  });

  it("un repère de la zone choisie tranche : l'adresse y est", () => {
    const zones = [zone("Netanya", "Nitsa"), zone("Tel Aviv")];
    expect(zoneCitee("Boulevard Nitsa 20, près de la rue Tel Aviv", "Netanya", zones)).toBeNull();
  });

  it("entre deux zones citées, un repère passe avant un nom de ville", () => {
    expect(citee("Ehud Manor 12, angle rue Tel Aviv")).toBe(QUARTIER_IR_YAMIM);
  });

  it("une zone choisie qui n'existe plus : le reste se lit quand même", () => {
    expect(zoneCitee("Dizengoff 50, Tel Aviv", "Ville retirée", ZONES)).toBe("Tel Aviv");
  });
});

describe("la grille du gérant (23 novembre 2026)", () => {
  const prix = (nom: string) => GRILLE_DES_ZONES.find((z) => z.nom === nom)?.livraison;

  it("Netanya 30 ₪, son quartier 40 ₪, les villages 50 ₪, le Sharon 70 ₪, Herzliya et Césarée 100 ₪, Tel Aviv 150 ₪", () => {
    expect(prix("Netanya")).toBe(3000);
    expect(prix(QUARTIER_IR_YAMIM)).toBe(4000);
    for (const village of ["Even Yehuda", "Kfar Yona", "Kadima-Tsoran", "Pardesia", "Beit Yitzhak", "Tsur Moshe", "Udim"]) {
      expect(prix(village), village).toBe(5000);
    }
    // Sa correction du soir même : « toute la ligne Ra'anana, Kfar Saba, Hadera, c'est 70 ; Césarée, 100 ».
    for (const sharon of ["Ra'anana", "Kfar Saba", "Hod Hasharon", "Hadera"]) expect(prix(sharon), sharon).toBe(7000);
    expect(prix("Césarée")).toBe(10000);
    expect(ZONES_CORRIGEES.sort()).toEqual(["Césarée", "Hadera", "Hod Hasharon", "Kfar Saba", "Ra'anana"]);
    expect(prix("Herzliya")).toBe(10000);
    expect(prix("Ramat HaSharon")).toBe(10000);
    for (const loin of ["Tel Aviv", "Ramat Gan", "Givatayim", "Petah Tikva"]) expect(prix(loin), loin).toBe(15000);
    expect(new Set(GRILLE_DES_ZONES.map((z) => z.nom)).size).toBe(GRILLE_DES_ZONES.length);
  });

  it("le supplément se déduit de la livraison de base : le client paie le prix de la grille", () => {
    const supplements = supplementsDeLaGrille(3000);
    const tarif = { fraisLivraison: 3000, fraisExpress: 2000 };
    for (const z of GRILLE_DES_ZONES) {
      const ville = { ...supplements.find((s) => s.nom === z.nom)!, minimumCommande: 0 };
      expect(fraisDeLivraison(tarif, ville, false), z.nom).toBe(z.livraison);
    }
    // Une livraison de base qu'il aurait montée : jamais de supplément négatif.
    expect(supplementsDeLaGrille(3500).find((s) => s.nom === "Netanya")!.supplementLivraison).toBe(0);
    expect(supplementsDeLaGrille(3500).find((s) => s.nom === "Tel Aviv")!.supplementLivraison).toBe(11500);
  });

  it("une base neuve part de la même grille, le quartier juste après sa ville", () => {
    expect(VILLES_EXEMPLE.map((v) => v.nom)).toEqual(GRILLE_DES_ZONES.map((z) => z.nom));
    expect(VILLES_EXEMPLE[0].nom).toBe("Netanya");
    expect(VILLES_EXEMPLE[1]).toEqual({ nom: QUARTIER_IR_YAMIM, supplementLivraison: 1000, minimumCommande: 0 });
  });

  it("appliquée une seule fois à la mise en ligne, après la création des villes", () => {
    const preparer = lire("prisma/preparer.ts");
    expect(preparer).toContain("await appliquerLaGrilleDesZones(prisma)");
    expect(preparer.indexOf("appliquerLaGrilleDesZones(prisma)")).toBeGreaterThan(preparer.indexOf("remplirLaBase(prisma"));
    const operation = lire("prisma/remplissage.ts");
    const debut = operation.indexOf("export async function appliquerLaGrilleDesZones");
    const corps = operation.slice(debut, operation.indexOf("\n}\n", debut));
    expect(corps).toContain("operationFaite(prisma, CLE_GRILLE_DES_ZONES)");
    expect(corps).toContain("noterOperation(prisma, CLE_GRILLE_DES_ZONES)");
    // Rien n'est supprimé, et une ville retirée par le gérant n'est pas recréée.
    expect(corps).not.toMatch(/delete|createMany/);
  });

  it("sa correction est une opération à elle, lancée après la grille : la grille déjà appliquée n'est pas rejouée", () => {
    const preparer = lire("prisma/preparer.ts");
    expect(preparer.indexOf("corrigerLaGrilleDesZones(prisma)")).toBeGreaterThan(preparer.indexOf("appliquerLaGrilleDesZones(prisma)"));
    const operation = lire("prisma/remplissage.ts");
    const debut = operation.indexOf("export async function corrigerLaGrilleDesZones");
    const corps = operation.slice(debut, operation.indexOf("\n}\n", debut));
    expect(corps).toContain("operationFaite(prisma, CLE_CORRECTION_DE_LA_GRILLE)");
    expect(corps).toContain("noterOperation(prisma, CLE_CORRECTION_DE_LA_GRILLE)");
    expect(corps).toContain("ZONES_CORRIGEES.includes(c.nom)");
    expect(corps).not.toMatch(/delete|create/);
  });

  it("le nom du quartier est traduit, et se lit en hébreu et en russe", () => {
    expect(nomVille(QUARTIER_IR_YAMIM, "he")).toBe("נתניה – עיר ימים / פולג");
    expect(nomVille(QUARTIER_IR_YAMIM, "ru")).toBe("Нетания – Ир-Ямим / Полег");
    for (const l of LANGUES) expect(communeDe(nomVille(QUARTIER_IR_YAMIM, l)), l).toBe(nomVille("Netanya", l));
  });
});

describe("le gérant change la zone d'une commande", () => {
  it("seul le supplément change : le tarif du moment et l'express restent", () => {
    // Netanya (30 ₪) → quartier (+10 ₪), puis → Tel Aviv (+120 ₪), avec un express à 20 ₪ dans la livraison.
    expect(livraisonApresChangementDeZone(3000, 0, 1000)).toBe(4000);
    expect(livraisonApresChangementDeZone(5000, 0, 12000)).toBe(17000);
    // Dans l'autre sens : le client avait choisi plus cher que son adresse.
    expect(livraisonApresChangementDeZone(15000, 12000, 0)).toBe(3000);
    expect(livraisonApresChangementDeZone(1000, 5000, 0)).toBe(0);
  });

  it("l'action exige le gérant, refuse une commande annulée et recalcule le total", () => {
    const actions = lire("app/admin/(protege)/actions.ts");
    const debut = actions.indexOf("export async function changerLaZone");
    const corps = actions.slice(debut, actions.indexOf("\n}\n", debut));
    expect(corps).toContain("await exigerAdmin()");
    expect(corps).toContain('c.statut === "ANNULEE"');
    expect(corps).toContain("livraisonApresChangementDeZone(c.tarifLivraison, c.supplementVille, ville.supplementLivraison)");
    expect(corps).toContain("await recalculer(tx, commandeId)");
  });

  it("Waze reçoit la ville, pas le nom de la zone", () => {
    expect(decodeURIComponent(lienWaze("Ehud Manor 12", QUARTIER_IR_YAMIM))).toContain("q=Ehud Manor 12, Netanya&");
    expect(decodeURIComponent(lienWaze("Dizengoff 50", "Tel Aviv"))).toContain("q=Dizengoff 50, Tel Aviv&");
  });

  it("l'alerte Telegram dit quand la zone est à vérifier, et seulement alors", () => {
    const base = { numero: 7, nomClient: "Sarah Cohen", ville: "Netanya", jour: "Demain", creneau: "20:00 – 21:00", total: 9000, paiement: "Bit", nombreArticles: 2, demandeLibre: "", lienAdmin: "https://exemple.test/admin/commandes/x" };
    expect(texteDeLAlerte({ ...base, zoneAVerifier: "Tel Aviv" })).toContain("Zone à vérifier : l'adresse désigne Tel Aviv, le client a choisi Netanya");
    expect(texteDeLAlerte(base)).not.toContain("Zone à vérifier");
    expect(texteDeLAlerte({ ...base, zoneAVerifier: null })).not.toContain("Zone à vérifier");
  });
});

describe("ce que le client lit", () => {
  it("le panier le prévient dans les cinq langues, sans rien corriger à sa place", () => {
    for (const l of LANGUES) {
      const p = DICTIONNAIRES[l].panier;
      expect(p.zoneAutre, l).toContain("{ville}");
      expect(p.zoneAutre, l).toContain("{choisie}");
      expect(p.zoneChoisir, l).toContain("{ville}");
    }
    const panier = lire("app/(boutique)/panier/PageDuPanier.tsx");
    expect(panier).toContain("zoneCitee(v.adresse, v.ville, zones)");
    expect(panier).toContain('changer("ville", autreZone)');
  });

  it("le navigateur ne reçoit que ce qui désigne les zones, pas les tables de traduction", () => {
    const zones = lire("lib/zones.ts");
    expect(zones).not.toContain("i18n/catalogue");
    expect(zones).not.toContain("server-only");
    expect(lire("lib/zones-lecture.ts")).toContain('import "server-only"');
  });

  it("les conditions de vente disent que la livraison suit l'adresse réelle", () => {
    expect(lire("app/(boutique)/conditions/page.tsx")).toContain("texte={c.prix.p3}");
    for (const l of LANGUES) expect(lire(`lib/i18n/serveur/${l}.ts`), l).toMatch(/3\. [^\n]+\n\s+p1: [^\n]+\n\s+p2: [^\n]+\n\s+p3: "/);
  });
});
