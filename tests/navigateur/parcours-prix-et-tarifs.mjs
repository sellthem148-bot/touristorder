// Prix rapides, tarifs selon le moment, frais regroupés.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");
const deborde = async (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || window.innerWidth > window.screen.width);

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
const admin = await ctx.newPage();
const client = await ctx.newPage();
for (const p of [admin, client]) p.on("pageerror", (e) => erreurs.push(String(e)));

try {
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");

  // 1. Produits : filtre « À compléter »
  await admin.goto(BASE + "/admin/produits?etat=a-completer");
  verifier(await admin.getByText("Prix à définir").first().isVisible(), "liste produits : « Prix à définir » pour la base sans prix");
  const masque = admin.getByRole("button", { name: "Afficher Lait sans lactose 1 L" });
  await masque.click();
  await admin.getByText("n'a pas encore de prix").waitFor();
  ok("impossible de mettre en ligne un article sans prix");

  // 2. Prix rapides
  await admin.goto(BASE + "/admin/produits/prix");
  await admin.getByRole("heading", { name: "Prix rapides" }).waitFor();
  verifier(await admin.getByRole("link", { name: /À compléter/ }).getAttribute("aria-current") === "page", "prix rapides : ouvre sur « À compléter »");
  verifier(!(await deborde(admin)), "prix rapides : pas de défilement horizontal");
  await admin.screenshot({ path: `${OUT}/v3-1-prix-rapides.png` });
  await admin.getByLabel("Prix ₪").first().waitFor();
  await admin.locator('input[name^="prix_"]').nth(0).fill("12,50");
  await admin.locator('input[name^="prix_"]').nth(1).fill("abc");
  await admin.getByRole("button", { name: /^Enregistrer les/ }).click();
  await admin.getByText(/Rien n'a été enregistré/).waitFor();
  ok("une valeur illisible : rien n'est enregistré, l'article fautif est nommé");

  // Catégorie Boissons : trois prix, un achat, un laissé vide
  await admin.goto(BASE + "/admin/produits/prix");
  await admin.getByRole("link", { name: /Boissons/ }).click();
  await admin.waitForURL(/categorie=/);
  const ligne = (nom) => admin.locator("li", { has: admin.getByRole("link", { name: nom, exact: true }) });
  await ligne("Eau gazeuse 1,5 L").locator('input[name^="prix_"]').fill("6,90");
  await ligne("Eau gazeuse 1,5 L").locator('input[name^="achat_"]').fill("4,50");
  await ligne("Glaçons 2 kg").locator('input[name^="prix_"]').fill("12");
  await ligne("Thé glacé 1,5 L").locator('input[name^="prix_"]').fill("");
  await admin.getByRole("button", { name: /^Enregistrer les/ }).click();
  await admin.getByText(/article.* enregistré/).waitFor();
  const message = await admin.getByRole("status").innerText();
  verifier(/2 articles enregistrés, dont 2 en ligne/.test(message), `prix rapides : « ${message} »`);

  await client.goto(BASE + "/categorie/boissons");
  const page = espaces(await client.locator("main").innerText());
  verifier(page.includes("Eau gazeuse 1,5 L") && page.includes("6,90") && page.includes("Glaçons 2 kg"), "les articles chiffrés sont en ligne");
  verifier(!page.includes("Thé glacé"), "un article laissé sans prix reste masqué");
  verifier(!(await client.content()).includes("4,50"), "le prix d'achat n'apparaît pas côté client");

  // 3. Tarifs : page et grille
  await admin.goto(BASE + "/admin/tarifs");
  await admin.getByRole("heading", { name: "La semaine en un coup d'œil" }).waitFor();
  verifier((await admin.locator("table td").count()) === 7 * 24, "grille : 7 jours × 24 heures");
  verifier(await admin.getByTitle("Ven 10h : Week-end").isVisible(), "grille : vendredi 10h = Week-end");
  verifier(await admin.getByTitle("Mar 23h : Fin de soirée").isVisible(), "grille : mardi 23h = Fin de soirée");
  verifier(await admin.getByTitle("Mar 12h : Tarif de base").isVisible(), "grille : mardi 12h = tarif de base");
  verifier(!(await deborde(admin)), "tarifs : pas de défilement horizontal");
  await admin.screenshot({ path: `${OUT}/v3-2-tarifs.png`, fullPage: true });

  // Modifier une plage : livraison de nuit à 50 ₪
  const nuit = admin.locator("details", { hasText: "Fin de soirée" });
  await nuit.locator("summary").click();
  await nuit.getByLabel("Livraison (₪)").fill("50");
  await nuit.getByRole("button", { name: "Enregistrer" }).click();
  await admin.getByText("Tarif « Fin de soirée » enregistré.").waitFor();
  ok("plage modifiée");

  // Une plage mal saisie est refusée
  const ajout = admin.locator("section", { hasText: "Ajouter une plage" });
  await ajout.getByLabel("Nom").fill("Test");
  for (const j of ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]) await ajout.getByText(j, { exact: true }).click();
  await ajout.getByRole("button", { name: "Ajouter" }).click();
  await admin.getByText(/Coche au moins un jour/).waitFor();
  ok("plage sans jour refusée");

  // 4. Panier : le tarif suit le jour et le créneau choisis
  await client.goto(BASE + "/");
  await client.getByRole("button", { name: "Ajouter Bamba au panier" }).first().click().catch(async () => {
    await client.getByRole("button", { name: "Choisir les options de Bamba" }).first().click();
  });
  if (await client.getByRole("dialog").isVisible().catch(() => false)) {
    await client.getByRole("dialog").getByText("Petit", { exact: true }).click();
    await client.getByRole("dialog").getByRole("button", { name: /^Ajouter ·/ }).click();
  }
  await client.goto(BASE + "/categorie/courses-epicerie");
  await client.getByRole("button", { name: "Ajouter Lait 3 % 1 L au panier" }).click();
  await client.goto(BASE + "/panier");
  await client.getByText("Bamba").first().waitFor();

  await client.getByText("Demain", { exact: true }).click();
  await client.getByText("19:00 – 20:00", { exact: true }).click();
  let info = espaces(await client.locator("p[aria-live=polite]").innerText());
  verifier(info.startsWith("Tarif normal"), `demain 19h : ${info}`);
  verifier(espaces(await client.getByRole("button", { name: /^Commander/ }).innerText()).includes("61,80"), "demain 19h : 6,90 + 9,90 + 15 + 30 = 61,80");

  await client.getByText("22:00 – 23:00", { exact: true }).click();
  info = espaces(await client.locator("p[aria-live=polite]").innerText());
  verifier(info.includes("fin de soirée") && info.includes("service 15 ₪, livraison 50 ₪") && info.includes("+10 %"), `demain 22h : ${info}`);
  verifier((await client.getByText(/Express · \+/).count()) === 0, "pas d'express en fin de soirée (express à 0 dans la plage)");
  const total = espaces(await client.getByRole("button", { name: /^Commander/ }).innerText());
  verifier(total.includes("83,48"), `fin de soirée : 16,80 + 1,68 (10 %) + 15 + 50 = 83,48 (lu : ${total})`);
  verifier(await client.getByText("Supplément fin de soirée (+10 %)").isVisible(), "ligne « Supplément fin de soirée (+10 %) »");

  const vendredi = client.locator("label", { hasText: /^Vendredi/ });
  await vendredi.click();
  await client.getByText("19:00 – 20:00", { exact: true }).click();
  info = espaces(await client.locator("p[aria-live=polite]").innerText());
  verifier(info.includes("week-end") && info.includes("livraison 40 ₪"), `vendredi 19h : ${info}`);
  verifier(espaces(await client.getByRole("button", { name: /^Commander/ }).innerText()).includes("76,80"), "week-end : 16,80 + 20 + 40 = 76,80");
  await client.screenshot({ path: `${OUT}/v3-3-panier-weekend.png`, fullPage: true });

  // 5. Commande de nuit, puis article indisponible : la majoration suit
  await client.getByText("Demain", { exact: true }).click();
  await client.getByText("22:00 – 23:00", { exact: true }).click();
  await client.getByLabel("Votre nom").fill("David Lévy");
  await client.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 11 22 33 44");
  await client.getByLabel("Votre adresse e-mail").fill(`client${Date.now() % 100000}@exemple.test`);
  await client.getByLabel("Ville").selectOption("Netanya");
  await client.getByLabel("Rue et numéro, ou nom de l'hôtel").fill("Hôtel Carlton, chambre 210"); await client.getByLabel("Étage", { exact: true }).fill("3"); await client.getByLabel("N° d'appartement ou de chambre").fill("12");
  await client.getByRole("button", { name: /^Commander/ }).click();
  await client.waitForURL(/\/suivi\//);
  await client.getByText("Merci, votre commande est enregistrée.").waitFor();
  const suivi = espaces(await client.locator("main").innerText());
  verifier(suivi.includes("Supplément fin de soirée (+10 %)") && suivi.includes("83,48"), "suivi : supplément de fin de soirée et total 83,48");
  const urlSuivi = client.url().replace("?nouvelle=1", "");

  await admin.goto(BASE + "/admin");
  await admin.getByText("David Lévy").first().click();
  await admin.waitForURL(/\/admin\/commandes\//);
  verifier(await admin.getByText("Fin de soirée", { exact: true }).isVisible(), "admin : le tarif appliqué est indiqué");
  const lait = admin.locator("li", { hasText: "Lait 3 % 1 L" });
  await lait.getByRole("checkbox").check();
  await lait.getByRole("button", { name: "OK" }).click();
  await admin.waitForTimeout(800);
  const encaisser = espaces(await admin.locator("div", { hasText: /^Total de la commande/ }).locator("dd").innerText());
  verifier(encaisser.includes("72,59"), `lait indispo : 6,90 + 0,69 + 15 + 50 = 72,59 (lu : ${encaisser})`);
  await admin.screenshot({ path: `${OUT}/v3-4-admin-commande-nuit.png`, fullPage: true });

  // 6. Frais regroupés
  await admin.goto(BASE + "/admin/reglages");
  await admin.getByText("Afficher « Frais de service (livraison comprise) »").click();
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  await client.goto(urlSuivi);
  verifier(await client.getByText("Frais de service (livraison comprise)").isVisible(), "suivi : une seule ligne « livraison comprise »");
  verifier((await client.getByText("Frais de service", { exact: true }).count()) === 0, "suivi : plus de ligne séparée");
  verifier(espaces(await client.locator("main").innerText()).includes("65,00"), "suivi : service + livraison = 15 + 50 = 65,00");
  await client.goto(BASE + "/");
  verifier(espaces(await client.locator("main").innerText()).includes("Service + livraison"), "accueil : « Service + livraison »");
  await admin.goto(BASE + "/admin/reglages");
  await admin.getByText("Afficher « Frais de service (livraison comprise) »").click();
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  ok("frais regroupés désactivés à nouveau");
} finally {
  writeFileSync(`${OUT}/resultat3.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
