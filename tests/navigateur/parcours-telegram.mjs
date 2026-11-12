// L'alerte Telegram, de bout en bout, contre un FAUX Telegram local (aucun message réel ne part).
// Le site doit être lancé avec TELEGRAM_API=http://127.0.0.1:3199 :
//   TELEGRAM_API=http://127.0.0.1:3199 npm run dev -- -p 3100
import { chromium, devices } from "playwright";
import { createServer } from "node:http";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");

// ── Le faux Telegram : un robot connu, ses messages reçus, et ce qu'on lui demande d'envoyer.
const JETON = "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw";
const ROBOT = "touristorder_commandes_essai_bot"; // un nom long : il ne doit rien faire déborder
const faux = { recus: [], envoyes: [] };
const serveur = createServer((req, res) => {
  let corps = "";
  req.on("data", (d) => (corps += d));
  req.on("end", () => {
    const m = req.url.match(/^\/bot([^/]+)\/(\w+)$/);
    const repondre = (code, objet) => { res.writeHead(code, { "content-type": "application/json" }); res.end(JSON.stringify(objet)); };
    if (!m || m[1] !== JETON) return repondre(401, { ok: false, error_code: 401, description: "Unauthorized" });
    const demande = corps ? JSON.parse(corps) : {};
    if (m[2] === "getMe") return repondre(200, { ok: true, result: { id: 123456789, is_bot: true, username: ROBOT } });
    if (m[2] === "getUpdates") return repondre(200, { ok: true, result: faux.recus });
    if (m[2] === "sendMessage") { faux.envoyes.push(demande); return repondre(200, { ok: true, result: { message_id: faux.envoyes.length } }); }
    return repondre(404, { ok: false, error_code: 404, description: "Not Found" });
  });
});
await new Promise((pret) => serveur.listen(3199, "127.0.0.1", pret));

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
const admin = await ctx.newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));
const partie = admin.locator("section#telegram");
const etat = async () => espaces(await partie.locator("h2 + span").innerText());
// Après chaque geste, la partie Telegram est à l'écran : rien à chercher ailleurs dans la page.
const aLEcran = async () => {
  await admin.waitForTimeout(400);
  return admin.evaluate(() => { const r = document.querySelector("#telegram").getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && r.top > -50; });
};

