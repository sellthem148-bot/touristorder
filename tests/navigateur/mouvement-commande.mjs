// Le mouvement sur le panier et sur la page de suivi : les lignes qui arrivent, la quantité qui rebondit, la
// ligne retirée qui se replie, le champ refusé qui se secoue, puis — la commande passée — la coche qui se
// trace, la barre d'avancement qui se remplit, l'étape en cours et le bouton de paiement qui « battent ».
// Comme mouvement.mjs, il vérifie surtout ce que le mouvement ne doit pas faire : laisser un bloc invisible,
// élargir la page, gêner la commande.
// Il PASSE UNE COMMANDE et la fait avancer dans l'espace gérant : sur le jeu de test local seulement
// (base neuve + npm run seed:demo, voir README.md) — il refuse toute autre adresse.
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3100";
if (!/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error("Ce parcours passe une commande : en local seulement.");
const OUT = process.argv[2];
const erreurs = [];
const ok = (m) => console.log("✓", m);
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
const pause = (p, ms) => p.waitForTimeout(ms);
/** Ce que le mouvement a laissé derrière lui une fois les animations finies (rien ne doit l'être). */
const restes = (p) =>
  p.evaluate(() =>
    [...document.querySelectorAll(".apparait, .arrive, .entree-page, .saute, .monte, .deploie, .change, .se-remplit, .balance, .champ-erreur")]
      .filter((el) => {
        const s = getComputedStyle(el);
        return el.getClientRects().length > 0 && (Number(s.opacity) < 1 || s.clipPath !== "none" || s.transform !== "none");
      })
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
  );
const enAttente = (p) => p.locator(".a-venir").count();
async function toutDefiler(p) {
  const hauteur = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= hauteur; y += 500) {
    await p.evaluate((v) => scrollTo(0, v), y);
    await pause(p, 120);
  }
  await pause(p, 800);
}

