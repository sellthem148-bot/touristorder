import { chromium, devices } from "playwright";
const B = process.env.BASE_URL || "http://localhost:3100"; const b = await chromium.launch();
const p = await (await b.newContext({ ...devices["iPhone SE"] })).newPage();
const res = []; const mesure = async (nom) => {
  const [sw, iw, ew] = await p.evaluate(() => [document.documentElement.scrollWidth, innerWidth, screen.width]);
  res.push(`${sw > iw || iw > ew ? "✗" : "✓"} ${nom} (${sw}/${iw}/${ew})`);
};
await p.goto(B + "/"); await mesure("accueil");
await p.goto(B + "/recherche?q=maillot"); await mesure("recherche maillot");
await p.getByRole("button", { name: /^Choisir les options de Maillot/ }).first().click(); await p.getByRole("dialog").waitFor(); await mesure("fiche produit");
await p.getByRole("button", { name: "Fermer" }).click();
await p.goto(B + "/");
await p.getByRole("button", { name: /^Ajouter Pack d'eau/ }).first().click();
for (const u of ["/panier", "/categorie/plage-soleil", "/recherche?q=couches", "/commandes", "/compte/connexion"]) { await p.goto(B + u); await p.waitForTimeout(600); await mesure(u); }
await p.goto(B + "/admin/connexion"); await p.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123"); await p.getByRole("button", { name: "Se connecter" }).click(); await p.waitForURL(B + "/admin");
await mesure("/admin");
await p.locator('a[href^="/admin/commandes/"]').first().click(); await p.waitForURL(/commandes\//); await mesure("admin commande");
await p.screenshot({ path: process.argv[2] + "/v2-11-admin-se.png" });
for (const u of ["/admin/statistiques", "/admin/produits", "/admin/produits?etat=a-completer", "/admin/produits/nouveau", "/admin/produits/prix", "/admin/tarifs", "/admin/villes", "/admin/clients", "/admin/journee", "/admin/journee?jour=2026-11-11", "/admin/categories", "/admin/reglages"]) { await p.goto(B + u); await mesure(u); }
console.log(res.join("\n")); await b.close();
