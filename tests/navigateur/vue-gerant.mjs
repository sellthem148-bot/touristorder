// Les photos de Wolt sur les pages de la boutique (17 novembre 2026), dans les deux états du réglage
// « Photos de Wolt pour tout le monde » (Réglages) :
// - décoché : seul le gérant connecté les voit (« grâce à ces images de Wolt je peux chercher les images qui
//   correspondent à chaque produit ») ; un client ne reçoit ni ces photos ni leur adresse ;
// - coché (« le site a 0 client, on est 2 à bosser dessus : active-moi les photos pour tout le monde ») : tout
//   visiteur voit la photo ; « Changer la photo », sur la fiche, reste au gérant.
// L'étiquette « Wolt » que le gérant voyait sur chaque photo n'existe plus (sa demande du 24 novembre 2026) :
// le mot n'apparaît sur aucune carte ni aucune fiche, pour personne.
// À lancer sur le catalogue ENTIER (« npx tsx tests/outils/base-complete.ts »).
// Ce parcours COCHE et DÉCOCHE le réglage, puis le remet comme il l'a trouvé : base LOCALE seulement.
// Sur le vrai site : SANS_GERANT=1 — il ne modifie rien et ne se connecte pas ; seule la partie « client » est
// vérifiée, dans l'état où le réglage se trouve.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const SANS_GERANT = process.env.SANS_GERANT === "1";
if (!SANS_GERANT && !/^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE)) throw new Error("Ce parcours change un réglage : base locale seulement (ou SANS_GERANT=1).");
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
const TELEPHONE = { ...devices["iPhone 13"], locale: "fr-FR" };
const ORDINATEUR = { viewport: { width: 1280, height: 900 }, locale: "fr-FR" };
const PAGES = ["/", "/categorie/cremerie-oeufs", "/recherche?q=lait", "/he", "/he/categorie/boissons"];
// Ce qu'un client ne reçoit jamais : les repères du gérant. Et, réglage décoché, pas même l'adresse d'une photo.
const REPERES_DU_GERANT = /data-etiquette-gerant|data-vue-gerant|Vue du gérant|admin\/produits|>Wolt</;
const ADRESSE_DE_PHOTO = /admin\/repere/;
const pourTousSurLeSite = async () => (await (await fetch(BASE + "/admin/repere/etat")).json()).pourTous === true;
const lire = async (chemin) => (await fetch(BASE + chemin, { headers: { "Accept-Language": chemin.startsWith("/he") ? "he" : "fr" } })).text();
// Les photos visibles à l'écran sont bien arrivées (une photo refusée par le serveur resterait vide).
const chargees = async (p, selecteur) => {
  await p.waitForFunction((s) => [...document.querySelectorAll(s)].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }).every((i) => i.complete), selecteur, { timeout: 30000 });
  return p.evaluate((s) => { const vues = [...document.querySelectorAll(s)].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.left < innerWidth && r.right > 0; }); return { vues: vues.length, vides: vues.filter((i) => i.naturalWidth === 0).length }; }, selecteur);
};
const compter = (p) => p.evaluate(() => ({
  wolt: document.querySelectorAll("main article [data-repere=carte]").length,
  etiquettes: document.querySelectorAll("main article [data-etiquette-gerant]").length,
  icones: document.querySelectorAll("main article [data-sans-photo]").length,
  cartes: document.querySelectorAll("main article").length,
  bandeau: document.querySelector("[data-vue-gerant]")?.getAttribute("data-vue-gerant") ?? null,
  pourTous: document.querySelector("[data-vue-gerant]")?.getAttribute("data-pour-tous") ?? null,
}));
const forme = (p) => p.evaluate(() => {
  const haut = (el) => Math.round((el.getBoundingClientRect().height / el.getBoundingClientRect().width) * 100);
  const wolt = document.querySelector("main article [data-repere=carte]");
  const photo = document.querySelector("main article img.photo");
  return { wolt: wolt ? haut(wolt) : null, photo: photo ? haut(photo) : null };
});

const navigateur = await chromium.launch();
const connecter = async (options) => {
  const ctx = await navigateur.newContext(options);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(BASE + "/admin/connexion");
  await p.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await p.getByRole("button", { name: "Se connecter" }).click();
  await p.waitForURL(BASE + "/admin");
  return { ctx, p };
};

