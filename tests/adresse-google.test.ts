// L'adresse vérifiée par Google : de ce que Google dit d'un lieu (sa ville, son quartier, sa rue) à la zone
// du gérant — sans rien de Google ici : les fonctions sont pures et reçoivent des textes.
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { lieuDeLaCommande, lireReperes, sansMotDeVoie, zoneASignaler, zoneCitee, zonePourLieu, zoneReperee } from "@/lib/zones";
import { autresLectures } from "@/lib/google-adresses";
import { CLE_GOOGLE_MAPS_DU_SITE, cleGoogleMaps } from "@/lib/google-maps";
import { champsGoogle, estUneAdresse, lieuDepuisGoogle, ligneDAdresse, nomsEnTexte, LONGUEUR_ADRESSE_GOOGLE, LONGUEUR_REPERES_GOOGLE, LONGUEUR_VILLE_GOOGLE, type ComposantGoogle } from "@/lib/lieu-google";
import { commandeSchema } from "@/lib/validation";
import { lienWaze } from "@/lib/messages-client";
import { texteDeLAlerte } from "@/lib/telegram";
import { nomVille } from "@/lib/i18n/catalogue";
import { DICTIONNAIRES, dictionnaireServeur } from "@/lib/i18n";
import { LANGUES } from "@/lib/langues";
import { GRILLE_DES_ZONES, QUARTIER_IR_YAMIM } from "../prisma/zones-1123";

const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");

// Les zones telles que le serveur les prépare (lib/zones-lecture.ts) : toute la grille du gérant, le nom de
// chacune dans les cinq langues, et pour le quartier deux repères comme il en saisira dans « Villes ».
const ZONES = GRILLE_DES_ZONES.map((z) => zoneReperee(z.nom, z.nom === QUARTIER_IR_YAMIM ? "Rue Ehud Manor, Résidence Lagoon\nרחוב בני בנימין" : "", LANGUES.map((l) => nomVille(z.nom, l))));
const zoneDe = (villes: string[], precisions: string[] = []) => zonePourLieu({ villes, precisions }, ZONES);