try {
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");
  await admin.goto(BASE + "/admin/reglages");
  if ((await etat()) !== "Pas installée") {
    // Un essai précédent a laissé l'alerte en place : on repart de zéro.
    await partie.getByRole("button", { name: /Retirer l'alerte|Recommencer/ }).click();
    await partie.getByText("Alerte Telegram retirée.").waitFor();
  }
  verifier((await etat()) === "Pas installée", "au départ : alerte « Pas installée », l'étape 1 est celle à faire");

  // Étape 1 : un jeton bien formé mais inconnu de Telegram, puis le bon
  await partie.getByLabel("Jeton du robot").fill("987654321:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw");
  await partie.getByRole("button", { name: "Ajouter le robot" }).click();
  await partie.getByText(/Telegram ne reconnaît pas ce jeton/).waitFor();
  verifier(await aLEcran(), "jeton inconnu : refusé, et le message s'affiche dans la partie Telegram, à l'écran");
  await partie.getByLabel("Jeton du robot").fill(`  ${JETON}  `);
  await partie.getByRole("button", { name: "Ajouter le robot" }).click();
  await partie.getByText("Étape 1 faite : ton robot est enregistré. Passe à l'étape 2.").waitFor();
  verifier((await etat()) === "À terminer" && (await aLEcran()), "étape 1 faite : état « À terminer », toujours à l'écran");
  const lien = await partie.getByRole("link", { name: "Ouvrir mon robot dans Telegram" }).getAttribute("href");
  verifier(lien === `https://t.me/${ROBOT}`, "étape 2 : un bouton ouvre le robot dans Telegram");
  const depasse = await partie.evaluate((s) => [...s.querySelectorAll("a, button, p, li")].some((e) => e.getBoundingClientRect().right > s.getBoundingClientRect().right + 1));
  verifier(!depasse && !(await admin.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "étapes : rien ne dépasse du cadre, même avec un long nom de robot");
  verifier(!(await admin.content()).includes(JETON.slice(12)), "le jeton n'est jamais réaffiché dans la page");

  // Étape 3 trop tôt : le robot n'a reçu aucun message
  await partie.getByRole("button", { name: "Relier", exact: true }).click();
  await partie.getByText(/Ton robot n'a encore reçu aucun message/).waitFor();
  verifier((await etat()) === "À terminer" && faux.envoyes.length === 0, "« Relier » avant d'avoir écrit au robot : expliqué, rien n'est envoyé");

  // Le gérant écrit à son robot, puis relie
  faux.recus = [
    { update_id: 1, message: { message_id: 1, chat: { id: 111, first_name: "Quelqu'un d'autre", type: "private" }, text: "ancien message" } },
    { update_id: 2, message: { message_id: 2, chat: { id: 777, first_name: "Yossi", type: "private" }, text: "/start" } },
  ];
  await partie.getByRole("button", { name: "Relier", exact: true }).click();
  await partie.getByText(/C'est en place, Yossi/).waitFor();
  verifier((await etat()) === "Active" && (await aLEcran()), "relié : état « Active », confirmation à l'écran");
  verifier(faux.envoyes.length === 1 && faux.envoyes[0].chat_id === "777" && faux.envoyes[0].text.includes("Alerte reliée"), "le robot écrit « Alerte reliée » à la personne qui vient de lui parler (le dernier message reçu)");

  // Essai
  await partie.getByRole("button", { name: "Envoyer un essai maintenant" }).click();
  await partie.getByText("Message d'essai envoyé : regarde Telegram, tu dois l'avoir reçu.").waitFor();
  verifier(faux.envoyes.length === 2 && faux.envoyes[1].text.includes("Message d'essai"), "« Envoyer un essai » : le message part");
  await admin.screenshot({ path: `${OUT}/v8-1-telegram-active.png` });

  // Une vraie commande : l'alerte part toute seule
  const client = await (await navigateur.newContext({ ...devices["iPhone 13"] })).newPage();
  client.on("pageerror", (e) => erreurs.push(String(e)));
  const NOM = `Dana Alerte-${Date.now() % 100000}`;
  await client.goto(BASE + "/");
  await client.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await client.goto(BASE + "/panier");
  await client.getByText("Pack d'eau").first().waitFor();
  await client.getByLabel("Votre nom").fill(NOM);
  await client.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 99 88 77 66");
  await client.getByLabel("Votre adresse e-mail").fill(`dana${Date.now() % 100000}@exemple.test`);
  await client.getByLabel("Ville").selectOption("Netanya");
  await client.getByLabel("Rue et numéro, ou nom de l'hôtel").fill("Hôtel Island, chambre 7"); await client.getByLabel("Étage", { exact: true }).fill("3"); await client.getByLabel("N° d'appartement ou de chambre").fill("12");
  await client.getByLabel("Un article introuvable ? (facultatif)").fill("1 parasol");
  await client.getByRole("button", { name: /^Commander/ }).click();
  await client.waitForURL(/\/suivi\//);
  for (let i = 0; i < 40 && faux.envoyes.length < 3; i++) await client.waitForTimeout(250);
  const alerte = espaces(faux.envoyes[2]?.text ?? "");
  verifier(faux.envoyes.length === 3 && faux.envoyes[2].chat_id === "777", "nouvelle commande : une alerte part dans la discussion reliée");
  verifier(/^Nouvelle commande n°\d+ /.test(alerte) && alerte.includes(`${NOM} · Netanya`) && /1 article · \d+,\d\d ₪ à recevoir \(Bit\)/.test(alerte) && alerte.includes("Demande hors catalogue : 1 parasol") && /\/admin\/commandes\/\w+$/.test(alerte),
    "l'alerte dit : numéro, client, ville, montant à recevoir, demande hors catalogue, lien vers la commande");

  // Retirer l'alerte : plus rien ne part
  await admin.goto(BASE + "/admin/reglages");
  await partie.getByRole("button", { name: "Retirer l'alerte" }).click();
  await partie.getByText("Alerte Telegram retirée.").waitFor();
  verifier((await etat()) === "Pas installée", "alerte retirée : état « Pas installée »");
  verifier(!(await admin.evaluate(() => document.documentElement.scrollWidth > innerWidth)), "Réglages : pas de défilement horizontal");
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-telegram.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
  serveur.close();
}
