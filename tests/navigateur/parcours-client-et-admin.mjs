import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");
// Sur téléphone, une page trop large se « dézoome » : innerWidth grandit avec elle. On compare donc aussi à la largeur de l écran.
const deborde = async (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth || window.innerWidth > window.screen.width);

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
const page = await ctx.newPage();
page.on("pageerror", (e) => erreurs.push(String(e)));

try {
// 1. Accueil
await page.goto(BASE + "/");
await page.getByRole("heading", { name: "Les plus demandés" }).waitFor();
verifier(!(await page.content()).match(/Super-Pharm|Wolt Market|prixAchat|lienWolt/), "l'accueil ne montre ni boutique ni prix d'achat");
verifier(!(await deborde(page)), "accueil : pas de défilement horizontal");
await page.screenshot({ path: `${OUT}/v2-1-accueil.png` });

// 2. Produit sans option : « + » direct, puis la pastille de quantité
await page.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
verifier(await page.getByRole("button", { name: "Ajouter un Pack d'eau 6 × 1,5 L" }).first().isVisible(), "eau ajoutée : la quantité apparaît sur la carte");

// 3. Produit à options : la fiche s'ouvre, le choix est obligatoire
await page.getByRole("button", { name: "Choisir les options de Couches Huggies" }).first().click();
const fiche = page.getByRole("dialog", { name: "Couches Huggies" });
await fiche.waitFor();
verifier(await fiche.getByRole("button", { name: "Choisissez : taille" }).isDisabled(), "fiche : bouton bloqué tant que la taille n'est pas choisie");
await fiche.getByRole("radio", { name: /^6/ }).check({ force: true });
await fiche.getByRole("button", { name: "Une de plus" }).click();
verifier(espaces(await fiche.getByRole("button", { name: /^Ajouter ·/ }).innerText()).includes("149,80"), "fiche : 2 × (69,90 + 5) = 149,80");
verifier(!(await deborde(page)), "fiche ouverte : pas de défilement horizontal");
await page.screenshot({ path: `${OUT}/v2-2-fiche.png` });
await fiche.getByRole("button", { name: /^Ajouter ·/ }).click();
await fiche.waitFor({ state: "hidden" });
verifier(await page.getByRole("link", { name: "Panier, 3 articles" }).isVisible(), "badge panier = 3");

// 4. Panier avec les nouvelles options
await page.goto(BASE + "/panier");
await page.getByText("Taille : 6").waitFor();
ok("le panier affiche la variante choisie");
await page.getByLabel("Votre nom").fill("Sarah Cohen");
await page.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 12 34 56 78");
await page.getByLabel("Votre adresse e-mail").fill(`client${Date.now() % 100000}@exemple.test`);
await page.getByLabel("Ville").selectOption("Netanya");
await page.getByLabel("Rue et numéro, ou nom de l'hôtel").fill("Hôtel Dan, chambre 512"); await page.getByLabel("Étage", { exact: true }).fill("3"); await page.getByLabel("N° d'appartement ou de chambre").fill("12");
await page.getByText("Demain", { exact: true }).click();
await page.getByText("19:00 – 20:00", { exact: true }).click();
await page.getByText(/Express · \+/).click();
await page.getByText("Le remplacer par un équivalent").click();
await page.getByText("Bit", { exact: true }).click();
await page.getByText("10 ₪", { exact: true }).click();
const total = espaces(await page.getByRole("button", { name: /^Commander/ }).innerText());
verifier(total.includes("249,70"), `total = 174,70 + 15 + (30 + 20 express) + 10 pourboire = 249,70 (lu : ${total})`);
verifier(!(await deborde(page)), "panier : pas de défilement horizontal");
await page.screenshot({ path: `${OUT}/v2-3-panier.png`, fullPage: true });
await page.getByRole("button", { name: /^Commander/ }).click();
await page.waitForURL(/\/suivi\//);
await page.getByText("Merci, votre commande est enregistrée.").waitFor();
const urlSuivi = page.url().replace("?nouvelle=1", "");
verifier(await page.getByText("Taille : 6").isVisible(), "suivi : variante affichée");
verifier(await page.getByText("Mode de paiement : Bit").isVisible(), "suivi : mode de paiement");
verifier(espaces(await page.locator("main").innerText()).includes("Paiement en attente · 249,70 ₪"), "suivi : paiement en attente, avec le montant");
const reglement = decodeURIComponent(await page.getByRole("link", { name: "Recevoir les coordonnées de paiement" }).getAttribute("href"));
verifier(reglement.startsWith("https://wa.me/972501234567?text=") && reglement.includes("régler ma commande") && reglement.includes("par Bit"), "suivi : bouton WhatsApp pour recevoir les coordonnées de paiement");
verifier((await page.locator("main span", { hasText: /^\s*Express\s*$/ }).count()) === 1 && (await page.getByText("Livraison express").isVisible()), "suivi : express");
await page.screenshot({ path: `${OUT}/v2-4-suivi.png`, fullPage: true });

// 5. Mes commandes
await page.goto(BASE + "/commandes");
await page.getByText(/^Commande n°\d+$/).first().waitFor();
verifier(espaces(await page.locator("main").innerText()).includes("249,70"), "« Mes commandes » liste la commande");
await page.screenshot({ path: `${OUT}/v2-5-mes-commandes.png` });

// 6. Admin
const admin = await ctx.newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));
await admin.goto(BASE + "/admin/connexion");
await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
await admin.getByRole("button", { name: "Se connecter" }).click();
await admin.waitForURL(BASE + "/admin");
verifier(await admin.getByText("Express", { exact: true }).first().isVisible(), "liste admin : pastille express");
verifier(espaces(await admin.locator("main").innerText()).includes("À payer · 249,70 ₪"), "liste admin : étiquette « à payer » avec le montant");
await admin.getByText("Sarah Cohen").first().click();
await admin.waitForURL(/\/admin\/commandes\//);
verifier(await admin.getByText("Taille : 6").isVisible(), "admin : variante sur la liste de courses");
verifier(await admin.getByText("Remplacer par un équivalent").isVisible(), "admin : consigne de remplacement");
const ligneCouches = admin.locator("li", { hasText: "Couches Huggies" });
await ligneCouches.getByRole("checkbox").check();
await ligneCouches.getByRole("button", { name: "OK" }).click();
await admin.waitForTimeout(800);
const encaisser = espaces(await admin.locator("div", { hasText: /^Total de la commande/ }).locator("dd").innerText());
verifier(encaisser.includes("99,90"), `couches indispo : 24,90 + 15 + 50 + 10 = 99,90 (lu : ${encaisser})`);
verifier(!(await deborde(admin)), "admin commande : pas de défilement horizontal");
await admin.screenshot({ path: `${OUT}/v2-6-admin-commande.png`, fullPage: true });

// 7. Statistiques
await admin.goto(BASE + "/admin/statistiques");
await admin.getByRole("heading", { name: "Les plus vendus (30 jours)" }).waitFor();
verifier(espaces(await admin.locator("main").innerText()).includes("99,90"), "statistiques : le chiffre du jour");
await admin.screenshot({ path: `${OUT}/v2-7-stats.png`, fullPage: true });

// 8. Produit : options mal saisies, puis correctes, badge populaire
await admin.goto(BASE + "/admin/produits/nouveau");
await admin.getByLabel("Nom du produit").fill("Casquette enfant");
await admin.getByLabel("Catégorie").selectOption({ label: "🏖️ Plage & soleil" });
await admin.getByLabel("Prix de vente (₪)").fill("39,90");
await admin.getByLabel("Badge").selectOption("populaire");
await admin.getByLabel("Options au choix du client (facultatif)").fill("Couleur Rouge Bleu");
await admin.getByRole("button", { name: "Ajouter le produit" }).click();
await admin.getByText(/écris « Nom : choix 1 \| choix 2 »/).first().waitFor();
verifier((await admin.getByLabel("Badge").inputValue()) === "populaire", "options refusées : le reste de la saisie est conservé");
await admin.getByLabel("Options au choix du client (facultatif)").fill("Couleur : Rouge | Bleu\nTaille : 2-4 ans | 5-8 ans +5");
await admin.screenshot({ path: `${OUT}/v2-8-admin-produit.png`, fullPage: true });
await admin.getByRole("button", { name: "Ajouter le produit" }).click();
await admin.waitForURL(/\/admin\/produits\?ok=/);
ok("produit à options créé");

// (L'accueil ne montre que les rayons et les articles les plus demandés : on passe par la recherche.)
await page.goto(BASE + "/recherche?q=casquette");
await page.getByRole("button", { name: "Choisir les options de Casquette enfant" }).first().click();
const fiche2 = page.getByRole("dialog", { name: "Casquette enfant" });
await fiche2.waitFor();
verifier(await fiche2.getByText("+5,00 ₪").first().isVisible(), "le supplément d'option s'affiche côté client");
await fiche2.getByRole("button", { name: "Fermer" }).click();

// 9. Épuisé
await admin.goto(BASE + "/admin/produits?q=Lingettes");
await admin.getByRole("button", { name: "Marquer épuisé Lingettes bébé" }).click();
await admin.getByRole("button", { name: "Remettre en stock Lingettes bébé" }).waitFor();
await page.goto(BASE + "/categorie/bebe-enfants");
verifier(await page.getByText("Épuisé", { exact: true }).first().isVisible(), "produit épuisé : badge visible");
verifier((await page.getByRole("button", { name: "Ajouter Lingettes bébé au panier" }).count()) === 0, "produit épuisé : pas de bouton +");

// 10. Dupliquer
await admin.goto(BASE + "/admin/produits?q=Tongs");
await admin.getByRole("link", { name: "Tongs adulte" }).click();
await admin.getByRole("button", { name: "Dupliquer" }).click();
await admin.getByText("Copie créée (masquée)").waitFor();
verifier((await admin.getByLabel("Nom du produit").inputValue()) === "Tongs adulte (copie)", "copie créée avec ses options");
verifier((await admin.getByLabel("Options au choix du client (facultatif)").inputValue()).startsWith("Pointure :"), "la copie garde les options");

// 11. Réglages
await admin.goto(BASE + "/admin/reglages");
await admin.getByLabel("Pourboires proposés (₪)").fill("5 10 15");
await admin.getByRole("button", { name: "Enregistrer" }).click();
await admin.getByText("Réglages enregistrés.").waitFor();
await page.goto(BASE + "/panier");
await page.goto(BASE + "/");
ok("réglages : pourboires enregistrés");

// 12. Une ancienne commande rouverte ne vide pas le panier
await page.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
await page.goto(urlSuivi);
await page.waitForTimeout(500);
verifier(await page.getByRole("link", { name: "Panier, 1 article" }).isVisible(), "rouvrir une ancienne commande ne vide pas le panier");

// Bureau
const bureau = await navigateur.newPage({ viewport: { width: 1280, height: 900 } });
await bureau.goto(BASE + "/");
await bureau.waitForTimeout(500);
await bureau.screenshot({ path: `${OUT}/v2-9-accueil-ordinateur.png` });
await bureau.goto(BASE + "/categorie/plage-soleil");
await bureau.screenshot({ path: `${OUT}/v2-10-categorie-ordinateur.png` });
} finally {
  writeFileSync(`${OUT}/resultat2.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
