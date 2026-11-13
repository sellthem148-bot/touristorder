// « Remets tout » (demande du gérant, 13 novembre 2026) : les rayons Crèmerie et Boissons retrouvent les articles
// que leurs courtes sélections avaient masqués la veille — le catalogue rangé en sous-rayons se parcourt sans tout
// faire défiler. Une seule fois ; les introuvables sur Wolt, l'alcool et les articles sans prix ne reviennent pas.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ARTICLES_DE_LA_LISTE } from "../prisma/articles-liste";
import { BOISSONS_GARDEES, BOISSONS_REMISES_EN_VENTE } from "../prisma/allegement-boissons";
import { CREMERIE_GARDEE, INTROUVABLES_SUR_WOLT } from "../prisma/allegement-cremerie";
import { VIANDE_ET_VOLAILLE } from "../prisma/retrait-viande";
import {
  CLE_ALLEGEMENT_BOISSONS, CLE_ALLEGEMENT_CREMERIE, CLE_REMISE_EN_VENTE_DES_RAYONS, LOTS_WOLT, RAYONS_RACCOURCIS_LE,
  boissonsARetirer, cremerieARetirer, rayonsARemettre,
} from "../prisma/remplissage";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");

describe("Crèmerie et Boissons remis en vente en entier", () => {
  it("tout ce que les deux sélections courtes avaient masqué revient, sauf les introuvables sur Wolt", () => {
    const { noms, nomsWolt } = rayonsARemettre();
    const cremerie = cremerieARetirer();
    const boissons = boissonsARetirer();
    const introuvables = new Set(INTROUVABLES_SUR_WOLT);
    const attendus = [...new Set([...cremerie.noms, ...boissons.noms])].filter((n) => !introuvables.has(n));
    expect([...noms].sort()).toEqual(attendus.sort());
    expect([...nomsWolt].sort()).toEqual([...new Set([...cremerie.nomsWolt, ...boissons.nomsWolt])].sort());
    expect(new Set(noms).size).toBe(noms.length);
    // Plusieurs centaines d'articles : c'est bien « tout », pas une nouvelle sélection.
    expect(noms.length).toBeGreaterThan(380);
    expect(noms).toContain("Sirop SodaStream Pepsi 44 cl");
  });

  it("« supprime ça » tient toujours : aucun des cinq introuvables sur Wolt ne revient", () => {
    const { noms } = rayonsARemettre();
    expect(noms.filter((n) => INTROUVABLES_SUR_WOLT.includes(n))).toEqual([]);
    // Trois d'entre eux étaient dans la Crèmerie : sans cette exclusion, ils seraient revenus avec le rayon.
    expect(cremerieARetirer().noms.filter((n) => INTROUVABLES_SUR_WOLT.includes(n))).toHaveLength(3);
  });

  it("ni alcool, ni viande, ni médicament : rien de ce que le code n'a jamais mis en vente", () => {
    const { noms, nomsWolt } = rayonsARemettre();
    const jamaisEnVente = [...ARTICLES_DE_LA_LISTE.filter((a) => a.alcool || a.masque), ...LOTS_WOLT.flatMap((l) => l.articles).filter((a) => a.horsLigne)];
    expect(jamaisEnVente.length).toBeGreaterThan(10);
    const nomsInterdits = new Set(jamaisEnVente.map((a) => a.nom));
    expect(noms.filter((n) => nomsInterdits.has(n))).toEqual([]);
    const woltInterdits = new Set(jamaisEnVente.map((a) => ("nomWolt" in a ? a.nomWolt : "") ?? "").filter((n) => n !== ""));
    expect(nomsWolt.filter((n) => woltInterdits.has(n))).toEqual([]);
    for (const alcool of ["Bière Corona 6 × 35,5 cl", "Vin blanc sec Segal 75 cl", "Bière Goldstar 6 × 33 cl", "Vodka Absolut Blue 70 cl"]) expect(noms, alcool).not.toContain(alcool);
    const viande = new Set(VIANDE_ET_VOLAILLE);
    expect(noms.filter((n) => viande.has(n))).toEqual([]);
  });

  it("les articles restés en vente ne sont pas concernés : les deux sélections, Red Bull et Monster", () => {
    const { noms } = rayonsARemettre();
    const enVente = new Set([...CREMERIE_GARDEE, ...BOISSONS_GARDEES, ...BOISSONS_REMISES_EN_VENTE]);
    expect(noms.filter((n) => enVente.has(n))).toEqual([]);
  });

  it("une seule fois, dans la même transaction : seulement un article masqué, qui a un prix, masqué depuis les sélections", () => {
    const source = lire("prisma/remplissage.ts");
    const debut = source.indexOf("export async function remettreEnVenteLesRayons");
    expect(debut).toBeGreaterThan(0);
    const corps = source.slice(debut, source.indexOf("\n}\n", debut));
    for (const morceau of [
      "operationFaite(prisma, CLE_REMISE_EN_VENTE_DES_RAYONS)", "noterOperation(prisma, CLE_REMISE_EN_VENTE_DES_RAYONS)", "$transaction",
      "rayonsARemettre()", "actif: false", "prix: { gt: 0 }", "updatedAt: { gte: RAYONS_RACCOURCIS_LE }", "nom: { notIn: INTROUVABLES_SUR_WOLT }", "data: { actif: true }",
    ]) expect(corps, morceau).toContain(morceau);
    // Rien n'est supprimé, aucun prix n'est touché.
    expect(corps).not.toMatch(/delete|prix: \d|prixAchat|prixIndicatif/);
    // Une clé à elle : les deux sélections restent notées comme faites, elles ne se rejouent pas par-dessus.
    expect(new Set([CLE_REMISE_EN_VENTE_DES_RAYONS, CLE_ALLEGEMENT_CREMERIE, CLE_ALLEGEMENT_BOISSONS]).size).toBe(3);
  });

  it("un article que le gérant avait masqué lui-même avant les sélections ne revient pas", () => {
    // Les deux sélections ont été mises en ligne le 12 novembre 2026 à 15 h 55 et 16 h 43 (UTC) : le repère est juste avant.
    expect(RAYONS_RACCOURCIS_LE.getTime()).toBeLessThan(Date.parse("2026-11-12T15:55:00Z"));
    expect(RAYONS_RACCOURCIS_LE.getTime()).toBeGreaterThan(Date.parse("2026-11-12T00:00:00Z"));
  });

  it("la mise en ligne l'applique après les deux sélections et après Red Bull et Monster", () => {
    const preparer = lire("prisma/preparer.ts");
    const ordre = ["allegerLaCremerie(prisma)", "allegerLesBoissons(prisma)", "remettreEnVenteRedBullEtMonster(prisma)", "remettreEnVenteLesRayons(prisma)"].map((appel) => preparer.indexOf(`await ${appel}`));
    expect(ordre.every((position) => position > 0)).toBe(true);
    expect([...ordre].sort((a, b) => a - b)).toEqual(ordre);
    // La base d'essai suit la même suite d'opérations que la production.
    const base = lire("tests/outils/base-complete.ts");
    expect(base.indexOf("r.remettreEnVenteLesRayons")).toBeGreaterThan(base.indexOf("r.remettreEnVenteRedBullEtMonster"));
  });
});
