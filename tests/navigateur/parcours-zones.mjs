// Les zones de livraison définies par les adresses : la grille du gérant (Netanya 30 ₪, son quartier Ir Yamim /
// Poleg 40 ₪, le Sharon 50 ₪, Herzliya 100 ₪, Tel Aviv 150 ₪), les repères qu'il saisit dans « Villes », le
// client prévenu au panier quand son adresse désigne une autre zone, la commande signalée, et la zone changée
// par le gérant — la livraison et le total suivent.
// PASSE UNE COMMANDE et modifie les villes : jeu de test local seulement, sur un serveur fraîchement démarré.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");
const QUARTIER = "Netanya – Ir Yamim / Poleg";

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
const admin = await ctx.newPage();
const client = await ctx.newPage();
for (const p of [admin, client]) p.on("pageerror", (e) => erreurs.push(String(e)));
const deborde = (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);

try {
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");

  // 1. « Villes » : la grille, le quartier, et ses repères
  await admin.goto(BASE + "/admin/villes");
  await admin.getByRole("heading", { name: "Villes livrées" }).waitFor();
  const recap = admin.locator("section", { hasText: "Prix de livraison par ville" });
  const prixDe = async (ville) => espaces(await recap.locator("tr", { has: admin.getByRole("cell", { name: ville, exact: true }) }).innerText());
  for (const [ville, prix] of [["Netanya", "30 ₪"], [QUARTIER, "40 ₪"], ["Even Yehuda", "50 ₪"], ["Ra'anana", "50 ₪"], ["Hadera", "50 ₪"], ["Herzliya", "100 ₪"], ["Ramat HaSharon", "100 ₪"], ["Tel Aviv", "150 ₪"], ["Petah Tikva", "150 ₪"]]) {
    const ligne = await prixDe(ville);
    if (!ligne.startsWith(`${ville} ${prix}`)) throw new Error(`ÉCHEC : ${ville} devrait être à ${prix} — « ${ligne} »`);
  }
  ok("grille du gérant : Netanya 30 ₪, Ir Yamim / Poleg 40 ₪, le Sharon 50 ₪, Herzliya 100 ₪, Tel Aviv 150 ₪");
  const noms = await admin.locator('input[name^="nom_"]').evaluateAll((l) => l.map((i) => i.value));
  verifier(noms[0] === "Netanya" && noms[1] === QUARTIER, "le quartier est rangé juste après sa ville");
  verifier(await admin.getByText("Les zones se définissent par les adresses").isVisible(), "la page explique comment définir une zone par ses adresses");
  const ligneQuartier = admin.locator("li", { has: admin.locator(`input[value="${QUARTIER}"]`) });
  await ligneQuartier.locator("summary").click();
  await ligneQuartier.locator("textarea").fill("Ehud Manor, Sea Opera");
  await admin.getByRole("button", { name: "Enregistrer les villes" }).click();
  await admin.getByText("Villes enregistrées.").waitFor();
  verifier((await ligneQuartier.locator("textarea").inputValue()) === "Ehud Manor, Sea Opera" && espaces(await ligneQuartier.locator("summary").innerText()).includes("(2)"), "repères du quartier enregistrés (2), la ligne reste ouverte");
  verifier(!(await deborde(admin)), "« Villes » : pas de défilement horizontal sur téléphone");
  if (OUT) await admin.screenshot({ path: `${OUT}/zones-1-villes.png` });

  // 2. Le panier : l'adresse désigne le quartier, le client est prévenu et change d'un geste
  await client.goto(BASE + "/");
  await client.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await client.goto(BASE + "/panier");
  await client.getByText("Pack d'eau").first().waitFor();
  await client.getByText("Demain", { exact: true }).click();
  await client.getByText("19:00 – 20:00", { exact: true }).click();
  const options = await client.getByLabel("Ville").locator("option").allInnerTexts();
  verifier(options.some((o) => o.startsWith(QUARTIER) && o.includes("+10")), "le quartier est proposé dans la liste, avec son supplément");
  const info = () => client.locator("p[aria-live=polite]").innerText().then(espaces);
  const total = () => client.getByRole("button", { name: /^Commander/ }).innerText().then(espaces);
  const avis = client.locator("[data-zone-citee]");
  await client.getByLabel("Ville").selectOption("Netanya");
  await client.getByText("Appartement", { exact: true }).click();
  const rue = client.getByLabel("Rue et numéro", { exact: true });
  await rue.fill("Herzl 12");
  verifier((await avis.count()) === 0 && (await info()).includes("livraison 30 ₪"), "une adresse de Netanya : aucun avis, livraison 30 ₪");
  await rue.fill("Ehud Manor 12");
  await avis.waitFor();
  verifier(espaces(await avis.innerText()).includes(`Cette adresse semble se trouver à ${QUARTIER}, et non à Netanya.`), "une rue du quartier (un repère du gérant) : le client est prévenu");
  if (OUT) { await avis.scrollIntoViewIfNeeded(); await client.screenshot({ path: `${OUT}/zones-2-panier-avis.png` }); }
  await avis.getByRole("button", { name: `Choisir ${QUARTIER}` }).click();
  verifier((await client.getByLabel("Ville").inputValue()) === QUARTIER && (await avis.count()) === 0, "« Choisir » passe à la bonne zone, l'avis disparaît");
  verifier((await info()).includes("livraison 40 ₪") && (await total()).includes("79,90"), "le quartier : livraison 40 ₪, total 24,90 + 15 + 40 = 79,90");

  // 3. Une autre ville dans l'adresse, et le client garde quand même la moins chère
  await client.getByLabel("Ville").selectOption("Netanya");
  await rue.fill("Rue Tel Aviv 5, Netanya");
  verifier((await avis.count()) === 0, "une rue qui porte le nom d'une autre ville, à Netanya : aucun avis");
  await rue.fill("Dizengoff 50, Tel Aviv");
  await avis.waitFor();
  verifier(espaces(await avis.innerText()).includes("Cette adresse semble se trouver à Tel Aviv, et non à Netanya."), "l'adresse nomme Tel Aviv : le client est prévenu");
  verifier(!(await deborde(client)), "panier avec l'avis : pas de défilement horizontal");
  // En hébreu : le même avis, dans sa langue.
  const he = await ctx.newPage();
  he.on("pageerror", (e) => erreurs.push(String(e)));
  await he.goto(BASE + "/he/panier");
  await he.locator("#ville").selectOption("Netanya");
  await he.locator('label:has(input[name="logement"][value="APPARTEMENT"])').click();
  await he.locator("#adresse").fill("דיזנגוף 50 תל אביב");
  const avisHe = he.locator("[data-zone-citee]");
  await avisHe.waitFor();
  const texteHe = await avisHe.innerText();
  verifier(texteHe.includes("תל אביב") && texteHe.includes("נתניה") && !/\{\w+\}/.test(texteHe) && !(await deborde(he)), "hébreu : l'avis est en hébreu, avec les noms des deux zones");
  if (OUT) { await avisHe.scrollIntoViewIfNeeded(); await he.screenshot({ path: `${OUT}/zones-3-panier-hebreu.png` }); }
  await he.close();

  await client.getByLabel("Votre nom").fill("Daniel Lévy");
  await client.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 11 22 33 44");
  await client.getByLabel("Votre adresse e-mail").fill(`zones${Date.now() % 100000}@exemple.test`);
  await client.getByLabel("Étage", { exact: true }).fill("3");
  await client.getByLabel("N° d'appartement", { exact: true }).fill("12");
  verifier((await total()).includes("69,90"), "il garde « Netanya » : 24,90 + 15 + 30 = 69,90 à payer");
  await client.getByRole("button", { name: /^Commander/ }).click();
  await client.waitForURL(/\/suivi\//);
  verifier(espaces(await client.locator("main").innerText()).includes("69,90"), "la commande passe quand même : rien n'est corrigé à la place du client");

  // 4. Le gérant : la commande est signalée, il change la zone, le total suit
  await admin.goto(BASE + "/admin");
  const carte = admin.locator("li", { hasText: "Daniel Lévy" }).first();
  verifier(espaces(await carte.innerText()).includes("Zone à vérifier"), "liste des commandes : « Zone à vérifier »");
  await carte.getByRole("link").first().click();
  await admin.waitForURL(/\/admin\/commandes\//);
  const signal = admin.locator("[data-zone-a-verifier]");
  const texteSignal = espaces(await signal.innerText());
  verifier(texteSignal.includes("L'adresse désigne Tel Aviv (livraison 150 ₪)") && texteSignal.includes("le client a choisi Netanya (livraison 30 ₪)"), "la commande dit quelle zone l'adresse désigne, avec les deux prix");
  if (OUT) { await signal.scrollIntoViewIfNeeded(); await admin.screenshot({ path: `${OUT}/zones-4-commande-signalee.png` }); }
  await signal.getByRole("button", { name: "Passer la commande à Tel Aviv" }).click();
  await admin.getByText("Zone changée : Tel Aviv, livraison 150,00 ₪. Le total est à jour.").waitFor();
  const apres = espaces(await admin.locator("main").innerText());
  verifier(apres.includes("dont supplément Tel Aviv 120,00") && apres.includes("189,90"), "zone changée : supplément Tel Aviv 120 ₪, total 24,90 + 15 + 150 = 189,90");
  verifier((await signal.count()) === 0, "plus rien à vérifier : l'adresse et la zone s'accordent");
  await client.reload();
  const suivi = espaces(await client.locator("main").innerText());
  verifier(suivi.includes("Tel Aviv") && suivi.includes("189,90"), "la page de suivi du client montre la nouvelle zone et le nouveau total");

  // 5. Il peut aussi choisir lui-même une autre zone ; le signalement revient si l'adresse ne s'accorde plus
  await admin.getByText("Changer la zone de livraison").click();
  await admin.getByLabel(/Nouvelle zone/).selectOption("Netanya");
  await admin.getByRole("button", { name: "Changer", exact: true }).click();
  await admin.getByText("Zone changée : Netanya, livraison 30,00 ₪. Le total est à jour.").waitFor();
  verifier(espaces(await admin.locator("main").innerText()).includes("69,90") && (await signal.count()) === 1, "retour à Netanya : total 69,90, et la commande est de nouveau signalée");
  await admin.getByText("Changer la zone de livraison").click();
  await admin.getByLabel(/Nouvelle zone/).selectOption("Netanya");
  await admin.getByRole("button", { name: "Changer", exact: true }).click();
  await admin.getByText("La commande est déjà à Netanya.").waitFor();
  ok("la même zone : rien n'est changé, et c'est dit");
  verifier(!(await deborde(admin)), "commande : pas de défilement horizontal sur téléphone");
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-zones.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
