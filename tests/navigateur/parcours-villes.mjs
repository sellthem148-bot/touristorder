// Villes livrées : supplément de livraison et minimum par ville, de l'admin au client.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");

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

  // 1. La liste de départ, autour de Netanya
  await admin.goto(BASE + "/admin/villes");
  await admin.getByRole("heading", { name: "Villes livrées" }).waitFor();
  const ligne = (nom) => admin.locator("li", { has: admin.locator(`input[value="${nom}"]`) });
  verifier((await admin.locator('input[name^="nom_"]').count()) >= 15, "liste de départ : au moins 15 villes");
  const recap = admin.locator("section", { hasText: "Prix de livraison par ville" });
  const cellule = (ville) => recap.locator("tr", { has: admin.getByRole("cell", { name: ville, exact: true }) });
  verifier(espaces(await cellule("Netanya").innerText()).includes("30 ₪"), "récap : Netanya = 30 ₪ en tarif de base");
  verifier(espaces(await cellule("Tel Aviv").innerText()).startsWith("Tel Aviv 55 ₪"), "récap : Tel Aviv = 30 + 25 = 55 ₪");

  // 2. Une valeur illisible : rien n'est enregistré
  await ligne("Herzliya").locator('input[name^="supp_"]').fill("vingt");
  await admin.getByRole("button", { name: "Enregistrer les villes" }).click();
  await admin.getByText(/Rien n'a été enregistré/).waitFor();
  ok("supplément illisible : rien n'est enregistré");

  // 3. Herzliya +20, Tel Aviv minimum 100, Udim retirée
  await ligne("Herzliya").locator('input[name^="supp_"]').fill("20");
  await ligne("Tel Aviv").locator('input[name^="min_"]').fill("100");
  await ligne("Udim").getByText("Retirer").click();
  await admin.getByRole("button", { name: "Enregistrer les villes" }).click();
  await admin.getByText("Villes enregistrées (1 retirée).").waitFor();
  ok("villes enregistrées");
  verifier(espaces(await cellule("Herzliya").innerText()).startsWith("Herzliya 50 ₪"), "récap : Herzliya = 30 + 20 = 50 ₪");
  verifier((await admin.locator('input[value="Udim"]').count()) === 0, "Udim retirée");

  // 4. Ajouter une ville, refuser un doublon
  const ajout = admin.locator("section", { hasText: "Ajouter une ville" });
  await ajout.getByLabel("Ville").fill("Kfar Vitkin");
  await ajout.getByLabel("Supplément ₪").fill("5");
  await ajout.getByRole("button", { name: "Ajouter" }).click();
  await admin.getByText("« Kfar Vitkin » ajoutée.").waitFor();
  await ajout.getByLabel("Ville").fill("netanya");
  await ajout.getByRole("button", { name: "Ajouter" }).click();
  await admin.getByText("« netanya » est déjà dans la liste.").waitFor();
  ok("ville ajoutée, doublon refusé (majuscules ignorées)");
  await admin.screenshot({ path: `${OUT}/v4-1-villes.png`, fullPage: true });

  // 5. Accueil : les noms des villes, « Livraison dès »
  await client.goto(BASE + "/");
  const accueil = espaces(await client.locator("main").innerText());
  verifier(accueil.includes("📍 Netanya ·") && !accueil.includes("object Object"), "accueil : les noms des villes");
  verifier(accueil.includes("Livraison dès"), "accueil : « Livraison dès … »");

  // 6. Panier : le prix suit la ville
  await client.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await client.goto(BASE + "/panier");
  await client.getByText("Pack d'eau").first().waitFor();
  await client.getByText("Demain", { exact: true }).click();
  await client.getByText("19:00 – 20:00", { exact: true }).click();
  const options = await client.getByLabel("Ville").locator("option").allInnerTexts();
  verifier(!options.includes("Udim"), "la ville retirée n'est plus proposée");
  verifier(options.some((o) => o.startsWith("Kfar Vitkin") && o.includes("+5")), "la ville ajoutée est proposée avec son supplément");
  const info = () => client.locator("p[aria-live=polite]").innerText().then(espaces);
  const total = () => client.getByRole("button", { name: /^Commander/ }).innerText().then(espaces);

  await client.getByLabel("Ville").selectOption("Netanya");
  verifier((await info()).includes("livraison 30 ₪"), "Netanya : livraison 30 ₪");
  verifier((await total()).includes("69,90"), "Netanya : 24,90 + 15 + 30 = 69,90");

  await client.getByLabel("Ville").selectOption("Herzliya");
  verifier((await info()).includes("livraison 50 ₪ (dont +20 ₪ pour Herzliya)"), "Herzliya : livraison 50 ₪ (dont +20 ₪)");
  verifier((await total()).includes("89,90"), "Herzliya : 24,90 + 15 + 50 = 89,90");

  await client.getByLabel("Ville").selectOption("Tel Aviv");
  verifier(await client.getByText("Minimum de commande pour Tel Aviv : 100,00 ₪ d'articles.").isVisible(), "Tel Aviv : minimum de 100 ₪ annoncé");
  verifier(await client.getByRole("button", { name: /^Commander/ }).isDisabled(), "Tel Aviv : commande bloquée sous le minimum");
  await client.screenshot({ path: `${OUT}/v4-2-panier-tel-aviv.png`, fullPage: true });

  // 7. Commande à Herzliya : le serveur facture le même montant
  await client.getByLabel("Ville").selectOption("Herzliya");
  await client.getByLabel("Ton nom").fill("Rachel Benhamou");
  await client.getByLabel("Ton numéro WhatsApp").fill("+33 6 55 44 33 22");
  await client.getByLabel("Ton adresse e-mail").fill(`client${Date.now() % 100000}@exemple.test`);
  await client.getByLabel("Adresse ou hôtel (avec n° de chambre)").fill("Hôtel Daniel, chambre 301");
  await client.getByRole("button", { name: /^Commander/ }).click();
  await client.waitForURL(/\/suivi\//);
  const suivi = espaces(await client.locator("main").innerText());
  verifier(suivi.includes("Livraison · Herzliya") && suivi.includes("89,90"), "suivi : « Livraison · Herzliya » et total 89,90");

  await admin.goto(BASE + "/admin");
  await admin.getByText("Rachel Benhamou").first().click();
  await admin.waitForURL(/\/admin\/commandes\//);
  verifier(espaces(await admin.locator("main").innerText()).includes("dont supplément Herzliya 20,00"), "admin : « dont supplément Herzliya 20,00 ₪ »");

  // 8. Statistiques par ville
  await admin.goto(BASE + "/admin/statistiques");
  const stats = espaces(await admin.locator("section", { hasText: "Par ville (30 jours)" }).innerText());
  verifier(stats.includes("Herzliya") && stats.includes("89,90"), "statistiques : la ville apparaît avec son chiffre");
} finally {
  writeFileSync(`${OUT}/resultat-villes.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
