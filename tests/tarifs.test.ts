import { describe, expect, it } from "vitest";
import {
  dansLaPlage, debutDuCreneau, decrirePlage, jourDeLaSemaine, momentDeLivraison, momentPresent,
  NOM_TARIF_DE_BASE, tarifDeLaLivraison, tarifPour, type PlageTarifaire,
} from "@/lib/tarifs";
import { calculerTotaux } from "@/lib/calcul";
import { plageSchema, produitSchema } from "@/lib/admin-schemas";
import { CATALOGUE, CATEGORIES, PLAGES_EXEMPLE } from "@/prisma/catalogue";
import { lireOptionsSaisies } from "@/lib/options";

const base = { fraisService: 1500, fraisLivraison: 3000, fraisExpress: 2000, majorationPct: 0 };
const plage = (p: Partial<PlageTarifaire>): PlageTarifaire => ({
  id: p.nom ?? "x", nom: "x", jours: [0, 1, 2, 3, 4, 5, 6], debut: "00:00", fin: "00:00",
  fraisService: 2000, fraisLivraison: 4500, fraisExpress: 0, majorationPct: 10, ...p,
});
const h = (hh: number, mm = 0) => hh * 60 + mm;

describe("plages horaires", () => {
  it("plage dans la journée : début inclus, fin exclue", () => {
    const p = plage({ debut: "09:00", fin: "18:00" });
    expect(dansLaPlage(p, { jour: 1, minutes: h(9) })).toBe(true);
    expect(dansLaPlage(p, { jour: 1, minutes: h(17, 59) })).toBe(true);
    expect(dansLaPlage(p, { jour: 1, minutes: h(18) })).toBe(false);
    expect(dansLaPlage(p, { jour: 1, minutes: h(8, 59) })).toBe(false);
  });
  it("plage qui passe minuit (21:00 → 08:00)", () => {
    const p = plage({ debut: "21:00", fin: "08:00" });
    expect(dansLaPlage(p, { jour: 2, minutes: h(23, 30) })).toBe(true);
    expect(dansLaPlage(p, { jour: 2, minutes: h(2) })).toBe(true);
    expect(dansLaPlage(p, { jour: 2, minutes: h(7, 59) })).toBe(true);
    expect(dansLaPlage(p, { jour: 2, minutes: h(8) })).toBe(false);
    expect(dansLaPlage(p, { jour: 2, minutes: h(12) })).toBe(false);
  });
  it("même heure de début et de fin = toute la journée, seulement les jours cochés", () => {
    const weekend = plage({ jours: [5, 6] });
    expect(dansLaPlage(weekend, { jour: 5, minutes: h(10) })).toBe(true);
    expect(dansLaPlage(weekend, { jour: 6, minutes: h(23, 59) })).toBe(true);
    expect(dansLaPlage(weekend, { jour: 0, minutes: h(10) })).toBe(false);
  });
  it("une heure abîmée ne correspond à rien", () => {
    expect(dansLaPlage(plage({ debut: "25:00", fin: "08:00" }), { jour: 1, minutes: h(2) })).toBe(false);
  });
});

describe("choix du tarif", () => {
  const weekend = plage({ nom: "Week-end", jours: [5, 6], fraisLivraison: 4000, majorationPct: 0 });
  const nuit = plage({ nom: "Nuit", debut: "21:00", fin: "08:00" });
  it("la première plage qui correspond gagne (priorité)", () => {
    expect(tarifPour({ jour: 5, minutes: h(22) }, [weekend, nuit], base).nom).toBe("Week-end");
    expect(tarifPour({ jour: 5, minutes: h(22) }, [nuit, weekend], base).nom).toBe("Nuit");
  });
  it("aucune plage : tarif de base", () => {
    const t = tarifPour({ jour: 2, minutes: h(12) }, [weekend, nuit], base);
    expect(t).toEqual({ nom: NOM_TARIF_DE_BASE, plageId: null, ...base });
  });
  it("les montants viennent de la plage", () => {
    expect(tarifPour({ jour: 2, minutes: h(23) }, [weekend, nuit], base)).toMatchObject({ fraisLivraison: 4500, fraisExpress: 0, majorationPct: 10 });
  });
});

