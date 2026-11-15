// « Photos rapides » : coller sur un article l'image qu'on vient de copier (demande du gérant, 15 novembre 2026 :
// « il y a encore trop de produits sans images »). Bouton « Coller », Ctrl + V, image glissée sur la ligne ;
// une vignette est refusée, la même image deux fois de suite est signalée, la photo apparaît côté client.
// MODIFIE la base (pose des images d'essai sur cinq articles) : base LOCALE seulement, jamais le vrai site.
// Pour tout remettre : vider `photoUrl` des articles dont la photo commence par « /uploads/ ».
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
if (!/^http:\/\/(localhost|127\.0\.0\.1)[:/]/.test(BASE)) throw new Error("Ce parcours pose des photos d'essai : base locale seulement.");
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };

// Une image d'essai dessinée dans la page (aucun fichier, aucun autre site) : `cote` px, une couleur à elle.
const dessiner = (cote, couleur) => `(async () => {
  const toile = document.createElement("canvas");
  toile.width = ${cote}; toile.height = ${cote};
  const c = toile.getContext("2d");
  c.fillStyle = "#ffffff"; c.fillRect(0, 0, ${cote}, ${cote});
  c.fillStyle = "${couleur}"; c.beginPath(); c.arc(${cote} / 2, ${cote} / 2, ${cote} / 3, 0, 7); c.fill();
  return await new Promise((fini) => toile.toBlob(fini, "image/png"));
})()`;
const copier = (p, cote, couleur) => p.evaluate(`(async () => { const blob = await ${dessiner(cote, couleur)}; await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]); })()`);