describe("la zone d'un lieu reconnu", () => {
  it("la ville, en français, en anglais, en hébreu, en russe : la même zone", () => {
    expect(zoneDe(["Netanya"])).toEqual({ zone: "Netanya", villeNonLivree: null });
    expect(zoneDe(["נתניה"])).toEqual({ zone: "Netanya", villeNonLivree: null });
    expect(zoneDe(["Нетания"]).zone).toBe("Netanya");
    expect(zoneDe(["Caesarea"]).zone).toBe("Césarée");
    expect(zoneDe(["קיסריה"]).zone).toBe("Césarée");
    expect(zoneDe(["Herzliya"], ["Sokolov St"]).zone).toBe("Herzliya");
  });

  it("Google n'écrit pas toujours une ville comme nous : les signes, les lettres doublées de l'hébreu, un nom plus long", () => {
    expect(zoneDe(["Giv'atayim"]).zone).toBe("Givatayim");
    expect(zoneDe(["Raanana"]).zone).toBe("Ra'anana");
    expect(zoneDe(["Tel Aviv-Yafo"]).zone).toBe("Tel Aviv");
    expect(zoneDe(["תל אביב-יפו"]).zone).toBe("Tel Aviv");
    expect(zoneDe(["Beit Yitzhak-Sha'ar Hefer"]).zone).toBe("Beit Yitzhak");
    expect(zoneDe(["הרצלייה"]).zone).toBe("Herzliya");
    expect(zoneDe(["פתח תקוה"]).zone).toBe("Petah Tikva");
    // Une autre écriture latine (« Kefar Sava ») n'est pas reconnue seule : c'est l'hébreu, lu en plus, qui tranche.
    expect(zoneDe(["Kefar Sava"])).toEqual({ zone: null, villeNonLivree: "Kefar Sava" });
    expect(zoneDe(["Kefar Sava", "כפר סבא"]).zone).toBe("Kfar Saba");
  });

  it("un morceau de mot n'est pas une ville : « Herzl » n'est pas « Herzliya »", () => {
    expect(zoneDe(["Herzl"]).zone).toBeNull();
    expect(zoneDe(["Ramat"]).zone).toBeNull();
    expect(zoneDe(["Tel Mond"]).zone).toBeNull();
    expect(zoneDe(["Kfar"]).zone).toBeNull();
  });

  it("l'ordre des mots ne compte pas, et un nom plus court ne vaut que s'il ne désigne qu'une zone", () => {
    // La commune s'appelle officiellement « Tzoran-Kadima » : en hébreu, les mêmes mots dans l'autre ordre.
    expect(zoneDe(["צורן-קדימה"]).zone).toBe("Kadima-Tsoran");
    expect(zoneDe(["Kadima"]).zone).toBe("Kadima-Tsoran");
    // « Ramat » serait Ramat Gan ou Ramat HaSharon : ni l'une ni l'autre.
    expect(zoneDe(["Ramat"])).toEqual({ zone: null, villeNonLivree: "Ramat" });
  });

  it("un quartier vendu à son prix l'emporte sur sa ville : par le quartier, quand Google en nomme un", () => {
    expect(zoneDe(["Netanya"], ["Ir Yamim", "Ehud Manor Street"]).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zoneDe(["Netanya"], ["Poleg"]).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zoneDe(["נתניה"], ["עיר ימים"]).zone).toBe(QUARTIER_IR_YAMIM);
    // Le quartier d'une AUTRE ville qui porterait le même nom ne compte pas.
    expect(zoneDe(["Herzliya"], ["Ir Yamim"]).zone).toBe("Herzliya");
  });

  it("… et sinon par la RUE (Google ne range pas Ehud Manor dans un quartier) : un repère du gérant, quel que soit le mot de voie", () => {
    // Ce que Google renvoie réellement : « Ehud Manor Street » (long), « Ehud Manor St » (court), à « Netanya ».
    expect(zoneDe(["Netanya"], ["Ehud Manor Street", "Ehud Manor St"]).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zoneDe(["Netanya"], ["Ehud Manor St"]).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zoneDe(["Netanya"], ["Résidence Lagoon"]).zone).toBe(QUARTIER_IR_YAMIM);
    // Le gérant a noté cette rue en hébreu, avec « רחוב » : la lecture en hébreu la retrouve.
    expect(zoneDe(["Netanya", "נתניה"], ["Bnei Binyamin Street", "בני בנימין"]).zone).toBe(QUARTIER_IR_YAMIM);
    // Une rue de Netanya qu'aucun repère ne revendique reste à Netanya (30 ₪) : « Nitsa Boulevard ».
    expect(zoneDe(["Netanya"], ["Nitsa Boulevard", "Nitsa Blvd"]).zone).toBe("Netanya");
    // Un repère ne compte qu'en mots entiers.
    expect(zoneDe(["Netanya"], ["Ehud Manorim Street"]).zone).toBe("Netanya");
  });

  it("le mot de voie ne compte pas : « rue X », « X Street », « X St », « Sderot X », « רחוב X » sont la même rue", () => {
    expect(sansMotDeVoie("rue ehud manor")).toBe("ehud manor");
    expect(sansMotDeVoie("ehud manor street")).toBe("ehud manor");
    expect(sansMotDeVoie("ehud manor st")).toBe("ehud manor");
    expect(sansMotDeVoie("sderot oved ben ami")).toBe("oved ben ami");
    expect(sansMotDeVoie("nitsa blvd")).toBe("nitsa");
    expect(sansMotDeVoie("רחוב אהוד מנור")).toBe("אהוד מנור");
    expect(sansMotDeVoie("שדרות ניצה")).toBe("ניצה");
    // Au milieu d'un nom, le mot reste ; seul, il ne désigne rien.
    expect(sansMotDeVoie("residence de la rue haute")).toBe("residence de la rue haute");
    expect(sansMotDeVoie("sderot")).toBe("");
    expect(lireReperes("Rue Ehud Manor, Ehud Manor St, Sderot Nitsa, rue, שד' בן גוריון")).toEqual(["ehud manor", "nitsa", "בן גוריון"]);
    // Pour une adresse tapée à la main aussi, le repère « rue Ehud Manor » reconnaît « Ehud Manor 5 ».
    expect(zoneCitee("Ehud Manor 5", "Netanya", ZONES)).toBe(QUARTIER_IR_YAMIM);
  });

  it("une ville que le gérant ne livre pas : aucune zone, et son nom", () => {
    expect(zoneDe(["Jerusalem"], ["Jaffa St"])).toEqual({ zone: null, villeNonLivree: "Jerusalem" });
    // Même si la rue porte le nom d'un repère : la rue d'une autre ville n'est pas celle du gérant.
    expect(zoneDe(["Haifa"], ["Ehud Manor St"])).toEqual({ zone: null, villeNonLivree: "Haifa" });
  });

  it("rien de reconnu : aucune zone, rien à dire — sauf un repère, qui désigne sa zone à lui seul", () => {
    expect(zoneDe([])).toEqual({ zone: null, villeNonLivree: null });
    expect(zoneDe([], ["Herzl St"])).toEqual({ zone: null, villeNonLivree: null });
    expect(zoneDe([], ["Ehud Manor St"]).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zoneDe(["  ", ""]).zone).toBeNull();
  });

  it("une ville qui n'a que des quartiers à son prix : reconnue par le nom de sa commune", () => {
    const zones = [zoneReperee("Hadera – Givat Olga", "Rothschild"), zoneReperee("Tel Aviv", "", ["תל אביב"])];
    expect(zonePourLieu({ villes: ["Hadera"], precisions: ["Givat Olga"] }, zones).zone).toBe("Hadera – Givat Olga");
    // Dans la ville mais hors du quartier : on ne peut rien dire, et ce n'est pas une ville « non livrée ».
    expect(zonePourLieu({ villes: ["Hadera"], precisions: ["Herzl St"] }, zones)).toEqual({ zone: null, villeNonLivree: null });
  });
});

