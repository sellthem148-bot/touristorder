// Les contrastes côté client : aucun texte ne doit se perdre sur son fond — surtout depuis que le fond de la
// boutique peut être sombre (lib/fond.ts), où un texte resté foncé devient illisible sans que rien ne casse.
// Pour chaque texte affiché, on cherche le fond qu'il a réellement derrière lui (en remontant ses parents et
// en superposant les couleurs translucides) et on calcule le rapport de contraste. Refusé : moins de 3.
// Ne modifie rien (le panier reste dans le navigateur) : se lance aussi sur le vrai site.
//   node tests/navigateur/contrastes.mjs [dossier de captures] [adresses en plus, ex. /suivi/…]
import { existsSync, statSync } from "node:fs";
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3100";
// Le dossier de captures est celui des arguments qui existe sur le disque ; les autres sont des adresses du site.
const ARGUMENTS = process.argv.slice(2);
const OUT = ARGUMENTS.find((a) => existsSync(a) && statSync(a).isDirectory()) ?? null;
const EN_PLUS = ARGUMENTS.filter((a) => a !== OUT && a.startsWith("/"));
const SEUIL = Number(process.env.SEUIL || 3); // en dessous : refusé (SEUIL=4.5 pour voir aussi ce qui est seulement moyen)
const ok = (m) => console.log("✓", m);
const fautes = [];

/** Les textes de la page dont le contraste est insuffisant. */
const mesurer = (p, seuil) =>
  p.evaluate((seuil) => {
    // Toute couleur (rgb, lab, oklch, color-mix… : les teintes du site sont écrites dans ces formats) est
    // peinte sur un point d'une toile, puis relue en rouge, vert, bleu et opacité.
    const toile = Object.assign(document.createElement("canvas"), { width: 1, height: 1 }).getContext("2d", { willReadFrequently: true });
    const lues = new Map();
    const lire = (c) => {
      if (!lues.has(c)) {
        toile.clearRect(0, 0, 1, 1);
        toile.fillStyle = "#000";
        toile.fillStyle = c;
        toile.fillRect(0, 0, 1, 1);
        const [r, g, b, a] = toile.getImageData(0, 0, 1, 1).data;
        // La toile rend une couleur déjà mêlée à son opacité : on retrouve la couleur pleine.
        lues.set(c, a === 0 ? [0, 0, 0, 0] : [r, g, b, a / 255]);
      }
      return lues.get(c);
    };
    const poser = (dessus, dessous) => {
      const a = dessus[3];
      return [dessus[0] * a + dessous[0] * (1 - a), dessus[1] * a + dessous[1] * (1 - a), dessus[2] * a + dessous[2] * (1 - a), 1];
    };
    const lum = ([r, g, b]) => {
      const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const rapport = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((u, v) => v - u); return (x + 0.05) / (y + 0.05); };
    // Le fond réel d'un élément : ses parents, du plus proche au plus lointain, jusqu'à une couleur opaque.
    const fondDe = (el) => {
      const couches = [];
      for (let e = el; e; e = e.parentElement) {
        const c = lire(getComputedStyle(e).backgroundColor);
        if (c[3] > 0) { couches.push(c); if (c[3] >= 1) break; }
      }
      let fond = lire(getComputedStyle(document.documentElement).backgroundColor);
      if (fond[3] === 0) fond = [255, 255, 255, 1];
      for (const c of couches.reverse()) fond = poser(c, fond);
      return fond;
    };
    const visible = (el) => {
      if (el.getClientRects().length === 0) return false;
      const r = el.getBoundingClientRect();
      if (r.width < 3 || r.height < 3) return false; // « sr-only »
      for (let e = el; e; e = e.parentElement) {
        const s = getComputedStyle(e);
        if (s.visibility === "hidden" || Number(s.opacity) < 0.05) return false;
      }
      return true;
    };
    const fautes = [];
    for (const el of document.querySelectorAll("body *")) {
      if (["SCRIPT", "STYLE", "OPTION", "NOSCRIPT"].includes(el.tagName) || el.closest("nextjs-portal, [aria-hidden='true']")) continue;
      const texte = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join(" ").trim();
      if (!texte || !visible(el)) continue;
      const s = getComputedStyle(el);
      const fond = fondDe(el);
      const couleur = poser(lire(s.color), fond);
      const r = rapport(couleur, fond);
      if (r < seuil) fautes.push(`${r.toFixed(2)} « ${texte.slice(0, 40)} » <${el.tagName.toLowerCase()} class="${String(el.className).slice(0, 70)}"> texte ${s.color} sur ${fond.map(Math.round).slice(0, 3).join(",")}`);
    }
    // Un champ de saisie : son texte d'exemple et ce qu'on y tape.
    for (const el of document.querySelectorAll("input:not([type=hidden]):not([type=radio]):not([type=checkbox]), textarea, select")) {
      if (!visible(el)) continue;
      const fond = fondDe(el);
      const r = rapport(poser(lire(getComputedStyle(el).color), fond), fond);
      if (r < seuil) fautes.push(`${r.toFixed(2)} champ #${el.id || el.name} : texte ${getComputedStyle(el).color} sur ${fond.map(Math.round).slice(0, 3).join(",")}`);
    }
    return fautes;
  }, seuil);