const navigateur = await chromium.launch();
const ouvrir = async (options) => {
  const ctx = await navigateur.newContext(options);
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  await p.goto(BASE + "/admin/connexion");
  await p.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await p.getByRole("button", { name: "Se connecter" }).click();
  await p.waitForURL(BASE + "/admin");
  await p.goto(BASE + "/admin/produits/photos", { waitUntil: "networkidle" });
  return { ctx, p };
};
const sansPhoto = async (p) => Number((await p.getByRole("link", { name: /^Sans photo \(/ }).innerText()).match(/\((\d+)\)/)[1]);

try {
  const { ctx, p } = await ouvrir({ viewport: { width: 1280, height: 900 }, locale: "fr-FR" });
  const lignes = p.locator("ul.carte > li");
  const avant = await sansPhoto(p);
  verifier(avant >= 6, `« Photos rapides » : ${avant} articles sans photo, chacun avec « Coller » et « Ajouter »`);
  // (Le champ de fichier caché compte aussi comme un bouton, sans texte : on ne lit que les vrais.)
  const textes = async (ligne) => (await ligne.locator("button").allInnerTexts()).map((t) => t.trim());
  verifier((await textes(lignes.nth(0))).join(" / ") === "Coller / Ajouter", "une ligne : « Coller » d'abord, « Ajouter » ensuite");
  await p.getByText("Reviens ici → « Coller »").waitFor();
  ok("le mode d'emploi est en haut de la page : chercher, copier, coller");
  const nomDe = async (i) => (await lignes.nth(i).locator("p").first().innerText()).trim();
  const message = (i) => lignes.nth(i).locator("[role=alert], [role=status]");

  // 1. Une adresse copiée à la place de l'image : on dit quoi faire, rien n'est enregistré
  await p.evaluate(() => navigator.clipboard.writeText("https://exemple.test/lait.jpg"));
  await lignes.nth(0).getByRole("button", { name: /^Coller/ }).click();
  await message(0).filter({ hasText: "pas l'image" }).waitFor();
  verifier((await lignes.nth(0).locator("img[src^='/uploads/']").count()) === 0, "une adresse copiée au lieu de l'image : « choisis Copier l'image », rien n'est enregistré");

  // 2. Une vraie image : collée, enregistrée, la vignette apparaît
  await copier(p, 640, "#1d4ed8");
  await lignes.nth(0).getByRole("button", { name: /^Coller/ }).click();
  await message(0).filter({ hasText: "Photo enregistrée." }).waitFor();
  const premiere = await lignes.nth(0).locator("img[data-photo-site]").getAttribute("src");
  verifier(/^\/uploads\/[0-9a-f-]{36}\.(png|jpg)$/.test(premiere), `« Coller » : l'image copiée est enregistrée sur « ${await nomDe(0)} » et sa vignette s'affiche`);
  verifier((await textes(lignes.nth(0))).join(" / ") === "Coller / Changer", "le second bouton devient « Changer »");
  if (OUT) await p.screenshot({ path: `${OUT}/photos-coller-1.png` });

  // 3. La même image sur l'article suivant : signalée (on a oublié de copier la nouvelle), acceptée si on insiste
  await lignes.nth(1).getByRole("button", { name: /^Coller/ }).click();
  await message(1).filter({ hasText: "même image que pour l'article précédent" }).waitFor();
  verifier((await lignes.nth(1).locator("img[src^='/uploads/']").count()) === 0, "la même image sur l'article suivant : signalée, pas enregistrée");
  await lignes.nth(1).getByRole("button", { name: /^Coller/ }).click();
  await message(1).filter({ hasText: "Photo enregistrée." }).waitFor();
  ok("recollée telle quelle : acceptée (c'était voulu)");

  // 4. Une vignette (150 px) est refusée ; une petite image (300 px) passe avec un avertissement
  await copier(p, 150, "#b91c1c");
  await lignes.nth(2).getByRole("button", { name: /^Coller/ }).click();
  await message(2).filter({ hasText: "Image trop petite (150 px)" }).waitFor();
  verifier((await lignes.nth(2).locator("img[src^='/uploads/']").count()) === 0, "une vignette de 150 px : refusée, « ouvre l'image en grand »");
  await copier(p, 300, "#b45309");
  await lignes.nth(2).getByRole("button", { name: /^Coller/ }).click();
  await message(2).filter({ hasText: "petite (300 px)" }).waitFor();
  verifier((await lignes.nth(2).locator("img[src^='/uploads/']").count()) === 1, "une image de 300 px : enregistrée, avec « elle sera un peu floue »");

  // 5. « Chercher une image » vise la ligne ; Ctrl + V y pose l'image
  const [recherche] = await Promise.all([ctx.waitForEvent("page"), lignes.nth(3).getByRole("link", { name: /^Chercher une image/ }).click()]);
  verifier(/google\.[a-z.]+\/search\?.*tbm=isch/.test(recherche.url()) || recherche.url() === "about:blank" || /google|consent/.test(recherche.url()), "« Chercher une image » ouvre la recherche d'images dans un autre onglet");
  await recherche.close();
  await p.bringToFront();
  verifier((await p.locator("ul.carte > li[data-visee=oui]").count()) === 1 && (await lignes.nth(3).getAttribute("data-visee")) === "oui", "la ligne où l'on a cherché est entourée : c'est elle qui recevra l'image");
  await lignes.nth(3).getByText("reviens ici, puis « Coller »").waitFor();
  await p.evaluate(`(async () => {
    const blob = await ${dessiner(700, "#047857")};
    const transfert = new DataTransfer();
    transfert.items.add(new File([blob], "copie.png", { type: "image/png" }));
    document.dispatchEvent(new ClipboardEvent("paste", { clipboardData: transfert, bubbles: true, cancelable: true }));
  })()`);
  await message(3).filter({ hasText: "Photo enregistrée." }).waitFor();
  verifier((await lignes.nth(3).locator("img[src^='/uploads/']").count()) === 1, `Ctrl + V : l'image va sur la ligne visée (« ${await nomDe(3)} »)`);
  verifier((await p.locator("ul.carte > li[data-visee=oui]").count()) === 0, "une fois la photo posée, plus aucune ligne n'attend d'image");
  // Sans ligne visée, un Ctrl + V ne pose rien nulle part.
  const posees = await p.locator("ul.carte > li img[src^='/uploads/']").count();
  await p.evaluate(`(async () => {
    const blob = await ${dessiner(700, "#7c3aed")};
    const transfert = new DataTransfer();
    transfert.items.add(new File([blob], "copie.png", { type: "image/png" }));
    document.dispatchEvent(new ClipboardEvent("paste", { clipboardData: transfert, bubbles: true, cancelable: true }));
  })()`);
  await p.waitForTimeout(800);
  verifier((await p.locator("ul.carte > li img[src^='/uploads/']").count()) === posees, "Ctrl + V sans ligne visée : rien n'est posé au hasard");

  // 6. Une image glissée sur une ligne
  const transfert = await p.evaluateHandle(`(async () => {
    const blob = await ${dessiner(620, "#be185d")};
    const t = new DataTransfer();
    t.items.add(new File([blob], "glissee.png", { type: "image/png" }));
    return t;
  })()`);
  await lignes.nth(4).dispatchEvent("dragover", { dataTransfer: transfert });
  await lignes.nth(4).dispatchEvent("drop", { dataTransfer: transfert });
  await message(4).filter({ hasText: "Photo enregistrée." }).waitFor();
  verifier((await lignes.nth(4).locator("img[src^='/uploads/']").count()) === 1, "une image glissée sur la ligne : enregistrée");

  // 7. Le compte baisse, et le client voit la photo
  const nomPremier = await nomDe(0);
  await p.reload({ waitUntil: "networkidle" });
  const apres = await sansPhoto(p);
  verifier(apres === avant - 5, `après rechargement : ${apres} articles sans photo (cinq de moins)`);
  await p.goto(BASE + "/recherche?q=" + encodeURIComponent(nomPremier), { waitUntil: "networkidle" });
  const tuile = p.locator("main article").filter({ hasText: nomPremier }).first();
  verifier((await tuile.locator(`img[src*="${premiere.split("/").pop()}"]`).count()) === 1, `côté client : la tuile de « ${nomPremier} » montre la photo collée`);
  await ctx.close();

  // 8. Sur téléphone : les deux boutons tiennent, la page ne s'élargit pas
  const { ctx: ctxTel, p: tel } = await ouvrir({ ...devices["iPhone 13"], locale: "fr-FR" });
  const large = await tel.evaluate(() => innerWidth > screen.width || document.documentElement.scrollWidth > innerWidth + 1);
  const boutons = await tel.locator("ul.carte > li").nth(0).locator("button").evaluateAll((l) => l.map((b) => { const r = b.getBoundingClientRect(); return { droite: r.right, hauteur: r.height }; }));
  verifier(!large && boutons.every((b) => b.droite <= 390 && b.hauteur >= 34), "téléphone : « Coller » et « Ajouter » tiennent dans la ligne, la page ne s'élargit pas");
  await copier(tel, 640, "#0e7490");
  await tel.locator("ul.carte > li").nth(0).getByRole("button", { name: /^Coller/ }).tap();
  await tel.locator("ul.carte > li").nth(0).locator("[role=status]").filter({ hasText: "Photo enregistrée." }).waitFor();
  ok("téléphone : « Coller » pose l'image copiée");
  if (OUT) await tel.screenshot({ path: `${OUT}/photos-coller-2-telephone.png` });
  await ctxTel.close();
} finally {
  if (OUT) writeFileSync(`${OUT}/resultat-photos-coller.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
