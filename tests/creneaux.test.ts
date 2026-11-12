import { describe, expect, it } from "vitest";
import { amplitudeDesCreneaux, finDuCreneau, heureLimitePassee, joursDeLivraison } from "@/lib/creneaux";
import { tarifDeLaLivraison, type PlageTarifaire } from "@/lib/tarifs";
import { PLAGES_EXEMPLE } from "@/prisma/catalogue";

const SOIR = ["19:00 – 20:00", "20:00 – 21:00", "21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"];
const TOUS = [0, 1, 2, 3, 4, 5, 6];
// Heures d'Israël en hiver = UTC+2 : 15:00Z = 17:00 en Israël.
const israel = (iso: string) => new Date(iso);

describe("créneaux du soir", () => {
  it("à 17h, tous les créneaux de ce soir sont possibles (délai 60 min)", () => {
    const j = joursDeLivraison({ creneaux: SOIR, joursLivres: TOUS, delaiPreparation: 60, heureLimite: "" }, israel("2026-11-10T15:00:00Z"));
    expect(j[0]).toEqual({ valeur: "2026-11-10", libelle: "Aujourd'hui", creneaux: SOIR, complets: [] });
    expect(j).toHaveLength(8);
  });
  it("à 19h30, ce soir : seulement les créneaux qui commencent dans au moins 60 min", () => {
    const j = joursDeLivraison({ creneaux: SOIR, joursLivres: TOUS, delaiPreparation: 60, heureLimite: "" }, israel("2026-11-10T17:30:00Z"));
    expect(j[0].creneaux).toEqual(["21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"]);
    expect(j[1].creneaux).toEqual(SOIR); // demain : tout
  });
  it("exactement à la limite : le créneau reste proposé", () => {
    const j = joursDeLivraison({ creneaux: SOIR, joursLivres: TOUS, delaiPreparation: 60, heureLimite: "" }, israel("2026-11-10T19:00:00Z")); // 21:00 en Israël
    expect(j[0].creneaux[0]).toBe("22:00 – 23:00");
  });
  it("à 22h30 : ce soir est complet, la prochaine livraison est demain", () => {
    const j = joursDeLivraison({ creneaux: SOIR, joursLivres: TOUS, delaiPreparation: 60, heureLimite: "" }, israel("2026-11-10T20:30:00Z"));
    expect(j[0].valeur).toBe("2026-11-11");
    expect(j[0].libelle).toBe("Demain");
  });
  it("seulement les jours livrés (ex. pas le vendredi ni le samedi)", () => {
    const j = joursDeLivraison({ creneaux: SOIR, joursLivres: [0, 1, 2, 3, 4], delaiPreparation: 60, heureLimite: "" }, israel("2026-11-10T15:00:00Z")); // mardi
    const semaine = j.map((x) => new Date(`${x.valeur}T12:00:00Z`).getUTCDay());
    expect(semaine.includes(5) || semaine.includes(6)).toBe(false);
    expect(j.map((x) => x.valeur)).toEqual(["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-15", "2026-11-16", "2026-11-17"]);
  });
  it("« Dès que possible » (sans heure) reste proposé le jour même", () => {
    const j = joursDeLivraison({ creneaux: ["Dès que possible", "19:00 – 20:00"], joursLivres: TOUS, delaiPreparation: 60, heureLimite: "" }, israel("2026-11-10T20:30:00Z"));
    expect(j[0]).toMatchObject({ valeur: "2026-11-10", creneaux: ["Dès que possible"] });
  });
  it("fin et amplitude des créneaux (minuit compris)", () => {
    expect(finDuCreneau("23:00 – 00:00")).toBe(24 * 60);
    expect(finDuCreneau("19:00 – 20:30")).toBe(20 * 60 + 30);
    expect(finDuCreneau("Dès que possible")).toBeNull();
    expect(amplitudeDesCreneaux(SOIR)).toBe("19h – 00h");
    expect(amplitudeDesCreneaux(["Dès que possible"])).toBeNull();
  });
});

