// La recherche « vivante » de l'en-tête (demande du gérant, 15 novembre 2026 : « comme sur Wolt ») : les articles
// s'affichent pendant qu'on tape, sans valider ; le champ garde le curseur ; « retour » ramène d'où l'on vient.
// Et la recherche comprend ce qu'un visiteur tape vraiment : sans accents, sans tirets, plusieurs mots.
// À lancer sur le catalogue ENTIER, comme parcours-rayons :
//   base vide, puis  npx tsx tests/outils/base-complete.ts
// Ne modifie rien dans la base : se lance aussi sur le vrai site (BASE_URL=https://www.touristorder.com).
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
const noms = (p) => p.locator("main article h3").allInnerTexts().then((l) => l.map((n) => n.trim()));
const chemin = (p) => p.evaluate(() => decodeURIComponent(location.pathname + location.search));
const aLeCurseur = (p) => p.evaluate(() => document.activeElement?.id === "recherche");
// Les résultats de CE texte sont à l'écran : l'adresse le dit, et le titre de la page aussi.
const resultatsDe = async (p, texte) => {
  await p.waitForFunction((t) => new URLSearchParams(location.search).get("q") === t && (document.querySelector("main h1")?.textContent ?? "").includes(t), texte, { timeout: 15000 });
};

const navigateur = await chromium.launch();
const contexte = async (options) => {
  const ctx = await navigateur.newContext(options);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  return { ctx, p };
};

