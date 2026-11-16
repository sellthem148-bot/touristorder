// Le mouvement du site côté client : ce qui arrive à l'écran monte en fondu, ce qu'on touche répond.
// Ce parcours vérifie surtout ce que le mouvement ne doit JAMAIS faire : laisser un bloc invisible, élargir la
// page, décrocher ce qui reste collé à l'écran, s'imposer à qui a demandé moins d'animations, cacher le site
// à un navigateur sans JavaScript.
// À lancer sur le catalogue ENTIER, comme parcours-rayons.mjs :
//   base vide, puis  npx tsx tests/outils/base-complete.ts
// Ne modifie rien dans la base (le panier reste dans le navigateur).
import { chromium, devices } from "playwright";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const ok = (m) => console.log("✓", m);
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
const pause = (p, ms) => p.waitForTimeout(ms);

/** Ce que le mouvement a laissé derrière lui une fois les animations finies (rien ne doit l'être) :
 *  un élément animé resté transparent, coupé ou déplacé. */
const restes = (p) =>
  p.evaluate(() =>
    // (Un bloc encore en attente plus bas dans la page n'est pas un reste : `enAttente` le compte à part.)
    // (Ni une tuile d'une longue liste qui attend encore plus bas : `.a-venir`.)
    [...document.querySelectorAll(".apparait:not(.a-venir), .arrive, .entree-page, .saute, .monte, .deploie, .change, .se-remplit, .balance")]
      .filter((el) => {
        const s = getComputedStyle(el);
        return el.getClientRects().length > 0 && (Number(s.opacity) < 1 || s.clipPath !== "none" || s.transform !== "none");
      })
      .map((el) => `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}`),
  );
const enAttente = (p) => p.locator(".a-venir").count();
/** Les photos d'articles chargées mais restées transparentes (aucune ne doit l'être). */
const photosCoincees = (p) =>
  p.evaluate(() => [...document.querySelectorAll("img.photo")].filter((i) => i.getClientRects().length > 0 && i.complete && i.naturalWidth > 0 && getComputedStyle(i).opacity === "0").length);
/** Les éléments à l'écran encore transparents (une tuile ou une photo qui n'est pas encore arrivée). */
const transparentsALEcran = (p) =>
  p.evaluate(() => [...document.querySelectorAll("main article")].filter((a) => { const r = a.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0 && Number(getComputedStyle(a).opacity) < 1; }).length);
/** L'en-tête : sa hauteur, où sont le logo, la recherche et les boutons, et la hauteur de la page. */
const mesurerEnTete = (p) =>
  p.evaluate(() => {
    const boite = (el) => { const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, l: r.width, h: r.height, fin: r.right, bas: r.bottom }; };
    const nom = document.querySelector("header.entete .nom-du-site");
    return {
      hauteur: Math.round(document.querySelector("header.entete").getBoundingClientRect().height),
      logo: boite(document.querySelector("header.entete a svg")),
      recherche: boite(document.querySelector(".entete-recherche")),
      boutons: boite(document.querySelector("[data-entete-boutons]")),
      nomVisible: nom.getBoundingClientRect().width > 20 && getComputedStyle(nom).opacity === "1",
      page: document.documentElement.scrollHeight,
      etat: document.documentElement.dataset.defile ?? "",
    };
  });
/** Un coup de pouce : la page descend de `distance` pixels en un tiers de seconde. */
const coupDePouce = (p, distance) =>
  p.evaluate((d) => new Promise((fini) => { const y0 = scrollY; const t0 = performance.now(); const pas = (t) => { const k = Math.min(1, (t - t0) / 330); scrollTo(0, y0 + d * k); if (k < 1) requestAnimationFrame(pas); else fini(); }; requestAnimationFrame(pas); }), distance);

