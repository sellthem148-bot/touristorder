// Le flyer A5 de Tourist Order — recto en français, verso en anglais — avec le logo de l'agence partenaire
// (Elite Home Group, « En partenariat avec »). C'est le document de référence du gérant.
//
//   node affiches/flyer/generer.mjs      → réécrit, dans ce dossier : flyer-tourist-order.pdf (deux pages),
//                                          -fr.pdf, -en.pdf, -fr.png, -en.png et texte.txt
//
// Changer un texte : le tableau LANGUES ci-dessous. Tout ce que le flyer annonce est ce que le site annonce
// (tests/affiche.test.ts compare texte.txt au site) : si un réglage change, changer le flyer.
// PAS DE PRIX : le gérant a fait retirer les frais de livraison le 24 novembre 2026 (« ils n'ont pas besoin de
// le voir sur le flyer ») — le client les lit au panier, avant de régler.
// Le QR code (affiches/elements/qr-flyer.svg) mène à https://www.touristorder.com/?via=flyer : le site s'ouvre
// dans la langue du téléphone. Pour une autre adresse, refaire ce fichier, puis le relire dans l'image produite.
// Le générateur refuse d'écrire un flyer dont un bloc déborde.
import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.join(ICI, "../..");
// Polices et images sont écrites DANS la page (une page sans adresse ne peut pas lire un fichier du disque).
const donnees = (type, ...morceaux) => `data:${type};base64,${readFileSync(path.join(RACINE, ...morceaux)).toString("base64")}`;

// Le numéro WhatsApp du gérant, celui de la page de contact (WHATSAPP_DU_GERANT, prisma/remplissage.ts).
const WHATSAPP = "+33 1 76 39 00 78";
const QR = readFileSync(path.join(ICI, "../elements/qr-flyer.svg"), "utf8");
// Le sigle du site (lib/sigle.ts), en tuile claire pour le bandeau de photos.
const SIGLE = readFileSync(path.join(RACINE, "public/logo/tourist-order-sigle-clair.svg"), "utf8").replace(/ width="64" height="64"/, "");
// Le logo de l'agence, détouré d'après le fichier envoyé par le gérant : il appartient à l'agence, jamais dans public/.
const PARTENAIRE = { nom: "Elite Home Group", logo: donnees("image/png", "affiches/elements/elite-home-group-noir.png") };

const LANGUES = [
  {
    code: "fr",
    sur: "Livraison à domicile · Service en français",
    titre: "Vos courses livrées à votre logement, le soir même.",
    partenaire: "En partenariat avec",
    faits: [["Livraison le soir", "19h – 00h"], ["Commandez avant 17h", "Livré ce soir"]],
    comment: "Comment ça marche",
    etapes: [["Vous choisissez", "Sur touristorder.com, en français : plus de 650 articles."], ["Vous réglez", "À la commande, par Bit, PayBox ou virement."], ["Nous vous livrons", "Le soir, à votre logement ou à votre hôtel."]],
    quoi: "Ce que nous livrons",
    rayons: ["Crèmerie & œufs", "Boissons", "Pain & pâtisserie", "Fruits & légumes", "Épicerie", "Apéro & snacks", "Chargeurs & électronique", "Maison & entretien"],
    plus: "Un article introuvable ? Demandez-le nous : nous le cherchons pour vous.",
    commandez: "Commandez sur",
    scannez: "Scannez pour commander",
    villes: "Netanya · Herzliya · Ra'anana · Kfar Saba · Hadera · Césarée · Tel Aviv",
    nombre: "19 villes livrées",
    langues: "Nous répondons en français, en anglais et en hébreu.",
  },
  {
    code: "en",
    sur: "Home delivery in Israel · Service in English",
    titre: "Your groceries delivered to your door, the same evening.",
    partenaire: "In partnership with",
    faits: [["Evening delivery", "7 pm – midnight"], ["Order before 5 pm", "Delivered tonight"]],
    comment: "How it works",
    etapes: [["You choose", "On touristorder.com, in English: over 650 items."], ["You pay", "When you order, by Bit, PayBox or bank transfer."], ["We deliver", "In the evening, to your rental or your hotel."]],
    quoi: "What we deliver",
    rayons: ["Dairy & eggs", "Drinks", "Bread & pastries", "Fruit & vegetables", "Groceries", "Snacks", "Chargers & electronics", "Home & cleaning"],
    plus: "Can't find an item? Ask us and we'll look for it.",
    commandez: "Order at",
    scannez: "Scan to order",
    villes: "Netanya · Herzliya · Ra'anana · Kfar Saba · Hadera · Caesarea · Tel Aviv",
    nombre: "19 cities served",
    langues: "We reply in English, French and Hebrew.",
  },
];

