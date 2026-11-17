// Les photos de Wolt dans l'espace du gérant (15 novembre 2026 : « je veux toutes les photos de Wolt, comme ça
// je sais ce que je cherche — il y a plein de produits que je ne connais pas ») : dans la liste « Produits »,
// sur la fiche d'un article, dans « Photos rapides » et « Prix rapides » — en grand, et jamais côté client.
// À lancer sur le catalogue ENTIER (base vide, puis « npx tsx tests/outils/base-complete.ts »). Ne modifie rien.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const deborde = (p) => p.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
// Les photos visibles à l'écran sont bien arrivées (une photo absente du serveur resterait vide).
const chargees = async (p, selecteur) => {
  await p.waitForFunction((s) => [...document.querySelectorAll(s)].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }).every((i) => i.complete), selecteur, { timeout: 30000 });
  return p.evaluate((s) => { const vues = [...document.querySelectorAll(s)].filter((i) => { const r = i.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; }); return { vues: vues.length, vides: vues.filter((i) => i.naturalWidth === 0).length }; }, selecteur);
};

// Le réglage « Photos de Wolt pour tout le monde » (Réglages) : coché, les visiteurs voient aussi ces photos.
const POUR_TOUS = (await (await fetch(BASE + "/admin/repere/etat")).json()).pourTous === true;

const navigateur = await chromium.launch();
const ouvrir = async (options) => {
  const ctx = await navigateur.newContext(options);
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(BASE + "/admin/connexion");
  await p.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await p.getByRole("button", { name: "Se connecter" }).click();
  await p.waitForURL(BASE + "/admin");
  return { ctx, p };
};

