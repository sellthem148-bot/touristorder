// Ma journée : liste Wolt additionnée, tournée du soir, heure limite du jour même.
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
const admin = await (await navigateur.newContext({ ...devices["iPhone 13"] })).newPage();
admin.on("pageerror", (e) => erreurs.push(String(e)));

async function commander({ nom, tel, ville, adresse, creneau }) {
  // Chaque client a son propre navigateur (son propre panier).
  const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(BASE + "/");
  await p.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await p.getByRole("button", { name: "Choisir les options de Couches Huggies" }).first().click();
  const fiche = p.getByRole("dialog", { name: "Couches Huggies" });
  await fiche.getByRole("radio", { name: /^4/ }).check({ force: true });
  await fiche.getByRole("button", { name: /^Ajouter ·/ }).click();
  await fiche.waitFor({ state: "hidden" });
  await p.goto(BASE + "/panier");
  await p.getByText("Couches Huggies").first().waitFor();
  // Le 3e jour proposé : aucun autre parcours n'y commande, la liste du jour ne contient que ces commandes.
  const jour = p.locator('input[name="dateLivraison"]').nth(2);
  const valeurJour = await jour.getAttribute("value");
  await jour.check({ force: true });
  await p.getByText(creneau, { exact: true }).click();
  await p.getByLabel("Votre nom").fill(nom);
  await p.getByLabel("Votre numéro de téléphone (WhatsApp)").fill(tel);
  await p.getByLabel("Votre adresse e-mail").fill(`client${Date.now() % 100000}@exemple.test`);
  await p.getByLabel("Ville").selectOption(ville);
  await p.getByText("Appartement", { exact: true }).click(); await p.getByLabel("Rue et numéro", { exact: true }).fill(adresse); await p.getByLabel("Étage", { exact: true }).fill("3"); await p.getByLabel("N° d'appartement", { exact: true }).fill("12");
  await p.getByText("Bit", { exact: true }).click();
  await p.getByRole("button", { name: /^Commander/ }).click();
  await p.waitForURL(/\/suivi\//);
  const total = espaces(await p.locator("dl").last().locator("div").last().innerText()).replace(/^Total à payer ?/, "");
  await ctx.close();
  return { total, jour: valeurJour };
}

try {
  // 1. Deux clients commandent pour le même soir (dans le désordre des créneaux)
  const t1 = await commander({ nom: "Yaël Azoulay", tel: "+33 6 10 20 30 40", ville: "Herzliya", adresse: "Hôtel Daniel, chambre 120", creneau: "20:00 – 21:00" });
  const t2 = await commander({ nom: "Michaël Haddad", tel: "+33 6 50 60 70 80", ville: "Netanya", adresse: "Leonardo Plaza, chambre 803", creneau: "19:00 – 20:00" });
  ok(`deux commandes passées (${t1.total} et ${t2.total}) pour le ${t1.jour}`);

  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");

  // 2. Les coordonnées de paiement du gérant (privées) : elles ne partent que dans le message WhatsApp
  await admin.goto(BASE + "/admin/reglages");
  await admin.getByLabel("Tes coordonnées de paiement (privé)").fill("Bit ou PayBox : 050 111 2233");
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();

  // 3. Ma journée (ce soir-là) : d'abord les paiements, la liste Wolt reste vide tant que rien n'est payé
  await admin.goto(BASE + "/admin/journee");
  verifier(await admin.getByRole("link", { name: "Demain" }).isVisible(), "Ma journée : Aujourd'hui / Demain");
  await admin.goto(`${BASE}/admin/journee?jour=${t1.jour}`);
  const paiements = admin.locator("section", { hasText: "1. Paiements à recevoir" });
  const wolt = admin.locator("section", { hasText: "2. À commander sur Wolt" });
  verifier((await paiements.getByRole("button", { name: /Paiement reçu/ }).count()) === 2, "paiements à recevoir : les deux commandes");
  verifier(espaces(await wolt.innerText()).includes("les commandes reçues attendent leur paiement"), "liste Wolt vide tant que rien n'est payé");
  const montant = decodeURIComponent(await paiements.getByRole("link", { name: /Envoyer le montant/ }).first().getAttribute("href"));
  verifier(/^https:\/\/wa\.me\/33\d+\?text=/.test(montant) && montant.includes("Montant à régler") && montant.includes("par Bit") && montant.includes("050 111 2233"),
    "WhatsApp « envoyer le montant » : montant, mode et coordonnées de paiement");
  verifier(/Paiement en attente\s*2\b/i.test(espaces(await admin.locator("section[aria-label=Résumé]").innerText())), "résumé : 2 paiements en attente");
  await admin.screenshot({ path: `${OUT}/v6-0-journee-paiements.png`, fullPage: true });

  // 4. Un paiement reçu : seule cette commande passe dans la liste Wolt
  await paiements.getByRole("button", { name: /Paiement reçu/ }).first().click();
  await wolt.getByText("1 × Couches Huggies (Taille : 4)").waitFor();
  verifier((await paiements.getByRole("button", { name: /Paiement reçu/ }).count()) === 1, "après un paiement : une seule commande reste à payer");
  await paiements.getByRole("button", { name: /Paiement reçu/ }).first().click();
  await admin.getByText("Rien en attente").waitFor();
  const texteWolt = espaces(await wolt.innerText());
  verifier(texteWolt.includes("2 × Couches Huggies (Taille : 4)"), "liste Wolt : les couches des deux commandes payées additionnées");
  verifier(texteWolt.includes("2 × Pack d'eau 6 × 1,5 L"), "liste Wolt : l'eau des deux commandes additionnée");
  verifier(texteWolt.includes("Super-Pharm") && texteWolt.includes("Wolt Market"), "liste Wolt : regroupée par boutique");
  await admin.screenshot({ path: `${OUT}/v6-1-journee-wolt.png`, fullPage: true });

  // 5. Tout marquer « commandées sur Wolt »
  await wolt.getByRole("button", { name: "Marquer « commandées sur Wolt »" }).click();
  await admin.getByText("Rien à commander").waitFor();
  ok("les deux commandes passent à « En préparation »");

  // 4. La tournée : 19h avant 20h, liens Waze et WhatsApp, total à encaisser
  const tournee = admin.locator("section", { hasText: "3. Ma tournée" });
  const ordre = await tournee.locator("h3").allInnerTexts();
  verifier(ordre[0].includes("19:00 – 20:00") && ordre[1].includes("20:00 – 21:00"), "tournée : par créneau, dans l'ordre des heures");
  const waze = await tournee.getByRole("link", { name: "Waze" }).first().getAttribute("href");
  verifier(waze.startsWith("https://waze.com/ul?q=") && decodeURIComponent(waze).includes("Leonardo Plaza, chambre 803, Netanya"), "lien Waze vers l'adresse du client");
  const jArrive = await tournee.getByRole("link", { name: /J'arrive/ }).first().getAttribute("href");
  verifier(jArrive.startsWith("https://wa.me/33650607080?text=") && !decodeURIComponent(jArrive).includes("₪"), "WhatsApp « j'arrive » : aucun montant, la commande est déjà payée");
  verifier(espaces(await tournee.innerText()).includes("Payée"), "tournée : chaque commande porte son étiquette « Payée »");
  const resume = espaces(await admin.locator("section[aria-label=Résumé]").innerText());
  verifier(/À livrer\s*2\b/i.test(resume), "résumé : 2 livraisons");
  await admin.screenshot({ path: `${OUT}/v6-2-journee-tournee.png`, fullPage: true });

  // 5. Livrée
  await tournee.getByRole("button", { name: /Commande n°\d+ livrée/ }).first().click();
  await admin.getByText(/Déjà livrées \(1\)/).waitFor();
  verifier(/À livrer\s*1\b/i.test(espaces(await admin.locator("section[aria-label=Résumé]").innerText())), "après « Livrée » : 1 livraison restante");

  // 6. Heure limite passée : plus de livraison « ce soir »
  await admin.goto(BASE + "/admin/reglages");
  await admin.getByLabel("Commande avant… pour être livré le soir même").fill("00:01");
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  const client = await (await navigateur.newContext({ ...devices["iPhone 13"] })).newPage();
  await client.goto(BASE + "/");
  verifier(espaces(await client.locator("main").innerText()).includes("Commandez avant 00h01 pour être livré ce soir"), "accueil : « Commandez avant 00h01 pour être livré ce soir »");
  await client.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await client.goto(BASE + "/panier");
  await client.getByText("Pack d'eau").first().waitFor();
  const jours = await client.locator('input[name="dateLivraison"]').evaluateAll((l) => l.map((i) => i.parentElement.textContent.trim()));
  verifier(!jours.includes("Aujourd'hui"), "après l'heure limite : « Aujourd'hui » n'est plus proposé");
  verifier(await client.getByText(/Les commandes pour ce soir sont closes depuis 00h01/).isVisible(), "le client voit pourquoi");

  await admin.goto(BASE + "/admin/reglages");
  await admin.getByLabel("Commande avant… pour être livré le soir même").fill("17:00");
  await admin.getByRole("button", { name: "Enregistrer", exact: true }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  ok("heure limite remise à 17:00");
} finally {
  writeFileSync(`${OUT}/resultat-journee.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
