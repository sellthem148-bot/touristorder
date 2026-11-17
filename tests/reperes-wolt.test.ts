// Les photos repère du gérant (photos de Wolt, tirées de ses captures) : privées, jamais côté client.
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { DOSSIER_DES_REPERES, NOMBRE_DE_PHOTOS_REPERE, PHOTOS_REPERE, estPhotoRepere, photoRepere } from "@/lib/reperes-wolt";
import { repereWolt } from "@/lib/repere-wolt";
import { LOTS_WOLT } from "../prisma/remplissage";
import { RELEVE_DU_12_NOVEMBRE, RELEVE_DU_POISSON_SURGELE, REMPLACEMENTS_DU_12_NOVEMBRE } from "../prisma/releve-wolt-1112";
import { RELEVE_DES_BOISSONS } from "../prisma/articles-wolt-captures-boissons";
import { RELEVE_DES_CANETTES, RELEVE_DES_CHOCOLATS, RELEVE_DU_15_NOVEMBRE } from "../prisma/releve-wolt-1115";

const fichiersDe = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiersDe(path.join(dossier, e.name)) : [path.join(dossier, e.name)]));

describe("photos repère", () => {
  it("chaque photo de la liste existe, est un petit JPEG, et rien d'autre ne traîne dans le dossier", () => {
    for (const p of PHOTOS_REPERE) {
      const fichier = path.join(DOSSIER_DES_REPERES, p.fichier);
      expect(existsSync(fichier), p.fichier).toBe(true);
      expect(statSync(fichier).size, p.fichier).toBeLessThan(40_000);
      expect(readFileSync(fichier).subarray(0, 3).toString("hex"), p.fichier).toBe("ffd8ff");
      expect(p.fichier).toMatch(/^[a-z0-9-]+\.jpg$/);
    }
    expect(readdirSync(DOSSIER_DES_REPERES).sort()).toEqual(PHOTOS_REPERE.map((p) => p.fichier).sort());
    expect(new Set(PHOTOS_REPERE.map((p) => p.fichier)).size).toBe(PHOTOS_REPERE.length);
    expect(new Set(PHOTOS_REPERE.map((p) => p.nomWolt)).size).toBe(PHOTOS_REPERE.length);
  });

  it("chaque photo est celle d'un article du site, avec son nom exact sur Wolt", () => {
    const connus = new Map<string, string>();
    for (const a of [...LOTS_WOLT.flatMap((l) => l.articles), ...RELEVE_DU_12_NOVEMBRE, ...RELEVE_DU_POISSON_SURGELE, ...RELEVE_DES_BOISSONS, ...RELEVE_DU_15_NOVEMBRE, ...RELEVE_DES_CHOCOLATS, ...RELEVE_DES_CANETTES, ...REMPLACEMENTS_DU_12_NOVEMBRE]) connus.set(a.nom, a.nomWolt);
    for (const p of PHOTOS_REPERE) expect(connus.get(p.nom), p.nom).toBe(p.nomWolt);
  });

  it("Dynamica (capture du 13 novembre) : la photo de chaque article que la page montrait — 27 sur 30", () => {
    const dynamica = LOTS_WOLT.find((l) => l.nom === "Dynamica")!.articles;
    expect(dynamica).toHaveLength(30);
    const sansPhoto = dynamica.filter((a) => photoRepere(a.nom, a.nomWolt) == null).map((a) => a.nom);
    // Trois articles n'étaient plus sur la page « Les plus commandés » ce jour-là.
    expect(sansPhoto.sort()).toEqual(["Coque MagSafe transparente Dualtek iPhone 17 Pro Max", "Verre trempé OtterBox iPhone 17/18 Pro Max", "Verre trempé anti-regards PG Glass iPhone 17 Pro"]);
    expect(photoRepere("Chargeur Apple 20 W USB-C", "Apple | 20W | USB-C")).toBe("/admin/repere/chargeur-apple-20-w-usb-c.jpg");
    // Les deux articles ajoutés d'après cette capture ont la leur.
    for (const a of LOTS_WOLT.find((l) => l.nom === "Dynamica, capture du 13 novembre")!.articles) expect(photoRepere(a.nom, a.nomWolt), a.nom).not.toBeNull();
  });

  it("captures de Wolt Market du 15 novembre : 110 photos, 12 du rayon chocolat et biscuits, 11 du rayon boissons — 718 en tout", () => {
    expect(PHOTOS_REPERE).toHaveLength(718);
    expect(photoRepere("Ferrero Rocher praliné × 16", "")).toBe("/admin/repere/ferrero-rocher-praline-16.jpg");
    // Les premiers relevés de Wolt Market (10 et 11 novembre) n'avaient aucune photo : la plupart en ont une maintenant.
    const premiers = LOTS_WOLT.filter((l) => l.nom === "Wolt Market" || l.nom === "Wolt Market, fiches du 11 novembre").flatMap((l) => l.articles);
    const avec = premiers.filter((a) => photoRepere(a.nom, a.nomWolt) != null).length;
    expect(avec).toBeGreaterThanOrEqual(160);
    expect(photoRepere("Ketchup Heinz classique 700 g", "")).toBe("/admin/repere/ketchup-heinz-classique-700-g.jpg");
  });

  it("un article est reconnu à son nom sur Wolt (même renommé), sinon à son nom ; un autre n'a pas de photo", () => {
    const lait = PHOTOS_REPERE.find((p) => p.nom === "Lait Tnuva 3 % 1 L")!;
    expect(photoRepere("Mon lait préféré", lait.nomWolt)).toBe(`/admin/repere/${lait.fichier}`);
    expect(photoRepere("Lait Tnuva 3 % 1 L", "")).toBe(`/admin/repere/${lait.fichier}`);
    expect(photoRepere("Parasol géant du gérant", null)).toBeNull();
    expect(repereWolt("Lait Tnuva 3 % 1 L", lait.nomWolt).photo).toBe(`/admin/repere/${lait.fichier}`);
    expect(repereWolt("Parasol géant du gérant", "").photo).toBeNull();
  });

  it("la route ne sert que les fichiers de la liste, et seulement au gérant", () => {
    expect(estPhotoRepere(PHOTOS_REPERE[0].fichier)).toBe(true);
    for (const mechant of ["../../.env", "..%2F.env", "autre.jpg", "", "lait.jpg/../../x"]) expect(estPhotoRepere(mechant), mechant).toBe(false);
    const route = readFileSync("app/admin/(protege)/repere/[fichier]/route.ts", "utf8");
    expect(route.indexOf("await exigerAdmin()")).toBeGreaterThan(-1);
    expect(route.indexOf("await exigerAdmin()")).toBeLessThan(route.indexOf("readFile("));
    expect(route.indexOf("estPhotoRepere(fichier)")).toBeLessThan(route.indexOf("readFile("));
    expect(route).toContain("private");
  });

  it("le gérant les voit partout dans son espace : liste des produits, fiche, Photos rapides, listes de courses", () => {
    // « Je veux toutes les photos de Wolt, comme ça je sais ce que je cherche » (15 novembre 2026).
    const lire = (f: string) => readFileSync(f, "utf8");
    const liste = lire("app/admin/(protege)/produits/page.tsx");
    expect(liste).toContain("photoRepere(p.nom, p.nomWolt)");
    expect(liste).toContain('<PhotoWolt photo={photoRepere(p.nom, p.nomWolt)!} nom={p.nom} taille="liste" />');
    const fiche = lire("app/admin/(protege)/produits/[id]/page.tsx");
    expect(fiche).toContain("repereWolt(p.nom, p.nomWolt)");
    expect(fiche).toContain('<PhotoWolt photo={repere.photo} nom={p.nom} taille="grande" />');
    expect(fiche).toContain("le client ne la voit pas");
    expect(lire("app/admin/(protege)/produits/photos/LignePhoto.tsx")).toContain("<PhotoWolt photo={photoWolt} nom={nom} />");
    // Ma journée, la commande et Prix rapides passent par la même ligne de repère.
    expect(lire("components/admin/RepereWolt.tsx")).toContain("<PhotoWolt photo={photo} nom={nom} />");
    // Une seule façon de la montrer : en grand, recadrée sur l'article dans une liste, avec l'étiquette « Wolt ».
    const photo = lire("components/admin/PhotoWolt.tsx");
    expect(photo).toMatch(/ligne: "h-\[84px\] w-28 sm:h-\[108px\] sm:w-36"/);
    expect(photo).toContain(">Wolt</span>");
    expect(photo).not.toContain('"use client"');
  });

  it("« /admin/repere/etat » dit de l'extérieur si les photos sont sur le serveur : un nombre, jamais un nom ni une photo", () => {
    const route = readFileSync("app/admin/(protege)/repere/[fichier]/route.ts", "utf8");
    // Seule cette adresse répond sans connexion ; toute photo passe toujours par exigerAdmin().
    expect(route).toContain('if (fichier === "etat") return Response.json(await etatDesPhotos()');
    expect(route.indexOf('if (fichier === "etat")')).toBeLessThan(route.indexOf("await exigerAdmin()"));
    expect(route.indexOf("await exigerAdmin()")).toBeLessThan(route.indexOf("readFile("));
    expect(estPhotoRepere("etat")).toBe(false);
    const etat = route.slice(route.indexOf("async function etatDesPhotos"));
    expect(etat).toContain("presentes: fichiers.filter(estPhotoRepere).length");
    expect(etat).not.toMatch(/readFile|fichiers\s*[,}]|nom\b/);
    expect(NOMBRE_DE_PHOTOS_REPERE).toBe(new Set(PHOTOS_REPERE.map((p) => p.fichier)).size);
  });

  it("sur le site, la photo de Wolt n'arrive sur une page de la boutique que par lib/vue-gerant.ts : au gérant connecté, ou à tous s'il a coché le réglage", () => {
    // 17 novembre 2026, deux décisions du gérant : « grâce à ces images de Wolt je peux chercher les images qui
    // correspondent à chaque produit — alors mets-moi les images » (il les voit connecté à son espace), puis « le
    // site a 0 client, on est 2 à bosser dessus : active-moi les photos pour tout le monde » (un réglage, coché).
    const lire = (f: string) => readFileSync(f, "utf8");
    const vue = lire("lib/vue-gerant.ts");
    expect(vue).toContain('import "server-only"');
    // Le réglage : lu dans la base, faux tant qu'il n'est pas coché.
    expect(vue).toContain("select: { photosWoltPourTous: true }");
    expect(vue).toContain("pourTous: r?.photosWoltPourTous === true");
    expect(lire("prisma/schema.prisma")).toMatch(/photosWoltPourTous Boolean @default\(false\)/);
    // Qui regarde : un visiteur ne voit les photos que si le réglage est coché, et jamais les repères du gérant.
    const qui = vue.slice(vue.indexOf("export const vueDuGerant"), vue.indexOf("export type Repere"));
    expect(qui).toContain("if (!(await estAdmin())) return { gerant: false, pourTous, photosDeWolt: pourTous, etiquettes: false };");
    expect(qui).toContain("return { gerant: true, pourTous, photosDeWolt: pourTous || !commeUnClient, etiquettes: !commeUnClient };");
    // Les photos : la question est posée AVANT de relire la base ou de chercher une photo.
    const reperes = vue.slice(vue.indexOf("export async function reperesPour"));
    const garde = reperes.indexOf("if (!vue.photosDeWolt) return reperes;");
    expect(garde).toBeGreaterThan(-1);
    expect(garde).toBeLessThan(reperes.indexOf("prisma.produit.findMany"));
    expect(garde).toBeLessThan(reperes.indexOf("photoRepere("));
    expect(reperes).toContain("reperes.set(p.id, { photo, etiquette: vue.etiquettes });");
    // Le catalogue ne connaît que cette porte : sans elle `repere` vaut null, et le nom sur Wolt reste hors de ce qu'une page reçoit.
    const catalogue = lire("lib/catalogue.ts");
    expect(catalogue).toContain("const reperes = await reperesPour(liste);");
    expect(catalogue).toContain("function versPublic(p: Brut, langue: Langue = \"fr\", repere: Repere | null = null): ProduitPublic {");
    expect(catalogue.match(/versPublic\(/g)).toHaveLength(2); // sa définition, et `versPublics` : aucun lecteur ne la contourne
    expect(catalogue.slice(catalogue.indexOf("export const PRODUIT_PUBLIC"), catalogue.indexOf("satisfies Prisma.ProduitSelect"))).not.toMatch(/nomWolt|prixAchat|boutique|lienWolt|prixIndicatif/);
    // La carte et la fiche ne la montrent que si le serveur l'a donnée ; l'étiquette « Wolt » et le lien vers
    // « Photos rapides » n'existent que pour le gérant : le site ne nomme jamais Wolt devant un client.
    expect(lire("components/CarteProduit.tsx")).toContain("<ApercuSurCarte repere={produit.repere} epuise={produit.epuise} />");
    expect(lire("components/FicheProduit.tsx")).toContain("<ApercuSurFiche repere={produit.repere} id={produit.id} nom={produit.nom} />");
    const apercu = lire("components/admin/ApercuGerant.tsx");
    expect(apercu.match(/\{repere\.etiquette && \(/g)).toHaveLength(2);
    for (const reserve of [">Wolt</span>", "Photo de Wolt, en attendant la tienne.", "href={`/admin/produits/photos#p-${id}`}"]) {
      const avant = apercu.slice(0, apercu.indexOf(reserve));
      expect(avant.lastIndexOf("{repere.etiquette && ("), reserve).toBeGreaterThan(avant.lastIndexOf("export function"));
    }
    // Le bandeau : rien pour un client ; au gérant, il dit qui voit ces photos, et mène aux réglages.
    const bandeau = lire("components/admin/VueDuGerant.tsx");
    expect(bandeau).toContain("if (!vue.gerant) return null;");
    expect(bandeau).toContain("Tes clients voient l'icône du rayon, jamais ces photos.");
    expect(bandeau).toContain("Les articles sans photo montrent celle de Wolt à tout le monde.");
    expect(bandeau).toContain('href="/admin/reglages"');
    expect(lire("app/(boutique)/layout.tsx")).toContain("<BandeauDuGerant />");
    // « Voir comme un client » n'est qu'un choix d'affichage du gérant : l'action exige sa connexion.
    const actions = lire("app/admin/(protege)/actions.ts");
    const action = actions.slice(actions.indexOf("export async function changerLaVueDuSite"));
    expect(action.indexOf("await exigerAdmin()")).toBeGreaterThan(-1);
    expect(action.indexOf("await exigerAdmin()")).toBeLessThan(action.indexOf("cookies()"));
  });

  it("« Photos de Wolt pour tout le monde » : un réglage du gérant, coché une seule fois à sa demande — c'est lui qui le décoche", () => {
    const lire = (f: string) => readFileSync(f, "utf8");
    // La case est dans ses réglages, avec ce qu'elle fait et ce qu'il faut savoir avant d'ouvrir le site aux clients.
    const page = lire("app/admin/(protege)/reglages/page.tsx");
    expect(page).toContain('name="photosWoltPourTous" defaultChecked={r.photosWoltPourTous}');
    expect(page).toContain("Ces photos sont celles de Wolt et des marques : décoche avant d&apos;ouvrir le site aux clients");
    expect(lire("lib/admin-schemas.ts")).toContain("photosWoltPourTous: z.boolean(),");
    const actions = lire("app/admin/(protege)/actions.ts");
    expect(actions).toContain('photosWoltPourTous: form.get("photosWoltPourTous") === "on",');
    expect(actions).toContain("oublierLeReglageDesPhotos();");
    // Cochée par la mise en ligne, une seule fois (sa demande du 17 novembre) : décochée ensuite, elle le reste.
    const remplissage = lire("prisma/remplissage.ts");
    const operation = remplissage.slice(remplissage.indexOf("export async function montrerLesPhotosDeWoltATous"));
    expect(operation.slice(0, operation.indexOf("\n}\n"))).toContain("noterOperation(prisma, CLE_PHOTOS_DE_WOLT_POUR_TOUS)");
    expect(operation.indexOf("if (faite) return")).toBeLessThan(operation.indexOf("photosWoltPourTous: true"));
    expect(lire("prisma/preparer.ts")).toContain("dire(await montrerLesPhotosDeWoltATous(prisma));");
    // La route : au gérant seul tant que la case n'est pas cochée ; à tous ensuite, dix minutes de garde au plus.
    const route = lire("app/admin/(protege)/repere/[fichier]/route.ts");
    const servir = route.slice(route.indexOf("const pourTous = await photosDeWoltPourTous();"));
    expect(servir).toMatch(/if \(!pourTous\) \{\s+if \(!\(await estAdmin\(\)\)\) compteurs\.refusees\+\+;\s+await exigerAdmin\(\);\s+\}/);
    expect(servir).toContain('pourTous ? "public, max-age=600, s-maxage=600" : "private, max-age=86400"');
    expect(servir).toContain('"X-Robots-Tag": "noindex"');
    // Les moteurs de recherche n'y vont pas : « /admin » reste fermé.
    expect(lire("app/robots.ts")).toContain('disallow: ["/admin"');
    // Ce réglage ne fait pas partie de ce que le navigateur d'un client reçoit des réglages.
    const publics = lire("lib/reglages.ts");
    expect(publics.slice(publics.indexOf("export async function reglagesPublics"), publics.indexOf("export type ReglagesPublics"))).not.toContain("photosWoltPourTous");
  });

  it("ces photos appartiennent à Wolt et aux marques : aucune dans public/, et les pages de la boutique ne les connaissent que par lib/vue-gerant.ts", () => {
    const publics = new Set(fichiersDe("public").map((f) => path.basename(f)));
    for (const p of PHOTOS_REPERE) expect(publics.has(p.fichier), p.fichier).toBe(false);
    const cotéClient = [...fichiersDe("app/(boutique)"), ...fichiersDe("components").filter((f) => !f.includes(`${path.sep}admin${path.sep}`)), "lib/catalogue.ts"];
    for (const f of cotéClient.filter((f) => /\.(ts|tsx)$/.test(f))) {
      const source = readFileSync(f, "utf8");
      expect(/reperes-wolt|repere-wolt|admin\/repere|PhotoWolt/.test(source), f).toBe(false);
    }
    // Le dossier part bien avec la route qui les sert (sinon elles manquent en production).
    expect(readFileSync("next.config.ts", "utf8")).toContain("./prive/reperes-wolt/*.jpg");
  });
});
