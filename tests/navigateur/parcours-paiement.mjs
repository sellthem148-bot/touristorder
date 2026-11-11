// Paiement avant les achats, demande d'article hors catalogue, reçu, export comptable,
// pages d'information et référencement. À lancer après les autres parcours.
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
const COORDONNEES = "Bit ou PayBox : 050 111 2233";
// Un nom unique : le parcours peut être relancé sans confondre ses commandes avec celles d'un essai précédent.
const NOM = `Nathan Sebag-${Date.now() % 100000}`;

const navigateur = await chromium.launch();
const ctxClient = await navigateur.newContext({ ...devices["iPhone 13"] });
const client = await ctxClient.newPage();
client.on("pageerror", (e) => erreurs.push(String(e)));
const ctxAdmin = await navigateur.newContext({ ...devices["iPhone 13"] });
const admin = await ctxAdmin.newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));

const texte = async (p) => espaces(await p.locator("main").innerText());
const etiquettePaiement = async () => espaces(await admin.locator("section", { hasText: "Paiement" }).first().locator("span").first().innerText());

try {
  // 1. « Je ne trouve pas mon article » : de la recherche sans résultat à la demande envoyée
  await client.goto(BASE + "/recherche?q=parasol%20g%C3%A9ant");
  await client.getByRole("link", { name: "Demander cet article" }).click();
  await client.waitForURL(/\/panier\?demande=/);
  await client.getByRole("heading", { name: "Demander un article" }).waitFor();
  verifier((await client.getByLabel("Que vous faut-il ?").inputValue()) === "parasol géant", "recherche sans résultat → demande pré-remplie avec ce qui était cherché");
  verifier(!(await deborde(client)), "demande : pas de défilement horizontal");
  await client.getByLabel("Que vous faut-il ?").fill("1 parasol de plage, 2 m, bleu");
  await client.getByLabel("Votre nom").fill(NOM);
  await client.getByLabel("Votre numéro WhatsApp").fill("+33 6 77 88 99 00");
  const email = `nathan${Date.now() % 100000}@exemple.test`;
  await client.getByLabel("Votre adresse e-mail").fill(email);
  await client.getByLabel("Ville").selectOption("Netanya");
  await client.getByLabel("Adresse ou hôtel (avec n° de chambre)").fill("Résidence Lagoon, appartement 14");
  // Le 4e jour proposé : aucun autre parcours n'y commande.
  await client.locator('input[name="dateLivraison"]').nth(3).check({ force: true });
  await client.getByText("Virement", { exact: true }).click();
  verifier((await texte(client)).includes("Rien à régler pour l'instant"), "demande seule : rien à régler avant le prix");
  await client.getByRole("button", { name: "Envoyer ma demande" }).click();
  await client.waitForURL(/\/suivi\//);
  await client.getByText("Merci, votre demande est envoyée.").waitFor();
  const urlSuivi = client.url().replace("?nouvelle=1", "");
  let suivi = await texte(client);
  verifier(suivi.includes("Votre demande hors catalogue : 1 parasol de plage, 2 m, bleu"), "suivi : la demande est rappelée");
  verifier(!suivi.includes("Paiement en attente"), "suivi : aucun paiement demandé tant que le prix n'est pas confirmé");
  await client.screenshot({ path: `${OUT}/v7-1-suivi-demande.png`, fullPage: true });

  // 2. Le gérant chiffre la demande : un article hors catalogue, le total, puis le paiement
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");
  await admin.goto(BASE + "/admin/reglages");
  await admin.getByLabel("Tes coordonnées de paiement (privé)").fill(COORDONNEES);
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  await admin.goto(BASE + "/admin");
  const carte = admin.locator("li", { hasText: NOM }).first();
  verifier(espaces(await carte.innerText()).includes("Demande hors catalogue") && espaces(await carte.innerText()).includes("Rien à régler"), "liste des commandes : demande hors catalogue, rien à régler");
  await carte.click();
  await admin.waitForURL(/\/admin\/commandes\//);
  const urlCommande = admin.url();
  verifier((await texte(admin)).includes("Le client demande : 1 parasol de plage, 2 m, bleu"), "détail : ce que le client demande");

  await admin.getByRole("textbox", { name: "Article", exact: true }).fill("Parasol de plage 2 m");
  await admin.getByLabel("Prix de vente").fill("89,90");
  await admin.getByLabel("Prix Wolt").fill("77,77");
  await admin.getByLabel("Boutique (facultatif)").fill("Decathlon Netanya");
  await admin.getByRole("button", { name: "Ajouter", exact: true }).click();
  await admin.getByText("Article ajouté : le total est à jour.").waitFor();
  const total1 = espaces(await admin.locator("div", { hasText: /^Total de la commande/ }).locator("dd").innerText());
  verifier(/^\d+,\d\d ₪$/.test(total1) && total1 !== "89,90 ₪", `article ajouté : le total compte les frais (${total1})`);
  verifier((await etiquettePaiement()) === `À payer · ${total1}`, "le total devient « à payer »");
  const montant = decodeURIComponent(await admin.getByRole("link", { name: /Envoyer le montant et les coordonnées/ }).getAttribute("href"));
  verifier(montant.startsWith("https://wa.me/33677889900?text=") && montant.includes(`Montant à régler : ${total1.replace(" ₪", "")}`) && montant.includes("par Virement") && montant.includes(COORDONNEES),
    "WhatsApp au client : montant, mode et coordonnées de paiement");
  verifier(!(await deborde(admin)), "détail d'une commande : pas de défilement horizontal");
  await admin.screenshot({ path: `${OUT}/v7-2-admin-a-payer.png`, fullPage: true });

  // 3. Le client voit le montant à régler ; les coordonnées ne sont jamais sur le site
  await client.goto(urlSuivi);
  suivi = await texte(client);
  verifier(suivi.includes(`Paiement en attente · ${total1}`) && suivi.includes("par Virement"), "suivi : paiement en attente, montant et mode");
  const demander = decodeURIComponent(await client.getByRole("link", { name: "Recevoir les coordonnées de paiement" }).getAttribute("href"));
  verifier(demander.startsWith("https://wa.me/972501234567?text=") && demander.includes("régler ma commande"), "suivi : bouton WhatsApp pour recevoir les coordonnées");
  for (const u of [urlSuivi, BASE + "/", BASE + "/panier", BASE + "/conditions", BASE + "/contact"]) {
    await client.goto(u);
    verifier(!(await client.content()).includes("050 111 2233"), `les coordonnées de paiement ne sont pas dans ${u.replace(BASE, "") || "/"}`);
  }

  // 4. Paiement reçu → la commande est réglée
  await admin.getByRole("button", { name: `Paiement reçu · ${total1}` }).click();
  await admin.getByText("Payée", { exact: true }).first().waitFor();
  verifier((await admin.getByRole("link", { name: /Envoyer le montant/ }).count()) === 0, "payée : plus de bouton « envoyer le montant »");
  await client.goto(urlSuivi);
  verifier((await texte(client)).includes("Paiement reçu"), "suivi : paiement reçu");

  // 5. Un article ajouté après le paiement : un complément
  await admin.getByRole("textbox", { name: "Article", exact: true }).fill("Lestage de parasol");
  await admin.getByLabel("Prix de vente").fill("20");
  await admin.getByRole("button", { name: "Ajouter", exact: true }).click();
  await admin.locator("li", { hasText: "Lestage de parasol" }).waitFor();
  await admin.getByText(/^Reste \d/).first().waitFor();
  const complement = (await etiquettePaiement()).replace("Reste ", "");
  verifier(/^\d+,\d\d ₪$/.test(complement), `article ajouté après paiement : un complément reste dû (${complement})`);
  await client.goto(urlSuivi);
  verifier((await texte(client)).includes(`Reste à régler · ${complement}`), "suivi : le complément à régler");
  await admin.getByRole("button", { name: `Complément reçu · ${complement}` }).click();
  await admin.getByText("Payée", { exact: true }).first().waitFor();

  // 6. Un article indisponible après le paiement : un remboursement
  const ligne = admin.locator("li", { hasText: "Parasol de plage 2 m" });
  await ligne.getByRole("checkbox").check();
  await ligne.getByRole("button", { name: "OK" }).click();
  await admin.getByText(/^À rembourser/).first().waitFor();
  const remboursement = (await etiquettePaiement()).replace("À rembourser ", "");
  await client.goto(urlSuivi);
  suivi = await texte(client);
  verifier(suivi.includes(`Remboursement à venir · ${remboursement}`) && suivi.includes("Indisponible, remboursé"), `suivi : remboursement annoncé (${remboursement})`);
  await client.screenshot({ path: `${OUT}/v7-3-suivi-remboursement.png`, fullPage: true });
  await admin.getByRole("button", { name: `Remboursement fait · ${remboursement}` }).click();
  await admin.getByText("Payée", { exact: true }).first().waitFor();
  ok("remboursement fait : la commande est de nouveau « payée »");

  // 7. Le reçu : ce que le client a payé, sans rien de privé
  await admin.getByRole("link", { name: "Reçu à imprimer ou à envoyer" }).click();
  await admin.getByRole("heading", { name: /^Reçu n°\d+$/ }).waitFor();
  const recu = await texte(admin);
  verifier(recu.includes(NOM) && recu.includes("Lestage de parasol") && !recu.includes("Parasol de plage 2 m"), "reçu : le client et les articles livrés seulement");
  verifier(!recu.includes("Decathlon") && !recu.includes("77,77"), "reçu : ni boutique ni prix d'achat");
  verifier(!(await deborde(admin)), "reçu : pas de défilement horizontal");
  await admin.screenshot({ path: `${OUT}/v7-4-recu.png`, fullPage: true });

  // 8. Export comptable : ventes et achats Wolt
  await admin.goto(urlCommande);
  await admin.getByRole("button", { name: /Commandée sur Wolt/ }).click();
  await admin.getByText("En préparation", { exact: true }).first().waitFor();
  const ventes = await ctxAdmin.request.get(BASE + "/admin/export/ventes?mois=tout");
  const csvVentes = await ventes.text();
  verifier(ventes.status() === 200 && ventes.headers()["content-type"].startsWith("text/csv") && /attachment; filename="tourist-order-ventes-tout\.csv"/.test(ventes.headers()["content-disposition"]),
    "export des ventes : un fichier CSV à télécharger");
  verifier(csvVentes.charCodeAt(0) === 0xfeff && csvVentes.includes('"N° commande";"Commandée le"') && csvVentes.includes(`"${NOM}";"Netanya";"En préparation";"Virement"`), "export des ventes : la commande, son statut et son mode de paiement");
  const csvAchats = await (await ctxAdmin.request.get(BASE + "/admin/export/achats?mois=tout")).text();
  verifier(csvAchats.includes('"Lestage de parasol"') && !csvAchats.includes("Parasol de plage 2 m"), "export des achats : l'article acheté, pas l'article indisponible");
  const anonyme = await ctxClient.request.get(BASE + "/admin/export/ventes?mois=tout");
  verifier(anonyme.url().includes("/admin/connexion") && !(await anonyme.text()).includes(NOM), "export : refusé sans être connecté comme gérant");
  verifier((await ctxAdmin.request.get(BASE + "/admin/export/autre")).status() === 404, "export inconnu : 404");
  await admin.goto(BASE + "/admin/statistiques");
  verifier(await admin.getByRole("button", { name: "Exporter les ventes" }).isVisible() && await admin.getByRole("button", { name: "Exporter les achats Wolt" }).isVisible(), "Statistiques : les deux boutons d'export");
  verifier(!(await deborde(admin)), "Statistiques : pas de défilement horizontal");

  // 9. Alerte Telegram : un jeton mal formé est refusé sans appeler Telegram
  await admin.goto(BASE + "/admin/reglages");
  await admin.getByLabel("Jeton du robot").fill("pas-un-jeton");
  await admin.getByRole("button", { name: "Ajouter le robot" }).click();
  await admin.getByText(/ne ressemble pas à celui d'un robot Telegram/).waitFor();
  verifier(!(await deborde(admin)), "Réglages : pas de défilement horizontal");
  ok("Réglages : alerte Telegram, jeton invalide refusé");

  // 10. Pages d'information, pied de page, référencement
  for (const [chemin, titre] of [["/conditions", "Conditions générales de vente"], ["/confidentialite", "Politique de confidentialité"], ["/mentions-legales", "Mentions légales"], ["/contact", "Contact"]]) {
    await client.goto(BASE + chemin);
    await client.getByRole("heading", { level: 1, name: titre }).waitFor();
    verifier(!(await deborde(client)), `${chemin} : la page s'affiche, sans défilement horizontal`);
  }
  await client.goto(BASE + "/");
  const pied = client.locator("footer");
  verifier((await pied.getByRole("link", { name: "Conditions générales de vente" }).count()) === 1 && (await pied.getByRole("link", { name: "Contact" }).count()) === 1, "pied de page : liens vers les pages d'information");
  verifier((await client.locator('script[type="application/ld+json"]').count()) === 1 && /^https?:\/\/[^/]+\/?$/.test(await client.locator('link[rel="canonical"]').getAttribute("href")), "accueil : données structurées et adresse canonique");
  const plan = await (await ctxClient.request.get(BASE + "/sitemap.xml")).text();
  verifier(plan.includes("/categorie/") && plan.includes("/conditions") && !plan.includes("/admin") && !plan.includes("/suivi"), "plan du site : rayons et pages d'information, rien de privé");
  const robots = await (await ctxClient.request.get(BASE + "/robots.txt")).text();
  verifier(/Disallow: \/admin/.test(robots) && /Disallow: \/suivi/.test(robots) && /Sitemap: .*\/sitemap\.xml/.test(robots), "robots.txt : espace gérant et suivi exclus, plan du site indiqué");
  await client.goto(BASE + "/panier");
  verifier((await client.locator('meta[name="robots"]').getAttribute("content")).includes("noindex"), "panier : hors des moteurs de recherche");

  // 11. Le site vouvoie le client
  for (const chemin of ["/", "/panier?demande=", "/compte/connexion", "/commandes", "/conditions", "/contact", urlSuivi.replace(BASE, "")]) {
    await client.goto(BASE + chemin);
    const page = (await client.locator("body").innerText()).replace(/\s+/g, " ");
    const tutoiement = page.match(/(^|[\s«(])(tu|ton|ta|tes|toi|te)\s/i);
    verifier(!tutoiement, `${chemin} : aucun tutoiement${tutoiement ? ` (« …${page.slice(Math.max(0, tutoiement.index - 30), tutoiement.index + 30)}… »)` : ""}`);
  }
} finally {
  writeFileSync(`${OUT}/resultat-paiement.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