describe("ce que Google renvoie, ramené à un lieu et à une ligne d'adresse", () => {
  // Les formes relevées le 24 novembre 2026 avec une vraie clé (`language: "fr"`, `includedRegionCodes: ["il"]`).
  const FIN: ComposantGoogle[] = [
    { longText: "HaSharon", shortText: "HaSharon", types: ["administrative_area_level_2", "political"] },
    { longText: "Center District", shortText: "Center District", types: ["administrative_area_level_1", "political"] },
    { longText: "Israël", shortText: "IL", types: ["country", "political"] },
  ];
  // « Nitsa 10 Netanya » → « Nitsa Blvd 10, Netanya, Israël », types ['street_address'].
  const NITSA: ComposantGoogle[] = [
    { longText: "10", shortText: "10", types: ["street_number"] },
    { longText: "Nitsa Boulevard", shortText: "Nitsa Blvd", types: ["route"] },
    { longText: "Netanya", shortText: "Netanya", types: ["locality", "political"] },
    ...FIN,
  ];
  // « Ehud Manor 5 Netanya » : une rue d'Ir Yamim, et AUCUN composant de quartier.
  const MANOR: ComposantGoogle[] = [
    { longText: "5", shortText: "5", types: ["street_number"] },
    { longText: "Ehud Manor Street", shortText: "Ehud Manor St", types: ["route"] },
    { longText: "Netanya", shortText: "Netanya", types: ["locality", "political"] },
    ...FIN,
  ];
  const MANOR_EN_HEBREU: ComposantGoogle[] = [
    { longText: "5", types: ["street_number"] },
    { longText: "אהוד מנור", types: ["route"] },
    { longText: "נתניה", types: ["locality", "political"] },
  ];
  // « Island Hotel Netanya » → types ['hotel', 'lodging', 'point_of_interest', 'establishment'], un code postal en plus.
  const HOTEL: ComposantGoogle[] = [
    { longText: "10", shortText: "10", types: ["street_number"] },
    { longText: "Sderot Oved Ben Ami", shortText: "Sderot Oved Ben Ami", types: ["route"] },
    { longText: "Netanya", shortText: "Netanya", types: ["locality", "political"] },
    ...FIN,
    { longText: "4220520", shortText: "4220520", types: ["postal_code"] },
  ];
  const TYPES_HOTEL = ["hotel", "lodging", "point_of_interest", "establishment"];

  it("la ville et la rue (son nom long et son nom court), dans les écritures lues, sans doublon", () => {
    const lieu = lieuDepuisGoogle([MANOR, MANOR_EN_HEBREU], "Ehud Manor Street 5");
    expect(lieu.villes).toEqual(["Netanya", "נתניה"]);
    expect(lieu.precisions).toEqual(["Ehud Manor Street", "Ehud Manor St", "אהוד מנור", "Ehud Manor Street 5"]);
    // Aucun quartier chez Google : c'est le repère du gérant (« Rue Ehud Manor ») qui fait passer à 40 ₪.
    expect(zonePourLieu(lieu, ZONES).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zonePourLieu(lieuDepuisGoogle([NITSA], "Nitsa Boulevard 10"), ZONES)).toEqual({ zone: "Netanya", villeNonLivree: null });
    // Le pays, le district (« HaSharon », « Center District ») et le code postal ne sont jamais pris pour la ville.
    expect(lieuDepuisGoogle([FIN, [{ longText: "4220520", types: ["postal_code"] }]]).villes).toEqual([]);
    expect(lieuDepuisGoogle([HOTEL]).villes).toEqual(["Netanya"]);
    // Une lecture qui a échoué (rien) ne casse rien.
    expect(lieuDepuisGoogle([MANOR, null, undefined]).villes).toEqual(["Netanya"]);
    // Un quartier, quand Google en donne un, est lu aussi.
    expect(lieuDepuisGoogle([[{ longText: "Ir Yamim", shortText: "Ir Yamim", types: ["neighborhood", "political"] }, ...MANOR]]).precisions[0]).toBe("Ir Yamim");
  });

  it("la ligne du champ : la rue et le numéro pour une adresse ; le nom puis la rue pour un hôtel", () => {
    expect(estUneAdresse(["street_address"])).toBe(true);
    expect(estUneAdresse(TYPES_HOTEL)).toBe(false);
    expect(ligneDAdresse("Nitsa Boulevard 10", ["street_address"], NITSA)).toBe("Nitsa Boulevard 10");
    // Tapée en hébreu sur le site en français : la proposition est en hébreu, c'est elle que le client garde.
    expect(ligneDAdresse("אהוד מנור 5", ["street_address"], MANOR)).toBe("אהוד מנור 5");
    expect(ligneDAdresse("Island Luxurious Suites Hotel", TYPES_HOTEL, HOTEL)).toBe("Island Luxurious Suites Hotel, Sderot Oved Ben Ami 10");
    // Le nom porte déjà la rue, ou Google n'en donne pas : le nom seul.
    expect(ligneDAdresse("Sderot Oved Ben Ami Suites", TYPES_HOTEL, HOTEL)).toBe("Sderot Oved Ben Ami Suites");
    expect(ligneDAdresse("Hôtel Dan", ["lodging"], [])).toBe("Hôtel Dan");
    expect(ligneDAdresse("x".repeat(400), ["lodging"], HOTEL)).toHaveLength(200);
  });

  it("l'hôtel : sa zone est celle de sa ville, et son nom peut être un repère du gérant", () => {
    const lieu = lieuDepuisGoogle([HOTEL], "Island Luxurious Suites Hotel");
    expect(zonePourLieu(lieu, ZONES).zone).toBe("Netanya");
    const avecRepere = ZONES.map((z) => (z.nom === QUARTIER_IR_YAMIM ? zoneReperee(z.nom, "Island Luxurious Suites") : z));
    expect(zonePourLieu(lieu, avecRepere).zone).toBe(QUARTIER_IR_YAMIM);
  });

  it("ce qui part avec la commande : trois champs bornés, des noms entiers, jamais le séparateur dans un nom", () => {
    const lieu = lieuDepuisGoogle([MANOR, MANOR_EN_HEBREU]);
    const champs = champsGoogle("  Ehud Manor St 5,\n Netanya, Israël ", lieu);
    expect(champs).toEqual({ adresseGoogle: "Ehud Manor St 5, Netanya, Israël", villeGoogle: "Netanya | נתניה", reperesGoogle: "Ehud Manor Street | Ehud Manor St | אהוד מנור" });
    expect(lieuDeLaCommande({ adresse: "", ville: "", ...champs })).toEqual(lieu);
    expect(nomsEnTexte(["a".repeat(100), "b".repeat(100), "c"], 160)).toBe("a".repeat(100));
    expect(lieuDepuisGoogle([[{ longText: "Tel | Aviv", types: ["locality"] }]]).villes).toEqual(["Tel Aviv"]);
    expect(champsGoogle("x".repeat(1000), lieu).adresseGoogle).toHaveLength(LONGUEUR_ADRESSE_GOOGLE);
  });

  it("toujours les deux écritures : l'hébreu pour un site en lettres latines, l'anglais pour l'hébreu, les deux pour le russe", () => {
    expect(autresLectures("fr")).toEqual(["iw"]);
    expect(autresLectures("en")).toEqual(["iw"]);
    expect(autresLectures("es")).toEqual(["iw"]);
    expect(autresLectures("he")).toEqual(["en"]);
    expect(autresLectures("ru")).toEqual(["iw", "en"]);
  });
});

