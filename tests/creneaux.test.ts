import { describe, expect, it } from "vitest";
import { amplitudeDesCreneaux, finDuCreneau, joursDeLivraison } from "@/lib/creneaux";
import { tarifDeLaLivraison, type PlageTarifaire } from "@/lib/tarifs";
import { PLAGES_EXEMPLE } from "@/prisma/catalogue";

const SOIR = ["19:00 – 20:00", "20:00 – 21:00", "21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"];
const TOUS = [0, 1, 2, 3, 4, 5, 6];
// Heures d'Israël en hiver = UTC+2 : 15:00Z = 17:00 en Israël.
const israel = (iso: string) => new Date(iso);

describe("créneaux du soir", () => {
  it("à 17h, tous les créneaux de ce soir sont possibles (délai 60 min)", () => {
    const j = joursDeLivraison(SOIR, TOUS, 60, israel("2026-11-10T15:00:00Z"));
    expect(j[0]).toEqual({ valeur: "2026-11-10", libelle: "Aujourd'hui", creneaux: SOIR });
    expect(j).toHaveLength(8);
  });
  it("à 19h30, ce soir : seulement les créneaux qui commencent dans au moins 60 min", () => {
    const j = joursDeLivraison(SOIR, TOUS, 60, israel("2026-11-10T17:30:00Z"));
    expect(j[0].creneaux).toEqual(["21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"]);
    expect(j[1].creneaux).toEqual(SOIR); // demain : tout
  });
  it("exactement à la limite : le créneau reste proposé", () => {
    const j = joursDeLivraison(SOIR, TOUS, 60, israel("2026-11-10T19:00:00Z")); // 21:00 en Israël
    expect(j[0].creneaux[0]).toBe("22:00 – 23:00");
  });
  it("à 22h30 : ce soir est complet, la prochaine livraison est demain", () => {
    const j = joursDeLivraison(SOIR, TOUS, 60, israel("2026-11-10T20:30:00Z"));
    expect(j[0].valeur).toBe("2026-11-11");
    expect(j[0].libelle).toBe("Demain");
  });
  it("seulement les jours livrés (ex. pas le vendredi ni le samedi)", () => {
    const j = joursDeLivraison(SOIR, [0, 1, 2, 3, 4], 60, israel("2026-11-10T15:00:00Z")); // mardi
    const semaine = j.map((x) => new Date(`${x.valeur}T12:00:00Z`).getUTCDay());
    expect(semaine.includes(5) || semaine.includes(6)).toBe(false);
    expect(j.map((x) => x.valeur)).toEqual(["2026-11-10", "2026-11-11", "2026-11-12", "2026-11-15", "2026-11-16", "2026-11-17"]);
  });
  it("« Dès que possible » (sans heure) reste proposé le jour même", () => {
    const j = joursDeLivraison(["Dès que possible", "19:00 – 20:00"], TOUS, 60, israel("2026-11-10T20:30:00Z"));
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