const navigateur = await chromium.launch();
try {
  const contexte = await navigateur.newContext({ ...devices["iPhone 13"] });
  const p = await contexte.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
    // Les avertissements de React (deux voisins de même clé…) arrivent dans la console, pas en erreur de page.
    p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text().slice(0, 300)); });

  // 1. Deux articles au panier, puis la page du panier — la barre de chargement accompagne le changement de page
  await p.goto(BASE + "/", { waitUntil: "networkidle" });
  await p.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  const autre = p.locator('main article button[aria-label^="Ajouter"]:not([aria-label*="Pack d\'eau"])').first();
  await autre.click();
  await pause(p, 400);
  const barres = [];
  await p.exposeFunction("noterBarre", (etat) => barres.push(etat));
  await p.evaluate(() => {
    new MutationObserver(() => {
      const b = document.querySelector("[data-barre-navigation]");
      window.noterBarre(b ? b.dataset.barreNavigation : "repos");
    }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-barre-navigation"] });
  });
  await p.locator("aside.monte a").click();
  await p.waitForURL(BASE + "/panier");
  await p.locator("form ul li").first().waitFor();
  if (OUT) { await pause(p, 140); await p.screenshot({ path: `${OUT}/commande-1-panier-en-cours.png` }); }
  await pause(p, 1200);
  // (« charge » manque quand la page arrive tout de suite : la barre va droit au bout.)
  verifier(barres[0] === "depart" && barres.includes("fin") && barres.at(-1) === "repos", `changement de page : la barre de chargement part, finit et se retire (${[...new Set(barres)].join(" → ")})`);
  verifier((await p.locator("form ul li").count()) === 2, "panier : les deux lignes sont là");
  verifier((await p.locator("header a[href$='/panier'] svg").count()) === 1, "en-tête : un seul chariot, quel que soit le nombre d'articles");
  verifier((await restes(p)).length === 0, "panier : une fois arrivé, rien n'est resté transparent ou déplacé");
  verifier((await enAttente(p)) >= 2, "panier : les étapes plus bas attendent d'arriver à l'écran");
  verifier(!(await deborde(p)), "panier : pas de défilement horizontal");

  // 2. La quantité rebondit, le prix de la ligne et le total suivent ; la ligne retirée se replie
  const ligne = p.locator("form ul li").first();
  const totalAvant = await p.locator("form aside dl > div").last().locator("dd").innerText();
  await ligne.locator("button").last().click();
  await pause(p, 60);
  verifier((await ligne.locator(".saute").innerText()).trim() === "2", "un article de plus : la quantité passe à 2");
  await pause(p, 500);
  const totalApres = await p.locator("form aside dl > div").last().locator("dd").innerText();
  verifier(totalApres !== totalAvant, `le total a suivi (${totalAvant.trim()} → ${totalApres.trim()})`);
  await ligne.locator("button").first().click();
  await pause(p, 400);
  const seconde = p.locator("form ul li").nth(1);
  await seconde.locator("button").first().click(); // la corbeille : cette ligne n'a qu'un article
  await pause(p, 110);
  const pendant = await seconde.evaluate((el) => ({ classe: el.className, hauteur: el.getBoundingClientRect().height })).catch(() => null);
  verifier(pendant === null || /grid-rows-\[0fr\]/.test(pendant.classe), "la ligne retirée se replie avant de quitter le panier");
  await pause(p, 600);
  verifier((await p.locator("form ul li").count()) === 1, "elle a quitté le panier");
  // La ligne part 220 ms après le toucher, puis le chariot de l'en-tête se balance une demi-seconde : on le laisse finir.
  await pause(p, 600);
  const apresRetrait = await restes(p);
  verifier(apresRetrait.length === 0, `rien n'est resté transparent ou déplacé après ces changements${apresRetrait.length ? " : " + apresRetrait.slice(0, 4).join(" | ") : ""}`);

  // 3. Commander sans rien remplir : les champs refusés se secouent, la page y amène le client
  await toutDefiler(p);
  verifier((await enAttente(p)) === 0, "en faisant défiler, toutes les étapes du formulaire sont arrivées");
  await p.getByRole("button", { name: /^Commander/ }).click();
  await p.locator(".champ-erreur").first().waitFor();
  const refuses = await p.locator(".champ-erreur").count();
  verifier(refuses >= 3, `sans rien remplir : ${refuses} champs refusés, marqués et secoués`);
  verifier((await p.locator(".champ-erreur").first().evaluate((el) => getComputedStyle(el).animationName)) === "secousse", "le champ refusé porte l'animation de secousse");
  await pause(p, 1300);
  const premier = await p.locator("#nomClient").boundingBox();
  verifier(premier.y > 0 && premier.y < p.viewportSize().height, "la page a amené le client sur le premier champ à corriger");
  verifier((await restes(p)).length === 0, "après la secousse, les champs sont revenus à leur place");
  if (OUT) await p.screenshot({ path: `${OUT}/commande-2-refus.png` });

  // 4. Le formulaire rempli : les champs du logement arrivent, les choix répondent, la commande part
  await p.getByLabel("Votre nom").fill("Sarah Mouvement");
  await p.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 11 22 33 44");
  await p.getByLabel("Votre adresse e-mail").fill(`mouvement${Date.now() % 1000000}@exemple.test`);
  await p.getByLabel("Ville").selectOption("Netanya");
  await p.locator("label.pastille", { hasText: "Maison" }).click();
  const rue = p.getByLabel("Rue et numéro", { exact: true });
  await rue.waitFor();
  verifier(await rue.evaluate((el) => el.closest(".apparait") !== null), "le logement choisi : ses champs arrivent en montant");
  verifier((await p.locator("label.pastille", { hasText: "Maison" }).evaluate((el) => getComputedStyle(el).animationName)) === "appui", "le choix coché répond d'un petit appui");
  await rue.fill("Rue des Fleurs 4");
  await pause(p, 600);
  verifier((await restes(p)).length === 0 && !(await deborde(p)), "formulaire rempli : rien d'invisible, pas de défilement horizontal");
  await p.getByRole("button", { name: /^Commander/ }).click();
  await p.waitForURL(/\/suivi\//);
  await p.getByText("Merci, votre commande est enregistrée.").waitFor();
  ok("la commande est passée : le mouvement n'a pas gêné le formulaire");

  // 5. La page de suivi : la coche se trace, l'étape en cours et le bouton de paiement battent
  if (OUT) { await pause(p, 500); await p.screenshot({ path: `${OUT}/commande-3-suivi-en-cours.png` }); }
  verifier((await p.locator("svg.se-trace").count()) >= 1, "suivi : la coche du remerciement se trace");
  verifier((await p.locator("ol li .bat").count()) === 1, "suivi : une seule étape « bat », celle en cours");
  const batEtape = await p.locator("ol li .bat").evaluate((el) => { const s = getComputedStyle(el); return { nom: s.animationName, boucle: s.animationIterationCount }; });
  verifier(batEtape.nom === "halo" && batEtape.boucle === "infinite", "suivi : le halo de l'étape en cours tourne en boucle");
  verifier((await p.locator("a.bat").count()) === 1, "suivi : le bouton de paiement « bat », lui seul");
  await pause(p, 1600);
  verifier((await p.locator("svg.se-trace circle").first().evaluate((el) => getComputedStyle(el).strokeDasharray)) === "none", "suivi : une fois tracée, la coche est entière");
  await toutDefiler(p);
  verifier((await enAttente(p)) === 0 && (await restes(p)).length === 0, "suivi : tout est arrivé, rien n'est resté invisible");
  verifier(!(await deborde(p)), "suivi : pas de défilement horizontal (le halo n'élargit pas la page)");
  const suivi = p.url().replace("?nouvelle=1", "");

  // 6. Le gérant encaisse et met la commande en livraison : la barre d'avancement se remplit
  const admin = await contexte.newPage();
  admin.on("pageerror", (e) => erreurs.push(String(e)));
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");
  await admin.getByText("Sarah Mouvement").first().click();
  await admin.waitForURL(/\/admin\/commandes\//);
  await admin.getByRole("button", { name: "Paiement reçu" }).click();
  await admin.getByText(/^Payée/).first().waitFor();
  await admin.getByText("Changer l'étape à la main").click();
  const select = admin.locator("select#statut");
  await select.selectOption("EN_LIVRAISON");
  await select.locator("xpath=ancestor::form").getByRole("button").click();
  await admin.getByText("En livraison").first().waitFor();
  await admin.waitForLoadState("networkidle");

  await p.goto(suivi, { waitUntil: "commit" });
  const barre = p.locator("ol .se-remplit");
  await barre.waitFor();
  await pause(p, 450);
  const piste = await p.locator("ol > div").first().boundingBox();
  const enCours = (await barre.boundingBox()).width;
  if (OUT) await p.screenshot({ path: `${OUT}/commande-4-avancement-en-cours.png` });
  await pause(p, 1500);
  const finale = (await barre.boundingBox()).width;
  verifier(enCours < finale - 2, `suivi : la barre d'avancement se remplit à l'arrivée (${Math.round(enCours)} px, puis ${Math.round(finale)} px)`);
  verifier(Math.abs(finale - (piste.width * 2) / 3) < 3, "elle s'arrête à l'étape « En livraison » (deux tiers du chemin)");
  verifier((await p.locator("ol li .bat").count()) === 1 && (await p.locator("a.bat").count()) === 0, "commande payée : l'étape en cours bat encore, plus aucun bouton de paiement");
  verifier((await p.locator("svg.se-trace").count()) === 1, "« paiement reçu » : sa coche se trace");
  if (OUT) await p.screenshot({ path: `${OUT}/commande-5-en-livraison.png` });

  // 7. En hébreu : la barre part de la droite, rien ne dépasse
  await p.goto(suivi.replace(BASE, BASE + "/he"), { waitUntil: "networkidle" });
  await pause(p, 1600);
  const pisteHe = await p.locator("ol > div").first().boundingBox();
  const barreHe = await p.locator("ol .se-remplit").boundingBox();
  verifier(Math.abs(barreHe.x + barreHe.width - (pisteHe.x + pisteHe.width)) < 2, "hébreu : la barre d'avancement part de la droite");
  await toutDefiler(p);
  verifier((await enAttente(p)) === 0 && (await restes(p)).length === 0 && !(await deborde(p)), "hébreu : suivi entier, rien d'invisible, pas de défilement horizontal");

  // 8. Livrée : plus rien ne bat
  await select.selectOption("LIVREE");
  await select.locator("xpath=ancestor::form").getByRole("button").click();
  await admin.waitForLoadState("networkidle");
  await p.goto(suivi, { waitUntil: "networkidle" });
  // Le changement du gérant vient d'être enregistré : la page du client l'affiche (au besoin à sa relecture).
  await p.locator("h2 .change", { hasText: "Livrée" }).waitFor({ timeout: 45000 });
  await pause(p, 600);
  verifier((await p.locator(".bat").count()) === 0, "commande livrée : plus rien ne bat");

  // 9. Qui a demandé moins d'animations : rien ne bouge, rien ne boucle
  const calme = await (await navigateur.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" })).newPage();
  await calme.goto(suivi.replace("/suivi/", "/suivi/") , { waitUntil: "networkidle" });
  await pause(calme, 300);
  verifier((await enAttente(calme)) === 0 && (await restes(calme)).length === 0, "moins d'animations : la page de suivi est entière tout de suite");
  const boucles = await calme.evaluate(() => [...document.querySelectorAll("main *")].filter((el) => { const s = getComputedStyle(el); return s.animationName !== "none" && s.animationIterationCount === "infinite"; }).length);
  verifier(boucles === 0, "moins d'animations : aucune animation en boucle");

  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  if (erreurs.length) process.exitCode = 1;
} finally {
  await navigateur.close();
}
