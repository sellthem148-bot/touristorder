// Les cinq langues du site (français, anglais, russe, hébreu, espagnol) et l'adresse obligatoire :
// chaque page dans chaque langue (sens d'écriture, largeur), une commande refusée tant qu'il manque
// le nom, le téléphone, la rue, l'étage ou l'appartement, l'e-mail et le message du gérant dans la langue
// du client, le choix de la langue dans l'espace client. Le catalogue (articles, options, villes) se lit
// dans la langue du client ; la recherche la comprend. L'espace gérant reste en français.
// Chaque langue a son adresse (« /he/panier ») : le français sans préfixe, ce que lit un moteur de recherche.
// En développement, sans clé Resend, les e-mails sont écrits dans .courriels/ : ce parcours les y lit.
import { chromium, devices } from "playwright";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const BOITE = path.join(process.cwd(), ".courriels");
const LANGUES = ["fr", "en", "ru", "he", "es"];
const erreurs = [];
const ok = (m) => console.log("✓", m);
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const langueDeLaPage = (p) => p.evaluate(() => `${document.documentElement.lang}/${document.documentElement.dir}`);
const deborde = (p) => p.evaluate(() => window.innerWidth > screen.width || document.documentElement.scrollWidth > window.innerWidth);
const oubli = (texte) => /\{\w+\}/.test(texte); // une « {valeur} » restée dans un texte affiché
// L'adresse d'une page dans une langue : le français n'a pas de préfixe.
const adresse = (langue, page) => BASE + (langue === "fr" ? page : `/${langue}${page === "/" ? "" : page}`);
const chemin = (p) => new URL(p.url()).pathname;

/** Le dernier e-mail écrit pour une adresse, une fois le serveur passé par after(). */
async function courriel(adresse) {
  for (let i = 0; i < 40; i++) {
    const trouves = (existsSync(BOITE) ? readdirSync(BOITE) : [])
      .filter((f) => f.endsWith(".html"))
      .sort()
      .reverse()
      .map((f) => readFileSync(path.join(BOITE, f), "utf8"))
      .filter((html) => html.startsWith(`<!-- À : ${adresse} |`));
    if (trouves.length) return trouves[0];
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`ÉCHEC : aucun e-mail écrit pour ${adresse}`);
}

async function contexte(nav, langue, options = {}) {
  const ctx = await nav.newContext({ ...devices["iPhone 13"], ...options });
  if (langue) await ctx.addCookies([{ name: "langue", value: langue, url: BASE }]);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(`${langue ?? "?"} : ${e.message}`));
  return { ctx, p };
}

