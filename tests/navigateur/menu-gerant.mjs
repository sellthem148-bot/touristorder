// Le menu du gérant : aucun lien ne doit sortir de l'écran. Sur ordinateur et tablette ils sont tous
// visibles ; sur téléphone la rangée défile jusqu'au dernier et montre toujours le lien de la page ouverte.
// Ne modifie aucune donnée : peut se lancer seul, à tout moment.
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const etapes = [];
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); etapes.push(m); console.log("✓", m); };
const ECRANS = [
  ["ordinateur 1440 px", { viewport: { width: 1440, height: 800 } }, true],
  ["ordinateur 1280 px", { viewport: { width: 1280, height: 800 } }, true],
  ["petit ordinateur 1024 px", { viewport: { width: 1024, height: 700 } }, true],
  ["tablette 768 px", { viewport: { width: 768, height: 900 } }, true],
  ["téléphone 390 px", devices["iPhone 13"], false],
  ["petit téléphone 320 px", devices["iPhone SE"], false],
];

const navigateur = await chromium.launch();
try {
  for (const [nom, options, tousVisibles] of ECRANS) {
    const ctx = await navigateur.newContext(options);
    const p = await ctx.newPage();
    await p.goto(BASE + "/admin/connexion");
    await p.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
    await p.getByRole("button", { name: "Se connecter" }).click();
    await p.waitForURL(BASE + "/admin");
    const menu = () => p.evaluate(() => {
      const liens = [...document.querySelectorAll('nav[aria-label="Administration"] a')];
      const dans = (a) => { const r = a.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.right <= innerWidth; };
      return { total: liens.length, visibles: liens.filter(dans).length, tropLarge: document.documentElement.scrollWidth > innerWidth || innerWidth > screen.width };
    });
    const accueil = await menu();
    verifier(accueil.total >= 11 && !accueil.tropLarge, `${nom} : le menu a ses ${accueil.total} liens, la page n'est pas trop large`);
    if (tousVisibles) verifier(accueil.visibles === accueil.total, `${nom} : tous les liens du menu sont à l'écran (« Réglages » compris)`);

    // La page du dernier lien : son lien est à l'écran, même sur téléphone.
    await p.getByRole("navigation", { name: "Administration" }).getByRole("link", { name: "Réglages" }).click({ force: true });
    await p.waitForURL(BASE + "/admin/reglages");
    await p.getByRole("heading", { name: "Réglages", level: 1 }).waitFor();
    await p.waitForTimeout(300);
    const actif = await p.evaluate(() => {
      const a = document.querySelector('nav[aria-label="Administration"] a[aria-current="page"]');
      const r = a?.getBoundingClientRect();
      return { texte: a?.textContent ?? "", visible: !!r && r.left >= 0 && r.right <= innerWidth };
    });
    verifier(actif.texte === "Réglages" && actif.visible, `${nom} : sur la page Réglages, son lien est à l'écran`);
    if (!tousVisibles) {
      // Au doigt, la rangée revient au début et va jusqu'au bout.
      const bouts = await p.evaluate(() => {
        const n = document.querySelector('nav[aria-label="Administration"]');
        const liens = [...n.querySelectorAll("a")];
        const dans = (a) => { const r = a.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth; };
        n.scrollTo({ left: 0 }); const premier = dans(liens[0]);
        n.scrollTo({ left: n.scrollWidth }); const dernier = dans(liens[liens.length - 1]);
        return { premier, dernier };
      });
      verifier(bouts.premier && bouts.dernier, `${nom} : la rangée défile du premier lien au dernier`);
    }
    await ctx.close();
  }
} finally {
  await navigateur.close();
}
console.log(`${etapes.length} vérifications : le menu du gérant est complet sur tous les écrans.`);