const e = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const page = (t) => `
<section class="page" lang="${t.code}">
  <header>
    <div class="marque">${SIGLE}<div><b>Tourist Order</b><span>${e(t.sur)}</span></div></div>
    <div class="partenaire"><span>${e(t.partenaire)}</span><img src="${PARTENAIRE.logo}" alt="${PARTENAIRE.nom}"></div>
    <h1>${e(t.titre)}</h1>
  </header>
  <ul class="faits">${t.faits.map(([a, b]) => `<li><span>${e(a)}</span><b>${e(b)}</b></li>`).join("")}</ul>
  <main>
    <h2>${e(t.comment)}</h2>
    <ol>${t.etapes.map(([a, b], i) => `<li><i>${i + 1}</i><div><b>${e(a)}</b><span>${e(b)}</span></div></li>`).join("")}</ol>
    <h2>${e(t.quoi)}</h2>
    <p class="rayons">${t.rayons.map((r) => `<span>${e(r)}</span>`).join("")}</p>
    <p class="plus">${e(t.plus)}</p>
  </main>
  <footer>
    <div class="qr">${QR}<span>${e(t.scannez)}</span></div>
    <div class="contact">
      <span class="petit">${e(t.commandez)}</span>
      <b class="site">touristorder.com</b>
      <p class="wa"><span>WhatsApp</span> ${WHATSAPP}</p>
      <p class="villes"><b>${e(t.nombre)}</b> ${e(t.villes)}…</p>
      <p class="langues">${e(t.langues)}</p>
    </div>
  </footer>
</section>`;

// Couleurs et police du site : encre #0d1321, jaune « soleil » #f2b632, Geist. La bannière est celle de l'accueil
// (public/accueil/banniere.jpg : douze photos du domaine public ou sous CC0, qui s'impriment sans mention).
const html = (langues) => `<!doctype html><html><head><meta charset="utf-8"><title>Tourist Order — flyer</title><style>
@font-face { font-family: Geist; font-weight: 500; src: url("${donnees("font/ttf", "assets/polices/Geist-Medium.ttf")}"); }
@font-face { font-family: Geist; font-weight: 700; src: url("${donnees("font/ttf", "assets/polices/Geist-Bold.ttf")}"); }
@page { size: 148mm 210mm; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #fff; }
body { font-family: Geist, system-ui, sans-serif; font-weight: 500; color: #0d1321; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 148mm; height: 210mm; position: relative; overflow: hidden; display: flex; flex-direction: column; background: #f8f8f8; page-break-after: always; }
header { flex: none; position: relative; height: 66.5mm; padding: 8.5mm 10mm 0; color: #fff; background: linear-gradient(180deg, rgba(13,19,33,.72) 0%, rgba(13,19,33,.62) 40%, rgba(13,19,33,.94) 100%), url("${donnees("image/jpeg", "public/accueil/banniere.jpg")}") center / cover #0d1321; }
.marque { display: flex; align-items: center; gap: 3.2mm; }
.marque svg { width: 12.5mm; height: 12.5mm; flex: none; }
.marque b { display: block; font-size: 15pt; font-weight: 700; letter-spacing: -.01em; line-height: 1.1; }
.marque span { display: block; margin-top: .8mm; font-size: 6.6pt; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.82); }
.partenaire { position: absolute; top: 7.5mm; right: 10mm; width: 31mm; background: #fff; border-radius: 3mm; padding: 2mm 3.2mm 2.4mm; text-align: center; box-shadow: 0 .6mm 2.4mm rgba(13,19,33,.25); }
.partenaire span { display: block; margin-bottom: 1.3mm; font-size: 4.7pt; letter-spacing: .08em; text-transform: uppercase; color: #5b6470; white-space: nowrap; }
.partenaire img { display: block; width: 100%; height: auto; }
h1 { margin-top: 12mm; font-size: 23.5pt; line-height: 1.08; font-weight: 700; letter-spacing: -.02em; max-width: 118mm; }
.faits { flex: none; list-style: none; display: grid; grid-template-columns: repeat(2, 1fr); gap: 2.5mm; margin: -10mm 10mm 0; position: relative; }
.faits li { background: #fff; border-radius: 3mm; padding: 3.2mm 3.4mm 3.4mm; box-shadow: 0 .6mm 2.4mm rgba(13,19,33,.14); border-top: 1.1mm solid #f2b632; }
.faits span { display: block; font-size: 6.6pt; letter-spacing: .05em; text-transform: uppercase; color: #5b6470; }
.faits b { display: block; margin-top: .9mm; font-size: 10.6pt; line-height: 1.15; font-weight: 700; }
main { flex: 1; padding: 6mm 10mm 0; }
h2 { font-size: 8pt; letter-spacing: .1em; text-transform: uppercase; color: #5b6470; font-weight: 700; margin-bottom: 3mm; }
ol { list-style: none; display: grid; gap: 2.5mm; margin-bottom: 5.5mm; }
ol li { display: flex; align-items: flex-start; gap: 3.4mm; }
ol i { flex: none; width: 7.4mm; height: 7.4mm; border-radius: 50%; background: #f2b632; color: #0d1321; font-style: normal; font-weight: 700; font-size: 10.5pt; display: flex; align-items: center; justify-content: center; }
ol b { display: block; font-size: 11.4pt; font-weight: 700; line-height: 1.15; }
ol span { display: block; margin-top: .5mm; font-size: 9pt; line-height: 1.3; color: #3c4553; }
.rayons { display: flex; flex-wrap: wrap; gap: 1.8mm; }
.rayons span { background: #fff; border: .25mm solid #d9dde3; border-radius: 99mm; padding: 1.3mm 3.1mm; font-size: 8.4pt; }
.plus { margin-top: 3.4mm; font-size: 8.6pt; line-height: 1.35; color: #3c4553; }
footer { flex: none; background: #0d1321; color: #fff; padding: 6mm 10mm; display: flex; gap: 7mm; align-items: center; }
.qr { flex: none; width: 36mm; background: #fff; border-radius: 3mm; padding: 3mm 3mm 2.2mm; text-align: center; }
.qr svg { display: block; width: 29mm; height: 29mm; margin: 0 auto; }
.qr span { display: block; margin-top: 1.6mm; white-space: nowrap; font-size: 6.2pt; font-weight: 700; color: #0d1321; letter-spacing: .02em; }
.contact { min-width: 0; }
.petit { display: block; font-size: 7.4pt; letter-spacing: .09em; text-transform: uppercase; color: rgba(255,255,255,.7); }
.site { display: block; font-size: 21pt; font-weight: 700; letter-spacing: -.02em; line-height: 1.1; color: #f2b632; }
.wa { margin-top: 2.6mm; font-size: 11pt; font-weight: 700; }
.wa span { display: inline-block; margin-right: 1.4mm; font-size: 7pt; letter-spacing: .08em; text-transform: uppercase; color: rgba(255,255,255,.7); font-weight: 500; vertical-align: 12%; }
.villes { margin-top: 2.8mm; font-size: 7.6pt; line-height: 1.4; color: rgba(255,255,255,.86); }
.villes b { display: block; color: #fff; font-size: 8pt; }
.langues { margin-top: 1.8mm; font-size: 7pt; color: rgba(255,255,255,.66); }
</style></head><body>${langues.map(page).join("")}</body></html>`;

