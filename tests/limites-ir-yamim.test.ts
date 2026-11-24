// La zone « Netanya – Ir Yamim / Poleg » reconnue par la POSITION de l'adresse (demande du gérant, 24 novembre
// 2026 : « fais par la position, tout au sud d'Uzi Hitman »). Les positions de ce test ont été relevées chez
// Google ce jour-là (prisma/limites-ir-yamim-1124.ts).
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { LONGUEUR_MAXIMALE_DES_LIMITES, RECTANGLES_AU_PLUS, dansLesLimites, lireLimites, lireReperes, positionValide, zoneASignaler, zonePourLieu, zoneReperee } from "@/lib/zones";
import { champsGoogle, lieuDepuisGoogle } from "@/lib/lieu-google";
import { commandeSchema } from "@/lib/validation";
import { nomVille } from "@/lib/i18n/catalogue";
import { LANGUES } from "@/lib/langues";
import { QUARTIER_IR_YAMIM } from "../prisma/zones-1123";
import { RUES_D_IR_YAMIM, texteDesRues } from "../prisma/rues-ir-yamim-1124";
import { CLE_LIMITES_D_IR_YAMIM, DANS_LA_ZONE, HORS_DE_LA_ZONE, LIMITES_D_IR_YAMIM } from "../prisma/limites-ir-yamim-1124";

const lire = (f: string) => readFileSync(path.join(process.cwd(), f), "utf8");
const zone = (nom: string, reperes = "", limites = "") => zoneReperee(nom, reperes, LANGUES.map((l) => nomVille(nom, l)), limites);
// Les zones sans AUCUN repère de rue : seule la position peut dire le quartier.
const ZONES = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, "", LIMITES_D_IR_YAMIM), zone("Herzliya"), zone("Tel Aviv")];
const aNetanya = (lat: number, lng: number, ...rue: string[]) => zonePourLieu({ villes: ["Netanya", "נתניה"], precisions: rue, position: { lat, lng } }, ZONES).zone;

describe("les limites écrites en clair", () => {
  it("un rectangle par ligne : « nord 32.2832, est 34.8475 »", () => {
    expect(lireLimites(LIMITES_D_IR_YAMIM)).toEqual([{ nord: 32.2832, est: 34.8475 }, { nord: 32.2772, est: 34.8525 }]);
    // La virgule des décimales, deux-points, majuscules, un point-virgule entre deux rectangles.
    expect(lireLimites("Nord : 32,2832, Est = 34,8475 ; sud 32.26")).toEqual([{ nord: 32.2832, est: 34.8475 }, { sud: 32.26 }]);
    // « ouest » n'est pas « est ».
    expect(lireLimites("ouest 34.83, est 34.85")).toEqual([{ ouest: 34.83, est: 34.85 }]);
    expect(lireLimites("sud-ouest 34.83")).toEqual([{ ouest: 34.83 }]);
  });

  it("ce qui n'est pas lisible est ignoré ; une borne hors d'Israël aussi", () => {
    expect(lireLimites("")).toEqual([]);
    expect(lireLimites("tout le sud\n\nau sud d'Uzi Hitman")).toEqual([]);
    expect(lireLimites("nord 48.85, est 2.35")).toEqual([]); // Paris
    expect(lireLimites("nord 34.8475")).toEqual([]); // une longitude à la place d'une latitude
    expect(lireLimites("nord 32.28, est 3")).toEqual([{ nord: 32.28 }]);
    expect(lireLimites(Array(20).fill("nord 32.28").join("\n"))).toHaveLength(RECTANGLES_AU_PLUS);
    expect(LIMITES_D_IR_YAMIM.length).toBeLessThan(LONGUEUR_MAXIMALE_DES_LIMITES);
  });

  it("une position : deux nombres, en Israël — sinon rien", () => {
    expect(positionValide(32.2766, 34.8389)).toEqual({ lat: 32.2766, lng: 34.8389 });
    for (const [lat, lng] of [[48.85, 2.35], [0, 0], [NaN, 34.8], [32.27, Infinity], ["32.27", "34.84"], [null, null], [undefined, undefined], [34.8389, 32.2766]]) {
      expect(positionValide(lat, lng), `${lat}, ${lng}`).toBeNull();
    }
  });
});

