import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { couleurDuRayon, RAYONS_EN_COULEUR } from "@/lib/couleurs-rayons";

// « Un peu plus de couleur, mais sans en abuser » : une teinte douce par rayon, sur la pastille de son icône.
describe("couleurs des rayons", () => {
  it("chaque rayon qui a son icône a sa couleur", () => {
    const icones = readFileSync("components/IconeRayon.tsx", "utf8");
    const adresses = [...icones.matchAll(/^\s+"([a-z-]+)": [A-Z]/gm)].map((m) => m[1]);
    expect(adresses.length).toBeGreaterThan(10);
    for (const adresse of adresses) expect(RAYONS_EN_COULEUR, `le rayon « ${adresse} » a une icône mais pas de couleur`).toContain(adresse);
  });

  it("deux rayons n'ont pas la même teinte (sauf l'ancien et le nouveau nom du poisson)", () => {
    const teintes = RAYONS_EN_COULEUR.filter((a) => a !== "boucherie-poisson").map((a) => couleurDuRayon(a).pastille);
    expect(new Set(teintes).size).toBe(teintes.length);
  });

  it("une teinte reste douce : fond clair, trait foncé de la même famille, jamais un aplat vif", () => {
    for (const adresse of RAYONS_EN_COULEUR) {
      const c = couleurDuRayon(adresse);
      const [, famille] = /^bg-([a-z]+)-100 text-\1-800$/.exec(c.pastille) ?? [];
      expect(famille, `« ${adresse} » : ${c.pastille}`).toBeTruthy();
      expect(c.survol).toBe(`group-hover:bg-${famille}-200 group-active:bg-${famille}-200`);
      expect(c.trait).toBe(`text-${famille}-700`);
    }
  });

  it("un rayon créé par le gérant garde le gris", () => {
    expect(couleurDuRayon("un-rayon-du-gerant").pastille).toBe("bg-slate-100 text-slate-700");
  });
});
