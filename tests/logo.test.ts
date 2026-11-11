import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SIGLE } from "@/lib/sigle";

// Les fichiers du logo (public/logo) et le sigle du site sont le même dessin :
// si l'un change sans l'autre, le logo de l'onglet et celui des fichiers ne se ressemblent plus.
const DOSSIER = join(process.cwd(), "public", "logo");
const lire = (nom: string) => readFileSync(join(DOSSIER, nom), "utf8");
const cercle = `<circle cx="${SIGLE.o.cx}" cy="${SIGLE.o.cy}" r="${SIGLE.o.r}" fill="${SIGLE.soleil}"/>`;

describe("fichiers du logo", () => {
  const vectoriels = readdirSync(DOSSIER).filter((f) => f.endsWith(".svg"));

  it("existent en vectoriel et en image", () => {
    expect(vectoriels.sort()).toEqual([
      "tourist-order-logo-clair.svg",
      "tourist-order-logo-empile.svg",
      "tourist-order-logo.svg",
      "tourist-order-profil.svg",
      "tourist-order-sigle-clair.svg",
      "tourist-order-sigle.svg",
    ]);
    for (const image of ["tourist-order-logo.png", "tourist-order-logo-clair.png", "tourist-order-logo-empile.png", "tourist-order-profil.png", "tourist-order-sigle.png", "tourist-order-sigle-clair.png"]) {
      // Signature d'un fichier PNG.
      expect(readFileSync(join(DOSSIER, image)).subarray(1, 4).toString("latin1"), image).toBe("PNG");
    }
  });

  it.each(vectoriels)("%s porte le tracé du sigle du site", (nom) => {
    const svg = lire(nom);
    expect(svg).toContain(`d="${SIGLE.t}"`);
    expect(svg).toContain(cercle);
  });

  it("le sigle seul est la tuile du site, sur fond encre puis sur fond blanc", () => {
    const tuile = (fond: string, lettre: string) =>
      `<rect width="${SIGLE.cote}" height="${SIGLE.cote}" rx="${SIGLE.rayon}" fill="${fond}"/><path d="${SIGLE.t}" fill="${lettre}"/>${cercle}`;
    expect(lire("tourist-order-sigle.svg")).toContain(tuile(SIGLE.encre, SIGLE.blanc));
    expect(lire("tourist-order-sigle-clair.svg")).toContain(tuile(SIGLE.blanc, SIGLE.encre));
  });

  it("le nom est tracé en courbes : aucun fichier ne dépend d'une police ni d'une adresse extérieure", () => {
    for (const nom of vectoriels) {
      const svg = lire(nom);
      expect(svg, nom).not.toMatch(/<text|font-family|<image|href=|<script/);
    }
  });
});
