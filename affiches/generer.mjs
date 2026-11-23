// L'affiche « partenaire » de Tourist Order, en français et en anglais, à imprimer (A4, se réduit en A5) :
// ce que le site fait, comment commander (QR code vers le site), et le logo de l'agence de location avec
// laquelle le gérant travaille (Elite Home Group — son logo, fourni par le gérant le 23 novembre 2026 ; il
// reste dans ce dossier, jamais dans public/ : il n'est pas publié sur le site).
// Tout ce que l'affiche annonce est ce que le site annonce (livraison le soir, 19 h – minuit ; paiement à la
// commande ; réponses en français, en anglais ou en hébreu) : si le site change, changer l'affiche.
//
//   node affiches/generer.mjs            → affiches/sortie/affiche-elite-home-group.pdf et .png
//
// Changer un texte : le tableau TEXTES ci-dessous. Changer le partenaire : PARTENAIRE (un PNG détouré
// dans affiches/elements). Le QR code (affiches/elements/qr-touristorder.svg) mène à https://www.touristorder.com.
import { readFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, "..");
const enBase64 = (fichier) => readFileSync(fichier).toString("base64");
const police = (nom) => `data:font/ttf;base64,${enBase64(path.join(RACINE, "assets/polices", nom))}`;
const image = (fichier, type) => `data:${type};base64,${enBase64(path.join(ICI, "elements", fichier))}`;

// Le visuel du haut : cinq photos de la bannière de l'accueil, en bandeau (public/produits/frais — domaine
// public ou CC0, lib/credits-photos.ts : elles s'impriment sans mention). Des photos pleines et colorées,
// pas celles sur fond blanc.
const PHOTOS = ["tomates.jpg", "pommes-pink.jpg", "raisin-blanc.jpg", "avocats.jpg", "courgettes.jpg"]
  .map((f) => `data:image/jpeg;base64,${enBase64(path.join(RACINE, "public/produits/frais", f))}`);

