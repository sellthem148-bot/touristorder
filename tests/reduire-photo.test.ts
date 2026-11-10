import { describe, expect, it } from "vitest";
import { COTE_MAX_PHOTO, dimensionsReduites, poidsLisible } from "@/lib/reduire-photo";
import { TAILLE_MAX_IMAGE } from "@/lib/image";

describe("photo allégée avant l'envoi", () => {
  it("une photo de téléphone est ramenée à 1 600 px, proportions gardées", () => {
    expect(dimensionsReduites(4032, 3024)).toEqual({ largeur: 1600, hauteur: 1200 });
    expect(dimensionsReduites(3024, 4032)).toEqual({ largeur: 1200, hauteur: 1600 });
    expect(dimensionsReduites(8000, 1000)).toEqual({ largeur: 1600, hauteur: 200 });
  });

  it("jamais d'agrandissement", () => {
    expect(dimensionsReduites(800, 600)).toEqual({ largeur: 800, hauteur: 600 });
    expect(dimensionsReduites(COTE_MAX_PHOTO, COTE_MAX_PHOTO)).toEqual({ largeur: COTE_MAX_PHOTO, hauteur: COTE_MAX_PHOTO });
  });

  it("une image très allongée garde au moins 1 px, une image illisible donne 0", () => {
    expect(dimensionsReduites(20000, 3)).toEqual({ largeur: 1600, hauteur: 1 });
    expect(dimensionsReduites(0, 0)).toEqual({ largeur: 0, hauteur: 0 });
    expect(dimensionsReduites(Number.NaN, 100)).toEqual({ largeur: 0, hauteur: 0 });
  });

  it("le poids se lit en clair", () => {
    expect(poidsLisible(3.84 * 1024 * 1024)).toBe("3,8 Mo");
    expect(poidsLisible(240 * 1024)).toBe("240 Ko");
    expect(poidsLisible(10)).toBe("1 Ko");
  });

  it("le poids accepté par le serveur reste sous la limite de Vercel (4,5 Mo par requête)", () => {
    expect(TAILLE_MAX_IMAGE).toBeLessThanOrEqual(4 * 1024 * 1024);
  });
});