/** Fait défiler toute la page, écran par écran, comme un doigt. */
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
  for (const [langue, prefixe] of [["français", ""], ["hébreu", "/he"]]) {
    const contexte = await navigateur.newContext({ ...devices["iPhone 13"] });
    const p = await contexte.newPage();
    p.on("pageerror", (e) => erreurs.push(String(e)));
    // Les avertissements de React (deux voisins de même clé…) arrivent dans la console, pas en erreur de page.
    p.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) erreurs.push(m.text().slice(0, 300)); });

    // 1. L'accueil : le haut de page arrive en cascade, le bas attend d'être à l'écran
    // Le logo de l'en-tête : à l'ouverture, la tuile se pose, le T descend, le O se lève. On le regarde dès
    // que la page s'affiche (feuille de style arrivée) : une fois tout chargé, l'animation est déjà finie.
    await p.goto(BASE + prefixe + "/", { waitUntil: "commit" });
    await p.waitForFunction(() => { const e = document.querySelector("header.entete"); return e && getComputedStyle(e).position === "fixed" && e.querySelector(".logo-vivant svg circle"); });
    const logo = await p.evaluate(() => {
      const svg = document.querySelector("header.entete .logo-vivant svg");
      return { tuile: getComputedStyle(svg).animationName, lettre: getComputedStyle(svg.querySelector("path")).animationName, soleil: getComputedStyle(svg.querySelector("circle")).animationName, ailleurs: [...document.querySelectorAll("footer svg circle")].map((c) => getComputedStyle(c).animationName).join() };
    });
    verifier(logo.tuile === "logo-tuile" && logo.lettre === "logo-lettre" && logo.soleil === "logo-soleil", `${langue} — à l'ouverture, le logo de l'en-tête s'anime (la tuile, le T, puis le O qui se lève)`);
    verifier(!logo.ailleurs.includes("logo-"), `${langue} — le logo du pied de page, lui, reste immobile`);
    await p.waitForLoadState("networkidle");
    // L'en-tête au large, en haut de page : le nom à côté du logo, la recherche sur toute la largeur.
    await pause(p, 400);
    const large = await mesurerEnTete(p);
    const ecranL = p.viewportSize().width;
    verifier(large.etat === "non" && large.hauteur === 113 && large.nomVisible, `${langue} — en haut de page, l'en-tête est au large (${large.hauteur} px, le nom du site à côté du logo)`);
    verifier(large.recherche.l >= ecranL - 34 && large.recherche.y >= large.logo.bas && large.recherche.bas <= large.hauteur, `${langue} — la recherche tient toute la largeur, sous le logo et les boutons`);
    const enCascade = await p.locator(".apparait").count();
    verifier(enCascade >= 15, `${langue} — accueil : ${enCascade} éléments arrivent en cascade`);
    const mots = await p.locator("h1 span.apparait").allInnerTexts();
    verifier(mots.length >= 3 && (await p.locator("h1").innerText()).replace(/\s+/g, " ").trim() === mots.join(" "), `${langue} — accueil : le titre arrive mot à mot (${mots.length} mots), et se lit comme avant`);
    if (OUT && !prefixe) {
      // Pour l'œil : la page rechargée, prise en plein mouvement.
      await p.reload({ waitUntil: "commit" });
      await p.waitForSelector("#rayons li");
      await pause(p, 260);
      await p.screenshot({ path: `${OUT}/mouvement-1-en-cours.png` });
      await p.waitForLoadState("networkidle");
    }
    await pause(p, 1500);
    const attente = await enAttente(p);
    verifier(attente >= 3, `${langue} — accueil : ${attente} blocs plus bas attendent d'arriver à l'écran`);
    verifier(
      await p.evaluate(() => [...document.querySelectorAll(".a-venir")].every((el) => el.getBoundingClientRect().top >= innerHeight)),
      `${langue} — aucun bloc en attente n'est déjà à l'écran (rien ne disparaît sous les yeux)`,
    );
    verifier(!(await deborde(p)), `${langue} — accueil : pas de défilement horizontal`);
    if (OUT) await p.screenshot({ path: `${OUT}/mouvement-2-accueil-${prefixe ? "he" : "fr"}.png` });

    // 1 bis. Dès qu'on fait défiler, l'en-tête se resserre en une rangée — sans décaler la page
    await p.evaluate(() => scrollTo(0, 60));
    await pause(p, 600);
    const serre = await mesurerEnTete(p);
    verifier(serre.etat === "oui" && serre.hauteur === 61 && !serre.nomVisible, `${langue} — page défilée : l'en-tête se resserre (${serre.hauteur} px, le sigle seul)`);
    const entre = (a, b) => (prefixe ? b.fin <= a.x + 1 : a.fin <= b.x + 1); // en hébreu, tout est retourné
    verifier(entre(serre.logo, serre.recherche) && entre(serre.recherche, serre.boutons) && serre.recherche.l > 100 && serre.recherche.y > 0 && serre.recherche.bas < 61, `${langue} — la recherche a glissé entre le logo et les boutons (${Math.round(serre.recherche.l)} px de large)`);
    verifier(serre.page === large.page && (await p.evaluate(() => scrollY)) === 60, `${langue} — la page n'a pas bougé pendant ce temps (même hauteur, même endroit)`);
    verifier(!(await deborde(p)), `${langue} — en-tête resserré : pas de défilement horizontal`);
    await p.evaluate(() => scrollTo(0, 0));
    await pause(p, 600);
    verifier((await mesurerEnTete(p)).hauteur === 113, `${langue} — revenu tout en haut, il reprend ses aises`);

    // 2. En faisant défiler : chaque bloc arrive, plus rien n'attend, rien ne reste à moitié visible
    await toutDefiler(p);
    verifier((await enAttente(p)) === 0, `${langue} — après avoir fait défiler la page, plus aucun bloc n'attend`);
    const arrives = await p.locator(".arrive").count();
    verifier(arrives === attente, `${langue} — les ${arrives} blocs sont arrivés`);
    const laisses = await restes(p);
    verifier(laisses.length === 0, `${langue} — rien n'est resté transparent ou coupé${laisses.length ? " : " + laisses.slice(0, 4).join(" | ") : ""}`);
    verifier(!(await deborde(p)), `${langue} — toujours pas de défilement horizontal`);

    // 3. Le « + » : le « − 1 + » se déplie à sa place, la barre du panier monte, les compteurs suivent
    await p.evaluate(() => scrollTo(0, 0));
    await p.goto(BASE + prefixe + "/categorie/fruits-legumes", { waitUntil: "networkidle" });
    await pause(p, 900);
    const tuile = p.locator("article", { has: p.locator("img") }).first();
    const plus = tuile.locator("button").first();
    const avant = await plus.boundingBox();
    await plus.click();
    // L'article file vers le panier : une pastille part du « + »…
    await p.locator("[data-envol]").first().waitFor({ state: "attached", timeout: 3000 });
    ok(`${langue} — au « + », l'article s'envole vers le panier`);
    const compteur = tuile.locator(".deploie");
    await compteur.waitFor();
    if (OUT && !prefixe) { await pause(p, 90); await p.screenshot({ path: `${OUT}/mouvement-3-ajout-en-cours.png` }); }
    await pause(p, 600);
    const apres = await compteur.boundingBox();
    verifier(Math.abs(apres.x - avant.x) < 1 && Math.abs(apres.y - avant.y) < 1, `${langue} — le « − 1 + » est à la place du « + » (coin haut gauche de la photo)`);
    verifier((await compteur.evaluate((el) => getComputedStyle(el).clipPath)) === "none", `${langue} — une fois déplié, le « − 1 + » est entier`);
    verifier((await compteur.locator("[aria-live]").innerText()).trim() === "1", `${langue} — il affiche 1`);
    const barre = p.locator("aside.monte");
    verifier(await barre.isVisible(), `${langue} — la barre du panier est montée en bas de l'écran`);
    const bas = await barre.boundingBox();
    const ecran = p.viewportSize();
    verifier(Math.abs(bas.y + bas.height - ecran.height) < 1, `${langue} — elle est posée au bord bas de l'écran, pas décalée`);
    await compteur.locator("button").last().click();
    await pause(p, 500);
    verifier((await compteur.locator("[aria-live]").innerText()).trim() === "2", `${langue} — un second appui : 2`);
    verifier((await barre.locator(".saute").innerText()).trim() === "2", `${langue} — le compteur de la barre suit : 2`);
    verifier((await p.locator("header a[href$='/panier'] svg").count()) === 1, `${langue} — en-tête : un seul chariot, qui se balance à chaque ajout`);
    // Le chariot de l'en-tête se balance une demi-seconde à chaque ajout : on le laisse finir.
    await pause(p, 500);
    const apresAjout = await restes(p);
    verifier(apresAjout.length === 0, `${langue} — rien n'est resté transparent ou coupé après l'ajout${apresAjout.length ? " : " + apresAjout.slice(0, 4).join(" | ") : ""}`);
    // … et ne laisse rien derrière elle.
    verifier((await p.locator("[data-envol]").count()) === 0 && !(await deborde(p)), `${langue} — l'envol terminé, la pastille s'est retirée ; la page n'a pas été élargie`);
    verifier((await photosCoincees(p)) === 0, `${langue} — aucune photo chargée n'est restée transparente`);
    if (OUT) await p.screenshot({ path: `${OUT}/mouvement-4-panier-${prefixe ? "he" : "fr"}.png` });

    // 4. La tuile ouvre toujours la fiche, qui monte par-dessus la page
    await tuile.locator("h3 button").click();
    const fiche = p.locator("dialog.fiche[open]");
    await fiche.waitFor();
    await pause(p, 500);
    const cadre = await fiche.boundingBox();
    verifier(cadre.y + cadre.height <= ecran.height + 1 && cadre.x >= 0 && cadre.width <= ecran.width, `${langue} — la fiche produit s'ouvre dans l'écran`);
    // Échap : elle se referme en douceur (elle redescend), puis disparaît pour de bon.
    await p.keyboard.press("Escape");
    await p.locator("dialog.fiche[data-se-ferme]").waitFor({ state: "attached", timeout: 2000 });
    await p.locator("dialog.fiche").waitFor({ state: "detached", timeout: 2000 });
    ok(`${langue} — la fiche se referme en douceur, puis disparaît`);

    // 5. Un rayon à sous-rayons : la rangée des sous-rayons reste collée sous l'en-tête pendant le mouvement
    await p.goto(BASE + prefixe + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
    await pause(p, 1200);
    verifier((await enAttente(p)) >= 3, `${langue} — crèmerie : les sous-rayons plus bas attendent`);
    await p.evaluate(() => scrollTo(0, 1400));
    await pause(p, 700);
    const collee = await p.locator('main nav[class*="z-[15]"]').boundingBox(); // la rangée du téléphone, pas la colonne du grand écran
    const entete = await p.locator("header").first().boundingBox();
    verifier(Math.abs(collee.y - (entete.y + entete.height)) <= 2, `${langue} — la rangée des sous-rayons reste collée sous l'en-tête`);
    await toutDefiler(p);
    verifier((await enAttente(p)) === 0 && (await restes(p)).length === 0, `${langue} — crèmerie : tout est arrivé, rien n'est resté invisible`);
    verifier(!(await deborde(p)), `${langue} — crèmerie : pas de défilement horizontal`);

    // 5 bis. Une longue liste (un sous-rayon entier) : les tuiles plus bas arrivent rangée par rangée
    await p.goto(BASE + prefixe + "/categorie/cremerie-oeufs?s=yaourts", { waitUntil: "networkidle" });
    await pause(p, 900);
    const tuilesDeLaListe = await p.locator("main article").count();
    const tuilesEnAttente = await p.locator("main article.a-venir").count();
    verifier(tuilesDeLaListe > 30 && tuilesEnAttente > 10, `${langue} — longue liste : ${tuilesDeLaListe} tuiles, dont ${tuilesEnAttente} plus bas qui attendent`);
    verifier((await transparentsALEcran(p)) === 0, `${langue} — longue liste : tout ce qui est à l'écran est visible`);
    await coupDePouce(p, 780);
    await pause(p, 550);
    verifier((await transparentsALEcran(p)) === 0, `${langue} — un coup de pouce d'un écran : une demi-seconde après, tout l'écran est là`);
    await toutDefiler(p);
    const resteListe = await restes(p);
    verifier((await enAttente(p)) === 0 && resteListe.length === 0, `${langue} — longue liste : toutes les tuiles sont arrivées${resteListe.length ? " : " + resteListe.slice(0, 3).join(" | ") : ""}`);
    verifier(!(await deborde(p)) && (await photosCoincees(p)) === 0, `${langue} — longue liste : pas de défilement horizontal, aucune photo restée transparente`);

    // 6. D'une page à l'autre : la barre de chargement accompagne, le fondu rejoue, et le panier n'a pas bougé
    verifier((await p.locator("header").first().getAttribute("data-defile")) === "oui", `${langue} — page défilée : l'en-tête a pris son ombre`);
    await p.evaluate(() => scrollTo(0, 0));
    await pause(p, 150);
    verifier((await p.locator("header").first().getAttribute("data-defile")) === "non", `${langue} — revenu en haut : l'ombre de l'en-tête s'en va`);
    await p.evaluate(() => {
      window.__barre = [];
      new MutationObserver(() => {
        const b = document.querySelector("[data-barre-navigation]");
        const etat = b ? b.dataset.barreNavigation : "repos";
        if (window.__barre.at(-1) !== etat) window.__barre.push(etat);
      }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-barre-navigation"] });
      // Pendant le chargement, le O du logo bat.
      window.__battement = "";
      new MutationObserver(() => {
        if (document.documentElement.hasAttribute("data-page-en-route")) window.__battement = getComputedStyle(document.querySelector("header.entete svg circle")).animationName;
      }).observe(document.documentElement, { attributes: true, attributeFilter: ["data-page-en-route"] });
    });
    await p.evaluate(() => { window.__fondus = 0; document.querySelector(".entree-page").addEventListener("animationstart", (e) => { if (e.animationName === "fondu" && e.target === e.currentTarget) window.__fondus += 1; }); });
    await p.locator("header a").first().click();
    await p.waitForURL(BASE + (prefixe || "/"));
    await pause(p, 700);
    verifier((await p.evaluate(() => window.__fondus)) === 1, `${langue} — en changeant de page, le contenu arrive en fondu (une fois)`);
    verifier((await p.locator("aside.monte .saute").innerText()).trim() === "2", `${langue} — le panier est resté tel quel d'une page à l'autre`);
    await pause(p, 600);
    const barre2 = await p.evaluate(() => window.__barre.join(" → "));
    // (« charge » manque quand la page arrive tout de suite : la barre va droit au bout.)
    verifier(/^depart( → charge)? → fin → repos$/.test(barre2), `${langue} — la barre de chargement part, avance, finit et se retire (${barre2})`);
    const battement = await p.evaluate(() => [window.__battement, document.documentElement.hasAttribute("data-page-en-route"), getComputedStyle(document.querySelector("header.entete svg circle")).animationName]);
    verifier(battement[0] === "logo-battement" && battement[1] === false && battement[2] === "none", `${langue} — pendant le chargement le O du logo bat, puis s'arrête (sans rejouer son lever)`);
    if (!prefixe) {
      const depart = await p.evaluate(() => new Promise((fini) => {
        new MutationObserver((_, o) => { const b = document.querySelector("[data-barre-navigation]"); if (b) { o.disconnect(); const r = b.getBoundingClientRect(); fini({ x: r.x, y: r.y }); } }).observe(document.body, { childList: true, subtree: true });
        document.querySelector("#rayons a").click();
      }));
      verifier(depart.x === 0 && depart.y === 0, "français — la barre part du coin haut gauche de l'écran");
      await p.waitForURL(/\/categorie\//);
      await p.goBack();
      await pause(p, 600);
    }

    // 7. Le panier (sans rien commander) : les lignes arrivent, la quantité rebondit, les étapes plus bas attendent
    await p.locator("aside.monte a").click();
    await p.waitForURL(BASE + prefixe + "/panier");
    await p.locator("form ul li").first().waitFor();
    await pause(p, 1100);
    verifier((await p.locator("form ul li").count()) === 1, `${langue} — panier : la ligne de l'article est là`);
    verifier((await enAttente(p)) >= 2, `${langue} — panier : les étapes plus bas attendent d'arriver à l'écran`);
    const ligne = p.locator("form ul li").first();
    await ligne.locator("button").last().click();
    await pause(p, 60);
    verifier((await ligne.locator(".saute").innerText()).trim() === "3", `${langue} — panier : un article de plus, la quantité rebondit à 3`);
    await pause(p, 500);
    await ligne.locator("button").first().click();
    await pause(p, 500);
    await toutDefiler(p);
    verifier((await enAttente(p)) === 0, `${langue} — panier : en faisant défiler, toutes les étapes sont arrivées`);
    const laissesPanier = await restes(p);
    verifier(laissesPanier.length === 0, `${langue} — panier : rien n'est resté transparent ou déplacé${laissesPanier.length ? " : " + laissesPanier.slice(0, 4).join(" | ") : ""}`);
    verifier(!(await deborde(p)), `${langue} — panier : pas de défilement horizontal`);
    // Choisir « Hôtel » : l'avis et le champ de l'hôtel arrivent en montant, le choix répond.
    const hotel = p.locator('label.pastille:has(input[name="logement"][value="HOTEL"])');
    await hotel.click();
    await p.locator("#adresse").waitFor();
    verifier(await p.locator("#adresse").evaluate((el) => el.closest(".apparait") !== null), `${langue} — panier : le champ de l'hôtel arrive en montant`);
    verifier((await hotel.evaluate((el) => getComputedStyle(el).animationName)) === "appui", `${langue} — panier : le choix coché répond d'un petit appui`);
    await pause(p, 700);
    verifier((await restes(p)).length === 0 && !(await deborde(p)), `${langue} — panier : après ce choix, rien d'invisible, pas de défilement horizontal`);
    if (OUT) await p.screenshot({ path: `${OUT}/mouvement-6-panier-${prefixe ? "he" : "fr"}.png` });
    await contexte.close();
  }

  // 8. Qui a demandé moins d'animations à son appareil : rien n'attend, rien ne bouge
  const calme = await navigateur.newContext({ ...devices["iPhone 13"], reducedMotion: "reduce" });
  const c = await calme.newPage();
  c.on("pageerror", (e) => erreurs.push(String(e)));
  await c.goto(BASE + "/", { waitUntil: "networkidle" });
  await pause(c, 400);
  verifier((await enAttente(c)) === 0, "moins d'animations : aucun bloc n'est mis en attente");
  verifier((await restes(c)).length === 0, "moins d'animations : toute la page est visible tout de suite");
  const duree = await c.locator(".apparait").first().evaluate((el) => parseFloat(getComputedStyle(el).animationDuration));
  verifier(duree < 0.001, "moins d'animations : les animations sont coupées");
  await c.goto(BASE + "/categorie/cremerie-oeufs?s=yaourts", { waitUntil: "networkidle" });
  await pause(c, 400);
  verifier((await enAttente(c)) === 0, "moins d'animations : dans une longue liste, aucune tuile n'attend");
  // Le « + » d'une carte, par son nom : dans la carte à la manière de Wolt il vient AVANT le bouton du nom.
  await c.locator("main article").first().getByRole("button", { name: /^Ajouter/ }).click();
  await pause(c, 150);
  verifier((await c.locator("[data-envol]").count()) === 0, "moins d'animations : pas d'envol vers le panier");
  await c.locator("main article h3 button").first().click();
  await c.locator("dialog.fiche[open]").waitFor();
  await c.keyboard.press("Escape");
  await pause(c, 80);
  verifier((await c.locator("dialog.fiche").count()) === 0, "moins d'animations : la fiche se ferme tout de suite");
  await calme.close();

  // 9. Sans JavaScript (et pour un moteur de recherche) : toute la page est là
  const sans = await navigateur.newContext({ ...devices["iPhone 13"], javaScriptEnabled: false });
  const s = await sans.newPage();
  await s.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "load" });
  await pause(s, 1500);
  verifier((await enAttente(s)) === 0, "sans JavaScript : aucun bloc n'est caché");
  const opacites = await s.locator("main article").evaluateAll((l) => l.filter((a) => a.offsetParent !== null).map((a) => Number(getComputedStyle(a).opacity)));
  verifier(opacites.length > 20 && opacites.every((o) => o === 1), `sans JavaScript : les ${opacites.length} tuiles sont visibles`);
  await s.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "load" });
  await s.evaluate(() => scrollTo(0, 1400));
  await pause(s, 400);
  const sansJs = await s.evaluate(() => ({ entete: Math.round(document.querySelector("header.entete").getBoundingClientRect().height), collee: Math.round(document.querySelector('main nav[class*="z-[15]"]').getBoundingClientRect().top) }));
  verifier(sansJs.entete === 113 && sansJs.collee === 113, `sans JavaScript : l'en-tête reste au large (${sansJs.entete} px) et la rangée des sous-rayons se colle juste dessous`);
  await s.goto(BASE + "/categorie/cremerie-oeufs?s=yaourts", { waitUntil: "load" });
  await pause(s, 1200);
  const liste = await s.locator("main article").evaluateAll((l) => l.map((a) => Number(getComputedStyle(a).opacity)));
  verifier(liste.length > 30 && liste.every((o) => o === 1), `sans JavaScript : dans une longue liste, les ${liste.length} tuiles sont visibles`);
  await s.goto(BASE + "/categorie/fruits-legumes", { waitUntil: "load" });
  await pause(s, 800);
  const photos = await s.locator("img.photo").evaluateAll((l) => l.filter((i) => i.getClientRects().length > 0).map((i) => [i.dataset.chargee ?? "", getComputedStyle(i).opacity]));
  verifier(photos.length > 0 && photos.every(([etat, o]) => etat === "" && o === "1"), `sans JavaScript : les ${photos.length} photos s'affichent comme de simples images`);
  await sans.close();

  // 10. Sur ordinateur : la tuile se soulève au survol, la colonne des rayons reste collée
  const ordi = await (await navigateur.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  ordi.on("pageerror", (e) => erreurs.push(String(e)));
  await ordi.goto(BASE + "/categorie/cremerie-oeufs", { waitUntil: "networkidle" });
  await pause(ordi, 1300);
  const ordiLarge = await mesurerEnTete(ordi);
  verifier(ordiLarge.hauteur === 83 && ordiLarge.nomVisible && ordiLarge.recherche.x - ordiLarge.logo.fin > 100, `ordinateur : en haut de page l'en-tête est plus haut (${ordiLarge.hauteur} px), le nom entre le logo et la recherche`);
  const carte = ordi.locator("main article").first();
  const repos = await carte.boundingBox();
  await carte.hover({ position: { x: 20, y: 150 } });
  await pause(ordi, 350);
  const survol = await carte.boundingBox();
  verifier(repos.y - survol.y > 1 && repos.y - survol.y < 4, "ordinateur : la tuile survolée se soulève un peu");
  if (OUT) await ordi.screenshot({ path: `${OUT}/mouvement-5-ordinateur.png` });
  await ordi.mouse.move(0, 0);
  await ordi.evaluate(() => scrollTo(0, 700)); // (le rayon tient en une rangée par sous-rayon : la page est courte)
  await pause(ordi, 600);
  const ordiSerre = await mesurerEnTete(ordi);
  verifier(ordiSerre.hauteur === 65 && ordiSerre.page === ordiLarge.page, `ordinateur : page défilée, il se resserre (${ordiSerre.hauteur} px) sans décaler la page`);
  const colonne = await ordi.locator("aside nav").first().boundingBox();
  verifier(colonne.y > 60 && colonne.y < 120, "ordinateur : la colonne des rayons reste collée pendant le défilement");
  await toutDefiler(ordi);
  verifier((await enAttente(ordi)) === 0 && (await restes(ordi)).length === 0, "ordinateur : tout est arrivé, rien n'est resté invisible");

  // 11. Sur ordinateur, depuis la fiche d'un article : elle se referme, puis l'article file vers le panier de l'en-tête
  await ordi.goto(BASE + "/categorie/fruits-legumes", { waitUntil: "networkidle" });
  await pause(ordi, 900);
  await ordi.locator("main article h3 button").first().click();
  await ordi.locator("dialog.fiche[open]").waitFor();
  await pause(ordi, 500);
  await ordi.locator("dialog.fiche[open] button.bouton").click();
  await ordi.locator("dialog.fiche[data-se-ferme]").waitFor({ state: "attached", timeout: 2000 });
  const envol = ordi.locator("[data-envol]").first();
  await envol.waitFor({ state: "attached", timeout: 3000 });
  verifier((await ordi.locator("dialog.fiche").count()) === 0, "ordinateur : la fiche s'est refermée avant l'envol");
  const depart = await envol.boundingBox();
  await pause(ordi, 400);
  const enVol = await envol.boundingBox().catch(() => null);
  const panierEnTete = await ordi.locator("header a[data-cible-panier='entete']").boundingBox();
  verifier(depart && (!enVol || enVol.x > depart.x) && panierEnTete.x > depart.x, "ordinateur : l'article part de la fiche vers le panier de l'en-tête (en haut à droite)");
  await pause(ordi, 1200);
  verifier((await ordi.locator("[data-envol]").count()) === 0 && (await ordi.locator("header a[data-cible-panier='entete'] span.saute").innerText()).trim() === "1", "ordinateur : la pastille s'est retirée, le panier compte 1 article");

  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  if (erreurs.length) process.exitCode = 1;
} finally {
  await navigateur.close();
}
