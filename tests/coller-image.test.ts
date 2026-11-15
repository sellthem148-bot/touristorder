// « Photos rapides » : coller sur un article l'image qu'on vient de copier (demande du gérant, 15 novembre 2026).
// Ce qui se décide sans navigateur : une vignette est refusée, une petite image est signalée, l'image écrite
// dans un morceau de page copié est lue, et rien n'est jamais téléchargé depuis un autre site.
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { COTE_CONSEILLE, COTE_REFUSE, TYPES_ACCEPTES, avisDeTaille, fichierDepuisDonnees, imageDansLeHtml } from "@/lib/coller-image";
import { abonner, derniereImageCollee, ligneVisee, noterImageCollee, viser } from "../app/admin/(protege)/produits/photos/cible";

const lire = (fichier: string) => readFileSync(path.join(__dirname, "..", fichier), "utf8");
// Un PNG d'un pixel.
const PIXEL = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

describe("coller une image : sa taille", () => {
  it("une vignette de liste de résultats est refusée, avec ce qu'il faut faire", () => {
    const avis = avisDeTaille(150, 150);
    expect(avis?.refus).toBe(true);
    expect(avis?.message).toMatch(/150 px/);
    expect(avis?.message).toMatch(/en grand/);
    expect(avisDeTaille(COTE_REFUSE - 1, 40)?.refus).toBe(true);
  });

  it("une petite image passe, mais on dit qu'elle sera floue", () => {
    const avis = avisDeTaille(240, 300);
    expect(avis?.refus).toBe(false);
    expect(avis?.message).toMatch(/Photo enregistrée/);
    expect(avis?.message).toMatch(/300 px/);
    expect(avisDeTaille(COTE_REFUSE, 10)?.refus).toBe(false);
  });

  it("c'est le plus grand côté qui compte ; une image assez grande ne dit rien", () => {
    expect(avisDeTaille(COTE_CONSEILLE, 120)).toBeNull();
    expect(avisDeTaille(120, 1200)).toBeNull();
    expect(avisDeTaille(1600, 1600)).toBeNull();
  });

  it("une image illisible est refusée", () => {
    expect(avisDeTaille(0, 0)?.refus).toBe(true);
    expect(avisDeTaille(Number.NaN, 100)?.refus).toBe(true);
  });
});

describe("coller une image : ce que le presse-papiers contient", () => {
  it("l'image écrite dans un morceau de page copié est lue", () => {
    const html = `<meta charset="utf-8"><img alt="lait" class="x" src="data:image/png;base64,${PIXEL}" width="225">`;
    const donnees = imageDansLeHtml(html);
    expect(donnees).toBe(`data:image/png;base64,${PIXEL}`);
    const fichier = fichierDepuisDonnees(donnees!);
    expect(fichier?.type).toBe("image/png");
    expect(fichier?.size).toBeGreaterThan(60);
    expect(TYPES_ACCEPTES.test(fichier!.type)).toBe(true);
    // Guillemets simples, retours à la ligne dans les données : pareil.
    expect(imageDansLeHtml(`<IMG SRC='data:image/jpeg;base64,${PIXEL.slice(0, 20)}\n${PIXEL.slice(20)}'>`)).toBe(`data:image/jpeg;base64,${PIXEL}`);
  });

  it("une image donnée par son adresse n'est pas lue : on ne va rien chercher ailleurs", () => {
    expect(imageDansLeHtml('<img src="https://exemple.test/lait.jpg">')).toBeNull();
    expect(imageDansLeHtml("<p>du texte</p>")).toBeNull();
    expect(imageDansLeHtml("")).toBeNull();
    expect(fichierDepuisDonnees("https://exemple.test/lait.jpg")).toBeNull();
    expect(fichierDepuisDonnees("data:text/html;base64,PGI+")).toBeNull();
    expect(fichierDepuisDonnees("data:image/png;base64,***")).toBeNull();
    // Aucun téléchargement dans ce module, ni dans la ligne d'article : seulement le presse-papiers du navigateur.
    for (const fichier of ["lib/coller-image.ts", "app/admin/(protege)/produits/photos/LignePhoto.tsx"]) {
      expect(lire(fichier), fichier).not.toMatch(/\bfetch\(|XMLHttpRequest|crossOrigin/);
    }
  });

  it("l'image collée passe par les mêmes contrôles que les autres : allégée, puis revérifiée par le serveur", () => {
    const ligne = lire("app/admin/(protege)/produits/photos/LignePhoto.tsx");
    expect(ligne).toContain("await reduirePhoto(fichier)");
    expect(ligne).toContain("enregistrerPhotoRapide(form)");
    const action = lire("app/admin/(protege)/actions.ts");
    const corps = action.slice(action.indexOf("export async function enregistrerPhotoRapide"));
    expect(corps.slice(0, 200)).toContain("await exigerAdmin()");
    // Un type que le serveur refuse (TIFF, GIF…) est converti en JPEG même s'il est petit.
    expect(lire("lib/reduire-photo.ts")).toMatch(/const dejaPetite = accepte && /);
  });
});

describe("coller une image : la ligne qui la reçoit", () => {
  it("une seule ligne attend l'image ; les lignes sont prévenues quand elle change", () => {
    let appels = 0;
    const arreter = abonner(() => { appels++; });
    viser("a");
    expect(ligneVisee()).toBe("a");
    viser("a"); // la même : personne n'est dérangé
    expect(appels).toBe(1);
    viser("b");
    expect(ligneVisee()).toBe("b");
    viser(null);
    expect(ligneVisee()).toBeNull();
    expect(appels).toBe(3);
    arreter();
    viser("c");
    expect(appels).toBe(3);
    viser(null);
  });

  it("la dernière image collée est retenue : la recoller sur un autre article est signalé", () => {
    noterImageCollee("abc", "article-1");
    expect(derniereImageCollee()).toEqual({ empreinte: "abc", id: "article-1" });
    const ligne = lire("app/admin/(protege)/produits/photos/LignePhoto.tsx");
    expect(ligne).toContain("derniere.empreinte === empreinte && derniere.id !== id");
    expect(ligne).toContain("C'est la même image que pour l'article précédent");
  });
});