const PARTENAIRE = { nom: "Elite Home Group", logo: image("elite-home-group-noir.png", "image/png") };
const QR = readFileSync(path.join(ICI, "elements/qr-touristorder.svg"), "utf8");
// Le sigle du site (lib/sigle.ts) : la tuile claire, pour le fond encre du haut de l'affiche.
const SIGLE = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="16" fill="#ffffff"/><path d="M8 20h21.6v6.8h-7.4v17.2h-6.8v-17.2h-7.4z" fill="#0d1321"/><circle cx="44.2" cy="32" r="12" fill="#f2b632"/></svg>`;

const TEXTES = {
  titre: { fr: "Vos courses livrées à votre logement, le soir même.", en: "Your groceries delivered to your door, the same evening." },
  quoi: {
    fr: "Épicerie, boissons, produits frais, pain, chargeurs et oublis de vacances.",
    en: "Groceries, drinks, fresh food, bread, chargers and holiday essentials.",
  },
  etapes: [
    { fr: "Scannez le QR code", en: "Scan the QR code" },
    { fr: "Choisissez vos articles", en: "Choose your items" },
    { fr: "Nous vous livrons le soir", en: "We deliver in the evening" },
  ],
  scanner: { fr: "Scannez pour commander", en: "Scan to order" },
  reperes: [
    { fr: "Livraison le soir, de 19 h à minuit", en: "Evening delivery, 7 pm to midnight" },
    { fr: "À Netanya et dans les alentours", en: "In Netanya and the surrounding area" },
    { fr: "Paiement par Bit, PayBox ou virement", en: "Pay by Bit, PayBox or bank transfer" },
    { fr: "Réponses en français, anglais et hébreu", en: "We answer in French, English and Hebrew" },
  ],
  partenaire: { fr: "En partenariat avec", en: "In partnership with" },
};

const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Tourist Order — affiche ${PARTENAIRE.nom}</title>
<style>
  @font-face { font-family: "Geist"; font-weight: 500; src: url("${police("Geist-Medium.ttf")}"); }
  @font-face { font-family: "Geist"; font-weight: 700; src: url("${police("Geist-Bold.ttf")}"); }
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 210mm; height: 297mm; }
  body { font-family: "Geist", sans-serif; font-weight: 500; color: #0d1321; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .affiche { width: 210mm; height: 297mm; padding: 10mm; display: flex; flex-direction: column; gap: 6.5mm; }
  /* Seul le milieu s'étire : le reste garde sa hauteur (un bloc qui rétrécirait disparaîtrait sans prévenir). */
  .affiche > * { flex: none; }
  .en { color: #5b6472; }

  /* Le haut : un bandeau de photos de produits qui se fond dans le fond encre du logo, la marque dans une
     pastille posée dessus, puis la promesse. */
  .tete { position: relative; background: #0d1321; color: #ffffff; border-radius: 7mm; overflow: hidden; }
  .photos { position: relative; height: 41mm; display: grid; grid-template-columns: repeat(${PHOTOS.length}, 1fr); }
  .photos img { display: block; width: 100%; height: 41mm; object-fit: cover; }
  .photos::after { content: ""; position: absolute; inset: 0; background: linear-gradient(to top, #0d1321 0%, rgba(13, 19, 33, 0.6) 20%, rgba(13, 19, 33, 0) 58%); }
  .marque { position: absolute; top: 6mm; left: 6mm; display: flex; align-items: center; gap: 3mm; background: #0d1321; border-radius: 5mm; padding: 2.2mm 5mm 2.2mm 2.2mm; font-weight: 700; font-size: 6.2mm; letter-spacing: -0.02em; box-shadow: 0 1mm 4mm rgba(0, 0, 0, 0.35); }
  .marque svg { width: 11mm; height: 11mm; }
  .promesse { padding: 4.5mm 11mm 9.5mm; }
  .tete h1 { font-size: 12.6mm; line-height: 1.08; letter-spacing: -0.035em; font-weight: 700; text-wrap: balance; }
  .tete .h1-en { margin-top: 3.6mm; font-size: 6.3mm; line-height: 1.2; letter-spacing: -0.02em; font-weight: 700; color: #f2b632; text-wrap: balance; }
  .tete .quoi { margin-top: 5mm; font-size: 4.1mm; line-height: 1.45; color: #e6e8ec; }
  .tete .quoi .en { color: #aab1bd; }

  /* Le milieu : comment commander, et le QR code. */
  .affiche > .milieu { flex: 1; min-height: 0; display: grid; grid-template-columns: 1fr 59mm; gap: 10mm; align-items: center; padding: 0 3mm; }
  .etapes { list-style: none; display: flex; flex-direction: column; gap: 7.5mm; }
  .etapes li { display: flex; align-items: center; gap: 5mm; }
  .numero { flex: none; width: 13mm; height: 13mm; border-radius: 50%; background: #f2b632; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 6.4mm; }
  .etapes .fr { display: block; font-weight: 700; font-size: 6.4mm; line-height: 1.15; letter-spacing: -0.02em; }
  .etapes .en { display: block; margin-top: 0.8mm; font-size: 4.5mm; line-height: 1.2; }
  .qr { background: #fdf1cf; border-radius: 6mm; padding: 4.5mm 4.5mm 4mm; text-align: center; }
  .qr .code { background: #ffffff; border-radius: 3.5mm; padding: 3.5mm; }
  .qr svg { display: block; width: 100%; height: auto; shape-rendering: crispEdges; }
  .qr .fr { display: block; margin-top: 3.2mm; font-weight: 700; font-size: 4.2mm; letter-spacing: -0.02em; white-space: nowrap; }
  .qr .en { display: block; font-size: 3.9mm; }
  .qr .adresse { display: inline-block; margin-top: 2.4mm; background: #0d1321; color: #ffffff; border-radius: 99mm; padding: 1.6mm 4.5mm; font-weight: 700; font-size: 4.4mm; }

  /* Les repères : quand, où, comment payer, dans quelle langue. */
  .reperes { display: grid; grid-template-columns: 1fr 1fr; border: 0.35mm solid #d9dce1; border-radius: 5mm; overflow: hidden; }
  .reperes div { display: flex; gap: 3mm; padding: 3.6mm 4.5mm; border-top: 0.35mm solid #d9dce1; }
  .reperes div:nth-child(-n+2) { border-top: 0; }
  .reperes div:nth-child(even) { border-inline-start: 0.35mm solid #d9dce1; }
  .reperes .puce { flex: none; width: 2.4mm; height: 2.4mm; margin-top: 1.5mm; border-radius: 50%; background: #f2b632; }
  .reperes .fr { display: block; font-weight: 700; font-size: 3.65mm; line-height: 1.3; letter-spacing: -0.01em; }
  .reperes .en { display: block; font-size: 3.45mm; line-height: 1.3; }

  /* Le partenaire. */
  .partenaire { display: flex; align-items: center; justify-content: center; gap: 9mm; padding-top: 1mm; }
  .partenaire .mention { text-align: end; font-size: 4.2mm; line-height: 1.35; }
  .partenaire .mention .fr { display: block; font-weight: 700; }
  .partenaire .trait { width: 0.35mm; align-self: stretch; background: #d9dce1; }
  .partenaire img { height: 27mm; width: auto; display: block; }
</style>
</head>
<body>
<main class="affiche">
  <header class="tete">
    <div class="photos">${PHOTOS.map((src) => `<img src="${src}" alt="">`).join("")}</div>
    <div class="marque">${SIGLE}<span>Tourist Order</span></div>
    <div class="promesse">
      <h1 lang="fr">${TEXTES.titre.fr}</h1>
      <p class="h1-en" lang="en">${TEXTES.titre.en}</p>
      <p class="quoi"><span lang="fr">${TEXTES.quoi.fr}</span><br><span class="en" lang="en">${TEXTES.quoi.en}</span></p>
    </div>
  </header>

  <section class="milieu">
    <ol class="etapes">
      ${TEXTES.etapes.map((e, i) => `<li><span class="numero">${i + 1}</span><span><span class="fr" lang="fr">${e.fr}</span><span class="en" lang="en">${e.en}</span></span></li>`).join("\n      ")}
    </ol>
    <div class="qr">
      <div class="code">${QR}</div>
      <span class="fr" lang="fr">${TEXTES.scanner.fr}</span>
      <span class="en" lang="en">${TEXTES.scanner.en}</span>
      <span class="adresse">touristorder.com</span>
    </div>
  </section>

  <section class="reperes">
    ${TEXTES.reperes.map((r) => `<div><span class="puce"></span><p><span class="fr" lang="fr">${r.fr}</span><span class="en" lang="en">${r.en}</span></p></div>`).join("\n    ")}
  </section>

  <footer class="partenaire">
    <p class="mention"><span class="fr" lang="fr">${TEXTES.partenaire.fr}</span><span class="en" lang="en">${TEXTES.partenaire.en}</span></p>
    <span class="trait"></span>
    <img src="${PARTENAIRE.logo}" alt="${PARTENAIRE.nom}">
  </footer>
</main>
</body>
</html>`;