const nav = await chromium.launch();
try {
  // 1. Chaque page, dans chaque langue : la bonne langue, le bon sens, jamais plus large que l'écran
  for (const langue of LANGUES) {
    const { ctx, p } = await contexte(nav, langue);
    for (const page of ["/", "/categorie/courses-epicerie", "/recherche?q=zzzz", "/panier?demande=", "/compte/connexion", "/commandes", "/contact", "/conditions", "/confidentialite", "/mentions-legales", "/credits"]) {
      await p.goto(adresse(langue, page), { waitUntil: "networkidle" });
      const attendu = `${langue}/${langue === "he" ? "rtl" : "ltr"}`;
      if ((await langueDeLaPage(p)) !== attendu) throw new Error(`ÉCHEC : ${page} en ${langue} : ${await langueDeLaPage(p)}`);
      if (await deborde(p)) throw new Error(`ÉCHEC : ${page} en ${langue} : plus large que l'écran`);
      if (oubli(await p.locator("body").innerText())) throw new Error(`ÉCHEC : ${page} en ${langue} : une {valeur} est restée dans la page`);
      // Tous les liens de la page restent dans la langue (sauf l'espace gérant, qui n'en a pas).
      const ailleurs = await p.locator('a[href^="/"]').evaluateAll((liens, l) => liens.map((a) => a.getAttribute("href")).filter((h) => h !== "/admin" && (l === "fr" ? /^\/(en|ru|he|es)(\/|$)/.test(h) : !(h === `/${l}` || h.startsWith(`/${l}/`) || h.startsWith(`/${l}?`)))), langue);
      if (ailleurs.length) throw new Error(`ÉCHEC : ${page} en ${langue} : liens hors de la langue ${JSON.stringify(ailleurs.slice(0, 5))}`);
    }
    if (OUT) await p.screenshot({ path: `${OUT}/langues-${langue}-conditions.png` });
    await ctx.close();
    ok(`${langue} : 11 pages à l'adresse de la langue, ${langue === "he" ? "de droite à gauche" : "de gauche à droite"}, sans débordement, tous leurs liens dans la langue`);
  }

  // 2. Sans choix : la langue du navigateur ; inconnue : le français
  for (const [locale, attendu, ou] of [["ru-RU", "ru/ltr", "/ru/contact"], ["he-IL", "he/rtl", "/he/contact"], ["de-DE", "fr/ltr", "/contact"], ["fr-FR", "fr/ltr", "/contact"]]) {
    const { ctx, p } = await contexte(nav, null, { locale });
    await p.goto(BASE + "/contact", { waitUntil: "networkidle" });
    verifier((await langueDeLaPage(p)) === attendu && chemin(p) === ou, `navigateur ${locale} sur /contact → ${ou} (${attendu})`);
    await ctx.close();
  }

  // 2 bis. Ce que lit un moteur de recherche (il ne demande aucune langue) : le français sans préfixe,
  //        chaque langue à son adresse, avec l'adresse de référence, les équivalents et la carte d'aperçu
  const lire = (page) => fetch(BASE + page, { headers: { "accept-language": "" }, redirect: "manual" });
  const accueil = await lire("/");
  const html = await accueil.text();
  verifier(accueil.status === 200 && html.includes('<html lang="fr" dir="ltr"'), "moteur de recherche sur / : le français, sans redirection");
  verifier(/<link rel="canonical" href="https?:\/\/[^"\/]+\/?"/.test(html) && ["en", "ru", "he", "es"].every((l) => new RegExp(`<link rel="alternate" hrefLang="${l}" href="[^"]*/${l}"`, "i").test(html)) && /hrefLang="x-default"/i.test(html), "accueil : adresse de référence et équivalents dans les cinq langues");
  const hebreu = await (await lire("/he/categorie/boissons")).text();
  verifier(hebreu.includes('<html lang="he" dir="rtl"') && /<link rel="canonical" href="[^"]*\/he\/categorie\/boissons"/.test(hebreu) && /property="og:image" content="[^"]*\/apercu\/he"/.test(hebreu), "/he/categorie/boissons : en hébreu, référence à sa propre adresse, carte d'aperçu en hébreu");
  verifier((await lire("/fr/contact")).status === 308 && (await lire("/he/admin")).status === 307, "« /fr/… » revient à l'adresse sans préfixe ; « /he/admin » à l'espace gérant");
  for (const l of LANGUES) {
    const image = await fetch(`${BASE}/apercu/${l}`);
    if (image.status !== 200 || image.headers.get("content-type") !== "image/png") throw new Error(`ÉCHEC : carte d'aperçu ${l} : ${image.status}`);
  }
  ok("carte d'aperçu : une image par langue");
  const plan = await (await fetch(BASE + "/sitemap.xml")).text();
  verifier(plan.includes("/he/contact</loc>") && plan.includes('hreflang="ru"') && (await (await fetch(BASE + "/robots.txt")).text()).includes("Disallow: /he/panier"), "plan du site : chaque page dans chaque langue ; robots : les pages privées fermées à chaque adresse");

  // 3. Le catalogue dans la langue du client : les articles, leurs options, la recherche
  const francais = await contexte(nav, "fr");
  await francais.p.goto(adresse("fr", "/categorie/courses-epicerie"), { waitUntil: "networkidle" });
  const nomFr = (await francais.p.locator("article h3").first().innerText()).trim();
  await francais.p.goto(adresse("fr", "/categorie/bebe-enfants"), { waitUntil: "networkidle" });
  const rangCouches = (await francais.p.locator("article h3").allInnerTexts()).findIndex((n) => n.includes("Couches Huggies"));
  await francais.ctx.close();
  verifier(rangCouches >= 0, "jeu de test : « Couches Huggies » (article à options) est en vente");

  const russe = await contexte(nav, "ru");
  await russe.p.goto(adresse("ru", "/categorie/courses-epicerie"), { waitUntil: "networkidle" });
  const nomsRu = await russe.p.locator("article h3").allInnerTexts();
  verifier(nomsRu.length > 0 && nomsRu.every((n) => /[\u0400-\u04ff]/.test(n)), `catalogue en russe : ${nomsRu.length} articles du rayon ont leur nom en russe (« ${nomFr} » → « ${nomsRu[0].trim()} »)`);
  // La recherche de l'en-tête reste à l'adresse de la langue.
  await russe.p.fill("#recherche", "молоко");
  await russe.p.press("#recherche", "Enter");
  await russe.p.waitForURL(/\/ru\/recherche\?q=/);
  await russe.p.waitForLoadState("networkidle");
  verifier((await russe.p.locator("article").count()) > 0, "recherche en russe : « молоко » trouve le lait");
  await russe.p.goto(adresse("ru", "/recherche?q=lait"), { waitUntil: "networkidle" });
  verifier((await russe.p.locator("article").count()) > 0, "recherche en russe : le nom français « lait » se trouve toujours");
  await russe.ctx.close();

  // 4. Une commande en hébreu : refusée tant qu'il manque une coordonnée
  const { ctx, p } = await contexte(nav, "he");
  await p.goto(adresse("he", "/categorie/courses-epicerie"), { waitUntil: "networkidle" });
  const nomHe = (await p.locator("article h3").first().innerText()).trim();
  verifier(/[\u0590-\u05ff]/.test(nomHe) && nomHe !== nomFr, `catalogue en hébreu : « ${nomFr} » → « ${nomHe} »`);
  await p.locator("article button.border-slate-300").first().click();
  // Un article à options : la fiche montre « Taille » et ses choix dans la langue du client
  await p.goto(adresse("he", "/categorie/bebe-enfants"), { waitUntil: "networkidle" });
  await p.locator("article").nth(rangCouches).locator("h3 button").click();
  const fiche = p.locator("dialog[open]");
  await fiche.waitFor();
  const groupeHe = (await fiche.locator("legend bdi").first().innerText()).trim();
  verifier(/[\u0590-\u05ff]/.test(groupeHe), `fiche en hébreu : l'option « Taille » s'appelle « ${groupeHe} »`);
  await fiche.locator("label.pastille", { hasText: /^\s*4/ }).first().click();
  await fiche.locator("button.bouton").click();
  await fiche.waitFor({ state: "hidden" });
  // Le lien du panier, dans l'en-tête, mène au panier en hébreu.
  await p.locator('header a[href="/he/panier"]').click();
  await p.waitForURL(/\/he\/panier$/);
  await p.waitForSelector("#nomClient");
  const panier = await p.locator("section[aria-labelledby=section-1]").innerText();
  verifier(panier.includes(nomHe) && panier.includes(groupeHe) && !panier.includes("Taille"), "panier en hébreu : noms d'articles et options dans la langue du client");
  await p.locator('button[type="submit"]').click();
  await p.waitForSelector("#logement-erreur");
  for (const champ of ["nomClient", "telephone", "email", "ville", "logement"]) {
    verifier((await p.locator(`#${champ}-erreur`).count()) === 1, `sans ${champ} : commande refusée, message sous le champ`);
  }
  verifier(/[֐-׿]/.test(await p.locator("#logement-erreur").innerText()), "les messages d'erreur sont en hébreu");
  await p.waitForFunction(() => document.activeElement?.id === "nomClient");
  ok("le premier champ à corriger reçoit le curseur");

  const email = `langues.${Date.now() % 1000000}@exemple.test`;
  const nom = `Dana Levi ${Date.now() % 1000}`;
  await p.fill("#nomClient", nom);
  await p.fill("#telephone", "+972 50 123 4567");
  await p.fill("#email", email);
  await p.selectOption("#ville", "Netanya");
  // Où le client loge. À l'hôtel : l'avis « nous ne montons pas dans les chambres », en hébreu, et ni étage ni code.
  const logement = (valeur) => p.locator("label.pastille", { has: p.locator(`input[name="logement"][value="${valeur}"]`) });
  await logement("HOTEL").click();
  const avisHotel = await p.locator("p[role=note]").innerText();
  verifier(/[֐-׿]/.test(avisHotel) && !oubli(avisHotel) && (await p.locator("#etage").count()) === 0 && (await p.locator("#codeEntree").count()) === 0, "hôtel : l'avis est en hébreu, ni étage ni code d'entrée demandés");
  await logement("MAISON").click();
  verifier((await p.locator("#etage").count()) === 0 && (await p.locator("#appartement").count()) === 0 && (await p.locator("#adresse").count()) === 1, "maison : la rue seulement, ni étage ni appartement");
  await logement("APPARTEMENT").click();
  await p.fill("#adresse", "Herzl 12");
  await p.fill("#appartement", "12");
  await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.activeElement?.id === "etage");
  verifier(chemin(p) === "/he/panier" && (await p.locator("#appartement-erreur").count()) === 0, "sans l'étage seulement : toujours refusée, le curseur va sur l'étage");
  await p.fill("#etage", "3");
  await p.fill("#codeEntree", "1234#");
  if (OUT) await p.screenshot({ path: `${OUT}/langues-he-panier.png`, fullPage: true });
  await p.locator('button[type="submit"]').click();
  await p.waitForURL(/\/he\/suivi\//);
  ok("commande passée : le suivi s'ouvre à son adresse en hébreu (/he/suivi/…)");
  await p.waitForLoadState("networkidle");
  const suivi = await p.locator("main").innerText();
  verifier(suivi.includes("Herzl 12") && suivi.includes("1234#") && suivi.includes("+972 50 123 4567") && !oubli(suivi), "suivi : rue, étage, code et téléphone affichés");
  verifier(suivi.includes(nomHe) && suivi.includes(groupeHe) && suivi.includes("נתניה") && !suivi.includes("Taille"), "suivi : articles, options et ville en hébreu");
  // La référence de la commande : les initiales de Dana Levi et un nombre — jamais « מס' 1 ».
  const reference = (/DL-\d{5,}/.exec(suivi) ?? [""])[0];
  verifier(reference !== "" && !/מס' ?\d/.test(suivi), `suivi : la commande porte sa référence (${reference}), pas son numéro`);
  verifier(!(await deborde(p)), "suivi en hébreu : pas de débordement");
  if (OUT) await p.screenshot({ path: `${OUT}/langues-he-suivi.png`, fullPage: true });

  // 5. L'e-mail du client est en hébreu ; l'avis au gérant en français, avec l'adresse entière
  const confirmation = await courriel(email);
  verifier(confirmation.includes(nomHe) && confirmation.includes(groupeHe) && !confirmation.includes("Couches Huggies"), "e-mail de confirmation : articles et options en hébreu");
  verifier(/href="[^"]*\/he\/suivi\/[^"]+"/.test(confirmation), "e-mail de confirmation : le lien de suivi mène à l'adresse en hébreu");
  verifier(confirmation.includes(reference) && !/מס' ?\d/.test(confirmation), "e-mail de confirmation : la même référence, pas de numéro");
  verifier(confirmation.includes('<html lang="he" dir="rtl">') && confirmation.includes("Herzl 12") && confirmation.includes("1234#") && !oubli(confirmation), "e-mail de confirmation en hébreu, avec l'adresse entière");
  if (process.env.EMAIL_GERANT || existsSync(BOITE)) {
    const avis = await courriel("gerant@exemple.test").catch(() => null);
    if (avis) verifier(avis.includes("Étage 3 · Appt / chambre 12 · Code 1234#") && avis.includes("Langue du client") && avis.includes("Couches Huggies") && avis.includes("Taille : 4"), "avis au gérant : en français (articles compris), étage, appartement, code, langue du client");
  }

  // 6. L'espace client : étage et appartement enregistrés ; le client y change sa langue
  const lien = /href="([^"]*\/compte\/acces\?jeton=[^"]+)"/.exec(confirmation)[1].replace(/&amp;/g, "&");
  await p.goto(lien, { waitUntil: "networkidle" });
  verifier(chemin(p) === "/he/compte" && (await p.inputValue("#profil-logement")) === "APPARTEMENT" && (await p.inputValue("#profil-etage")) === "3" && (await p.inputValue("#profil-appartement")) === "12", "espace client : le lien de l'e-mail mène à /he/compte, avec le logement, l'étage et l'appartement de la commande");
  await p.fill("#profil-codeEntree", "9999");
  await p.selectOption("#langue-compte", "ru");
  await p.waitForFunction(() => document.documentElement.lang === "ru" && location.pathname === "/ru/compte");
  verifier((await langueDeLaPage(p)) === "ru/ltr" && (await p.locator("header a").first().getAttribute("href")) === "/ru", "espace client : le client passe au russe — l'adresse devient /ru/compte, l'en-tête suit");
  verifier((await p.inputValue("#profil-codeEntree")) === "9999", "changer de langue ne vide pas ce qui est en cours de saisie");
  await p.selectOption("#langue-entete", "en");
  await p.waitForFunction(() => document.documentElement.lang === "en" && location.pathname === "/en/compte");
  ok("en-tête : passage à l'anglais, à l'adresse /en/compte");
  await p.selectOption("#langue-entete", "fr");
  await p.waitForFunction(() => document.documentElement.lang === "fr" && location.pathname === "/compte");
  ok("retour au français : l'adresse sans préfixe");
  await p.selectOption("#langue-entete", "en");
  await p.waitForFunction(() => document.documentElement.lang === "en" && location.pathname === "/en/compte");
  await ctx.close();

  // 7. Sur un autre appareil (navigateur en français), la connexion ramène la langue choisie
  const autre = await contexte(nav, null, { locale: "fr-FR" });
  await autre.p.goto(lien, { waitUntil: "networkidle" });
  verifier((await langueDeLaPage(autre.p)) === "en/ltr" && chemin(autre.p) === "/en/compte", "autre appareil : après connexion, l'espace client à l'adresse de sa langue (/en/compte)");
  await autre.ctx.close();

  // 8. L'espace gérant : en français, de gauche à droite, même quand le site est en hébreu ;
  //    la commande y porte l'adresse entière, la langue du client et un message WhatsApp en hébreu
  const gerant = await contexte(nav, "he", devices["Desktop Chrome"]);
  const a = gerant.p;
  await a.goto(BASE + "/admin/connexion");
  await a.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await a.getByRole("button", { name: "Se connecter" }).click();
  await a.waitForURL(BASE + "/admin");
  verifier((await a.evaluate(() => getComputedStyle(document.querySelector("main")).direction)) === "ltr" && (await a.locator("header").innerText()).includes("Commandes"), "espace gérant : en français, de gauche à droite");
  await a.getByText(nom).first().click();
  await a.waitForURL(/\/admin\/commandes\//);
  const commande = await a.locator("main").innerText();
  verifier(commande.includes("Étage 3 · Appt / chambre 12 · Code 1234#") && commande.includes("Langue du client"), "gérant : étage, appartement, code et langue du client sur la commande");
  verifier(commande.includes(nomFr) && commande.includes("Couches Huggies") && commande.includes("Taille : 4"), "gérant : les articles et leurs options restent en français sur la commande (avec, dessous, leur nom en hébreu pour Wolt)");
  const message = decodeURIComponent((await a.locator('a[href*="wa.me"]').first().getAttribute("href")).split("text=")[1]);
  verifier(/[֐-׿]/.test(message) && message.includes("/he/suivi/") && !oubli(message), "le message WhatsApp du gérant au client est en hébreu, avec le lien de suivi en hébreu");
  verifier((await a.evaluate(() => `${document.documentElement.lang}/${document.documentElement.dir}`)) === "fr/ltr", "espace gérant : la page entière est en français, même avec un site en hébreu");
  await gerant.ctx.close();
} finally {
  await nav.close();
}
console.log(erreurs.length ? `Erreurs JS :\n${erreurs.join("\n")}` : "Erreurs JS : aucune");
if (erreurs.length) process.exit(1);