const A5 = { width: "148mm", height: "210mm", printBackground: true, preferCSSPageSize: true };
const sortie = (nom) => path.join(ICI, nom);
const navigateur = await chromium.launch();
try {
  // 559 × 794 px = 148 × 210 mm à l'écran ; les aperçus sont pris deux fois plus fins.
  const p = await (await navigateur.newContext({ viewport: { width: 559, height: 794 }, deviceScaleFactor: 2 })).newPage();
  const ouvrir = async (langues) => {
    await p.setContent(html(langues), { waitUntil: "load" });
    await p.evaluate(() => document.fonts.ready);
  };

  await ouvrir(LANGUES);
  // Rien ne déborde : le pied est en bas de la feuille, le texte ne le touche pas, le titre reste au-dessus des
  // encadrés et sous le logo du partenaire — sinon on n'écrit rien.
  const mesures = await p.evaluate(() => [...document.querySelectorAll(".page")].map((pg) => {
    const mm = (px) => Math.round((px / 3.7795) * 10) / 10;
    const r = pg.getBoundingClientRect();
    const boite = (s) => pg.querySelector(s).getBoundingClientRect();
    return {
      langue: pg.lang,
      piedEnBas: Math.abs(boite("footer").bottom - r.bottom) < 1,
      avantLePied: mm(boite("footer").top - pg.querySelector("main").lastElementChild.getBoundingClientRect().bottom),
      titreAvantLesEncadres: mm(boite(".faits").top - boite("h1").bottom),
      logoAvantLeTitre: mm(boite("h1").top - boite(".partenaire").bottom),
      logoCharge: pg.querySelector(".partenaire img").naturalWidth > 0,
      police: document.fonts.check('700 12px Geist'),
    };
  }));
  for (const m of mesures) {
    const bon = m.piedEnBas && m.avantLePied >= 4 && m.titreAvantLesEncadres >= 3 && m.logoAvantLeTitre >= 2 && m.logoCharge && m.police;
    if (!bon) throw new Error(`Le flyer déborde ou il lui manque un élément (${JSON.stringify(m)}) : rien n'est écrit.`);
  }
  for (const [i, t] of LANGUES.entries()) await p.locator(".page").nth(i).screenshot({ path: sortie(`flyer-tourist-order-${t.code}.png`) });
  await p.pdf({ path: sortie("flyer-tourist-order.pdf"), ...A5 });
  for (const t of LANGUES) {
    await ouvrir([t]);
    await p.pdf({ path: sortie(`flyer-tourist-order-${t.code}.pdf`), ...A5 });
  }
  console.log(mesures.map((m) => `${m.langue} : ${m.avantLePied} mm avant le pied, titre ${m.titreAvantLesEncadres} mm au-dessus des encadrés`).join(" · "));
} finally {
  await navigateur.close();
}

// Le texte du flyer, tel qu'il s'imprime : c'est lui que tests/affiche.test.ts compare au site.
try {
  writeFileSync(sortie("texte.txt"), execFileSync("pdftotext", ["-layout", sortie("flyer-tourist-order.pdf"), "-"]));
  console.log("texte.txt réécrit.");
} catch {
  console.warn("pdftotext est introuvable : texte.txt n'a pas été réécrit — le refaire avant de lancer les tests.");
}