describe("les limites de la zone, face aux positions relevées chez Google", () => {
  const limites = lireLimites(LIMITES_D_IR_YAMIM);

  it("Ir Yamim et Ramat Poleg sont dedans — jusqu'à Uzi Hitman au nord, et les rues absentes de ses listes aussi", () => {
    for (const [lieu, lat, lng] of DANS_LA_ZONE) expect(dansLesLimites({ lat, lng }, limites), lieu).toBe(true);
    expect(DANS_LA_ZONE.map((x) => x[0]).join()).toContain("Yigal Bashan");
  });

  it("ce qui est au nord d'Uzi Hitman, Kiryat Nordau, la zone industrielle et le reste de Netanya sont dehors", () => {
    for (const [lieu, lat, lng] of HORS_DE_LA_ZONE) expect(dansLesLimites({ lat, lng }, limites), lieu).toBe(false);
  });

  it("la limite nord passe entre la dernière adresse d'Uzi Hitman et la première de la rue d'au-dessus", () => {
    const nord = limites[0].nord ?? 0;
    expect(nord).toBeGreaterThan(32.28236); // Uzi Hitman 6
    expect(nord).toBeLessThan(32.28405); // Rotem 1
    // Aucune rue de ses listes n'est au nord de cette limite.
    for (const rue of RUES_D_IR_YAMIM) expect(rue.latitude, rue.noms[0]).toBeLessThan(nord);
  });
});

