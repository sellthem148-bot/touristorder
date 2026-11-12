// Le repère Wolt du gérant : sous chaque article de la liste de courses (Ma journée, commande) et de
// « Prix rapides », son nom en hébreu à copier dans la recherche de Wolt et un lien pour le voir en images.
// À lancer sur la base de test (npm run seed:demo). Crée une commande.
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const ok = (m) => console.log("✓", m);
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const HEBREU = /[֐-׿]/;
const deborde = async (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || window.innerWidth > window.screen.width);

const navigateur = await chromium.launch();
try {
  // 1. Un client commande un pack d'eau
  const ctxClient = await navigateur.newContext({ ...devices["iPhone 13"] });
  const client = await ctxClient.newPage();
  client.on("pageerror", (e) => erreurs.push(String(e)));
  await client.goto(BASE + "/");
  await client.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await client.goto(BASE + "/panier");
  const jour = client.locator('input[name="dateLivraison"]').nth(3);
  const valeurJour = await jour.getAttribute("value");
  await jour.check({ force: true });
  await client.locator('input[name="creneau"]').first().check({ force: true });
  await client.getByLabel("Votre nom").fill("Repère Test");
  await client.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 21 43 65 87");
  await client.getByLabel("Votre adresse e-mail").fill(`repere${Date.now() % 100000}@exemple.test`);
  await client.getByLabel("Ville").selectOption("Netanya");
  await client.getByLabel("Rue et numéro, ou nom de l'hôtel").fill("12 rue Herzl");
  await client.getByLabel("Étage", { exact: true }).fill("3");
  await client.getByLabel("N° d'appartement ou de chambre").fill("12");
  await client.getByText("Bit", { exact: true }).click();
  await client.getByRole("button", { name: /^Commander/ }).click();
  await client.waitForURL(/\/suivi\//);
  ok(`commande passée pour le ${valeurJour}`);
  // Côté client, rien du repère : ni hébreu ajouté, ni lien d'images.
  verifier(!(await client.content()).includes("google.com/search"), "page du client : aucun lien de recherche d'images");
  await ctxClient.close();

  // 2. Le gérant : paiement reçu, puis la liste de courses de « Ma journée »
  const ctx = await navigateur.newContext({ ...devices["iPhone 13"], permissions: ["clipboard-read", "clipboard-write"] });
  const admin = await ctx.newPage();
  admin.on("pageerror", (e) => erreurs.push(String(e)));
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");
  await admin.goto(`${BASE}/admin/journee?jour=${valeurJour}`);
  await admin.locator("section", { hasText: "1. Paiements à recevoir" }).getByRole("button", { name: /Paiement reçu/ }).first().click();
  await admin.waitForLoadState("networkidle");
  await admin.goto(`${BASE}/admin/journee?jour=${valeurJour}`);
  const wolt = admin.locator("section", { hasText: "2. À commander sur Wolt" });
  const ligne = wolt.locator("li", { hasText: "Pack d'eau 6 × 1,5 L" }).first();
  await ligne.waitFor();
  const texte = await ligne.innerText();
  verifier(HEBREU.test(texte), `Ma journée : le nom en hébreu est sous l'article (« ${texte.replace(/\s+/g, " ").slice(0, 90)} »)`);
  verifier(texte.includes("traduction"), "Ma journée : prévenu que c'est une traduction, pas le nom exact de Wolt");
  await ligne.getByRole("button", { name: /Copier le nom en hébreu/ }).click();
  await ligne.getByText("Copié").waitFor();
  const colle = await admin.evaluate(() => navigator.clipboard.readText());
  verifier(HEBREU.test(colle) && texte.includes(colle), `bouton « Copier » : le nom en hébreu est dans le presse-papiers (« ${colle} »)`);
  const images = await ligne.getByRole("link", { name: /en images/ }).getAttribute("href");
  verifier(images.startsWith("https://www.google.com/search?tbm=isch&q=") && decodeURIComponent(images).includes(colle), "lien « Images » : une recherche d'images sur le nom en hébreu");
  verifier(!(await deborde(admin)), "Ma journée : pas de défilement horizontal sur téléphone");
  if (OUT) await wolt.screenshot({ path: `${OUT}/repere-journee.png` });

  // 3. La commande : même repère dans sa liste de courses, et dans la liste copiée
  await admin.goto(BASE + (await admin.locator('a[href^="/admin/commandes/"]').first().getAttribute("href")));
  const courses = admin.locator("section", { hasText: "Liste de courses" }).first();
  verifier(HEBREU.test(await courses.innerText()), "commande : le nom en hébreu est dans la liste de courses");
  await courses.getByRole("button", { name: "Copier la liste" }).click();
  const liste = await admin.evaluate(() => navigator.clipboard.readText());
  verifier(/Pack d'eau 6 × 1,5 L — /.test(liste) && HEBREU.test(liste), "commande : la liste copiée porte aussi le nom en hébreu");
  verifier(!(await deborde(admin)), "commande : pas de défilement horizontal sur téléphone");
  if (OUT) await courses.screenshot({ path: `${OUT}/repere-commande.png` });

  // 4. « Prix rapides » : chaque article a son repère
  await admin.goto(BASE + "/admin/produits/prix");
  const lignes = admin.locator("form li");
  const nombre = await lignes.count();
  const avecImages = await admin.getByRole("link", { name: /en images/ }).count();
  verifier(nombre > 0 && avecImages === nombre, `Prix rapides : un lien « Images » pour chacun des ${nombre} articles affichés`);
  const avecHebreu = await admin.getByRole("button", { name: /Copier le nom en hébreu/ }).count();
  verifier(avecHebreu >= nombre * 0.9, `Prix rapides : le nom en hébreu pour ${avecHebreu} articles sur ${nombre}`);
  verifier(!(await deborde(admin)), "Prix rapides : pas de défilement horizontal sur téléphone");
  await admin.setViewportSize({ width: 320, height: 640 });
  verifier(!(await deborde(admin)), "Prix rapides : pas de défilement horizontal sur un petit téléphone (320 px)");
  if (OUT) await admin.screenshot({ path: `${OUT}/repere-prix.png` });
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  if (erreurs.length) process.exitCode = 1;
} finally {
  await navigateur.close();
}
