// Le catalogue « comme sur Wolt » : des sous-rayons, des tuiles, une colonne des rayons — pour qu'un rayon de
// plusieurs centaines d'articles reste facile à parcourir, sur téléphone comme sur ordinateur.
// À lancer sur le catalogue ENTIER (pas le jeu de test, trop petit pour avoir des sous-rayons) :
//   base vide, puis  npx tsx tests/outils/base-complete.ts --tout-en-vente
// Ne modifie rien dans la base.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ").trim();
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
const visibles = (zone) => zone.locator("article").evaluateAll((l) => l.filter((a) => a.offsetParent !== null).length);

const navigateur = await chromium.launch();
const tel = await (await navigateur.newContext({ ...devices["iPhone 13"] })).newPage();
const ordi = await (await navigateur.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
const petit = await (await navigateur.newContext({ viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true })).newPage();
for (const p of [tel, ordi, petit]) p.on("pageerror", (e) => erreurs.push(String(e)));

try {
  // 1. L'accueil : les rayons d'abord, puis des rangées à faire défiler
  await tel.goto(BASE + "/", { waitUntil: "networkidle" });
  const tuiles = tel.locator("#rayons ul a");
  verifier((await tuiles.count()) >= 10, `accueil : ${await tuiles.count()} rayons en tuiles`);
  const premier = await tuiles.first().boundingBox();
  verifier(premier.y < 700, "accueil sur téléphone : les rayons sont visibles sans presque faire défiler");
  const rangees = tel.locator("section", { has: tel.getByRole("link", { name: /^Tout voir/ }) });
  verifier((await rangees.count()) >= 5, `accueil : ${await rangees.count()} rangées « Tout voir » (une par rayon bien garni)`);
  const rangee = rangees.first().locator(".rail");
  verifier(await rangee.evaluate((el) => el.scrollWidth > el.clientWidth + 50), "une rangée dépasse l'écran : elle défile de côté");
  const hauteurs = await rangee.locator("article").evaluateAll((l) => l.map((a) => Math.round(a.getBoundingClientRect().height)));
  verifier(new Set(hauteurs).size === 1, "dans une rangée, toutes les tuiles ont la même hauteur");
  verifier(!(await deborde(tel)), "accueil : pas de défilement horizontal de la page");
  if (OUT) await tel.screenshot({ path: `${OUT}/rayons-1-accueil.png` });

  // 2. Un grand rayon sur téléphone : ses sous-rayons, un aperçu de chacun, « Tout voir »
  await tel.goto(BASE + "/categorie/courses-epicerie", { waitUntil: "networkidle" });
  const total = Number(espaces(await tel.locator("header p").first().innerText()).match(/\d+/)[0]);
  const puces = tel.getByRole("navigation", { name: "Sous-rayons" }).getByRole("link");
  const nomsDesPuces = await puces.allInnerTexts();
  verifier(total > 60 && nomsDesPuces.length >= 6 && nomsDesPuces[0] === "Tout", `Courses & épicerie : ${total} articles, sous-rayons ${nomsDesPuces.slice(1).join(", ")}`);
  verifier((await puces.first().getAttribute("aria-current")) === "page", "« Tout » est la vue ouverte");
  const sections = tel.locator("section[aria-labelledby^=sous-rayon-]");
  verifier((await sections.count()) === nomsDesPuces.length - 1, "une section par sous-rayon");
  const comptes = await sections.locator("h2 span").allInnerTexts();
  verifier(comptes.reduce((s, n) => s + Number(n), 0) === total, "les sous-rayons se partagent tous les articles du rayon, sans en perdre");
  const affiches = await visibles(tel.locator("main"));
  verifier(affiches < total / 2 && affiches <= 6 * (await sections.count()), `l'aperçu montre ${affiches} tuiles sur ${total} : au plus trois lignes par sous-rayon`);
  const deux = await tel.locator("section[aria-labelledby^=sous-rayon-] article").evaluateAll((l) => l.slice(0, 2).map((a) => Math.round(a.getBoundingClientRect().top)));
  verifier(deux[0] === deux[1], "sur téléphone : deux tuiles par ligne");
  verifier(!(await deborde(tel)), "rayon : pas de défilement horizontal de la page");
  if (OUT) await tel.screenshot({ path: `${OUT}/rayons-2-rayon.png` });

  // 3. La rangée des sous-rayons reste sous l'en-tête pendant qu'on fait défiler, et reste cliquable
  await tel.evaluate(() => window.scrollTo(0, 1400));
  await tel.waitForTimeout(300);
  const barre = await tel.getByRole("navigation", { name: "Sous-rayons" }).boundingBox();
  const entete = await tel.locator("header").first().boundingBox();
  verifier(Math.abs(barre.y - (entete.y + entete.height)) <= 2, "en défilant : la rangée des sous-rayons reste collée sous l'en-tête");
  const dessus = await tel.evaluate(([x, y]) => document.elementFromPoint(x, y)?.closest("nav")?.getAttribute("aria-label"), [barre.x + 60, barre.y + barre.height / 2]);
  verifier(dessus === "Sous-rayons", "aucune tuile ni bouton « + » ne passe par-dessus la rangée");

  // 4. « Tout voir » ouvre le sous-rayon entier, à sa propre adresse
  await tel.evaluate(() => window.scrollTo(0, 0));
  const section = sections.filter({ has: tel.getByRole("link", { name: "Tout voir" }) }).first();
  const nomSous = espaces(await section.locator("h2").evaluate((h) => h.firstChild.textContent));
  const attendu = Number(await section.locator("h2 span").innerText());
  await section.getByRole("link", { name: "Tout voir" }).click();
  await tel.waitForURL(/\/categorie\/courses-epicerie\?s=[a-z-]+$/);
  await tel.locator("#titre-sous-rayon").waitFor();
  verifier(espaces(await tel.locator("#titre-sous-rayon").innerText()).startsWith(nomSous) && (await visibles(tel.locator("main"))) === attendu, `« ${nomSous} » : ses ${attendu} articles, tous affichés`);
  verifier((await tel.title()).startsWith(`${nomSous} — Courses & épicerie`), "le titre de la page nomme le sous-rayon");
  const active = tel.getByRole("navigation", { name: "Sous-rayons" }).locator('[aria-current="page"]');
  verifier(espaces(await active.innerText()) === nomSous, "la puce du sous-rayon ouvert est marquée");
  await tel.getByRole("link", { name: "Tout le rayon Courses & épicerie" }).click();
  await tel.waitForURL(/\/categorie\/courses-epicerie$/);
  ok("« Tout le rayon » revient à l'aperçu");

  // 5. La puce ouverte est amenée dans l'écran, même la dernière
  const derniere = nomsDesPuces[nomsDesPuces.length - 1];
  await tel.getByRole("navigation", { name: "Sous-rayons" }).getByRole("link", { name: derniere, exact: true }).click();
  await tel.waitForURL(/\?s=/);
  await tel.waitForTimeout(400);
  const puce = await tel.getByRole("navigation", { name: "Sous-rayons" }).locator('[aria-current="page"]').boundingBox();
  verifier(puce.x >= 0 && puce.x + puce.width <= 390, `la puce « ${derniere} », en bout de rangée, est amenée dans l'écran`);

  // 6. Une tuile : le « + » ajoute au panier, le nom ouvre la fiche
  await tel.goto(BASE + "/categorie/courses-epicerie", { waitUntil: "networkidle" });
  const tuile = tel.locator("section[aria-labelledby^=sous-rayon-] article").first();
  const nomArticle = espaces(await tuile.locator("h3").innerText());
  await tuile.getByRole("button", { name: `Ajouter ${nomArticle} au panier` }).click();
  await tel.getByRole("link", { name: /Voir le panier/ }).waitFor();
  verifier(await tuile.getByRole("button", { name: `Retirer un ${nomArticle}` }).isVisible(), "le « + » d'une tuile ajoute l'article : la tuile montre « − 1 + », la barre du panier apparaît");
  await tuile.locator("h3 button").click();
  await tel.getByRole("dialog", { name: nomArticle }).waitFor();
  ok("toucher la tuile ouvre la fiche de l'article");
  await tel.keyboard.press("Escape");

  // 7. Un petit rayon : tous ses articles, sans sous-rayons
  await tel.goto(BASE + "/categorie/shabbat-casher", { waitUntil: "networkidle" });
  verifier((await tel.getByRole("navigation", { name: "Sous-rayons" }).count()) === 0 && (await visibles(tel.locator("main"))) >= 1, "petit rayon : pas de sous-rayons, tous les articles");

  // 8. Sur ordinateur : la colonne des rayons, celui-ci ouvert sur ses sous-rayons ; quatre tuiles par ligne
  await ordi.goto(BASE + "/categorie/courses-epicerie", { waitUntil: "networkidle" });
  const colonne = ordi.locator("aside nav");
  verifier(await colonne.isVisible() && (await colonne.locator("> ul > li").count()) >= 10, "ordinateur : la colonne des rayons");
  const sous = await colonne.locator("ul ul a").allInnerTexts();
  verifier(sous.length === nomsDesPuces.length - 1 && sous.reduce((s, l) => s + Number(l.match(/\d+$/)[0]), 0) === total, "le rayon ouvert liste ses sous-rayons, avec le nombre d'articles de chacun");
  verifier(!(await ordi.getByRole("navigation", { name: "Sous-rayons" }).isVisible()), "ordinateur : pas de rangée de puces, la colonne suffit");
  const ligne = await ordi.locator("section[aria-labelledby^=sous-rayon-]").first().locator("article").evaluateAll((l) => l.filter((a) => a.offsetParent !== null).map((a) => Math.round(a.getBoundingClientRect().top)));
  verifier(ligne.filter((y) => y === ligne[0]).length === 4 && ligne.length <= 8, "ordinateur : quatre tuiles par ligne, deux lignes par sous-rayon");
  await colonne.locator("ul ul a").nth(1).click();
  await ordi.waitForURL(/\?s=/);
  verifier((await colonne.locator('ul ul a[aria-current="page"]').count()) === 1, "ordinateur : un clic dans la colonne ouvre le sous-rayon");
  if (OUT) await ordi.screenshot({ path: `${OUT}/rayons-3-ordinateur.png` });
  // L'accueil sur ordinateur : les flèches d'une rangée
  await ordi.goto(BASE + "/", { waitUntil: "networkidle" });
  const rangeeOrdi = ordi.locator("section", { has: ordi.getByRole("link", { name: /^Tout voir/ }) }).first();
  await rangeeOrdi.locator(".rail").hover();
  const avant = await rangeeOrdi.locator(".rail").evaluate((el) => el.scrollLeft);
  await rangeeOrdi.locator("button[aria-hidden=true]").last().click();
  await ordi.waitForTimeout(700);
  verifier((await rangeeOrdi.locator(".rail").evaluate((el) => el.scrollLeft)) > avant + 100, "ordinateur : la flèche fait défiler la rangée");

  // 9. En hébreu : de droite à gauche, les noms traduits, sans débordement
  await tel.goto(BASE + "/he/categorie/boissons?s=colas", { waitUntil: "networkidle" });
  const he = await tel.locator("main").innerText();
  verifier((await tel.evaluate(() => document.documentElement.dir)) === "rtl" && he.includes("קולה") && !he.includes("Colas") && !/\{\w+\}/.test(he), "hébreu : le sous-rayon « Colas » porte son nom en hébreu");
  verifier(!(await deborde(tel)), "hébreu : pas de défilement horizontal");
  verifier((await tel.locator('a[href^="/categorie"]').count()) === 0, "hébreu : tous les liens du rayon restent en hébreu");

  // 10. Sur un tout petit téléphone (320 px) : rien ne dépasse, même avec un article au panier
  for (const adresse of ["/", "/categorie/courses-epicerie", "/categorie/courses-epicerie?s=sauces-epices", "/recherche?q=sauce"]) {
    await petit.goto(BASE + adresse, { waitUntil: "networkidle" });
    if (adresse.includes("?s=")) await petit.locator("main article").first().getByRole("button", { name: /^Ajouter/ }).click();
    const sorties = await petit.locator("main article").evaluateAll((l) => l.filter((a) => a.offsetParent !== null && [...a.querySelectorAll("button, p")].some((e) => e.getBoundingClientRect().right > a.getBoundingClientRect().right + 1)).length);
    verifier(!(await deborde(petit)) && sorties === 0, `320 px · ${adresse} : la page tient, rien ne sort d'une tuile`);
  }
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-rayons.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