describe("au panier : la position que Google donne à l'adresse choisie", () => {
  it("une rue ABSENTE des repères, au sud d'Uzi Hitman : la zone à 40 ₪", () => {
    expect(aNetanya(32.27363, 34.83824, "Yigal Bashan Street", "יגאל בשן")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya(32.27239, 34.83684, "Tirza Atar Street", "תרצה אתר")).toBe(QUARTIER_IR_YAMIM);
    expect(aNetanya(32.27926, 34.84676, "Beni Berman Street", "קניון עיר ימים")).toBe(QUARTIER_IR_YAMIM);
  });

  // Ces zones-ci n'ont que le premier quartier. Kiryat Nordau a la sienne depuis (tests/kiryat-nordau.test.ts).
  it("au nord, ou à Kiryat Nordau : hors de CETTE zone", () => {
    expect(aNetanya(32.28405, 34.84682, "Rotem Street", "רותם")).toBe("Netanya");
    expect(aNetanya(32.2828, 34.84942, "Keren HaYesod Street", "קרן היסוד")).toBe("Netanya");
    expect(aNetanya(32.3277, 34.8598, "Herzl Street", "הרצל")).toBe("Netanya");
  });

  it("les limites ne valent que dans SA ville : Tel Aviv est au sud et à l'ouest, et n'est pas Netanya", () => {
    const telAviv = { lat: 32.0775, lng: 34.7742 };
    expect(dansLesLimites(telAviv, lireLimites(LIMITES_D_IR_YAMIM))).toBe(true); // le rectangle est ouvert vers le sud…
    expect(zonePourLieu({ villes: ["Tel Aviv-Yafo", "תל אביב-יפו"], precisions: ["Dizengoff Street"], position: telAviv }, ZONES).zone).toBe("Tel Aviv"); // … mais c'est la ville qui décide d'abord
    expect(zonePourLieu({ villes: ["Jerusalem"], precisions: [], position: { lat: 31.78, lng: 35.22 } }, ZONES)).toEqual({ zone: null, villeNonLivree: "Jerusalem" });
    // Sans ville, la position seule ne dit rien.
    expect(zonePourLieu({ villes: [], precisions: [], position: { lat: 32.2736, lng: 34.8382 } }, ZONES).zone).toBeNull();
  });

  it("sans position (Google ne l'a pas donnée), ou sans limites : comme avant, par les repères", () => {
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Yigal Bashan Street"] }, ZONES).zone).toBe("Netanya");
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Yigal Bashan Street"], position: null }, ZONES).zone).toBe("Netanya");
    const sansLimites = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, texteDesRues())];
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Yigal Bashan Street"], position: { lat: 32.27363, lng: 34.83824 } }, sansLimites).zone).toBe("Netanya");
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Ehud Manor Street"], position: { lat: 32.2766, lng: 34.8389 } }, sansLimites).zone).toBe(QUARTIER_IR_YAMIM);
  });

  it("un repère du gérant passe avant la position ; une ville entière n'a pas de limites", () => {
    // Une rue qu'il a notée dans le quartier, mais dont Google place le milieu au nord de la limite : c'est lui qu'on croit.
    const avecRepere = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, "Rotem", LIMITES_D_IR_YAMIM)];
    expect(zonePourLieu({ villes: ["Netanya"], precisions: ["Rotem Street"], position: { lat: 32.28405, lng: 34.84682 } }, avecRepere).zone).toBe(QUARTIER_IR_YAMIM);
    expect(zone("Netanya", "", "nord 33").limites).toBeUndefined();
    expect(zone(QUARTIER_IR_YAMIM, "", "au sud").limites).toBeUndefined();
  });

  it("la position part avec la commande, et le navigateur ne l'invente pas", () => {
    const lieu = lieuDepuisGoogle([[{ longText: "Netanya", types: ["locality"] }]], "", { lat: 32.27363, lng: 34.83824 });
    expect(champsGoogle("Yigal Bashan St 3, Netanya", lieu)).toMatchObject({ latitudeGoogle: "32.273630", longitudeGoogle: "34.838240" });
    const BASE = { nomClient: "Dana Levi", telephone: "+972 50 123 4567", email: "dana@example.com", ville: "Netanya", logement: "MAISON", adresse: "Yigal Bashan 3", dateLivraison: "2026-12-01", creneau: "19:00 – 20:00", remplacement: "CONTACTER", lignes: [{ produitId: "p1", quantite: 1 }] };
    expect(commandeSchema.parse({ ...BASE, latitudeGoogle: "32.273630", longitudeGoogle: "34.838240" })).toMatchObject({ latitudeGoogle: 32.27363, longitudeGoogle: 34.83824 });
    expect(commandeSchema.parse(BASE)).toMatchObject({ latitudeGoogle: null, longitudeGoogle: null });
    for (const faux of ["", "abc", "32,27", "1e5", "32.27; DROP", {}, 32.27, null]) {
      expect(commandeSchema.parse({ ...BASE, latitudeGoogle: faux, longitudeGoogle: faux }), String(faux)).toMatchObject({ latitudeGoogle: null, longitudeGoogle: null });
    }
    // Enregistrée seulement si elle est plausible ; jamais une raison de refuser la commande.
    const commandes = lire("lib/commandes.ts");
    expect(commandes).toContain("latitudeGoogle: positionValide(saisie.latitudeGoogle, saisie.longitudeGoogle)?.lat ?? null");
    expect(commandes).toContain("longitudeGoogle: positionValide(saisie.latitudeGoogle, saisie.longitudeGoogle)?.lng ?? null");
  });
});

describe("le gérant : « Zone à vérifier » suit la position", () => {
  const commande = { adresse: "Yigal Bashan Street 3", ville: "Netanya", villeGoogle: "Netanya | נתניה", reperesGoogle: "Yigal Bashan Street | יגאל בשן", latitudeGoogle: 32.27363, longitudeGoogle: 34.83824 };

  it("le client a gardé Netanya à 30 ₪ pour une adresse du quartier : signalé ; il a pris le quartier : rien", () => {
    expect(zoneASignaler(commande, ZONES)).toEqual({ zone: QUARTIER_IR_YAMIM, horsZones: null });
    expect(zoneASignaler({ ...commande, ville: QUARTIER_IR_YAMIM }, ZONES)).toBeNull();
  });

  it("l'inverse aussi : le quartier choisi pour une adresse du centre", () => {
    expect(zoneASignaler({ adresse: "Herzl Street 10", ville: QUARTIER_IR_YAMIM, villeGoogle: "Netanya", reperesGoogle: "Herzl Street", latitudeGoogle: 32.3277, longitudeGoogle: 34.8598 }, ZONES)).toEqual({ zone: "Netanya", horsZones: null });
  });

  it("une position absurde est ignorée, pas crue", () => {
    expect(zoneASignaler({ ...commande, latitudeGoogle: 0, longitudeGoogle: 0 }, ZONES)).toBeNull();
    expect(zoneASignaler({ ...commande, latitudeGoogle: null, longitudeGoogle: null }, ZONES)).toBeNull();
  });

  it("la liste des commandes, l'alerte et la commande relisent la position", () => {
    expect(lire("app/admin/(protege)/page.tsx")).toContain("latitudeGoogle: true, longitudeGoogle: true");
    expect(lire("lib/commande-courriels.ts")).toContain("latitudeGoogle: true, longitudeGoogle: true");
    expect(lire("lib/zones-lecture.ts")).toContain("LANGUES.map((l) => nomVille(v.nom, l)), v.limites)");
  });
});