try {
  // 1. Sur ordinateur : on tape, les articles arrivent — sans valider
  const { ctx: ctxOrdi, p: ordi } = await contexte({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  await ordi.goto(BASE + "/", { waitUntil: "networkidle" });
  const champ = ordi.locator("#recherche");
  const historique = await ordi.evaluate(() => history.length);
  await champ.click();
  await champ.pressSequentially("c", { delay: 60 });
  await ordi.waitForTimeout(700);
  verifier((await chemin(ordi)) === "/", "une seule lettre : on reste sur la page où l'on est");
  await champ.pressSequentially("oca", { delay: 60 });
  await resultatsDe(ordi, "coca");
  const coca = await noms(ordi);
  verifier(coca.length >= 5 && coca.slice(0, 5).every((n) => /coca/i.test(n)), `« coca », sans valider : ${coca.length} articles s'affichent, les Coca-Cola d'abord (« ${coca[0]} »)`);
  verifier(await aLeCurseur(ordi), "le champ garde le curseur : on peut continuer à taper");
  verifier((await champ.inputValue()) === "coca", "le champ garde ce qui a été tapé");
  if (OUT) await ordi.screenshot({ path: `${OUT}/recherche-1-coca.png` });

  // 2. On précise : les résultats suivent
  await champ.pressSequentially(" zero", { delay: 60 });
  await resultatsDe(ordi, "coca zero");
  const zero = await noms(ordi);
  verifier(zero.length >= 3 && zero.length < coca.length && zero.every((n) => /coca/i.test(n) && /zero/i.test(n)), `« coca zero » (sans tiret ni majuscule) : ${zero.length} articles, tous des Coca-Cola Zero`);
  verifier(await aLeCurseur(ordi), "le curseur est toujours dans le champ");
  verifier((await ordi.locator("main p[role=status]").innerText()).trim() !== "", "le nombre d'articles trouvés est annoncé (zone « status »)");

  // 3. Dix lettres ne font pas dix pages : une seule de plus dans l'historique, et « retour » ramène à l'accueil
  verifier((await ordi.evaluate(() => history.length)) === historique + 1, "tout ce qui a été tapé ne fait qu'UNE page de plus dans l'historique");
  await ordi.goBack();
  await ordi.waitForFunction(() => location.pathname === "/" && !location.search);
  await ordi.waitForTimeout(600);
  verifier((await champ.inputValue()) === "" && (await ordi.locator("#rayons").count()) === 1, "« retour » : l'accueil revient, le champ est vide");
  await ordi.goForward();
  await resultatsDe(ordi, "coca zero");
  verifier((await champ.inputValue()) === "coca zero", "« suivant » : les résultats reviennent, le champ aussi");

  // 4. On efface : les résultats s'effacent, la page le dit
  await champ.fill("");
  await ordi.waitForFunction(() => location.pathname === "/recherche" && !location.search);
  await ordi.getByText("Tapez au moins deux lettres").waitFor();
  verifier((await noms(ordi)).length === 0, "champ vidé : plus de résultats, « Tapez au moins deux lettres »");

  // 5. Ce qu'un visiteur tape vraiment
  for (const [texte, attendu] of [["oeufs", /Œufs/], ["cafe", /café/i], ["lait 3", /Lait .*3 %/], ["yaourt", /Yaourt/i], ["CHOCOLAT", /chocolat/i]]) {
    await champ.fill(texte);
    await resultatsDe(ordi, texte);
    const trouves = await noms(ordi);
    verifier(trouves.length > 0 && attendu.test(trouves[0]), `« ${texte} » : ${trouves.length} articles, d'abord « ${trouves[0]} »`);
  }
  await champ.fill("lait");
  await resultatsDe(ordi, "lait");
  const lait = await noms(ordi);
  verifier(/^Lait/.test(lait[0]) && lait.findIndex((n) => /^Laitue/.test(n)) !== 0, `« lait » : le lait avant la laitue (« ${lait[0]} »)`);

  // 6. Rien de trouvé : on propose de le demander, avec ce qui a été tapé
  await champ.fill("zzzzqqq");
  await resultatsDe(ordi, "zzzzqqq");
  const demander = ordi.getByRole("link", { name: /Demander cet article/ });
  await demander.waitFor();
  verifier(decodeURIComponent(await demander.getAttribute("href")).endsWith("/panier?demande=zzzzqqq"), "rien de trouvé : « Demander cet article » reprend ce qui a été tapé");

  // 7. La touche Entrée : pas de rechargement de la page, le clavier se range
  await ordi.evaluate(() => { window.__memePage = true; });
  await champ.fill("ba");
  await champ.press("Enter");
  await resultatsDe(ordi, "ba");
  verifier(await ordi.evaluate(() => window.__memePage === true), "Entrée : les résultats arrivent sans recharger la page");
  verifier(!(await aLeCurseur(ordi)), "Entrée : le champ rend le curseur (sur téléphone, le clavier se range)");
  verifier((await ordi.locator("[data-barre-navigation]").count()) === 0 || (await ordi.locator("[data-barre-navigation=charge]").count()) === 0, "Entrée : la barre de chargement ne reste pas en route");

  // 8. En quittant les résultats, le champ se vide ; la recherche repart de la nouvelle page
  await ordi.locator("header a").first().click();
  await ordi.waitForFunction(() => location.pathname === "/");
  await ordi.waitForTimeout(500);
  verifier((await champ.inputValue()) === "", "retour à l'accueil par le logo : le champ est vide");
  await ctxOrdi.close();

  // 9. Sur téléphone : pareil, la page tient dans l'écran, l'en-tête ne décale rien
  const { ctx: ctxTel, p: tel } = await contexte({ ...devices["iPhone 13"], locale: "fr-FR" });
  await tel.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
  await tel.locator("#recherche").tap();
  await tel.locator("#recherche").pressSequentially("yaourt", { delay: 70 });
  await resultatsDe(tel, "yaourt");
  const yaourts = await noms(tel);
  verifier(yaourts.length >= 10 && /yaourt/i.test(yaourts[0]), `téléphone, depuis un rayon : « yaourt » → ${yaourts.length} articles sans valider`);
  verifier(await aLeCurseur(tel), "téléphone : le champ garde le curseur");
  verifier(!(await deborde(tel)), "téléphone : la page des résultats tient dans l'écran");
  verifier((await tel.evaluate(() => scrollY)) === 0, "téléphone : les résultats se lisent depuis le haut");
  const premiere = await tel.locator("main article").first().boundingBox();
  const entete = await tel.locator("header.entete").boundingBox();
  verifier(premiere.y >= entete.y + entete.height, "téléphone : la première tuile est sous l'en-tête, pas dessous");
  if (OUT) await tel.screenshot({ path: `${OUT}/recherche-2-telephone.png` });
  // Faire défiler les résultats du doigt range le clavier (le champ rend le curseur).
  await tel.locator("main article").nth(1).dispatchEvent("touchmove", { touches: [], changedTouches: [], targetTouches: [] });
  verifier(!(await aLeCurseur(tel)), "téléphone : faire défiler les résultats range le clavier");
  await tel.goBack();
  await tel.waitForFunction(() => location.pathname === "/categorie/cremerie-oeufs");
  ok("téléphone : « retour » ramène au rayon d'où l'on venait");
  await ctxTel.close();

  // 10. En hébreu : l'adresse garde sa langue, les noms sont en hébreu, un mot hébreu trouve
  const { ctx: ctxHe, p: he } = await contexte({ ...devices["iPhone 13"], locale: "he-IL" });
  await he.goto(BASE + "/he", { waitUntil: "networkidle" });
  await he.locator("#recherche").tap();
  await he.locator("#recherche").pressSequentially("חלב", { delay: 70 });
  await resultatsDe(he, "חלב");
  verifier((await chemin(he)).startsWith("/he/recherche?q="), "hébreu : les résultats sont à l'adresse de la langue (/he/recherche)");
  const hebreu = await noms(he);
  verifier(hebreu.length > 0 && hebreu[0].includes("חלב"), `hébreu : « חלב » → ${hebreu.length} articles, d'abord « ${hebreu[0]} »`);
  verifier(!(await deborde(he)), "hébreu : la page tient dans l'écran");
  // Un nom de marque tapé en lettres latines se trouve aussi.
  await he.locator("#recherche").fill("coca zero");
  await resultatsDe(he, "coca zero");
  verifier((await noms(he)).length >= 3, "hébreu : « coca zero » tapé en lettres latines trouve les Coca-Cola Zero");
  if (OUT) await he.screenshot({ path: `${OUT}/recherche-3-hebreu.png` });
  await ctxHe.close();

  // 11. Sans JavaScript : un formulaire ordinaire — on tape, on valide, les résultats s'ouvrent
  const { ctx: ctxSans, p: sans } = await contexte({ viewport: { width: 1280, height: 900 }, locale: "fr-FR", javaScriptEnabled: false });
  await sans.goto(BASE + "/", { waitUntil: "load" });
  await sans.locator("#recherche").fill("coca zero");
  await sans.locator("#recherche").press("Enter");
  await sans.waitForURL(/\/recherche\?q=coca/);
  const sansJs = await noms(sans);
  verifier(sansJs.length >= 3 && sansJs.every((n) => /coca/i.test(n)), `sans JavaScript : on valide, ${sansJs.length} Coca-Cola Zero s'affichent`);
  await ctxSans.close();

  // 12. Une adresse de résultats ouverte directement : le champ montre ce qui est cherché
  const { ctx: ctxDirect, p: direct } = await contexte({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  await direct.goto(BASE + "/recherche?q=yaourt", { waitUntil: "networkidle" });
  await direct.waitForFunction(() => document.querySelector("#recherche")?.value === "yaourt");
  ok("adresse de résultats ouverte directement : le champ montre « yaourt »");
  await ctxDirect.close();
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-recherche.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
