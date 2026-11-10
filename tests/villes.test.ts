import { describe, expect, it } from "vitest";
import { fraisDeLivraison, livraisonLaMoinsChere, minimumPour } from "@/lib/villes";
import { tarifPour, type PlageTarifaire } from "@/lib/tarifs";
import { statistiques } from "@/lib/statistiques";
import { VILLES_EXEMPLE } from "@/prisma/catalogue";

const netanya = { nom: "Netanya", supplementLivraison: 0, minimumCommande: 0 };
const herzliya = { nom: "Herzliya", supplementLivraison: 1500, minimumCommande: 0 };
const telAviv = { nom: "Tel Aviv", supplementLivraison: 2500, minimumCommande: 10000 };
const base = { fraisService: 1500, fraisLivraison: 3000, fraisExpress: 2000, majorationPct: 0 };
const nuit: PlageTarifaire = {
  id: "n", nom: "Nuit", jours: [0, 1, 2, 3, 4, 5, 6], debut: "21:00", fin: "08:00",
  fraisService: 2000, fraisLivraison: 4500, fraisExpress: 0, majorationPct: 10,
};

describe("livraison par ville", () => {
  it("livraison du moment + supplément de la ville", () => {
    expect(fraisDeLivraison(base, netanya, false)).toBe(3000);
    expect(fraisDeLivraison(base, herzliya, false)).toBe(4500);
    expect(fraisDeLivraison(base, telAviv, false)).toBe(5500);
  });
  it("se cumule avec le tarif de nuit et l'express", () => {
    const t = tarifPour({ jour: 2, minutes: 23 * 60 }, [nuit], base);
    expect(fraisDeLivraison(t, telAviv, false)).toBe(7000); // 45 + 25
    expect(fraisDeLivraison(base, herzliya, true)).toBe(6500); // 30 + 15 + 20 express
  });
  it("sans ville choisie : pas de supplément", () => {
    expect(fraisDeLivraison(base, undefined, false)).toBe(3000);
  });
  it("minimum : le plus élevé entre le général et celui de la ville", () => {
    expect(minimumPour(telAviv, 5000)).toBe(10000);
    expect(minimumPour(herzliya, 5000)).toBe(5000);
    expect(minimumPour(undefined, 0)).toBe(0);
  });
  it("« Livraison dès » = la ville la moins chère", () => {
    expect(livraisonLaMoinsChere(base, [telAviv, herzliya])).toBe(4500);
    expect(livraisonLaMoinsChere(base, [])).toBe(3000);
  });
});

describe("villes de départ", () => {
  it("noms uniques, Netanya au prix de base, plus loin plus cher", () => {
    const noms = VILLES_EXEMPLE.map((v) => v.nom.toLowerCase());
    expect(new Set(noms).size).toBe(noms.length);
    const supp = (n: string) => VILLES_EXEMPLE.find((v) => v.nom === n)!.supplementLivraison;
    expect(supp("Netanya")).toBe(0);
    expect(supp("Herzliya")).toBeGreaterThan(supp("Netanya"));
    expect(supp("Tel Aviv")).toBeGreaterThan(supp("Herzliya"));
    expect(VILLES_EXEMPLE.every((v) => v.supplementLivraison >= 0 && Number.isInteger(v.supplementLivraison))).toBe(true);
  });
});

describe("statistiques par ville", () => {
  it("compte et additionne par ville, hors annulées", () => {
    const c = (ville: string, total: number, statut = "LIVREE") => ({
      createdAt: new Date("2026-11-10T10:00:00Z"), statut, total, pourboire: 0, express: false, ville, lignes: [],
    });
    const s = statistiques([c("Netanya", 5000), c("Netanya", 3000), c("Tel Aviv", 9000), c("Tel Aviv", 1, "ANNULEE")], new Date("2026-11-10T12:00:00Z"));
    expect(s.parVille).toEqual([
      { ville: "Netanya", commandes: 2, chiffre: 8000 },
      { ville: "Tel Aviv", commandes: 1, chiffre: 9000 },
    ]);
  });
});
