// Livraison le soir : horaires affichés, jours livrés, délai de préparation.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s\u00a0\u202f]+/g, " ");

const navigateur = await chromium.launch();
const ctx = await navigateur.newContext({ ...devices["iPhone 13"] });
const admin = await ctx.newPage();
const client = await ctx.newPage();
for (const p of [admin, client]) p.on("pageerror", (e) => erreurs.push(String(e)));

try {
  // 1. Accueil : horaires du soir et prochaine livraison
  await client.goto(BASE + "/");
  const accueil = espaces(await client.locator("main").innerText());
  verifier(accueil.includes("Horaires Le soir, 19h – 00h"), "accueil : horaires « Le soir, 19h – 00h »");
  verifier(/Prochaine livraison (Ce soir|Demain|\w+ \d+ \w+) dès \d\d:\d\d/.test(accueil), "accueil : « Prochaine livraison … dès … »");
  await client.screenshot({ path: `${OUT}/v5-1-accueil-soir.png` });

  // 2. Panier : uniquement des créneaux du soir
  await client.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await client.goto(BASE + "/panier");
  await client.getByText("Pack d'eau").first().waitFor();
  await client.getByText("Demain", { exact: true }).click();
  const creneaux = await client.locator('input[name="creneau"]').evaluateAll((l) => l.map((i) => i.value));
  verifier(JSON.stringify(creneaux) === JSON.stringify(["19:00 – 20:00", "20:00 – 21:00", "21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"]), "demain : les 5 créneaux du soir");

  // 3. Admin : ne pas livrer le vendredi ni le samedi, délai 90 min
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");
  await admin.goto(BASE + "/admin/reglages");
  const jours = admin.locator("fieldset", { hasText: "Jours où tu livres" });
  await jours.getByText("Ven", { exact: true }).click();
  await jours.getByText("Sam", { exact: true }).click();
  await admin.getByLabel("Délai de préparation (minutes)").fill("90");
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  verifier((await admin.getByLabel("Délai de préparation (minutes)").inputValue()) === "90", "réglages : délai enregistré");
  await admin.screenshot({ path: `${OUT}/v5-2-reglages-soir.png`, fullPage: true });

  await client.goto(BASE + "/panier");
  await client.getByText("Pack d'eau").first().waitFor();
  const libelles = await client.locator('input[name="dateLivraison"]').evaluateAll((l) => l.map((i) => i.parentElement.textContent.trim()));
  verifier(!libelles.some((l) => /^(Vendredi|Samedi)/.test(l)), `plus de vendredi ni de samedi (${libelles.join(", ")})`);

  // 4. Aucun jour coché : refusé
  await admin.goto(BASE + "/admin/reglages");
  for (const j of ["Dim", "Lun", "Mar", "Mer", "Jeu"]) await jours.getByText(j, { exact: true }).click();
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await admin.getByText(/Coche au moins un jour de livraison/).waitFor();
  ok("aucun jour de livraison : refusé");

  // Remise en état : tous les jours, 60 min
  await admin.goto(BASE + "/admin/reglages");
  for (const j of ["Ven", "Sam"]) await jours.getByText(j, { exact: true }).click();
  await admin.getByLabel("Délai de préparation (minutes)").fill("60");
  await admin.getByRole("button", { name: "Enregistrer" }).click();
  await admin.getByText("Réglages enregistrés.").waitFor();
  ok("réglages remis : tous les jours, 60 min");
} finally {
  writeFileSync(`${OUT}/resultat-soir.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