/** Coche ou décoche « Photos de Wolt pour tout le monde » dans les réglages, et attend que le site suive. */
const regler = async (p, pourTous) => {
  await p.goto(BASE + "/admin/reglages", { waitUntil: "networkidle" });
  const coche = p.locator("input[name=photosWoltPourTous]");
  if ((await coche.isChecked()) !== pourTous) {
    await coche.setChecked(pourTous);
    await p.locator("form:has(input[name=photosWoltPourTous]) button[type=submit]").click();
    await p.getByText("Réglages enregistrés.").waitFor();
  }
  const debut = Date.now();
  while (Date.now() - debut < 40000) {
    if ((await pourTousSurLeSite()) === pourTous && ADRESSE_DE_PHOTO.test(await lire("/")) === pourTous) return;
    await new Promise((fini) => setTimeout(fini, 1000));
  }
  throw new Error("ÉCHEC : le site ne suit pas le réglage « Photos de Wolt pour tout le monde »");
};

/** Ce que voit un visiteur qui n'est pas connecté. */
const commeUnClient = async (pourTous) => {
  const etat = pourTous ? "réglage coché" : "réglage décoché";
  for (const chemin of PAGES) {
    const html = await lire(chemin);
    const sansRepere = html.length > 5000 && !REPERES_DU_GERANT.test(html);
    if (pourTous) verifier(sansRepere && ADRESSE_DE_PHOTO.test(html), `client · ${etat} · ${chemin} : la page porte les photos, sans étiquette « Wolt » ni repère du gérant`);
    else verifier(sansRepere && !ADRESSE_DE_PHOTO.test(html), `client · ${etat} · ${chemin} : la page envoyée ne porte aucune trace des photos de Wolt`);
  }
  const ctx = await navigateur.newContext(TELEPHONE);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  const demandes = [];
  p.on("request", (r) => { if (r.url().includes("/admin/")) demandes.push(r.url()); });
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const accueil = await compter(p);
  if (pourTous) {
    verifier(accueil.cartes >= 20 && accueil.wolt >= 10 && accueil.icones === 0 && accueil.etiquettes === 0 && accueil.bandeau === null, `client · ${etat} · accueil : ${accueil.wolt} cartes sur ${accueil.cartes} montrent la photo, plus aucune icône, pas d'étiquette, pas de bandeau`);
    await p.locator("main article [data-repere=carte]").first().scrollIntoViewIfNeeded();
    const vues = await chargees(p, "[data-repere=carte] img");
    verifier(vues.vues >= 2 && vues.vides === 0, `client · ${etat} · les photos à l'écran sont bien arrivées (${vues.vues})`);
    const formes = await forme(p);
    verifier(formes.wolt === 75 && (formes.photo === null || formes.photo === 75), `client · ${etat} · la zone d'image garde la forme des autres cartes (4:3)`);
    verifier(!(await deborde(p)), `client · ${etat} · accueil : la page tient dans l'écran`);
    if (OUT) await p.screenshot({ path: `${OUT}/vue-client-pour-tous-1-accueil.png` });
    const carte = p.locator("main article:has([data-repere=carte])").first();
    await carte.getByRole("button", { name: /^Ajouter/ }).click();
    await carte.getByRole("button", { name: /^Retirer/ }).waitFor();
    ok(`client · ${etat} · le « + » d'une carte à photo de Wolt ajoute l'article au panier`);
    await carte.getByRole("button", { name: /^Retirer/ }).click();
    await carte.locator("h3 button").click();
    const fiche = p.locator("dialog[open]");
    await fiche.locator("[data-repere=fiche] img").waitFor();
    await p.waitForFunction(() => document.querySelector("dialog[open] [data-repere=fiche] img")?.complete);
    const image = await fiche.locator("[data-repere=fiche] img").evaluate((i) => ({ naturelle: i.naturalWidth, alt: i.alt }));
    verifier(image.naturelle > 0 && image.alt.length > 0 && (await fiche.locator("[data-etiquette-gerant], a[href^='/admin']").count()) === 0, `client · ${etat} · fiche : la photo en grand, décrite par le nom de l'article, sans lien vers l'espace du gérant`);
    if (OUT) await p.screenshot({ path: `${OUT}/vue-client-pour-tous-2-fiche.png` });
    await p.goto(BASE + "/he/categorie/boissons", { waitUntil: "networkidle" });
    const hebreu = await compter(p);
    verifier(hebreu.wolt >= 20 && hebreu.etiquettes === 0 && !(await deborde(p)), `client · ${etat} · page en hébreu : ${hebreu.wolt} photos, la page tient dans l'écran`);
    const photo = await fetch(BASE + "/admin/repere/lait-tnuva-3-1-l.jpg", { redirect: "manual" });
    verifier(photo.status === 200 && photo.headers.get("content-type") === "image/jpeg" && /noindex/.test(photo.headers.get("x-robots-tag") ?? "") && /max-age=600/.test(photo.headers.get("cache-control") ?? ""), `client · ${etat} · une photo est servie sans connexion, dix minutes au plus, fermée aux moteurs de recherche`);
    const robots = await (await fetch(BASE + "/robots.txt")).text();
    verifier(/Disallow: \/admin/.test(robots), `client · ${etat} · robots.txt ferme toujours « /admin » : les moteurs de recherche ne vont pas chercher ces photos`);
    const inconnue = await fetch(BASE + "/admin/repere/autre-fichier.jpg", { redirect: "manual" });
    verifier(inconnue.status === 404, `client · ${etat} · seules les photos de la liste sont servies (autre fichier : ${inconnue.status})`);
  } else {
    verifier(accueil.cartes >= 20 && accueil.wolt === 0 && accueil.icones >= 10 && accueil.bandeau === null, `client · ${etat} · accueil : ${accueil.cartes} cartes, ${accueil.icones} avec l'icône du rayon, aucune photo de Wolt, pas de bandeau`);
    await p.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
    const rayon = await compter(p);
    verifier(rayon.cartes >= 20 && rayon.wolt === 0 && rayon.bandeau === null, `client · ${etat} · Crèmerie : ${rayon.cartes} cartes, aucune photo de Wolt`);
    await p.locator("main article:has([data-sans-photo]) h3 button").first().click();
    await p.locator("dialog[open]").waitFor();
    verifier((await p.locator("dialog[open] [data-repere]").count()) === 0 && (await p.locator("dialog[open] img").count()) === 0, `client · ${etat} · fiche d'un article sans photo : pas de photo de Wolt, pas de lien vers l'espace du gérant`);
    verifier(demandes.length === 0, `client · ${etat} · le navigateur n'a demandé aucune adresse de l'espace du gérant`);
    const reponse = await fetch(BASE + "/admin/repere/lait-tnuva-3-1-l.jpg", { redirect: "manual" });
    verifier(reponse.status >= 300 && reponse.status < 400 && !(reponse.headers.get("content-type") ?? "").startsWith("image/"), `client · ${etat} · une photo demandée directement : refusée (réponse ${reponse.status}, renvoi vers la connexion)`);
  }
  await ctx.close();
};