describe("le serveur : du texte non fiable, jamais une raison de refuser une commande", () => {
  const BASE = {
    nomClient: "Dana Levi", telephone: "+972 50 123 4567", email: "dana@example.com", ville: "Netanya", logement: "MAISON", adresse: "Ehud Manor St 12",
    dateLivraison: "2026-12-01", creneau: "19:00 – 20:00", remplacement: "CONTACTER", lignes: [{ produitId: "p1", quantite: 1 }],
  };

  it("sans ces champs (adresse tapée à la main), la commande se lit comme avant", () => {
    const c = commandeSchema.parse(BASE);
    expect([c.adresseGoogle, c.villeGoogle, c.reperesGoogle]).toEqual(["", "", ""]);
  });

  it("bornés, sans retour à la ligne ni caractère de contrôle ; tout ce qui n'est pas un texte devient vide", () => {
    const c = commandeSchema.parse({ ...BASE, adresseGoogle: `  Ehud Manor St 12,\r\n\tNetanya\u0000, Israel ${"x".repeat(5000)}`, villeGoogle: "Netanya | נתניה", reperesGoogle: "y".repeat(5000) });
    expect(c.adresseGoogle.startsWith("Ehud Manor St 12, Netanya , Israel x")).toBe(true);
    expect(c.adresseGoogle).toHaveLength(LONGUEUR_ADRESSE_GOOGLE);
    expect(c.villeGoogle).toBe("Netanya | נתניה");
    expect(c.reperesGoogle).toHaveLength(LONGUEUR_REPERES_GOOGLE);
    expect("x".repeat(LONGUEUR_VILLE_GOOGLE + 50).slice(0, LONGUEUR_VILLE_GOOGLE)).toHaveLength(commandeSchema.parse({ ...BASE, villeGoogle: "x".repeat(900) }).villeGoogle.length);
    for (const faux of [12, null, {}, ["Netanya"], true]) {
      expect(commandeSchema.parse({ ...BASE, adresseGoogle: faux, villeGoogle: faux, reperesGoogle: faux })).toMatchObject({ adresseGoogle: "", villeGoogle: "", reperesGoogle: "" });
    }
  });

  it("le prix ne dépend jamais de ces champs : seule la zone choisie compte (lib/commandes.ts)", () => {
    const source = lire("lib/commandes.ts");
    expect(source).toContain("adresseGoogle: saisie.adresseGoogle");
    // La ville livrée, son supplément et son minimum se lisent d'après `saisie.ville` seulement.
    expect(source).toMatch(/where: \{ nom: saisie\.ville, active: true \}/);
    expect(source).not.toMatch(/nom: saisie\.villeGoogle|fraisDeLivraison\([^)]*Google/);
  });
});

