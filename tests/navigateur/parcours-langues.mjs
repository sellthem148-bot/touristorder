// Les cinq langues du site (français, anglais, russe, hébreu, espagnol) et l'adresse obligatoire :
// chaque page dans chaque langue (sens d'écriture, largeur), une commande refusée tant qu'il manque
// le nom, le téléphone, la rue, l'étage ou l'appartement, l'e-mail et le message du gérant dans la langue
// du client, le choix de la langue dans l'espace client. L'espace gérant reste en français.
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
    for (const chemin of ["/", "/categorie/courses-epicerie", "/recherche?q=zzzz", "/panier?demande=", "/compte/connexion", "/commandes", "/contact", "/conditions", "/confidentialite", "/mentions-legales", "/credits"]) {
      await p.goto(BASE + chemin, { waitUntil: "networkidle" });
      const attendu = `${langue}/${langue === "he" ? "rtl" : "ltr"}`;
      if ((await langueDeLaPage(p)) !== attendu) throw new Error(`ÉCHEC : ${chemin} en ${langue} : ${await langueDeLaPage(p)}`);
      if (await deborde(p)) throw new Error(`ÉCHEC : ${chemin} en ${langue} : plus large que l'écran`);
      if (oubli(await p.locator("body").innerText())) throw new Error(`ÉCHEC : ${chemin} en ${langue} : une {valeur} est restée dans la page`);
    }
    if (OUT) await p.screenshot({ path: `${OUT}/langues-${langue}-conditions.png` });
    await ctx.close();
    ok(`${langue} : 11 pages dans la langue, ${langue === "he" ? "de droite à gauche" : "de gauche à droite"}, sans débordement`);
  }

  // 2. Sans choix : la langue du navigateur ; inconnue : le français
  for (const [locale, attendu] of [["ru-RU", "ru/ltr"], ["he-IL", "he/rtl"], ["de-DE", "fr/ltr"]]) {
    const { ctx, p } = await contexte(nav, null, { locale });
    await p.goto(BASE + "/", { waitUntil: "networkidle" });
    verifier((await langueDeLaPage(p)) === attendu, `navigateur ${locale} → ${attendu}`);
    await ctx.close();
  }

  // 3. Une commande en hébreu : refusée tant qu'il manque une coordonnée
  const { ctx, p } = await contexte(nav, "he");
  await p.goto(BASE + "/categorie/courses-epicerie", { waitUntil: "networkidle" });
  await p.locator("article button.border-slate-300").first().click();
  await p.goto(BASE + "/panier", { waitUntil: "networkidle" });
  await p.waitForSelector("#nomClient");
  await p.locator('button[type="submit"]').click();
  await p.waitForSelector("#etage-erreur");
  for (const champ of ["nomClient", "telephone", "email", "ville", "adresse", "etage", "appartement"]) {
    verifier((await p.locator(`#${champ}-erreur`).count()) === 1, `sans ${champ} : commande refusée, message sous le champ`);
  }
  verifier(/[֐-׿]/.test(await p.locator("#etage-erreur").innerText()), "les messages d'erreur sont en hébreu");
  await p.waitForFunction(() => document.activeElement?.id === "nomClient");
  ok("le premier champ à corriger reçoit le curseur");

  const email = `langues.${Date.now() % 1000000}@exemple.test`;
  const nom = `Dana Levi ${Date.now() % 1000}`;
  await p.fill("#nomClient", nom);
  await p.fill("#telephone", "+972 50 123 4567");
  await p.fill("#email", email);
  await p.selectOption("#ville", "Netanya");
  await p.fill("#adresse", "Herzl 12");
  await p.fill("#appartement", "12");
  await p.locator('button[type="submit"]').click();
  await p.waitForFunction(() => document.activeElement?.id === "etage");
  verifier(p.url().endsWith("/panier") && (await p.locator("#appartement-erreur").count()) === 0, "sans l'étage seulement : toujours refusée, le curseur va sur l'étage");
  await p.fill("#etage", "3");
  await p.fill("#codeEntree", "1234#");
  if (OUT) await p.screenshot({ path: `${OUT}/langues-he-panier.png`, fullPage: true });
  await p.locator('button[type="submit"]').click();
  await p.waitForURL(/\/suivi\//);
  await p.waitForLoadState("networkidle");
  const suivi = await p.locator("main").innerText();
  verifier(suivi.includes("Herzl 12") && suivi.includes("1234#") && suivi.includes("+972 50 123 4567") && !oubli(suivi), "suivi : rue, étage, code et téléphone affichés");
  verifier(!(await deborde(p)), "suivi en hébreu : pas de débordement");
  if (OUT) await p.screenshot({ path: `${OUT}/langues-he-suivi.png`, fullPage: true });

  // 4. L'e-mail du client est en hébreu ; l'avis au gérant en français, avec l'adresse entière
  const confirmation = await courriel(email);
  verifier(confirmation.includes('<html lang="he" dir="rtl">') && confirmation.includes("Herzl 12") && confirmation.includes("1234#") && !oubli(confirmation), "e-mail de confirmation en hébreu, avec l'adresse entière");
  if (process.env.EMAIL_GERANT || existsSync(BOITE)) {
    const avis = await courriel("gerant@exemple.test").catch(() => null);
    if (avis) verifier(avis.includes("Étage 3 · Appt / chambre 12 · Code 1234#") && avis.includes("Langue du client"), "avis au gérant : en français, étage, appartement, code, langue du client");
  }

  // 5. L'espace client : étage et appartement enregistrés ; le client y change sa langue
  const lien = /href="([^"]*\/compte\/acces\?jeton=[^"]+)"/.exec(confirmation)[1].replace(/&amp;/g, "&");
  await p.goto(lien, { waitUntil: "networkidle" });
  verifier(p.url().endsWith("/compte") && (await p.inputValue("#profil-etage")) === "3" && (await p.inputValue("#profil-appartement")) === "12", "espace client : étage et appartement de la commande");
  await p.selectOption("#langue-compte", "ru");
  await p.waitForFunction(() => document.documentElement.lang === "ru");
  verifier((await langueDeLaPage(p)) === "ru/ltr", "espace client : le client passe au russe, la page change tout de suite");
  await p.selectOption("#langue-entete", "en");
  await p.waitForFunction(() => document.documentElement.lang === "en");
  ok("en-tête : passage à l'anglais");
  await ctx.close();

  // 6. Sur un autre appareil (navigateur en français), la connexion ramène la langue choisie
  const autre = await contexte(nav, null, { locale: "fr-FR" });
  await autre.p.goto(lien, { waitUntil: "networkidle" });
  verifier((await langueDeLaPage(autre.p)) === "en/ltr", "autre appareil : après connexion, la langue du client (anglais)");
  await autre.ctx.close();

  // 7. L'espace gérant : en français, de gauche à droite, même quand le site est en hébreu ;
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
  const message = decodeURIComponent((await a.locator('a[href*="wa.me"]').first().getAttribute("href")).split("text=")[1]);
  verifier(/[֐-׿]/.test(message) && message.includes("/suivi/") && !oubli(message), "le message WhatsApp du gérant au client est en hébreu");
  await gerant.ctx.close();
} finally {
  await nav.close();
}
console.log(erreurs.length ? `Erreurs JS :\n${erreurs.join("\n")}` : "Erreurs JS : aucune");
if (erreurs.length) process.exit(1);
