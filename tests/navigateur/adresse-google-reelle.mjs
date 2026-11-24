// Le VRAI champ d'adresse du panier devant le VRAI Google, avant une mise en ligne — sans passer de commande.
//
// La clé du site (lib/google-maps.ts) n'est acceptée par Google que depuis touristorder.com : en local elle est
// refusée. Ici le navigateur CROIT être sur le site (ORIGINE), mais chaque page lui est servie par le serveur
// local : Google voit donc la bonne adresse d'origine et répond pour de bon.
//
//   npm run build
//   NEXT_PUBLIC_GOOGLE_MAPS_KEY="<la clé de lib/google-maps.ts>" npx next start -p 3101
//   node tests/navigateur/adresse-google-reelle.mjs                    # cinq langues, une vingtaine de demandes à Google
//   ORIGINE=https://touristorder.com node tests/navigateur/adresse-google-reelle.mjs   # l'adresse sans www
//
// Chaque lancement compte dans le quota Google du gérant (quelques dizaines de demandes) : à lancer quand on
// touche à ce champ, pas en boucle. Jeu de test local (seed:demo) ; pour voir le quartier à son prix, poser un
// repère : UPDATE "Ville" SET reperes='Ehud Manor' WHERE nom LIKE 'Netanya – %'.
// Si Google refuse la clé pour ORIGINE, aucune proposition n'arrive : c'est le cas à vérifier dans Google Cloud
// (« Restrictions relatives aux sites web » de la clé), pas un défaut du site.
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const cle = (readFileSync(new URL("../../lib/google-maps.ts", import.meta.url), "utf8").match(/CLE_GOOGLE_MAPS_DU_SITE(?:: string)? = "([^"]*)"/) ?? [])[1] ?? "";
if (!cle) throw new Error("La clé du site est vide (lib/google-maps.ts) : rien à vérifier chez Google.");
const ORIGINE = process.env.ORIGINE || "https://www.touristorder.com";
const LOCAL = process.env.LOCAL || "http://127.0.0.1:3101";
const CAS = [
  { langue: "fr-FR", chemin: "/panier", saisies: ["Nitsa 10 Netanya", "Ehud Manor 5 Netanya", "Island Hotel Netanya", "Dizengoff 50 Tel Aviv", "Weizmann 100 Kfar Saba", "Jaffa 30 Jerusalem"] },
  { langue: "en-US", chemin: "/en/panier", saisies: ["Ehud Manor 5 Netanya", "Sokolov 10 Herzliya"] },
  { langue: "he-IL", chemin: "/he/panier", saisies: ["אהוד מנור 5 נתניה", "דיזנגוף 50 תל אביב"] },
  { langue: "ru-RU", chemin: "/ru/panier", saisies: ["Ehud Manor 5 Netanya", "Herzl 30 Hadera"] },
  { langue: "es-ES", chemin: "/es/panier", saisies: ["Herzl 1 Kadima"] },
];
(async () => {
  const navigateur = await chromium.launch(process.env.HTTPS_PROXY ? { proxy: { server: process.env.HTTPS_PROXY } } : {});
  let total = 0, rates = 0;
  const dire = (ok, quoi) => { total++; if (!ok) rates++; console.log((ok ? "✓ " : "✗ ") + quoi); };
  let panier = null;
  for (const cas of CAS) {
    const contexte = await navigateur.newContext({ locale: cas.langue, viewport: { width: 390, height: 844 }, storageState: panier ?? undefined });
    const journal = [], versGoogle = [];
    await contexte.route(ORIGINE + "/**", async (route) => {
      const req = route.request();
      const u = new URL(req.url());
      const entetes = { ...req.headers(), "x-forwarded-host": new URL(ORIGINE).host, "x-forwarded-proto": "https" };
      delete entetes.host;
      try {
        const r = await fetch(LOCAL + u.pathname + u.search, { method: req.method(), headers: entetes, body: req.postDataBuffer() ?? undefined, redirect: "manual" });
        const h = {};
        r.headers.forEach((v, k) => { if (!["content-encoding", "content-length", "transfer-encoding", "connection"].includes(k)) h[k] = v.replaceAll(LOCAL, ORIGINE); });
        await route.fulfill({ status: r.status, headers: h, body: Buffer.from(await r.arrayBuffer()) });
      } catch { await route.abort(); }
    });
    const page = await contexte.newPage();
    page.on("console", (m) => { if (m.type() === "error" || /Google Maps/.test(m.text())) journal.push(m.text().replaceAll(cle, "<clé>").slice(0, 200)); });
    page.on("pageerror", (e) => journal.push("JS : " + e.message.slice(0, 200)));
    page.on("request", (r) => { if (/googleapis\.com|gstatic\.com/.test(r.url())) versGoogle.push(r.url().replaceAll(cle, "<clé>").split("?")[0].replace(/^https:\/\//, "").slice(0, 80)); });
    if (!panier) {
      await page.goto(ORIGINE + "/", { waitUntil: "networkidle" });
      dire(versGoogle.length === 0, "accueil : rien n'est demandé à Google");
      await page.getByRole("button", { name: /^Ajouter/ }).first().click();
      await page.waitForTimeout(700);
      panier = await contexte.storageState();
    }
    await page.goto(ORIGINE + cas.chemin, { waitUntil: "networkidle" });
    await page.locator('label:has(input[name="logement"][value="MAISON"])').click();
    const champ = page.locator('input[name="adresse"]');
    await champ.waitFor({ timeout: 15000 });
    dire(versGoogle.length === 0, `${cas.chemin} : rien n'est demandé à Google avant de toucher le champ`);
    for (const saisie of cas.saisies) {
      await champ.click();
      await champ.fill("");
      await champ.pressSequentially(saisie, { delay: 25 });
      const liste = page.locator("[data-propositions]");
      const vue = await liste.waitFor({ timeout: 12000 }).then(() => true, () => false);
      if (!vue) { dire(false, `${cas.chemin} « ${saisie} » : pas de propositions`); continue; }
      const options = await liste.locator('[role="option"]').allInnerTexts();
      const logo = await liste.locator("[data-mention-google] img").evaluate((i) => i.complete && i.naturalWidth > 0).catch(() => false);
      const mention = await liste.locator("[data-mention-google]").innerText().catch(() => "");
      const dansLEcran = await liste.evaluate((e) => { const r = e.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth + 1; });
      await liste.locator('[role="option"]').first().click();
      await page.waitForFunction(() => !document.querySelector('input[name="adresse"]')?.getAttribute("aria-busy"), null, { timeout: 12000 }).catch(() => {});
      await page.waitForTimeout(500);
      const etat = await page.evaluate(() => ({
        adresse: document.querySelector('input[name="adresse"]')?.value,
        ville: document.querySelector('[name="ville"]')?.value,
        reconnue: document.querySelector("[data-adresse-reconnue]")?.textContent?.trim() ?? null,
        hors: document.querySelector("[data-adresse-hors-zones]")?.textContent?.trim() ?? null,
        g: ["adresseGoogle", "villeGoogle", "reperesGoogle"].map((n) => document.querySelector(`input[name="${n}"]`)?.value ?? null),
        large: document.documentElement.scrollWidth <= window.innerWidth + 1,
      }));
      console.log(`  [${cas.chemin}] « ${saisie} » → ${options.length} propositions, 1re : ${options[0]?.replace(/\n/g, " — ")}`);
      console.log(`      champ : « ${etat.adresse} » | zone : ${etat.ville} | ${etat.reconnue ?? etat.hors ?? "(aucun avis)"}`);
      console.log(`      gardé : ${JSON.stringify(etat.g)} | logo Google : ${logo ? "affiché" : "non (« " + mention + " »)"}`);
      dire(options.length > 0 && !!etat.adresse, `${cas.chemin} « ${saisie} » : une proposition choisie remplit le champ`);
      dire(!!(etat.reconnue || etat.hors), `${cas.chemin} « ${saisie} » : le client lit sa zone, ou l'avis « hors zones »`);
      dire(dansLEcran && etat.large, `${cas.chemin} « ${saisie} » : rien ne déborde de l'écran`);
    }
    console.log(`  demandes vers Google (${cas.chemin}) :`, Object.entries(versGoogle.reduce((a, u) => { const k = u.replace(/\/[A-Za-z0-9_-]{20,}.*/, "/…"); a[k] = (a[k] || 0) + 1; return a; }, {})).map(([k, n]) => `${n} × ${k}`).join(" ; "));
    dire(journal.length === 0, `${cas.chemin} : aucune erreur dans la console` + (journal.length ? " — " + [...new Set(journal)].slice(0, 3).join(" | ") : ""));
    await contexte.close();
  }
  console.log(`\n${total - rates} / ${total} vérifications (origine : ${ORIGINE})`);
  await navigateur.close();
  if (rates > 0) process.exitCode = 1;
})();