describe("ce que le gérant voit : « Zone à vérifier », Waze, Telegram", () => {
  const commande = (c: Partial<{ adresse: string; ville: string; villeGoogle: string; reperesGoogle: string }>) =>
    zoneASignaler({ adresse: "Ehud Manor St 12", ville: "Netanya", villeGoogle: "", reperesGoogle: "", ...c }, ZONES);

  it("Google situe l'adresse dans une autre zone que celle choisie : signalée, avec sa zone", () => {
    expect(commande({ villeGoogle: "Netanya | נתניה", reperesGoogle: "Ehud Manor Street | Ehud Manor St | אהוד מנור" })).toEqual({ zone: QUARTIER_IR_YAMIM, horsZones: null });
    expect(commande({ ville: "Netanya", villeGoogle: "Tel Aviv-Yafo" })).toEqual({ zone: "Tel Aviv", horsZones: null });
  });

  it("Google confirme la zone choisie : rien, même si la rue porte le nom d'une autre ville", () => {
    expect(commande({ ville: QUARTIER_IR_YAMIM, villeGoogle: "Netanya", reperesGoogle: "Ehud Manor Street | Ehud Manor St" })).toBeNull();
    expect(commande({ adresse: "Tel Aviv St 5", ville: "Netanya", villeGoogle: "Netanya" })).toBeNull();
  });

  it("Google situe l'adresse dans une ville hors de ses zones : signalée, avec le nom de cette ville", () => {
    expect(commande({ villeGoogle: "Jerusalem", reperesGoogle: "Jaffa Street | Jaffa St" })).toEqual({ zone: null, horsZones: "Jerusalem" });
  });

  it("une adresse tapée à la main : les mots de l'adresse parlent, comme avant", () => {
    expect(commande({ adresse: "Herzl 12, Tel Aviv" })).toEqual({ zone: "Tel Aviv", horsZones: null });
    expect(commande({ adresse: "Résidence Lagoon, bâtiment B" })).toEqual({ zone: QUARTIER_IR_YAMIM, horsZones: null });
    expect(commande({ adresse: "Herzl 12" })).toBeNull();
  });

  it("Waze reçoit l'adresse que Google a reconnue ; sans elle, la rue et la ville comme avant", () => {
    expect(decodeURIComponent(lienWaze("Ehud Manor St 12", QUARTIER_IR_YAMIM, "Ehud Manor St 5, Netanya, Israël"))).toContain("q=Ehud Manor St 5, Netanya, Israël&");
    expect(decodeURIComponent(lienWaze("Ehud Manor St 12", QUARTIER_IR_YAMIM))).toContain("q=Ehud Manor St 12, Netanya&");
    expect(decodeURIComponent(lienWaze("Ehud Manor St 12", QUARTIER_IR_YAMIM, "   "))).toContain("q=Ehud Manor St 12, Netanya&");
  });

  it("l'alerte Telegram le dit en une ligne", () => {
    const base = { numero: 7, nomClient: "Dana Levi", ville: "Netanya", jour: "mardi", creneau: "19:00 – 20:00", total: 9000, paiement: "Bit", nombreArticles: 2, demandeLibre: "", lienAdmin: "https://exemple/admin" };
    expect(texteDeLAlerte({ ...base, villeHorsZones: "Jerusalem" })).toContain("Zone à vérifier : Google situe l'adresse à Jerusalem (hors de tes zones), le client a choisi Netanya");
    expect(texteDeLAlerte({ ...base, zoneAVerifier: "Tel Aviv", villeHorsZones: "Jerusalem" }).match(/Zone à vérifier/g)).toHaveLength(1);
    expect(texteDeLAlerte(base)).not.toContain("Zone à vérifier");
  });
});