describe("posées une seule fois, et le gérant garde la main", () => {
  const remplissage = lire("prisma/remplissage.ts");
  const corps = remplissage.slice(remplissage.indexOf("export async function poserLesLimitesDIrYamim"));
  const fonction = corps.slice(0, corps.indexOf("\n}\n") + 3);

  it("une clé à elle, après les rues ; ses propres limites ne sont jamais remplacées", () => {
    expect(CLE_LIMITES_D_IR_YAMIM).toBe("limites-ir-yamim-1124");
    expect(fonction).toContain("operationFaite(prisma, CLE_LIMITES_D_IR_YAMIM)");
    expect(fonction).toContain("noterOperation(prisma, CLE_LIMITES_D_IR_YAMIM)");
    expect(fonction).toContain('const aLesSiennes = zone.limites.trim() !== "";');
    expect(fonction).toContain("...(aLesSiennes ? [] : [prisma.ville.update({ where: { id: zone.id }, data: { limites: LIMITES_D_IR_YAMIM } })])");
    expect(fonction).not.toMatch(/delete|deleteMany|create\(/);
    const preparer = lire("prisma/preparer.ts");
    expect(preparer.indexOf("poserLesLimitesDIrYamim(prisma)")).toBeGreaterThan(preparer.indexOf("ajouterLesRuesDIrYamim(prisma)"));
    expect(preparer.indexOf("poserLesLimitesDIrYamim(prisma)")).toBeLessThan(preparer.indexOf("mettreLesReglagesANiveau(prisma)"));
  });

  it("« HaIrusim » n'est pas un repère : Google situe la rue dans la zone et ses numéros ailleurs — la position dit", () => {
    expect(lireReperes(texteDesRues())).not.toContain("האיריסים");
    const zones = [zone("Netanya"), zone(QUARTIER_IR_YAMIM, texteDesRues(), LIMITES_D_IR_YAMIM)];
    const lieu = (lat: number, lng: number) => zonePourLieu({ villes: ["Netanya"], precisions: ["האיריסים"], position: { lat, lng } }, zones).zone;
    expect(lieu(32.27147, 34.84164)).toBe(QUARTIER_IR_YAMIM); // la rue, sans numéro
    expect(lieu(32.288652, 34.854766)).toBe("Netanya"); // « האיריסים 4 », là où Google le met
    expect(fonction).not.toContain("reperes");
  });

  it("le panier reçoit les limites avec les zones : sans elles, la position ne servirait à rien", () => {
    expect(lire("app/(boutique)/panier/page.tsx")).toContain("...(limites ? { limites } : {})");
  });

  it("« Villes » montre les limites d'un quartier et refuse une ligne illisible", () => {
    const page = lire("app/admin/(protege)/villes/page.tsx");
    expect(page).toContain("name={`lim_${v.id}`}");
    expect(page).toContain("quartiersDe(v.nom).length > 0 || v.limites");
    const actions = lire("app/admin/(protege)/actions.ts");
    expect(actions).toContain("lireLimites(limites).length !== lignes.length");
    // Le champ absent de la page (une ville entière) : ses limites ne sont pas touchées.
    expect(actions).toContain("...(limites !== undefined ? { limites } : {})");
  });
});
