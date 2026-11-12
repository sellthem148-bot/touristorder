import { describe, expect, it } from "vitest";
import { ARTICLES_MIS_EN_VENTE } from "../prisma/articles-liste";
import { repereWolt } from "@/lib/repere-wolt";

const HEBREU = /[֐-׿]/;

describe("repère Wolt : retrouver sur Wolt un article qu'on ne connaît pas", () => {
  it("le nom relevé sur Wolt passe avant tout : il est exact, et c'est lui qu'on cherche en images", () => {
    const r = repereWolt("Lait Tnuva 3 % 1 L", " חלב תנובה 3% 1 ליטר ");
    expect(r).toEqual({ hebreu: "חלב תנובה 3% 1 ליטר", exact: true, images: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent("חלב תנובה 3% 1 ליטר")}` });
  });

  it("sans nom relevé : la traduction en hébreu du nom français, signalée comme telle", () => {
    const r = repereWolt("Bamba Osem classique 80 g", "");
    expect(r.exact).toBe(false);
    expect(r.hebreu).toMatch(HEBREU);
    expect(r.images).toContain(encodeURIComponent(r.hebreu));
  });

  it("un article que le gérant a créé ou renommé : pas d'hébreu inventé, la recherche d'images se fait sur son nom", () => {
    const r = repereWolt("Parasol géant du gérant", null);
    expect(r).toEqual({ hebreu: "", exact: false, images: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent("Parasol géant du gérant")}` });
  });

  it("chaque article de la liste du gérant mis en vente a son nom en hébreu : c'est pour eux que le repère existe", () => {
    const sans = ARTICLES_MIS_EN_VENTE.filter((a) => !HEBREU.test(repereWolt(a.nom, "").hebreu)).map((a) => a.nom);
    expect(sans).toEqual([]);
  });
});