describe("la clé du site : dans le code, lue par le serveur, et nulle part ailleurs", () => {
  const FORME_D_UNE_CLE = /AIza[0-9A-Za-z_-]{35}/;
  const exemple = `AIza${"x".repeat(35)}`;

  it("la constante est vide, ou a la forme d'une clé de navigateur Google (« AIza… », 39 caractères)", () => {
    expect(CLE_GOOGLE_MAPS_DU_SITE === "" || new RegExp(`^${FORME_D_UNE_CLE.source}$`).test(CLE_GOOGLE_MAPS_DU_SITE)).toBe(true);
    expect(FORME_D_UNE_CLE.test(exemple)).toBe(true);
  });

  it("la variable d'environnement passe avant ; sinon la clé du site, pour le site en ligne seulement ; sinon rien", () => {
    expect(cleGoogleMaps({ NEXT_PUBLIC_GOOGLE_MAPS_KEY: " cle-d-essai " })).toBe("cle-d-essai");
    expect(cleGoogleMaps({ NEXT_PUBLIC_GOOGLE_MAPS_KEY: "cle-d-essai", VERCEL_ENV: "production" })).toBe("cle-d-essai");
    expect(cleGoogleMaps({ VERCEL_ENV: "production" })).toBe(CLE_GOOGLE_MAPS_DU_SITE);
    // En local, dans un aperçu de Vercel, dans les tests : rien — la clé du site n'accepte que le vrai site.
    expect(cleGoogleMaps({})).toBe("");
    expect(cleGoogleMaps({ VERCEL_ENV: "preview" })).toBe("");
    expect(cleGoogleMaps({ VERCEL_ENV: "development", NEXT_PUBLIC_GOOGLE_MAPS_KEY: "  " })).toBe("");
    // Ici, pendant les tests : aucune variable, donc aucune clé.
    expect(cleGoogleMaps({ ...process.env, NEXT_PUBLIC_GOOGLE_MAPS_KEY: undefined, VERCEL_ENV: undefined })).toBe("");
  });

  it("aucun autre fichier du dépôt ne contient une clé Google", () => {
    const racine = process.cwd();
    const IGNORES = new Set(["node_modules", ".next", ".git", ".vercel", "prive", "public", ".courriels", "package-lock.json", "sortie", "flyer"]);
    const TEXTES = /\.(ts|tsx|mts|mjs|js|json|md|css|sql|prisma|txt|example|yml|yaml)$|^\.env/;
    const avecCle: string[] = [];
    const parcourir = (dossier: string) => {
      for (const nom of readdirSync(path.join(racine, dossier))) {
        if (IGNORES.has(nom)) continue;
        const chemin = path.join(dossier, nom);
        const etat = statSync(path.join(racine, chemin));
        if (etat.isDirectory()) parcourir(chemin);
        else if (TEXTES.test(nom) && etat.size < 3_000_000 && FORME_D_UNE_CLE.test(lire(chemin))) avecCle.push(chemin);
      }
    };
    parcourir("");
    expect(avecCle.filter((f) => f !== path.join("lib", "google-maps.ts"))).toEqual([]);
    // Et la clé du site, quand elle est posée, n'est écrite qu'une fois, dans sa constante.
    if (CLE_GOOGLE_MAPS_DU_SITE) expect(lire("lib/google-maps.ts").split(CLE_GOOGLE_MAPS_DU_SITE)).toHaveLength(2);
  });
});