describe("heure limite pour le soir même", () => {
  const regles = { creneaux: SOIR, joursLivres: TOUS, delaiPreparation: 60, heureLimite: "17:00" };
  it("avant 17h : livré ce soir", () => {
    expect(joursDeLivraison(regles, israel("2026-11-10T14:59:00Z"))[0].valeur).toBe("2026-11-10"); // 16:59
  });
  it("à partir de 17h : prochaine livraison demain soir", () => {
    expect(heureLimitePassee("17:00", israel("2026-11-10T15:00:00Z"))).toBe(true);
    expect(joursDeLivraison(regles, israel("2026-11-10T15:00:00Z"))[0]).toMatchObject({ valeur: "2026-11-11", libelle: "Demain" });
  });
  it("pas d'heure limite (vide) : seul le délai compte", () => {
    expect(heureLimitePassee("", israel("2026-11-10T20:00:00Z"))).toBe(false);
    expect(joursDeLivraison({ ...regles, heureLimite: "" }, israel("2026-11-10T15:00:00Z"))[0].valeur).toBe("2026-11-10");
  });
});

describe("tarifs d'exemple pour le soir", () => {
  const plages = PLAGES_EXEMPLE.map((p, i) => ({ ...p, id: String(i) })) as PlageTarifaire[];
  const base = { fraisService: 1500, fraisLivraison: 3000, fraisExpress: 2000 };
  it("19h–22h en semaine : tarif de base ; 22h–minuit : fin de soirée ; vendredi soir : week-end", () => {
    expect(tarifDeLaLivraison("2026-11-10", "19:00 – 20:00", plages, base).nom).toBe("Tarif de base");
    expect(tarifDeLaLivraison("2026-11-10", "22:00 – 23:00", plages, base).nom).toBe("Fin de soirée");
    expect(tarifDeLaLivraison("2026-11-10", "23:00 – 00:00", plages, base).nom).toBe("Fin de soirée");
    expect(tarifDeLaLivraison("2026-11-13", "22:00 – 23:00", plages, base).nom).toBe("Week-end");
  });
});

describe("limite de commandes par créneau", () => {
  // Un mercredi à 10h en Israël : le soir même est encore possible.
  const maintenant = new Date("2026-11-11T08:00:00Z");
  const regles = { creneaux: ["19:00 – 20:00", "20:00 – 21:00"], joursLivres: [0, 1, 2, 3, 4, 5, 6], delaiPreparation: 60, heureLimite: "17:00" };

  it("sans limite, ou sans commande : rien n'est complet", async () => {
    const { joursDeLivraison } = await import("@/lib/creneaux");
    expect(joursDeLivraison(regles, maintenant, 2).every((j) => j.complets.length === 0 && j.creneaux.length === 2)).toBe(true);
    const occupe = { "2026-11-11|19:00 – 20:00": 9 };
    expect(joursDeLivraison(regles, maintenant, 2, occupe)[0].complets).toEqual([]);
    expect(joursDeLivraison({ ...regles, commandesParCreneau: 0 }, maintenant, 2, occupe)[0].complets).toEqual([]);
  });
  it("un créneau qui a atteint la limite est complet : affiché, plus choisissable", async () => {
    const { joursDeLivraison, cleDuCreneau } = await import("@/lib/creneaux");
    const occupe = { [cleDuCreneau("2026-11-11", "19:00 – 20:00")]: 3, [cleDuCreneau("2026-11-11", "20:00 – 21:00")]: 2, [cleDuCreneau("2026-11-12", "20:00 – 21:00")]: 4 };
    const [ce_soir, demain] = joursDeLivraison({ ...regles, commandesParCreneau: 3 }, maintenant, 2, occupe);
    expect(ce_soir).toMatchObject({ valeur: "2026-11-11", creneaux: ["20:00 – 21:00"], complets: ["19:00 – 20:00"] });
    expect(demain).toMatchObject({ valeur: "2026-11-12", creneaux: ["19:00 – 20:00"], complets: ["20:00 – 21:00"] });
  });
  it("un jour dont tous les créneaux sont complets disparaît : la prochaine livraison est le jour suivant", async () => {
    const { joursDeLivraison } = await import("@/lib/creneaux");
    const occupe = { "2026-11-11|19:00 – 20:00": 1, "2026-11-11|20:00 – 21:00": 1 };
    const jours = joursDeLivraison({ ...regles, commandesParCreneau: 1 }, maintenant, 3, occupe);
    expect(jours.map((j) => j.valeur)).toEqual(["2026-11-12", "2026-11-13"]);
  });
  it("le réglage : un nombre entier, 0 ou vide = pas de limite", async () => {
    const { reglagesSchema } = await import("@/lib/admin-schemas");
    const base = {
      fraisService: "15", fraisLivraison: "30", fraisExpress: "", minimumCommande: "", pourboires: "", paiements: "",
      creneaux: "19:00 – 20:00", whatsapp: "", messageAccueil: "", ouvert: true, fraisRegroupes: false, joursLivres: ["1"], delaiPreparation: "60", heureLimite: "",
      coordonneesPaiement: "", lienBit: "", entrepriseNom: "", entrepriseNumero: "", entrepriseAdresse: "", emailContact: "",
    };
    expect(reglagesSchema.parse({ ...base, commandesParCreneau: "4" }).commandesParCreneau).toBe(4);
    expect(reglagesSchema.parse({ ...base, commandesParCreneau: "" }).commandesParCreneau).toBe(0);
    for (const mauvais of ["-1", "2,5", "abc", "999"]) expect(reglagesSchema.safeParse({ ...base, commandesParCreneau: mauvais }).success, mauvais).toBe(false);
  });
});