async function toutDefiler(p) {
  const hauteur = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= hauteur; y += 600) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await p.waitForTimeout(90);
  }
  await p.waitForTimeout(700);
}

async function verifier(p, nom) {
  await toutDefiler(p);
  const f = await mesurer(p, SEUIL);
  if (f.length) { fautes.push(...f.map((x) => `${nom} — ${x}`)); console.log(`✗ ${nom} : ${f.length} texte(s) peu lisibles`); for (const x of f.slice(0, 12)) console.log("    ", x); }
  else ok(`${nom} : tous les textes se lisent sur leur fond`);
}

const navigateur = await chromium.launch();
try {
  for (const [appareil, options] of [["téléphone", { ...devices["iPhone 13"] }], ["ordinateur", { viewport: { width: 1280, height: 900 } }]]) {
    for (const prefixe of appareil === "téléphone" ? ["", "/he"] : [""]) {
      const p = await (await navigateur.newContext({ ...options, locale: "fr-FR" })).newPage();
      const page = async (chemin, nom, avant) => {
        await p.goto(BASE + prefixe + chemin, { waitUntil: "networkidle" });
        await p.waitForTimeout(900);
        if (avant) await avant();
        await verifier(p, `${appareil}${prefixe ? " (hébreu)" : ""} · ${nom}`);
      };
      // SEULES=1 : seulement les adresses données en plus (une page de suivi du jeu de test, par exemple).
      if (process.env.SEULES) {
        for (const chemin of EN_PLUS) await page(chemin, chemin.replace(/\/[A-Za-z0-9_-]{20,}/, "/…"));
        if (OUT && !prefixe) { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/contrastes-en-plus-${appareil}.png`, fullPage: true }); }
        await p.context().close();
        continue;
      }
      await page("/", "accueil");
      if (OUT && !prefixe) { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/contrastes-accueil-${appareil}.png` }); }
      await page("/categorie/cremerie-oeufs", "un grand rayon");
      // La fiche d'un article, ouverte par-dessus la page ; puis un article au panier (la barre du bas, le compteur).
      await p.evaluate(() => scrollTo(0, 0));
      await p.locator("main article h3 button").first().click();
      await p.locator("dialog.fiche[open]").waitFor();
      await p.waitForTimeout(700);
      const fiche = await mesurer(p, SEUIL);
      if (fiche.length) { fautes.push(...fiche.map((x) => `fiche — ${x}`)); console.log(`✗ ${appareil} · fiche d'un article : ${fiche.length}`); for (const x of fiche.slice(0, 8)) console.log("    ", x); } else ok(`${appareil}${prefixe ? " (hébreu)" : ""} · fiche d'un article : tous les textes se lisent`);
      await p.locator("dialog.fiche[open] button.bouton").click();
      await p.waitForTimeout(1200);
      await page("/categorie/cremerie-oeufs?s=yaourts", "un sous-rayon entier (avec un article au panier)");
      await page("/categorie/courses-epicerie", "un petit rayon");
      await page("/recherche?q=lait", "une recherche");
      await page("/recherche?q=zzzzzz", "une recherche sans résultat");
      await page("/panier", "le panier");
      if (OUT && !prefixe) { await p.evaluate(() => scrollTo(0, 0)); await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/contrastes-panier-${appareil}.png` }); }
      await page("/commandes", "mes commandes");
      await page("/compte/connexion", "la connexion à l'espace client");
      await page("/contact", "le contact");
      await page("/conditions", "les conditions de vente");
      await page("/credits", "les crédits photos");
      for (const chemin of EN_PLUS) await page(chemin, chemin.replace(/\/[A-Za-z0-9_-]{20,}/, "/…"));
      await p.context().close();
    }
  }
  console.log(fautes.length ? `\n${fautes.length} texte(s) peu lisibles.` : "\nAucun texte ne se perd sur son fond.");
  if (fautes.length) process.exitCode = 1;
} finally {
  await navigateur.close();
}