describe("le site : rien de Google sans la clé, et ce qui doit être dit est dit", () => {
  it("le navigateur ne lit aucune variable : la page du panier reçoit la clé du serveur et la passe au champ", () => {
    expect(lire("app/(boutique)/panier/page.tsx")).toContain("cleGoogle={cleGoogleMaps()}");
    for (const f of ["lib/google-adresses.ts", "lib/lieu-google.ts", "components/panier/ChampAdresse.tsx", "app/(boutique)/panier/PageDuPanier.tsx"]) {
      expect(lire(f), f).not.toMatch(/process\.env|google-maps"/);
    }
    // Sans clé, le champ du panier est le champ d'avant, et rien n'est demandé à Google.
    expect(lire("components/panier/ChampAdresse.tsx")).toContain("props.cleGoogle ? <AvecPropositions {...props} /> : <input {...props.champ} />");
    expect(lire("lib/google-adresses.ts")).toContain("if (!cle || !adressesGoogleDisponibles()");
    // Des champs « Essentials » seulement : `displayName` ferait passer la lecture au tarif supérieur.
    expect(lire("lib/google-adresses.ts")).not.toMatch(/\[[^\]]*"displayName"/);
    // L'adresse du script de Google n'est écrite que dans lib/google-adresses.ts.
    for (const f of ["app/layout.tsx", "app/(boutique)/layout.tsx", "app/(boutique)/panier/page.tsx", "app/(boutique)/panier/PageDuPanier.tsx", "components/panier/ChampAdresse.tsx", "next.config.ts", "proxy.ts"]) {
      expect(lire(f), f).not.toMatch(/googleapis|gstatic/);
    }
  });

  it("les textes du panier existent dans les cinq langues, avec la même valeur {ville}", () => {
    for (const langue of LANGUES) {
      const p = DICTIONNAIRES[langue].panier;
      expect(p.adressePropositions.length, langue).toBeGreaterThan(3);
      expect(p.adresseReconnue, langue).toContain("{ville}");
      expect(p.adresseHorsZones.split("{ville}"), langue).toHaveLength(2);
    }
  });

  it("la page de confidentialité dit, dans les cinq langues, que les propositions viennent de Google", () => {
    for (const langue of LANGUES) {
      expect(dictionnaireServeur(langue).juridique.confidentialite.partage.p2, langue).toContain("Google");
    }
    expect(lire("app/(boutique)/confidentialite/page.tsx")).toContain("c.partage.p2");
  });
});