describe("tournée du soir", () => {
  it("message « j'arrive » : le montant n'est rappelé que s'il reste à régler", async () => {
    const { messageJArrive, lienWaze } = await import("@/lib/messages-client");
    const reste = messageJArrive({ prenom: "Sarah", reference: "SA-15012", reste: 8990, mode: "Bit", site: "Courses Express" }).replace(/[  ]/g, " ");
    expect(reste).toContain("votre commande SA-15012");
    expect(reste).toContain("Il reste 89,90 ₪ à régler (Bit).");
    // Payée (le cas normal : le paiement se fait avant les achats) : aucun montant.
    const payee = messageJArrive({ prenom: "Sarah", reference: "SA-15012", reste: 0, mode: "Bit", site: "Courses Express" });
    expect(payee).not.toContain("₪");
    expect(payee).not.toContain("régler");
    expect(lienWaze("Hôtel Dan,\n chambre 512", "Tel Aviv")).toBe(
      "https://waze.com/ul?q=H%C3%B4tel%20Dan%2C%20chambre%20512%2C%20Tel%20Aviv&navigate=yes",
    );
  });
  it("heure limite dans les réglages : HH:MM ou vide", async () => {
    const { reglagesSchema } = await import("@/lib/admin-schemas");
    const base = {
      fraisService: "15", fraisLivraison: "30", fraisExpress: "", minimumCommande: "", pourboires: "", paiements: "",
      creneaux: "19:00 – 20:00", whatsapp: "", messageAccueil: "", ouvert: true, fraisRegroupes: false, joursLivres: ["1"], delaiPreparation: "60", commandesParCreneau: "",
      coordonneesPaiement: "", lienBit: "", entrepriseNom: "", entrepriseNumero: "", entrepriseAdresse: "", emailContact: "",
    };
    expect(reglagesSchema.parse({ ...base, heureLimite: "17:00" }).heureLimite).toBe("17:00");
    expect(reglagesSchema.parse({ ...base, heureLimite: "" }).heureLimite).toBe("");
    expect(reglagesSchema.safeParse({ ...base, heureLimite: "5pm" }).success).toBe(false);
  });
});
