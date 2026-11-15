import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { couleurDuRayon, RAYONS_EN_COULEUR } from "@/lib/couleurs-rayons";
import { FOND_DE_LA_BOUTIQUE } from "@/lib/fond";

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
      // Le trait de l'icône : foncé sur une surface claire, clair sur le fond sombre de la boutique.
      expect(c.trait).toBe(`text-${famille}-700 nuit:text-${famille}-300`);
      // Le bandeau (tête de la page du rayon, fiche sans photo) est le ton le plus clair ; le repère, un trait franc.
      expect(c.bandeau).toBe(`border-${famille}-200 bg-${famille}-50`);
      expect(c.repere).toBe(`bg-${famille}-400`);
    }
  });

  it("un rayon créé par le gérant garde le gris", () => {
    expect(couleurDuRayon("un-rayon-du-gerant").pastille).toBe("bg-slate-100 text-slate-700");
    expect(couleurDuRayon("un-rayon-du-gerant").bandeau).toBe("border-slate-200 bg-white");
  });
});

// « Un fond de couleur différent : ça fait trop brut », puis « Wolt a mis un fond noir pour faire ressortir les
// produits » — le fond de la boutique se choisit dans lib/fond.ts, sans toucher à l'espace gérant.
describe("fond de la boutique", () => {
  const css = readFileSync("app/globals.css", "utf8");
  it("le fond choisi est l'un des deux que la feuille de style connaît", () => {
    expect(["nuit", "ivoire"]).toContain(FOND_DE_LA_BOUTIQUE);
    expect(css).toMatch(/html:has\(\[data-fond="ivoire"\]\) \{\s*--color-fond: #faf5ec;/);
    expect(css).toMatch(/@media screen \{\s*html:has\(\[data-fond="nuit"\]\) \{\s*--color-fond: #0d1321;/);
  });
  it("le cadre de la boutique porte ce choix, et l'espace gérant garde le gris de départ", () => {
    expect(readFileSync("app/(boutique)/layout.tsx", "utf8")).toContain("data-fond={FOND_DE_LA_BOUTIQUE}");
    expect(css).toMatch(/--color-fond: #f7f7f6;/);
    expect(readFileSync("app/admin/(protege)/layout.tsx", "utf8")).not.toContain("data-fond");
  });
  it("la variante « nuit » ne s'applique jamais dans une surface claire (pas de blanc sur blanc)", () => {
    const variante = css.slice(css.indexOf("@custom-variant nuit"), css.indexOf("@custom-variant nuit") + 400);
    for (const surface of [".bg-white", ".carte", "article", "dialog", ".clair"]) expect(variante).toContain(`${surface} *`);
    expect(variante).toContain("@media screen");
  });
  it("ce qui s'assombrit soi-même n'écrit pas son blanc « bg-white » (la variante l'ignorerait)", () => {
    for (const fichier of ["components/CadreEnTete.tsx", "components/LienPanier.tsx", "app/(boutique)/layout.tsx"]) {
      const code = readFileSync(fichier, "utf8");
      for (const m of code.matchAll(/className="([^"]*nuit:bg-encre[^"]*)"/g)) expect(m[1].split(" "), fichier).not.toContain("bg-white");
    }
  });
});