describe("moment de la livraison", () => {
  const maintenant = new Date("2026-11-10T20:30:00Z"); // mardi 22:30 en Israël
  it("l'heure de début du créneau", () => {
    expect(debutDuCreneau("18:00 – 21:00")).toBe(h(18));
    expect(debutDuCreneau("21h30 - 23h")).toBe(h(21, 30));
    expect(debutDuCreneau("Dès que possible")).toBeNull();
    expect(momentDeLivraison("2026-11-13", "09:00 – 12:00", maintenant)).toEqual({ jour: 5, minutes: h(9) });
  });
  it("« Dès que possible » aujourd'hui = maintenant (heure d'Israël)", () => {
    expect(momentPresent(maintenant)).toEqual({ jour: 2, minutes: h(22, 30) });
    expect(momentDeLivraison("2026-11-10", "Dès que possible", maintenant)).toEqual({ jour: 2, minutes: h(22, 30) });
  });
  it("« Dès que possible » un autre jour = midi ce jour-là", () => {
    expect(momentDeLivraison("2026-11-14", "Dès que possible", maintenant)).toEqual({ jour: 6, minutes: h(12) });
  });
  it("jour de la semaine d'une date", () => {
    expect(jourDeLaSemaine("2026-11-13")).toBe(5); // vendredi
  });
  it("le tarif d'une livraison de bout en bout", () => {
    const plages = [plage({ nom: "Nuit", debut: "21:00", fin: "08:00" })];
    expect(tarifDeLaLivraison("2026-11-10", "Dès que possible", plages, base, maintenant).nom).toBe("Nuit");
    expect(tarifDeLaLivraison("2026-11-11", "12:00 – 15:00", plages, base, maintenant).nom).toBe(NOM_TARIF_DE_BASE);
  });
  it("décrit une plage", () => {
    expect(decrirePlage(plage({ debut: "21:00", fin: "08:00" }))).toBe("Tous les jours · 21:00 → 08:00 (lendemain)");
    expect(decrirePlage(plage({ jours: [6, 5] }))).toBe("Ven, Sam · toute la journée");
  });
});

describe("majoration sur les articles", () => {
  it("s'ajoute au total, arrondie à l'agora, et disparaît si tout manque", () => {
    const t = calculerTotaux([{ prixUnitaire: 999, quantite: 1 }], { fraisService: 0, fraisLivraison: 0, majorationPct: 10 });
    expect(t.majoration).toBe(100);
    expect(t.total).toBe(1099);
    expect(calculerTotaux([{ prixUnitaire: 999, quantite: 1, indisponible: true }], { fraisService: 0, fraisLivraison: 0, majorationPct: 10 }).total).toBe(0);
  });
  it("bornée entre 0 et 100 %", () => {
    expect(calculerTotaux([{ prixUnitaire: 1000, quantite: 1 }], { fraisService: 0, fraisLivraison: 0, majorationPct: 500 }).majoration).toBe(1000);
    expect(calculerTotaux([{ prixUnitaire: 1000, quantite: 1 }], { fraisService: 0, fraisLivraison: 0, majorationPct: -5 }).majoration).toBe(0);
  });
});

describe("formulaires", () => {
  const p = { nom: "Nuit", jours: ["0", "1"], debut: "21:00", fin: "08:00", fraisService: "20", fraisLivraison: "45", fraisExpress: "", majorationPct: "10", ordre: "", active: true };
  it("plage : lit les montants et les jours", () => {
    expect(plageSchema.parse(p)).toMatchObject({ jours: [0, 1], fraisLivraison: 4500, fraisExpress: 0, majorationPct: 10 });
  });
  it("plage : refuse heure abîmée, aucun jour, majoration > 100 %", () => {
    expect(plageSchema.safeParse({ ...p, debut: "9:00" }).success).toBe(false);
    expect(plageSchema.safeParse({ ...p, jours: [] }).success).toBe(false);
    expect(plageSchema.safeParse({ ...p, jours: ["7"] }).success).toBe(false);
    expect(plageSchema.safeParse({ ...p, majorationPct: "150" }).success).toBe(false);
  });
  const produit = { nom: "Lait", description: "", prix: "", prixAchat: "", prixBarre: "", categorieId: "c", boutique: "", lienWolt: "", nomWolt: "", ordre: "", actif: false, epuise: false, badge: "", options: "" };
  it("produit : prix vide = à définir, mais jamais en ligne sans prix", () => {
    expect(produitSchema.parse(produit).prix).toBe(0);
    expect(produitSchema.safeParse({ ...produit, actif: true }).success).toBe(false);
    expect(produitSchema.safeParse({ ...produit, actif: true, prix: "9,90" }).success).toBe(true);
  });
});

describe("base du catalogue", () => {
  it("noms uniques, catégories connues, options lisibles, badges valides", () => {
    const noms = CATALOGUE.map((a) => a.nom);
    expect(new Set(noms).size).toBe(noms.length);
    const cats = new Set(CATEGORIES.map((c) => c.nom));
    for (const a of CATALOGUE) {
      expect(cats.has(a.categorie), a.nom).toBe(true);
      expect(lireOptionsSaisies(a.options ?? "").ok, a.nom).toBe(true);
      expect(a.nom.length).toBeLessThanOrEqual(120);
    }
    expect(CATALOGUE.length).toBeGreaterThan(100);
    expect(CATEGORIES.every((c) => CATALOGUE.some((a) => a.categorie === c.nom))).toBe(true);
  });
  it("les plages d'exemple sont valides", () => {
    for (const p of PLAGES_EXEMPLE) {
      expect(plageSchema.safeParse({
        ...p, jours: p.jours.map(String), fraisService: String(p.fraisService / 100), fraisLivraison: String(p.fraisLivraison / 100),
        fraisExpress: String(p.fraisExpress / 100), majorationPct: String(p.majorationPct), ordre: String(p.ordre), active: true,
      }).success, p.nom).toBe(true);
    }
  });
});