const sortie = path.join(ICI, "sortie");
mkdirSync(sortie, { recursive: true });
const navigateur = await chromium.launch();
try {
  // A4 à 96 points par pouce : 794 × 1123 ; l'image est rendue trois fois plus fine (pour WhatsApp ou une impression).
  const p = await (await navigateur.newContext({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 })).newPage();
  await p.setContent(page, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  // Rien ne doit dépasser de la feuille : sinon l'impression ferait deux pages.
  // Rien ne doit dépasser : ni de la feuille (l'impression ferait deux pages), ni d'un bloc sur son voisin.
  const trop = await p.evaluate(() => {
    const blocs = [document.querySelector(".affiche"), ...document.querySelectorAll(".affiche > *")];
    return blocs.filter((b) => b.scrollHeight > b.clientHeight + 1 || b.scrollWidth > b.clientWidth + 1).map((b) => `${b.className} (${b.scrollWidth} × ${b.scrollHeight} px de contenu pour ${b.clientWidth} × ${b.clientHeight})`);
  });
  await p.screenshot({ path: path.join(sortie, "affiche-elite-home-group.png") });
  if (trop.length) throw new Error(`L'affiche déborde — ${trop.join(" ; ")} : raccourcir un texte ou réduire une taille.`);
  await p.pdf({ path: path.join(sortie, "affiche-elite-home-group.pdf"), format: "A4", printBackground: true, preferCSSPageSize: true });
  console.log("Affiche écrite dans", sortie);
} finally {
  await navigateur.close();
}
