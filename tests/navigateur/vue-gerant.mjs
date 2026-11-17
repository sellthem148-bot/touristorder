// La vue du gérant sur son site (17 novembre 2026 : « grâce à ces images de Wolt je peux chercher les images qui
// correspondent à chaque produit — alors mets-moi les images »). Connecté à son espace, il voit la photo de Wolt
// sur les articles qui n'ont pas encore la leur ; un client, lui, ne reçoit ni ces photos ni leur adresse.
// À lancer sur le catalogue ENTIER (« npx tsx tests/outils/base-complete.ts »). Ne modifie rien dans la base.
// Sur le vrai site : SANS_GERANT=1 — seule la partie « client » est vérifiée (on ne s'y connecte pas).
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const SANS_GERANT = process.env.SANS_GERANT === "1";
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
const TELEPHONE = { ...devices["iPhone 13"], locale: "fr-FR" };
const ORDINATEUR = { viewport: { width: 1280, height: 900 }, locale: "fr-FR" };
// Ce qu'une page de la boutique ne doit jamais porter pour un client.
const TRACES = /admin\/repere|data-repere-gerant|data-vue-gerant|Vue du gérant/;
// Les photos de Wolt visibles à l'écran sont bien arrivées (une photo refusée par le serveur resterait vide).
const chargees = async (p, selecteur) => {
  await p.waitForFunction((s) => [...document.querySelectorAll(s)].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).every((i) => i.complete), selecteur, { timeout: 30000 });
  return p.evaluate((s) => { const vues = [...document.querySelectorAll(s)].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }); return { vues: vues.length, vides: vues.filter((i) => i.naturalWidth === 0).length }; }, selecteur);
};
const compter = (p) => p.evaluate(() => ({
  wolt: document.querySelectorAll("main article [data-repere-gerant=carte]").length,
  icones: document.querySelectorAll("main article [data-sans-photo]").length,
  cartes: document.querySelectorAll("main article").length,
  bandeau: document.querySelector("[data-vue-gerant]")?.getAttribute("data-vue-gerant") ?? null,
}));

const navigateur = await chromium.launch();
const PAGES = ["/", "/categorie/cremerie-oeufs", "/recherche?q=lait", "/he", "/he/categorie/boissons"];

