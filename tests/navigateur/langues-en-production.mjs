// Les langues sur une VERSION DE PRODUCTION locale : là, les liens d'une page sont préchargés en arrière-plan,
// ce que le serveur de développement ne fait pas — un choix de langue défait par ce préchargement ne se voit qu'ici.
//   npm run build && npx next start -p 3101      puis      BASE_URL=http://localhost:3101 node tests/navigateur/langues-en-production.mjs
// Un téléphone en hébreu commande, change de langue en pleine saisie, revient au français. Crée une commande :
// jamais sur le vrai site. (Les e-mails ne partent pas dans ce mode : ils sont vérifiés par parcours-langues.mjs.)
import { chromium, devices } from "playwright";
const B = process.env.BASE_URL || "http://localhost:3101";
const nav = await chromium.launch();
const erreurs = [];
const ok = (c, m) => { console.log(`${c ? "OK " : "KO "} ${m}`); if (!c) erreurs.push(m); };
const etat = (p) => p.evaluate(() => `${location.pathname} ${document.documentElement.lang}/${document.documentElement.dir}`);
const ctx = await nav.newContext({ ...devices["iPhone 13"], locale: "he-IL" });
const p = await ctx.newPage();
p.on("pageerror", (e) => erreurs.push("JS : " + String(e).slice(0, 200)));
await p.goto(B + "/", { waitUntil: "networkidle" });
await p.locator("#rayons li a").first().click();
await p.waitForURL(/\/he\/categorie\//);
await p.waitForLoadState("networkidle");
const nomHe = (await p.locator("article h3").first().innerText()).trim();
await p.locator("article button.border-slate-300").first().click();
await p.locator('header a[href="/he/panier"]').click();
await p.waitForURL(/\/he\/panier$/);
await p.waitForSelector("#nomClient");
ok((await p.locator("section[aria-labelledby=section-1]").innerText()).includes(nomHe), `panier en hébreu : « ${nomHe} »`);
await p.fill("#nomClient", "Dana Levi");
await p.fill("#telephone", "+972 50 123 4567");
await p.fill("#email", `prod.local.${Date.now() % 100000}@exemple.test`);
await p.selectOption("#ville", { index: 1 });
await p.fill("#adresse", "Herzl 12");
// Changement de langue en pleine saisie : l'adresse change, rien n'est perdu, les articles se traduisent
await p.selectOption("#langue-entete", "en");
await p.waitForFunction(() => document.documentElement.lang === "en" && location.pathname === "/en/panier", null, { timeout: 20000 }).catch(() => {});
ok((await etat(p)) === "/en/panier en/ltr", `passage à l'anglais dans le panier → ${await etat(p)}`);
ok((await p.inputValue("#nomClient")) === "Dana Levi" && (await p.inputValue("#adresse")) === "Herzl 12", "la saisie en cours est gardée");
await p.waitForFunction((he) => !document.querySelector("section[aria-labelledby=section-1]").innerText.includes(he), nomHe, { timeout: 15000 }).catch(() => {});
const panierEn = await p.locator("section[aria-labelledby=section-1] li").first().innerText();
ok(!panierEn.includes(nomHe) && !/[֐-׿]/.test(panierEn), `les articles du panier passent en anglais : « ${panierEn.split("\n")[0]} »`);
// Envoi sans étage ni appartement : refusé
await p.locator('button[type="submit"]').click();
await p.waitForSelector("#etage-erreur");
ok((await etat(p)).startsWith("/en/panier") && /floor/i.test(await p.locator("#etage-erreur").innerText()), "sans étage : refusé, message en anglais");
await p.fill("#etage", "3");
await p.fill("#appartement", "12");
await p.locator('button[type="submit"]').click();
await p.waitForURL(/\/en\/suivi\//, { timeout: 30000 });
await p.waitForLoadState("networkidle");
ok((await etat(p)).startsWith("/en/suivi/") && (await etat(p)).endsWith("en/ltr"), `commande passée → ${(await etat(p)).replace(/suivi\/.*? /, "suivi/… ")}`);
// Le panier est vidé ; les liens de la page restent en anglais ; retour au français, qui tient
ok((await p.locator('a[href^="/"]').evaluateAll((l) => l.map((a) => a.getAttribute("href")).filter((h) => h !== "/admin" && !h.startsWith("/en")))).length === 0, "tous les liens de la page de suivi restent en anglais");
await p.selectOption("#langue-entete", "fr");
await p.waitForFunction(() => document.documentElement.lang === "fr" && !location.pathname.startsWith("/en"), null, { timeout: 20000 }).catch(() => {});
ok((await etat(p)).endsWith("fr/ltr") && (await etat(p)).startsWith("/suivi/"), "retour au français sur la page de suivi");
await p.goto(B + "/", { waitUntil: "networkidle" });
ok((await etat(p)) === "/ fr/ltr", `puis l'accueil reste en français malgré le téléphone en hébreu → ${await etat(p)}`);
await nav.close();
console.log(erreurs.length ? `\n${erreurs.length} PROBLÈME(S) : ${erreurs.join(" | ")}` : "\nTout est bon.");