/** Ce que voit le gérant connecté à son espace. */
const commeLeGerant = async (pourTous, ecran, options) => {
  const etat = `${ecran} · ${pourTous ? "réglage coché" : "réglage décoché"}`;
  const { ctx, p } = await connecter(options);
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const accueil = await compter(p);
  verifier(accueil.bandeau === "gerant" && accueil.pourTous === (pourTous ? "oui" : "non"), `${etat} · accueil : le bandeau « Vue du gérant » est là`);
  verifier(accueil.wolt >= 10 && accueil.icones === 0 && accueil.etiquettes === 0, `${etat} · accueil : ${accueil.wolt} cartes sur ${accueil.cartes} montrent la photo de Wolt, sans étiquette`);
  await p.locator("main article [data-repere=carte]").first().scrollIntoViewIfNeeded();
  const vues = await chargees(p, "[data-repere=carte] img");
  verifier(vues.vues >= 2 && vues.vides === 0, `${etat} · accueil : les photos de Wolt à l'écran sont bien arrivées (${vues.vues})`);
  verifier((await p.locator("main").getByText("Wolt", { exact: true }).count()) === 0 && (await p.locator("[data-repere=carte]").first().innerText()).trim() === "", `${etat} · aucune carte ne porte le mot « Wolt », même pour le gérant`);
  const texte = await p.locator("[data-vue-gerant]").innerText();
  verifier(pourTous ? /à tout le monde/.test(texte) && /toi seul vois « Changer la photo »/.test(texte) : /Tes clients voient l'icône du rayon, jamais ces photos/.test(texte), `${etat} · le bandeau dit qui voit ces photos : ${pourTous ? "tout le monde, « Changer la photo » pour lui seul" : "lui seul"}`);
  verifier((await p.locator("[data-vue-gerant] a[href='/admin/reglages']").count()) === 1, `${etat} · le bandeau mène aux réglages, où la case se coche et se décoche`);
  verifier(!(await deborde(p)), `${etat} · accueil : la page tient dans l'écran`);
  const formes = await forme(p);
  verifier(formes.wolt === 75 && (formes.photo === null || formes.photo === 75), `${etat} · la zone d'image garde la forme des autres cartes (4:3)`);
  if (OUT) await p.screenshot({ path: `${OUT}/vue-gerant-${ecran}-${pourTous ? "pour-tous" : "lui-seul"}-1-accueil.png` });

  // Le « + » d'une carte à photo de Wolt ajoute toujours au panier.
  const carte = p.locator("main article:has([data-repere=carte])").first();
  await carte.scrollIntoViewIfNeeded();
  await carte.getByRole("button", { name: /^Ajouter/ }).click();
  await carte.getByRole("button", { name: /^Retirer/ }).waitFor();
  ok(`${etat} · le « + » d'une carte à photo de Wolt ajoute toujours l'article au panier`);
  await carte.getByRole("button", { name: /^Retirer/ }).click();

  // La fiche : la photo de Wolt entière et « Changer la photo », qui ouvre « Photos rapides » sur la ligne de l'article.
  await carte.locator("h3 button").click();
  const fiche = p.locator("dialog[open]");
  await fiche.locator("[data-repere=fiche] img").waitFor();
  await p.waitForFunction(() => document.querySelector("dialog[open] [data-repere=fiche] img")?.complete);
  const large = await fiche.locator("[data-repere=fiche] img").evaluate((i) => ({ naturelle: i.naturalWidth, affichee: Math.round(i.getBoundingClientRect().width) }));
  verifier(large.naturelle > 0 && large.affichee >= 250, `${etat} · fiche : la photo de Wolt s'affiche en grand (${large.affichee} px)`);
  verifier(!/Wolt/.test(await fiche.locator("[data-repere=fiche]").innerText()), `${etat} · fiche : le mot « Wolt » n'y est plus`);
  const nom = (await fiche.locator("h2").innerText()).trim();
  if (OUT) await p.screenshot({ path: `${OUT}/vue-gerant-${ecran}-${pourTous ? "pour-tous" : "lui-seul"}-2-fiche.png` });
  const lien = fiche.getByRole("link", { name: "Changer la photo" });
  const adresse = await lien.getAttribute("href");
  verifier(/^\/admin\/produits\/photos#p-[a-z0-9]+$/.test(adresse), `${etat} · fiche : « Changer la photo » mène à la ligne de l'article dans « Photos rapides »`);
  await lien.click();
  await p.waitForURL(/\/admin\/produits\/photos#p-/);
  const ancre = `li${adresse.slice(adresse.indexOf("#"))}`;
  await p.locator(ancre).waitFor();
  await p.waitForFunction((s) => document.querySelector(s)?.getAttribute("data-visee") === "oui", ancre);
  const place = await p.locator(ancre).evaluate((li) => { const r = li.getBoundingClientRect(); return r.top >= 0 && r.top < innerHeight; });
  verifier(place && (await p.locator(ancre).locator("p").first().innerText()).trim() === nom, `${etat} · « Photos rapides » s'ouvre sur « ${nom} », la ligne est à l'écran et prête à recevoir l'image`);

  // Un rayon, la recherche, une page en hébreu
  await p.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
  const rayon = await compter(p);
  verifier(rayon.wolt >= 20 && rayon.icones === 0 && rayon.bandeau === "gerant", `${etat} · Crèmerie : ${rayon.wolt} cartes sur ${rayon.cartes} avec la photo de Wolt, aucune icône`);
  verifier(!(await deborde(p)), `${etat} · Crèmerie : la page tient dans l'écran`);
  await p.goto(BASE + "/recherche?q=lait", { waitUntil: "networkidle" });
  const recherche = await compter(p);
  verifier(recherche.wolt >= 5 && recherche.icones === 0, `${etat} · recherche « lait » : ${recherche.wolt} résultats sur ${recherche.cartes} avec la photo de Wolt`);
  await p.goto(BASE + "/he/categorie/boissons", { waitUntil: "networkidle" });
  const hebreu = await compter(p);
  const sens = await p.locator("[data-vue-gerant]").evaluate((b) => ({ dir: getComputedStyle(b).direction, texte: b.innerText }));
  verifier(hebreu.wolt >= 20 && sens.dir === "ltr" && /Vue du gérant/.test(sens.texte), `${etat} · page en hébreu : ${hebreu.wolt} photos de Wolt, le bandeau reste en français, de gauche à droite`);
  verifier(!(await deborde(p)), `${etat} · page en hébreu : la page tient dans l'écran`);

  // « Voir comme un client » : le site tel que les clients le voient ; « Revenir à ma vue » : ses repères reviennent
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Voir comme un client" }).click();
  await p.locator("[data-vue-gerant=client]").waitFor();
  await p.reload({ waitUntil: "networkidle" }); // relue depuis le serveur : le choix est gardé
  const commeClient = await compter(p);
  // (Le bandeau, lui, reste au gérant ; ce qu'un vrai client reçoit est vérifié plus haut, sans connexion.)
  if (pourTous) verifier(commeClient.bandeau === "client" && commeClient.wolt === accueil.wolt && commeClient.etiquettes === 0 && (await p.locator("main").getByText("Wolt", { exact: true }).count()) === 0, `${etat} · « Voir comme un client » : les ${commeClient.wolt} photos restent`);
  else verifier(commeClient.bandeau === "client" && commeClient.wolt === 0 && commeClient.icones === accueil.wolt && !ADRESSE_DE_PHOTO.test(await p.content()), `${etat} · « Voir comme un client » : plus aucune photo de Wolt, les ${commeClient.icones} icônes sont revenues`);
  await p.getByRole("button", { name: "Revenir à ma vue" }).click();
  await p.locator("[data-vue-gerant=gerant]").waitFor();
  await p.waitForFunction((n) => document.querySelectorAll("main article [data-repere=carte]").length === n, accueil.wolt);
  ok(`${etat} · « Revenir à ma vue » : ses photos et son bandeau reviennent`);

  // Déconnecté (cookies effacés) : le site redevient celui des clients
  await ctx.clearCookies();
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  const apres = await compter(p);
  verifier(apres.bandeau === null && apres.etiquettes === 0 && (pourTous ? apres.wolt === accueil.wolt : apres.wolt === 0), `${etat} · une fois déconnecté : ni bandeau ni étiquette, ${pourTous ? "les photos restent" : "plus de photo de Wolt"}`);
  await ctx.close();
};

try {
  const depart = await pourTousSurLeSite();
  if (SANS_GERANT) {
    ok(`(vrai site : rien n'est modifié ; le réglage « Photos de Wolt pour tout le monde » est ${depart ? "coché" : "décoché"})`);
    await commeUnClient(depart);
  } else {
    const { ctx: ctxReglages, p: reglages } = await connecter(ORDINATEUR);
    try {
      for (const pourTous of [false, true]) {
        await regler(reglages, pourTous);
        ok(`── réglage « Photos de Wolt pour tout le monde » ${pourTous ? "coché" : "décoché"} : le site suit`);
        await commeUnClient(pourTous);
        for (const [ecran, options] of [["téléphone", TELEPHONE], ["ordinateur", ORDINATEUR]]) await commeLeGerant(pourTous, ecran, options);
      }
    } finally {
      // Le réglage est remis comme il a été trouvé.
      await regler(reglages, depart);
      ok(`le réglage est remis comme il était (${depart ? "coché" : "décoché"})`);
      await ctxReglages.close();
    }
  }
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-vue-gerant.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