try {
  // ── 1. Un client : aucune photo de Wolt, aucune adresse de photo, pas de bandeau ──────────────────────────
  for (const chemin of PAGES) {
    const html = await (await fetch(BASE + chemin, { headers: { "Accept-Language": chemin.startsWith("/he") ? "he" : "fr" } })).text();
    verifier(html.length > 5000 && !TRACES.test(html), `client · ${chemin} : la page envoyée ne porte aucune trace des photos de Wolt (${Math.round(html.length / 1024)} Ko lus)`);
  }
  {
    const ctx = await navigateur.newContext(TELEPHONE);
    const p = await ctx.newPage();
    p.on("pageerror", (e) => erreurs.push(String(e)));
    const demandes = [];
    p.on("request", (r) => { if (r.url().includes("/admin/")) demandes.push(r.url()); });
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    const accueil = await compter(p);
    verifier(accueil.cartes >= 20 && accueil.wolt === 0 && accueil.icones >= 10 && accueil.bandeau === null, `client · accueil : ${accueil.cartes} cartes, ${accueil.icones} avec l'icône du rayon, aucune photo de Wolt, pas de bandeau`);
    await p.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
    const rayon = await compter(p);
    verifier(rayon.cartes >= 20 && rayon.wolt === 0 && rayon.bandeau === null, `client · Crèmerie : ${rayon.cartes} cartes, aucune photo de Wolt`);
    // La fiche d'un article sans photo : le bandeau à la couleur du rayon, comme avant.
    await p.locator("main article:has([data-sans-photo]) h3 button").first().click();
    await p.locator("dialog[open]").waitFor();
    verifier((await p.locator("dialog[open] [data-repere-gerant]").count()) === 0 && (await p.locator("dialog[open] img").count()) === 0, "client · fiche d'un article sans photo : pas de photo de Wolt, pas de lien vers l'espace du gérant");
    verifier(demandes.length === 0, "client · le navigateur n'a demandé aucune adresse de l'espace du gérant");
    // Même en connaissant l'adresse d'une photo, un client ne la reçoit pas.
    const reponse = await fetch(BASE + "/admin/repere/lait-tnuva-3-1-l.jpg", { redirect: "manual" });
    verifier(reponse.status >= 300 && reponse.status < 400 && !(reponse.headers.get("content-type") ?? "").startsWith("image/"), `client · une photo demandée directement : refusée (réponse ${reponse.status}, renvoi vers la connexion)`);
    await ctx.close();
  }

  if (SANS_GERANT) {
    ok("(vrai site : la partie « gérant » n'est pas jouée — on ne s'y connecte pas)");
  } else {
    // ── 2. Le gérant connecté : la photo de Wolt là où l'article n'a pas la sienne ──────────────────────────
    for (const [ecran, options] of [["téléphone", TELEPHONE], ["ordinateur", ORDINATEUR]]) {
      const ctx = await navigateur.newContext(options);
      const p = await ctx.newPage();
      p.on("pageerror", (e) => erreurs.push(String(e)));
      await p.goto(BASE + "/admin/connexion");
      await p.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
      await p.getByRole("button", { name: "Se connecter" }).click();
      await p.waitForURL(BASE + "/admin");

      await p.goto(BASE + "/", { waitUntil: "networkidle" });
      const accueil = await compter(p);
      verifier(accueil.bandeau === "wolt", `${ecran} · accueil : le bandeau « Vue du gérant » est là`);
      verifier(accueil.wolt >= 10 && accueil.icones === 0, `${ecran} · accueil : ${accueil.wolt} cartes sur ${accueil.cartes} montrent la photo de Wolt, plus aucune icône de rayon`);
      await p.locator("main article [data-repere-gerant=carte]").first().scrollIntoViewIfNeeded();
      const vues = await chargees(p, "[data-repere-gerant=carte] img");
      verifier(vues.vues >= 2 && vues.vides === 0, `${ecran} · accueil : les photos de Wolt à l'écran sont bien arrivées (${vues.vues})`);
      verifier((await p.locator("[data-repere-gerant=carte]").first().innerText()).trim() === "Wolt", `${ecran} · chaque photo de Wolt porte l'étiquette « Wolt »`);
      const bandeau = p.locator("[data-vue-gerant]");
      verifier(/Tes clients voient l'icône du rayon, jamais ces photos/.test(await bandeau.innerText()), `${ecran} · le bandeau dit que les clients ne voient pas ces photos`);
      verifier(!(await deborde(p)), `${ecran} · accueil : la page tient dans l'écran`);
      // La carte garde sa forme : même hauteur de zone d'image qu'une carte avec photo.
      const formes = await p.evaluate(() => {
        const haut = (el) => Math.round(el.getBoundingClientRect().height / el.getBoundingClientRect().width * 100);
        const wolt = document.querySelector("main article [data-repere-gerant=carte]");
        const photo = document.querySelector("main article img.photo");
        return { wolt: wolt ? haut(wolt) : null, photo: photo ? haut(photo) : null };
      });
      verifier(formes.wolt === 75 && (formes.photo === null || formes.photo === 75), `${ecran} · la zone d'image garde la forme des autres cartes (4:3)`);
      if (OUT) await p.screenshot({ path: `${OUT}/vue-gerant-${ecran}-1-accueil.png` });

      // Le « + » d'une carte à photo de Wolt ajoute toujours au panier.
      const carte = p.locator("main article:has([data-repere-gerant=carte])").first();
      await carte.scrollIntoViewIfNeeded();
      await carte.getByRole("button", { name: /^Ajouter/ }).click();
      await carte.getByRole("button", { name: /^Retirer/ }).waitFor();
      ok(`${ecran} · le « + » d'une carte à photo de Wolt ajoute toujours l'article au panier`);
      await carte.getByRole("button", { name: /^Retirer/ }).click();

      // La fiche : la photo de Wolt entière et « Mettre sa photo », qui ouvre « Photos rapides » sur la ligne de l'article.
      await carte.locator("h3 button").click();
      const fiche = p.locator("dialog[open]");
      await fiche.locator("[data-repere-gerant=fiche] img").waitFor();
      await p.waitForFunction(() => document.querySelector("dialog[open] [data-repere-gerant=fiche] img")?.complete);
      const large = await fiche.locator("[data-repere-gerant=fiche] img").evaluate((i) => ({ naturelle: i.naturalWidth, affichee: Math.round(i.getBoundingClientRect().width) }));
      verifier(large.naturelle > 0 && large.affichee >= 250, `${ecran} · fiche : la photo de Wolt s'affiche en grand (${large.affichee} px)`);
      verifier(/toi seul la vois/.test(await fiche.locator("[data-repere-gerant=fiche]").innerText()), `${ecran} · fiche : « Photo de Wolt : toi seul la vois »`);
      const nom = (await fiche.locator("h2").innerText()).trim();
      if (OUT) await p.screenshot({ path: `${OUT}/vue-gerant-${ecran}-2-fiche.png` });
      const lien = fiche.getByRole("link", { name: "Mettre sa photo" });
      const adresse = await lien.getAttribute("href");
      verifier(/^\/admin\/produits\/photos#p-[a-z0-9]+$/.test(adresse), `${ecran} · fiche : « Mettre sa photo » mène à la ligne de l'article dans « Photos rapides »`);
      await lien.click();
      await p.waitForURL(/\/admin\/produits\/photos#p-/);
      const ligne = p.locator(`li${adresse.slice(adresse.indexOf("#"))}`);
      await ligne.waitFor();
      await p.waitForFunction((s) => document.querySelector(s)?.getAttribute("data-visee") === "oui", `li${adresse.slice(adresse.indexOf("#"))}`);
      const place = await ligne.evaluate((li) => { const r = li.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
      verifier(place && (await ligne.locator("p").first().innerText()).trim() === nom, `${ecran} · « Photos rapides » s'ouvre sur « ${nom} », la ligne est à l'écran et prête à recevoir l'image`);
      if (OUT) await p.screenshot({ path: `${OUT}/vue-gerant-${ecran}-3-photos-rapides.png` });

      // Un rayon, la recherche, une page en hébreu
      await p.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
      const rayon = await compter(p);
      verifier(rayon.wolt >= 20 && rayon.icones === 0 && rayon.bandeau === "wolt", `${ecran} · Crèmerie : ${rayon.wolt} cartes sur ${rayon.cartes} avec la photo de Wolt, aucune icône`);
      verifier(!(await deborde(p)), `${ecran} · Crèmerie : la page tient dans l'écran`);
      await p.goto(BASE + "/recherche?q=lait", { waitUntil: "networkidle" });
      const recherche = await compter(p);
      verifier(recherche.wolt >= 5 && recherche.icones === 0, `${ecran} · recherche « lait » : ${recherche.wolt} résultats sur ${recherche.cartes} avec la photo de Wolt`);
      if (OUT) await p.screenshot({ path: `${OUT}/vue-gerant-${ecran}-4-recherche.png` });
      await p.goto(BASE + "/he/categorie/boissons", { waitUntil: "networkidle" });
      const hebreu = await compter(p);
      const sens = await p.locator("[data-vue-gerant]").evaluate((b) => ({ dir: getComputedStyle(b).direction, texte: b.innerText }));
      verifier(hebreu.wolt >= 20 && sens.dir === "ltr" && /Vue du gérant/.test(sens.texte), `${ecran} · page en hébreu : ${hebreu.wolt} photos de Wolt, le bandeau reste en français, de gauche à droite`);
      verifier(!(await deborde(p)), `${ecran} · page en hébreu : la page tient dans l'écran`);

      // « Voir comme un client » : les icônes reviennent ; « Afficher les photos de Wolt » : les photos aussi
      await p.goto(BASE + "/", { waitUntil: "networkidle" });
      await p.getByRole("button", { name: "Voir comme un client" }).click();
      await p.locator("[data-vue-gerant=client]").waitFor();
      await p.waitForFunction(() => document.querySelectorAll("main article [data-repere-gerant]").length === 0);
      const commeClient = await compter(p);
      verifier(commeClient.wolt === 0 && commeClient.icones === accueil.wolt, `${ecran} · « Voir comme un client » : plus aucune photo de Wolt, les ${commeClient.icones} icônes sont revenues`);
      // Relue depuis le serveur (la page d'avant garde dans ses scripts ce qu'elle avait reçu) : plus aucune adresse de photo.
      await p.reload({ waitUntil: "networkidle" });
      verifier((await p.locator("[data-vue-gerant=client]").count()) === 1 && !TRACES.test((await p.content()).replace(/data-vue-gerant|Vue du gérant/g, "")), `${ecran} · vue du client, page relue : le choix est gardé, et la page ne porte aucune adresse de photo`);
      await p.getByRole("button", { name: "Afficher les photos de Wolt" }).click();
      await p.locator("[data-vue-gerant=wolt]").waitFor();
      await p.waitForFunction((n) => document.querySelectorAll("main article [data-repere-gerant=carte]").length === n, accueil.wolt);
      ok(`${ecran} · « Afficher les photos de Wolt » : elles reviennent`);

      // Déconnecté (cookies effacés) : le site redevient celui des clients
      await ctx.clearCookies();
      await p.goto(BASE + "/", { waitUntil: "networkidle" });
      const apres = await compter(p);
      verifier(apres.bandeau === null && apres.wolt === 0, `${ecran} · une fois déconnecté : ni bandeau ni photo de Wolt`);
      await ctx.close();
    }
  }
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-vue-gerant.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
