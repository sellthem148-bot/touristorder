// Où le client loge (appartement, maison, hôtel), la référence de commande et le bouton « Payer avec Bit ».
// - une maison n'a ni étage ni appartement ; à l'hôtel on ne monte pas dans les chambres ;
// - le client lit une référence (« RB-58001 »), jamais « n°1 » ; le gérant voit les deux ;
// - un seul bouton WhatsApp à la fois ; le bouton Bit n'apparaît qu'avec le lien du gérant, pour un paiement par Bit.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");
const LIEN_BIT = "https://exemple.test/payer/tourist-order";

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
const admin = await ctx.newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));

/** Un client neuf (son propre navigateur), un pack d'eau au panier, le formulaire rempli jusqu'à l'adresse. */
async function nouveauClient(nom, mode) {
  const p = await (await navigateur.newContext({ ...devices["iPhone 13"] })).newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(BASE + "/");
  await p.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await p.goto(BASE + "/panier");
  await p.getByText("Pack d'eau").first().waitFor();
  await p.getByLabel("Votre nom").fill(nom);
  await p.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 11 22 33 44");
  await p.getByLabel("Votre adresse e-mail").fill(`logement${Date.now() % 1000000}@exemple.test`);
  await p.getByLabel("Ville").selectOption("Netanya");
  await p.getByText("Demain", { exact: true }).click();
  await p.getByText("19:00 – 20:00", { exact: true }).click();
  await p.getByText(mode, { exact: true }).click();
  return p;
}
const commander = async (p) => { await p.getByRole("button", { name: /^Commander/ }).click(); await p.waitForURL(/\/suivi\//); await p.getByText("Merci, votre commande est enregistrée.").waitFor(); };
const referenceLue = async (p) => (await p.getByText(/^Commande [A-Z]{1,2}-\d{5,}$/).innerText()).replace("Commande ", "");
const ouvrirDansLAdmin = async (nom) => { await admin.goto(BASE + "/admin"); await admin.getByText(nom).first().click(); await admin.waitForURL(/\/admin\/commandes\//); };

try {
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");

  // 1. Rien de choisi : la commande est refusée, sans champ d'adresse à l'écran
  const maison = await nouveauClient("Ruth Berman", "Bit");
  verifier((await maison.locator("#adresse").count()) === 0 && (await maison.locator("#etage").count()) === 0, "avant le choix : ni rue ni étage demandés");
  await maison.getByRole("button", { name: /^Commander/ }).click();
  await maison.locator("#logement-erreur").waitFor();
  verifier(new URL(maison.url()).pathname === "/panier", "sans dire où l'on loge : la commande est refusée");

  // 2. Maison : ni étage ni appartement
  await maison.getByText("Maison", { exact: true }).click();
  verifier((await maison.locator("#etage").count()) === 0 && (await maison.locator("#appartement").count()) === 0, "maison : ni étage ni numéro d'appartement demandés");
  verifier(await maison.locator("#codeEntree").isVisible(), "maison : le code d'entrée reste proposé (facultatif)");
  await maison.getByLabel("Rue et numéro", { exact: true }).fill("Rue des Fleurs 4");
  await maison.screenshot({ path: `${OUT}/v9-1-panier-maison.png`, fullPage: true });
  await commander(maison);
  const suiviMaison = espaces(await maison.locator("main").innerText());
  verifier(suiviMaison.includes("Rue des Fleurs 4, Netanya Maison") && !suiviMaison.includes("Étage"), "suivi : « Maison », sans étage");
  const refMaison = await referenceLue(maison);
  verifier(/^RB-\d{5,}$/.test(refMaison) && !/n°\s?\d/.test(suiviMaison), `suivi : référence ${refMaison} (initiales de Ruth Berman), aucun « n° »`);

  // 3. Hôtel : le nom de l'hôtel, la chambre facultative, et l'avis « nous ne montons pas »
  const hotel = await nouveauClient("Daniel Lehmann", "Virement");
  await hotel.getByText("Hôtel", { exact: true }).click();
  verifier(await hotel.getByText("À l'hôtel, nous ne montons pas dans les chambres").isVisible(), "hôtel : l'avis « nous ne montons pas dans les chambres » s'affiche dès le choix");
  verifier((await hotel.locator("#etage").count()) === 0 && (await hotel.locator("#codeEntree").count()) === 0, "hôtel : ni étage ni code d'entrée");
  await hotel.getByLabel("Nom de l'hôtel").fill("Hôtel Dan");
  await hotel.screenshot({ path: `${OUT}/v9-2-panier-hotel.png`, fullPage: true });
  await commander(hotel);
  const suiviHotel = espaces(await hotel.locator("main").innerText());
  verifier(suiviHotel.includes("Hôtel · Remise à la réception : nous vous appelons à notre arrivée") && !suiviHotel.includes("Ne pas monter"), "suivi : remise à la réception (sans chambre : rien d'autre)");
  const refHotel = await referenceLue(hotel);
  verifier(/^DL-\d{5,}$/.test(refHotel) && refHotel.slice(3) !== refMaison.slice(3), `deux commandes, deux références : ${refMaison}, ${refHotel}`);

  // 4. Appartement : l'étage et le numéro restent obligatoires
  const appartement = await nouveauClient("Lina Marciano", "Bit");
  await appartement.getByText("Appartement", { exact: true }).click();
  await appartement.getByLabel("Rue et numéro", { exact: true }).fill("Rue Herzl 12");
  await appartement.getByRole("button", { name: /^Commander/ }).click();
  await appartement.waitForTimeout(600);
  verifier(new URL(appartement.url()).pathname === "/panier", "appartement sans étage : la commande ne part pas");
  // Passer d'appartement à hôtel puis revenir : ce qui était saisi n'est pas perdu
  await appartement.getByLabel("Étage", { exact: true }).fill("3");
  await appartement.getByLabel("N° d'appartement", { exact: true }).fill("12");
  await appartement.getByText("Hôtel", { exact: true }).click();
  await appartement.getByText("Appartement", { exact: true }).click();
  verifier((await appartement.getByLabel("Étage", { exact: true }).inputValue()) === "3" && (await appartement.getByLabel("Rue et numéro", { exact: true }).inputValue()) === "Rue Herzl 12", "changer d'avis : la saisie est gardée");
  await commander(appartement);
  verifier(espaces(await appartement.locator("main").innerText()).includes("Étage 3 · Appt / chambre 12"), "suivi : étage et appartement");

  // 5. Le gérant : la consigne de l'hôtel, écrite pour lui, et rappelée au client dans « en route »
  await ouvrirDansLAdmin("Daniel Lehmann");
  verifier(espaces(await admin.locator("main").innerText()).includes("Hôtel · Ne pas monter : appeler le client, il descend chercher sa commande"), "commande à l'hôtel : « Ne pas monter : appeler le client »");
  verifier(await admin.getByText(`réf. client ${refHotel}`).isVisible(), "commande : la référence du client à côté du numéro");
  verifier((await admin.locator("main a.bouton-whatsapp").count()) === 1, "gérant : un seul bouton WhatsApp tant qu'il reste à payer");
  await admin.getByRole("button", { name: "Paiement reçu" }).click();
  await admin.getByText(/^Payée/).first().waitFor();
  const select = admin.locator("select#statut");
  await admin.getByText("Changer l'étape à la main").click();
  await select.selectOption("EN_LIVRAISON");
  await select.locator("xpath=ancestor::form").getByRole("button").click();
  await admin.getByText("En livraison").first().waitFor();
  const enRoute = decodeURIComponent(await admin.getByRole("link", { name: "Écrire au client sur WhatsApp" }).getAttribute("href"));
  verifier(enRoute.includes(`Votre commande ${refHotel} est en route.`) && enRoute.includes("nous ne montons pas dans les chambres") && !/n°\s?\d/.test(enRoute), "message « en route » : la référence, et la consigne de l'hôtel");
  // La tournée du jour de la livraison (demain, en Israël)
  const demain = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jerusalem" }).format(new Date(Date.now() + 24 * 3600 * 1000));
  await admin.goto(`${BASE}/admin/journee?jour=${demain}`);
  const tournee = admin.locator("li", { hasText: "Daniel Lehmann" }).last();
  verifier(espaces(await tournee.innerText()).includes("Ne pas monter : appeler le client"), "tournée : la consigne de l'hôtel sur la fiche de livraison");
  const jArrive = decodeURIComponent(await tournee.getByRole("link", { name: /J'arrive/ }).getAttribute("href"));
  verifier(jArrive.includes(`avec votre commande ${refHotel}`) && jArrive.includes("merci de descendre à la réception"), "« J'arrive » à l'hôtel : le client est prié de descendre");

  // 6. Bit : sans lien du gérant, pas de bouton ; un lien qui n'en est pas un est refusé
  await maison.reload();
  verifier((await maison.getByRole("link", { name: "Payer avec Bit" }).count()) === 0 && (await maison.getByRole("link", { name: "Recevoir les coordonnées de paiement" }).count()) === 1, "sans lien Bit : le client demande les coordonnées sur WhatsApp, comme avant");
  await admin.goto(BASE + "/admin/reglages");
  await admin.locator("#lienBit").evaluate((champ, valeur) => { champ.type = "text"; champ.value = valeur; }, "050 000 0000");
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText(/lienBit : Colle le lien entier/).waitFor();
  ok("réglages : un numéro de téléphone à la place du lien est refusé");
  await admin.goto(BASE + "/admin/reglages");
  await admin.locator("#lienBit").fill(LIEN_BIT);
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();

  // 7. Avec le lien : « Payer avec Bit », le montant et la référence à indiquer — un seul bouton
  await maison.reload();
  const bit = maison.getByRole("link", { name: "Payer avec Bit" });
  verifier((await bit.getAttribute("href")) === LIEN_BIT && (await bit.getAttribute("target")) === "_blank", "paiement par Bit : le bouton « Payer avec Bit » ouvre le lien du gérant");
  const aide = espaces(await maison.locator("main").innerText());
  verifier(aide.includes(`Montant : 69,90 ₪. Indiquez la référence ${refMaison} dans le message du paiement.`), "sous le bouton : le montant et la référence à indiquer");
  verifier((await maison.locator("main a.bouton-whatsapp").count()) === 0 && (await maison.getByRole("link", { name: "Nous écrire sur WhatsApp" }).count()) === 1, "plus de bouton WhatsApp : « Une question ? Nous écrire sur WhatsApp » en simple lien");
  await maison.screenshot({ path: `${OUT}/v9-3-suivi-bit.png`, fullPage: true });
  // Le lien n'est nulle part ailleurs sur le site
  for (const page of ["/", "/panier", "/contact", "/conditions"]) {
    await appartement.goto(BASE + page);
    verifier(!(await appartement.content()).includes(LIEN_BIT), `le lien Bit n'est pas dans la page ${page}`);
  }
  // Un client qui paie par virement, ou qui a déjà payé, n'a pas le bouton
  await hotel.reload();
  verifier((await hotel.getByRole("link", { name: "Payer avec Bit" }).count()) === 0, "commande déjà payée, par virement : pas de bouton Bit");

  // 8. Le message du gérant porte le lien Bit après ses coordonnées ; payé : le bouton disparaît
  await ouvrirDansLAdmin("Ruth Berman");
  const montant = decodeURIComponent(await admin.getByRole("link", { name: /Envoyer le montant et les coordonnées/ }).getAttribute("href"));
  verifier(montant.includes(`votre commande ${refMaison}`) && montant.includes(LIEN_BIT) && montant.includes("Montant à régler : 69,90 ₪ par Bit."), "message « Envoyer le montant » : la référence, le montant et le lien Bit");
  await admin.getByRole("button", { name: "Paiement reçu" }).click();
  await admin.getByText(/^Payée/).first().waitFor();
  await maison.reload();
  verifier((await maison.getByRole("link", { name: "Payer avec Bit" }).count()) === 0 && (await maison.locator("main a.bouton-whatsapp").count()) === 1, "payée : plus de bouton Bit, un seul bouton « Nous écrire sur WhatsApp »");

  // 9. Remettre les réglages comme avant
  await admin.goto(BASE + "/admin/reglages");
  await admin.locator("#lienBit").fill("");
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  ok("lien Bit retiré : les réglages sont comme au départ");
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-logement.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