try {
  for (const [ecran, options] of [["téléphone", { ...devices["iPhone 13"], locale: "fr-FR" }], ["ordinateur", { viewport: { width: 1280, height: 900 }, locale: "fr-FR" }]]) {
    const { ctx, p } = await ouvrir(options);

    // 1. La liste « Produits » : chaque article en ligne montre sa photo — celle du site, sinon celle de Wolt
    await p.goto(BASE + "/admin/produits?etat=en-ligne", { waitUntil: "networkidle" });
    const lignes = p.locator("ul.carte > li");
    const total = await lignes.count();
    const wolt = await p.locator("ul.carte > li [data-photo-wolt=liste]").count();
    const sansRien = await lignes.evaluateAll((l) => l.filter((li) => !li.querySelector("img")).length);
    verifier(total >= 100 && wolt >= total * 0.8 && sansRien === 0, `${ecran} · Produits : ${total} articles en ligne affichés, ${wolt} avec la photo de Wolt, aucun sans image`);
    await lignes.first().scrollIntoViewIfNeeded();
    const liste = await chargees(p, "[data-photo-wolt] img");
    verifier(liste.vues >= 1 && liste.vides === 0, `${ecran} · Produits : les photos de Wolt à l'écran sont bien arrivées (${liste.vues})`);
    verifier((await p.locator("[data-photo-wolt=liste]").first().innerText()).trim() === "Wolt", `${ecran} · Produits : chaque photo de Wolt porte l'étiquette « Wolt » (ce n'est pas celle que voit le client)`);
    verifier(!(await deborde(p)), `${ecran} · Produits : la page tient dans l'écran`);
    const cadre = await p.locator("[data-photo-wolt=liste]").first().boundingBox();
    // La colonne du nom (le lien, lui, n'est pas plus large que son texte).
    const nom = await lignes.first().locator("a[href^='/admin/produits/']").first().locator("xpath=../..").boundingBox();
    verifier(nom.width >= 150, `${ecran} · Produits : le nom de l'article garde sa place à côté de la photo (${Math.round(nom.width)} px)`);
    verifier(cadre.width >= 80 && cadre.height >= 60, `${ecran} · Produits : la photo de Wolt fait ${Math.round(cadre.width)} × ${Math.round(cadre.height)} px`);
    if (OUT) await p.screenshot({ path: `${OUT}/photos-wolt-${ecran}-1-produits.png` });

    // 2. Un article masqué qu'aucune capture n'a montré : pas de photo de Wolt, et la fiche dit pourquoi
    await p.goto(BASE + "/admin/produits?etat=masques", { waitUntil: "networkidle" });
    const masques = await p.locator("ul.carte > li").count();
    const masquesAvec = await p.locator("ul.carte > li [data-photo-wolt=liste]").count();
    verifier(masques > 0 && masquesAvec < masques, `${ecran} · Produits masqués : ${masquesAvec} sur ${masques} ont une photo de Wolt (les autres n'étaient sur aucune capture)`);

    // 3. La fiche d'un article : la photo de Wolt en entier, son nom en hébreu à copier
    await p.goto(BASE + "/admin/produits?etat=en-ligne", { waitUntil: "networkidle" });
    await p.locator("ul.carte > li a[href^='/admin/produits/']").first().click();
    await p.waitForURL(/\/admin\/produits\/[a-z0-9]+$/);
    const bloc = p.getByRole("region", { name: "Sur Wolt" });
    await bloc.waitFor();
    const grande = await chargees(p, "[data-photo-wolt=grande] img");
    const taille = await bloc.locator("[data-photo-wolt=grande]").boundingBox();
    verifier(grande.vues === 1 && grande.vides === 0 && taille.width >= 250, `${ecran} · fiche : la photo de Wolt en entier (${Math.round(taille.width)} × ${Math.round(taille.height)} px)`);
    verifier((await bloc.getByRole("button", { name: /^Copier le nom en hébreu/ }).count()) === 1 && (await bloc.getByText("le client ne la voit pas").count()) === 1, `${ecran} · fiche : le nom en hébreu à copier, et « le client ne la voit pas »`);
    const texte = await bloc.locator("p.surtitre").boundingBox();
    verifier(texte.width >= 60 && !(await deborde(p)), `${ecran} · fiche : le texte ne se serre pas à côté de la photo, la page tient dans l'écran`);
    if (OUT) await p.screenshot({ path: `${OUT}/photos-wolt-${ecran}-2-fiche.png` });

    // 4. « Photos rapides » : la photo de Wolt d'abord, en grand
    await p.goto(BASE + "/admin/produits/photos", { waitUntil: "networkidle" });
    const rapides = p.locator("ul.carte > li");
    const premiere = rapides.first();
    await premiere.scrollIntoViewIfNeeded();
    const photo = await premiere.locator("[data-photo-wolt=ligne]").boundingBox();
    const nomRapide = await premiere.locator("p").first().boundingBox();
    verifier(photo.width >= 110 && photo.height >= 80, `${ecran} · Photos rapides : la photo de Wolt fait ${Math.round(photo.width)} × ${Math.round(photo.height)} px (96 × 53 avant)`);
    verifier(photo.x < nomRapide.x && nomRapide.width >= 120, `${ecran} · Photos rapides : elle passe avant le nom de l'article, qui garde sa place`);
    const nombre = await rapides.count();
    verifier((await p.locator("ul.carte > li [data-photo-wolt=ligne]").count()) === nombre, `${ecran} · Photos rapides : les ${nombre} articles sans photo sur le site ont tous leur photo de Wolt`);
    const vues = await chargees(p, "ul.carte [data-photo-wolt] img");
    verifier(vues.vides === 0 && !(await deborde(p)), `${ecran} · Photos rapides : les photos à l'écran sont arrivées, la page tient dans l'écran`);
    if (OUT) await p.screenshot({ path: `${OUT}/photos-wolt-${ecran}-3-photos-rapides.png` });

    // 5. Une photo de Wolt s'ouvre en entier d'un toucher
    const adresse = await premiere.locator("[data-photo-wolt=ligne]").getAttribute("href");
    const reponse = await ctx.request.get(BASE + adresse);
    verifier(reponse.status() === 200 && reponse.headers()["content-type"] === "image/jpeg" && (POUR_TOUS ? /public/ : /private/).test(reponse.headers()["cache-control"] ?? ""), `${ecran} · un toucher ouvre la photo entière (${POUR_TOUS ? "image montrée à tous : réglage coché" : "image privée"})`);
    await ctx.close();
  }

  // 6. Côté client : rien, ni dans une page ni à quelqu'un qui n'est pas connecté — sauf si le gérant a coché
  //    « Photos de Wolt pour tout le monde » : alors la photo seule, jamais l'étiquette « Wolt » ni ses repères.
  const ctx = await navigateur.newContext({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  const p = await ctx.newPage();
  for (const adresse of ["/", "/categorie/cremerie-oeufs", "/recherche?q=lait"]) {
    await p.goto(BASE + adresse, { waitUntil: "networkidle" });
    const source = await p.content();
    if (POUR_TOUS) verifier(/admin\/repere/.test(source) && !/data-photo-wolt|data-etiquette-gerant|data-vue-gerant/.test(source), `côté client · ${adresse} : les photos de Wolt sont montrées (réglage coché), sans étiquette ni repère du gérant`);
    else verifier(!/admin\/repere|data-photo-wolt/.test(source), `côté client · ${adresse} : aucune photo de Wolt`);
  }
  const sansConnexion = await ctx.request.get(BASE + "/admin/repere/nutella-400-g.jpg", { maxRedirects: 0 });
  if (POUR_TOUS) verifier(sansConnexion.status() === 200 && /noindex/.test(sansConnexion.headers()["x-robots-tag"] ?? ""), "sans connexion, la photo est servie (réglage coché), fermée aux moteurs de recherche");
  else verifier(sansConnexion.status() !== 200, `sans connexion, une photo de Wolt n'est pas servie (réponse ${sansConnexion.status()})`);
  await ctx.close();
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-photos-wolt.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
