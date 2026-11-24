// L'adresse vérifiée par Google, au panier — avec un FAUX Google : le script de Maps est intercepté et
// remplacé par une bibliothèque d'essai locale (mêmes noms que la vraie : importLibrary("places"),
// AutocompleteSuggestion.fetchAutocompleteSuggestions, AutocompleteSessionToken, toPlace(), fetchFields).
// Rien ne part chez Google, aucune clé réelle n'est nécessaire.
//
// La clé du site est dans le code (lib/google-maps.ts) et ne sert que pour le site en ligne : ici, c'est la
// variable d'environnement qui la remplace. Le serveur local doit être lancé AVEC elle :
//   NEXT_PUBLIC_GOOGLE_MAPS_KEY=cle-d-essai npm run dev -- -p 3100
//   node tests/navigateur/parcours-adresse-google.mjs [dossier-de-captures]
// Et, sur un serveur lancé SANS la variable, la preuve que rien de Google n'est demandé :
//   SANS_CLE=1 node tests/navigateur/parcours-adresse-google.mjs
// PASSE DES COMMANDES et modifie les villes : jeu de test local seulement, sur un serveur fraîchement démarré.
import { chromium, devices } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const SANS_CLE = process.env.SANS_CLE === "1";
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");
const QUARTIER = "Netanya – Ir Yamim / Poleg";
const pause = (ms) => new Promise((r) => setTimeout(r, ms));

// Les lieux que le faux Google connaît, dans les formes que le vrai renvoie (relevées le 24 novembre 2026 avec
// une vraie clé, `language: "fr"`, `includedRegionCodes: ["il"]`) : la proposition (« Nitsa Boulevard 10,
// Netanya, Israël »), puis après fetchFields les composants (longText / shortText, types) et l'adresse écrite
// (« Nitsa Blvd 10, Netanya, Israël »). `mots` : ce qu'il faut taper pour les voir proposés.
const c = (long, court, ...types) => ({ longText: long, shortText: court ?? long, types });
const FIN = [c("HaSharon", null, "administrative_area_level_2", "political"), c("Center District", null, "administrative_area_level_1", "political"), c("Israël", "IL", "country", "political")];
const voie = (numero, long, court, ville) => [c(numero, null, "street_number"), c(long, court, "route"), c(ville, null, "locality", "political"), ...FIN];
const enHebreu = (numero, voie, ville) => [c(numero, null, "street_number"), c(voie, null, "route"), c(ville, null, "locality", "political"), c("ישראל", "IL", "country", "political")];
const LIEUX = {
  // Une rue du centre de Netanya : aucun repère du gérant, donc Netanya.
  nitsa: {
    mots: ["nitsa"], types: ["street_address"],
    fr: { principal: "Nitsa Boulevard 10", secondaire: "Netanya, Israël", adresse: "Nitsa Blvd 10, Netanya, Israël", composants: voie("10", "Nitsa Boulevard", "Nitsa Blvd", "Netanya") },
    he: { principal: "שדרות ניצה 10", secondaire: "נתניה, ישראל", adresse: "שדרות ניצה 10, נתניה, ישראל", composants: enHebreu("10", "שדרות ניצה", "נתניה") },
  },
  // Une rue d'Ir Yamim : Google ne donne AUCUN composant de quartier — seule la rue la distingue.
  manor: {
    mots: ["ehud", "אהוד"], types: ["street_address"],
    fr: { principal: "Ehud Manor Street 5", secondaire: "Netanya, Israël", adresse: "Ehud Manor St 5, Netanya, Israël", composants: voie("5", "Ehud Manor Street", "Ehud Manor St", "Netanya") },
    he: { principal: "אהוד מנור 5", secondaire: "נתניה, ישראל", adresse: "אהוד מנור 5, נתניה, ישראל", composants: enHebreu("5", "אהוד מנור", "נתניה") },
    ru: { adresse: "ул. Эхуд Манор 5, Нетания, Израиль", composants: [c("5", null, "street_number"), c("улица Эхуд Манор", "ул. Эхуд Манор", "route"), c("Нетания", null, "locality", "political"), c("Израиль", "IL", "country", "political")] },
  },
  // (Inventée pour l'essai.) Une rue que le gérant a notée en hébreu : seule la lecture en hébreu la retrouve.
  binyamin: {
    mots: ["bnei"], types: ["street_address"],
    fr: { principal: "Bnei Binyamin Street 3", secondaire: "Netanya, Israël", adresse: "Bnei Binyamin St 3, Netanya, Israël", composants: voie("3", "Bnei Binyamin Street", "Bnei Binyamin St", "Netanya") },
    he: { principal: "בני בנימין 3", secondaire: "נתניה, ישראל", adresse: "בני בנימין 3, נתניה, ישראל", composants: enHebreu("3", "בני בנימין", "נתניה") },
  },
  jaffa: {
    mots: ["jaffa"], types: ["street_address"],
    fr: { principal: "Jaffa Street 20", secondaire: "Jerusalem, Israël", adresse: "Jaffa St 20, Jerusalem, Israël", composants: voie("20", "Jaffa Street", "Jaffa St", "Jerusalem") },
    he: { principal: "יפו 20", secondaire: "ירושלים, ישראל", adresse: "יפו 20, ירושלים, ישראל", composants: enHebreu("20", "יפו", "ירושלים") },
  },
  // (Supposée.) Une ville que Google écrirait autrement que nous en lettres latines : l'hébreu la reconnaît.
  sava: {
    mots: ["weizmann"], types: ["street_address"],
    fr: { principal: "Weizmann Street 100", secondaire: "Kefar Sava, Israël", adresse: "Weizmann St 100, Kefar Sava, Israël", composants: voie("100", "Weizmann Street", "Weizmann St", "Kefar Sava") },
    he: { principal: "ויצמן 100", secondaire: "כפר סבא, ישראל", adresse: "ויצמן 100, כפר סבא, ישראל", composants: enHebreu("100", "ויצמן", "כפר סבא") },
  },
  // Un hôtel : son nom, des types d'établissement, un code postal en plus.
  hotel: {
    mots: ["island"], types: ["hotel", "lodging", "point_of_interest", "establishment"],
    fr: { principal: "Island Luxurious Suites Hotel", secondaire: "Sderot Oved Ben Ami, Netanya, Israël", adresse: "Sderot Oved Ben Ami 10, Netanya, 4220520, Israël", composants: [...voie("10", "Sderot Oved Ben Ami", null, "Netanya"), c("4220520", null, "postal_code")] },
    he: { principal: "מלון איילנד", secondaire: "שדרות עובד בן עמי, נתניה, ישראל", adresse: "שדרות עובד בן עמי 10, נתניה, ישראל", composants: enHebreu("10", "שדרות עובד בן עמי", "נתניה") },
  },
};
// (Inventées.) Sept rues Herzl : le site n'en montre que cinq. La première est à Netanya, la deuxième à Tel Aviv.
const VILLES_HERZL = [["Netanya", "נתניה"], ["Tel Aviv-Yafo", "תל אביב-יפו"], ["Herzliya", "הרצליה"], ["Hadera", "חדרה"], ["Ra'anana", "רעננה"], ["Jerusalem", "ירושלים"], ["Haifa", "חיפה"]];
VILLES_HERZL.forEach(([ville, he], i) => {
  LIEUX[`herzl${i}`] = {
    mots: ["herzl"], types: ["street_address"],
    fr: { principal: "Herzl Street 10", secondaire: `${ville}, Israël`, adresse: `Herzl St 10, ${ville}, Israël`, composants: voie("10", "Herzl Street", "Herzl St", ville) },
    he: { principal: "הרצל 10", secondaire: `${he}, ישראל`, adresse: `הרצל 10, ${he}, ישראל`, composants: enHebreu("10", "הרצל", he) },
  };
});

// Le faux script de Maps. Comme le vrai : une proposition s'écrit dans l'écriture de ce qui est tapé (de
// l'hébreu tapé sur le site en français donne des propositions en hébreu), mais les composants reviennent dans
// la langue DEMANDÉE ; une saisie sans résultat rend une liste vide.
// `mode` « refus » : la clé est refusée — fetchAutocompleteSuggestions lève « Permission denied on the service. » ;
// « auth » : Google appelle gm_authFailure juste après le chargement.
const fauxGoogle = (mode) => `(() => {
  const parametres = new URL(document.currentScript.src).searchParams;
  const journal = (window.__google = { parametres: Object.fromEntries(parametres), demandes: [], lectures: [], jetons: 0 });
  const LIEUX = ${JSON.stringify(LIEUX)};
  const texte = (t) => ({ text: t, toString: () => t });
  const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
  class AutocompleteSessionToken { constructor() { this.n = ++journal.jetons; } }
  class Place {
    constructor({ id, requestedLanguage }) { this.id = id; this.langue = requestedLanguage || null; this.jeton = null; }
    async fetchFields({ fields }) {
      journal.lectures.push({ id: this.id, langue: this.langue, fields, jeton: this.jeton });
      await attendre(80);
      const lieu = LIEUX[this.id];
      const l = this.langue === "iw" ? lieu.he : this.langue === "ru" && lieu.ru ? lieu.ru : lieu.fr;
      this.addressComponents = l.composants;
      // En anglais, le pays s'écrit « Israel ».
      if (fields.includes("formattedAddress")) this.formattedAddress = this.langue === "en" ? l.adresse.replace("Israël", "Israel") : l.adresse;
      if (fields.includes("types")) this.types = lieu.types;
      return { place: this };
    }
  }
  const AutocompleteSuggestion = {
    async fetchAutocompleteSuggestions(demande) {
      journal.demandes.push({ input: demande.input, language: demande.language, region: demande.region, pays: demande.includedRegionCodes, jeton: demande.sessionToken ? demande.sessionToken.n : null, biais: !!demande.locationBias });
      ${mode === "refus" ? 'console.error("Google Maps JavaScript API error: RefererNotAllowedMapError"); throw new Error("Permission denied on the service.");' : ""}
      // « lent » : une réponse qui arrive tard, après la demande suivante.
      await attendre(/lent/.test(demande.input) ? 900 : 40);
      const saisie = demande.input.toLowerCase();
      const ecriture = /[\\u0590-\\u05ff]/.test(saisie) || demande.language === "iw" ? "he" : "fr";
      const suggestions = Object.entries(LIEUX).filter(([, l]) => l.mots.some((m) => saisie.includes(m))).map(([id, l]) => ({
        placePrediction: {
          placeId: id, types: l.types, mainText: texte(l[ecriture].principal), secondaryText: texte(l[ecriture].secondaire), text: texte(l[ecriture].principal + ", " + l[ecriture].secondaire),
          toPlace() { const p = new Place({ id, requestedLanguage: demande.language }); p.jeton = demande.sessionToken ? demande.sessionToken.n : null; return p; },
        },
      }));
      return { suggestions };
    },
  };
  window.google = { maps: { importLibrary: async (nom) => { journal.bibliotheque = nom; return { AutocompleteSuggestion, AutocompleteSessionToken, Place }; } } };
  setTimeout(() => {
    window[parametres.get("callback")]();
    ${mode === "auth" ? "setTimeout(() => window.gm_authFailure(), 150);" : ""}
  }, 0);
})();`;

// Un point transparent : le logo « Powered by Google », que le faux Google sert à la place du vrai.
const POINT = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==", "base64");

/** Un visiteur : toutes ses demandes vers Google sont notées ; `mode` dit ce que le faux Google répond. */
async function visiteur(navigateur, mode = "faux", appareil = devices["iPhone 13"]) {
  const ctx = await navigateur.newContext({ ...appareil });
  const versGoogle = [];
  await ctx.route(/(googleapis|gstatic|google)\.com/, (route) => {
    const url = route.request().url();
    versGoogle.push(url);
    if (mode === "coupe") return route.abort();
    if (/maps\.googleapis\.com\/maps\/api\/js/.test(url)) return route.fulfill({ contentType: "text/javascript", body: fauxGoogle(mode) });
    if (/gstatic\.com/.test(url)) return route.fulfill({ contentType: "image/png", body: POINT });
    return route.abort();
  });
  const page = await ctx.newPage();
  page.on("pageerror", (e) => erreurs.push(String(e)));
  return { ctx, page, versGoogle };
}

const navigateur = await chromium.launch();
const deborde = (p) => p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
const journal = (p) => p.evaluate(() => window.__google);

/** Un article au panier, puis le panier ouvert. */
async function ouvrirLePanier(page, prefixe = "") {
  await page.goto(BASE + "/");
  await page.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await page.goto(BASE + prefixe + "/panier");
  await page.locator("#ville").waitFor();
}

try {
  if (SANS_CLE) {
    // ------------------------------------------------------------------------------------------------
    // Sans clé (ni variable, ni site en ligne) : le panier d'avant, et pas une demande vers Google.
    // ------------------------------------------------------------------------------------------------
    const { ctx, page, versGoogle } = await visiteur(navigateur);
    await ouvrirLePanier(page);
    await page.getByLabel("Ville").selectOption("Netanya");
    await page.getByText("Appartement", { exact: true }).click();
    const rue = page.getByLabel("Rue et numéro", { exact: true });
    await rue.click();
    await rue.pressSequentially("Ehud Manor 12", { delay: 30 });
    await pause(900);
    verifier(versGoogle.length === 0, "sans clé : aucune demande vers Google (ni script, ni image), même en tapant une adresse");
    verifier((await rue.getAttribute("role")) === null && (await rue.getAttribute("autocomplete")) === "address-line1" && (await rue.getAttribute("aria-autocomplete")) === null, "le champ est le champ d'avant : ni liste, ni rôle ajouté, la saisie automatique du navigateur");
    verifier((await page.locator("[data-propositions]").count()) === 0 && (await page.locator('input[name="adresseGoogle"]').count()) === 0, "aucune proposition, aucun champ « Google » dans le formulaire");
    verifier((await page.evaluate(() => typeof window.google)) === "undefined" && !(await page.content()).includes("AIza"), "rien de Google dans la page, et aucune clé envoyée au navigateur");
    await page.goto(BASE + "/admin/connexion");
    await page.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(BASE + "/admin");
    await page.goto(BASE + "/admin/villes");
    verifier(espaces(await page.locator('[data-adresses-google="en-attente"]').innerText()).startsWith("Adresse vérifiée par Google : pas encore active."), "« Villes » dit au gérant que l'adresse vérifiée par Google n'est pas encore active");
    await ctx.close();
  } else {
    // ------------------------------------------------------------------------------------------------
    // 0. Le gérant note deux rues de son quartier : l'une avec « Rue », l'autre en hébreu avec « רחוב ».
    // ------------------------------------------------------------------------------------------------
    const gerant = await visiteur(navigateur);
    const admin = gerant.page;
    await admin.goto(BASE + "/admin/connexion");
    await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
    await admin.getByRole("button", { name: "Se connecter" }).click();
    await admin.waitForURL(BASE + "/admin");
    await admin.goto(BASE + "/admin/villes");
    verifier(espaces(await admin.locator('[data-adresses-google="actives"]').innerText()).startsWith("Adresse vérifiée par Google : active."), "« Villes » dit au gérant que l'adresse vérifiée par Google est active");
    const ligneQuartier = admin.locator("li", { has: admin.locator(`input[value="${QUARTIER}"]`) });
    await ligneQuartier.locator("summary").click();
    await ligneQuartier.locator("textarea").fill("Rue Ehud Manor, רחוב בני בנימין");
    await admin.getByRole("button", { name: "Enregistrer les villes" }).click();
    await admin.getByText("Villes enregistrées.").waitFor();
    ok("le gérant a noté deux rues du quartier : « Rue Ehud Manor » et, en hébreu, « רחוב בני בנימין »");

    // ------------------------------------------------------------------------------------------------
    // 1. Le panier : Google n'est appelé qu'au champ d'adresse ; les propositions
    // ------------------------------------------------------------------------------------------------
    const { page: client, versGoogle } = await visiteur(navigateur);
    await ouvrirLePanier(client);
    await client.getByText("Demain", { exact: true }).click();
    await client.getByText("19:00 – 20:00", { exact: true }).click();
    const jour = await client.locator('input[name="dateLivraison"]:checked').inputValue();
    verifier(versGoogle.length === 0, "à l'ouverture du panier : aucune demande vers Google");
    await client.getByText("Appartement", { exact: true }).click();
    const rue = client.getByLabel("Rue et numéro", { exact: true });
    const liste = client.locator("[data-propositions]");
    const options = liste.getByRole("option");
    const zone = () => client.getByLabel("Ville").inputValue();
    const info = () => client.locator("p[aria-live=polite]").innerText().then(espaces);
    const total = () => client.getByRole("button", { name: /^Commander/ }).innerText().then(espaces);
    const taper = async (texte) => { await rue.fill(""); await rue.pressSequentially(texte, { delay: 25 }); };
    const reconnue = client.locator("[data-adresse-reconnue]");
    const avis = client.locator("[data-zone-citee]");
    const cache = (nom) => client.locator(`input[type=hidden][name="${nom}"]`).inputValue();

    await rue.click();
    await client.waitForFunction(() => window.__google && window.__google.bibliotheque === "places");
    const script = versGoogle.find((u) => u.includes("/maps/api/js"));
    const parametres = new URL(script).searchParams;
    verifier(parametres.get("key") === "cle-d-essai" && parametres.get("loading") === "async" && parametres.get("language") === "fr" && parametres.get("region") === "IL" && parametres.get("v") === "weekly" && parametres.get("callback") === "__adressesGoogle",
      "au champ d'adresse : le script de Maps est demandé une fois, avec la clé reçue du serveur, la langue du site et la région");
    verifier((await rue.getAttribute("role")) === "combobox" && (await rue.getAttribute("autocomplete")) === "off", "le champ annonce une liste de propositions");

    await taper("Eh");
    await pause(600);
    verifier((await journal(client)).demandes.length === 0 && (await liste.count()) === 0, "deux lettres : rien n'est demandé à Google");
    await taper("Ehud");
    await liste.waitFor();
    const j1 = await journal(client);
    const d1 = j1.demandes.at(-1);
    verifier(j1.demandes.length === 1 && d1.input === "Ehud" && d1.language === "fr" && d1.region === "il" && JSON.stringify(d1.pays) === '["il"]' && d1.jeton === 1 && d1.biais,
      "quatre lettres tapées d'une traite : UNE demande, en Israël seulement, dans la langue du site, avec un jeton de session");
    verifier((await options.count()) === 1 && espaces(await options.first().innerText()) === "Ehud Manor Street 5 Netanya, Israël", "la proposition : la rue en premier, la ville dessous");
    verifier((await client.getByRole("listbox", { name: "Propositions d'adresse" }).count()) === 1 && (await rue.getAttribute("aria-expanded")) === "true", "la liste a un nom pour les lecteurs d'écran, et le champ dit qu'elle est ouverte");
    const mention = liste.locator("[data-mention-google]");
    verifier((await mention.locator('img[alt="Powered by Google"]').count()) === 1 && (await mention.getAttribute("dir")) === "ltr", "la mention « Powered by Google » est sous les propositions");
    verifier(!(await deborde(client)), "panier avec les propositions : pas de défilement horizontal sur téléphone");
    // Le champ était en bas de l'écran : la page remonte d'elle-même, la liste entière est visible, le champ aussi.
    await client.waitForFunction(() => {
      const panneau = document.querySelector("[data-propositions]").getBoundingClientRect();
      const champ = document.querySelector("#adresse").getBoundingClientRect();
      const enTete = document.querySelector("header.entete").getBoundingClientRect().bottom;
      return panneau.bottom <= window.innerHeight && champ.top >= enTete;
    }, null, { timeout: 4000 });
    ok("la liste s'ouvre sous le champ et la page remonte pour la montrer en entier, sans glisser le champ sous l'en-tête");
    if (OUT) { await pause(450); await client.screenshot({ path: `${OUT}/google-1-propositions.png` }); }

    // Une saisie que Google ne connaît pas : une liste vide, donc aucune liste
    await taper("Nitza");
    await client.waitForFunction(() => window.__google.demandes.at(-1).input === "Nitza");
    await pause(300);
    verifier((await liste.count()) === 0 && (await rue.inputValue()) === "Nitza" && (await rue.getAttribute("aria-expanded")) === "false", "une saisie sans résultat (« Nitza ») : aucune liste, rien ne gêne la saisie");

    // Cinq propositions au plus, et le clavier
    await taper("Herzl");
    await client.waitForFunction(() => document.querySelectorAll("[data-propositions] [role=option]").length === 5);
    ok("sept adresses trouvées par Google : cinq affichées");
    await rue.press("ArrowDown");
    await rue.press("ArrowDown");
    verifier((await options.nth(1).getAttribute("aria-selected")) === "true" && (await rue.getAttribute("aria-activedescendant")) === (await options.nth(1).getAttribute("id")), "flèche bas, deux fois : la deuxième proposition est en surbrillance, et le champ la désigne");
    await rue.press("ArrowUp");
    verifier((await options.nth(0).getAttribute("aria-selected")) === "true", "flèche haut : la première");
    await rue.press("Escape");
    verifier((await liste.count()) === 0 && (await rue.inputValue()) === "Herzl" && (await rue.getAttribute("aria-expanded")) === "false", "Échap referme la liste, la saisie reste");
    await rue.press("ArrowDown");
    await liste.waitFor();
    await rue.press("ArrowDown");
    await rue.press("Enter");
    await reconnue.waitFor();
    verifier((await rue.inputValue()) === "Herzl Street 10" && (await zone()) === "Tel Aviv" && client.url().endsWith("/panier"), "Entrée choisit la proposition en surbrillance (Tel Aviv-Yafo) sans envoyer la commande : la rue dans le champ, la zone posée");
    verifier(espaces(await reconnue.innerText()) === "Adresse reconnue. Zone de livraison : Tel Aviv." && (await info()).includes("livraison 150 ₪"), "« Adresse reconnue. Zone de livraison : Tel Aviv. », livraison 150 ₪");

    // Une réponse en retard n'est jamais affichée
    await rue.fill("");
    await rue.pressSequentially("lent ehud", { delay: 10 });
    await pause(600); // la demande lente est partie
    await rue.fill("");
    await rue.pressSequentially("Jaffa", { delay: 10 });
    await liste.waitFor();
    await pause(1100); // la réponse lente est arrivée entre-temps
    verifier((await options.count()) === 1 && espaces(await options.first().innerText()).startsWith("Jaffa Street 20"), "une réponse arrivée après la demande suivante n'est pas affichée");
    // Toucher ailleurs referme la liste
    await client.getByRole("heading", { name: "Adresse de livraison" }).click();
    verifier((await liste.count()) === 0, "un toucher ailleurs dans la page referme la liste");

    // ------------------------------------------------------------------------------------------------
    // 2. Choisir une adresse : la ligne, la zone, ce que Google a lu
    // ------------------------------------------------------------------------------------------------
    await client.getByLabel("Ville").selectOption("");
    await taper("Nitsa");
    await options.first().click();
    await reconnue.waitFor();
    verifier((await rue.inputValue()) === "Nitsa Boulevard 10" && (await zone()) === "Netanya" && (await info()).includes("livraison 30 ₪"), "« Nitsa Boulevard 10 » : une rue de Netanya qu'aucun repère ne revendique — zone Netanya, 30 ₪ (aucune zone n'était choisie)");
    verifier((await cache("adresseGoogle")) === "Nitsa Blvd 10, Netanya, Israël" && (await cache("reperesGoogle")).startsWith("Nitsa Boulevard | Nitsa Blvd"), "l'adresse écrite par Google et la rue sous ses deux noms (« Boulevard », « Blvd ») partent avec la commande");

    await taper("Ehud");
    await liste.waitFor();
    const jeton = (await journal(client)).demandes.at(-1).jeton;
    await options.first().click();
    await client.waitForFunction((q) => document.querySelector("#ville").value === q, QUARTIER);
    verifier((await rue.inputValue()) === "Ehud Manor Street 5" && (await zone()) === QUARTIER, "« Ehud Manor Street 5 » : Google ne nomme aucun quartier — c'est la rue, notée « Rue Ehud Manor » par le gérant, qui pose la zone du QUARTIER");
    verifier(espaces(await reconnue.innerText()) === `Adresse reconnue. Zone de livraison : ${QUARTIER}.` && (await info()).includes("livraison 40 ₪") && (await total()).includes("79,90"), "le client le lit sous le champ ; livraison 40 ₪, total 24,90 + 15 + 40 = 79,90");
    const lectures = (await journal(client)).lectures.slice(-2);
    verifier(lectures.length === 2 && lectures[0].id === "manor" && lectures[0].langue === "fr" && lectures[0].jeton === jeton && JSON.stringify(lectures[0].fields) === '["addressComponents","formattedAddress","types"]' && lectures[1].langue === "iw" && !lectures.some((l) => l.fields.includes("displayName")),
      "Google est lu deux fois : dans la langue du site avec le jeton de la session, puis en hébreu — des champs « Essentials », jamais displayName");
    verifier((await cache("adresseGoogle")) === "Ehud Manor St 5, Netanya, Israël" && (await cache("villeGoogle")) === "Netanya | נתניה" && (await cache("reperesGoogle")).startsWith("Ehud Manor Street | Ehud Manor St | אהוד מנור"), "ce que Google a reconnu part avec la commande (adresse entière, ville et rue dans les deux écritures)");
    if (OUT) { await rue.scrollIntoViewIfNeeded(); await client.screenshot({ path: `${OUT}/google-2-reconnue.png` }); }
    await taper("Ehud");
    await liste.waitFor();
    verifier((await journal(client)).demandes.at(-1).jeton === jeton + 1, "une nouvelle saisie ouvre une nouvelle session (un nouveau jeton)");

    // Le client retape son adresse : ce que Google avait reconnu tombe
    await options.first().click();
    await reconnue.waitFor();
    await rue.press("End");
    await rue.pressSequentially(" bis");
    verifier((await reconnue.count()) === 0 && (await client.locator('input[name="adresseGoogle"]').count()) === 0 && (await zone()) === QUARTIER, "il retape son adresse : « reconnue » tombe, rien de Google ne part plus, sa zone reste");
    await liste.waitFor();
    await rue.press("Escape");

    // Tapée en hébreu sur le site en français : la proposition est en hébreu, les composants en lettres latines
    await client.getByLabel("Ville").selectOption("Netanya");
    await taper("אהוד");
    await liste.waitFor();
    verifier(espaces(await options.first().innerText()) === "אהוד מנור 5 נתניה, ישראל" && (await journal(client)).demandes.at(-1).language === "fr", "tapée en hébreu sur le site en français : la proposition s'affiche en hébreu");
    await options.first().click();
    await client.waitForFunction((q) => document.querySelector("#ville").value === q, QUARTIER);
    verifier((await rue.inputValue()) === "אהוד מנור 5" && (await cache("villeGoogle")).startsWith("Netanya"), "… le client garde sa rue en hébreu, et la zone du quartier est posée d'après les composants (en lettres latines)");

    // Une rue que le gérant a notée en hébreu : la lecture en hébreu la retrouve
    await client.getByLabel("Ville").selectOption("Netanya");
    await taper("Bnei");
    await options.first().click();
    await client.waitForFunction((q) => document.querySelector("#ville").value === q, QUARTIER);
    verifier((await rue.inputValue()) === "Bnei Binyamin Street 3", "une rue que le gérant a notée en hébreu (« רחוב בני בנימין ») : la zone passe au quartier, alors que le client lit et tape en lettres latines");

    // Une ville écrite autrement en lettres latines : reconnue par son nom en hébreu
    await taper("Weizmann");
    await options.first().click();
    await client.waitForFunction(() => document.querySelector("#ville").value === "Kfar Saba");
    verifier(espaces(await reconnue.innerText()).includes("Kfar Saba"), "« Kefar Sava » (une autre écriture) : reconnue comme Kfar Saba grâce à la lecture en hébreu");
    // … puis le client remet lui-même une zone moins chère : on le lui dit, sans le bloquer
    await client.getByLabel("Ville").selectOption("Netanya");
    await avis.waitFor();
    verifier(espaces(await avis.innerText()).includes("Cette adresse semble se trouver à Kfar Saba, et non à Netanya.") && (await reconnue.count()) === 0, "il rechoisit Netanya à la main : l'avis « cette adresse semble se trouver à Kfar Saba »");
    await avis.getByRole("button", { name: "Choisir Kfar Saba" }).click();
    verifier((await zone()) === "Kfar Saba" && (await avis.count()) === 0, "« Choisir Kfar Saba » le remet dans la bonne zone");

    // Une ville que le gérant ne livre pas : un avis, rien de bloqué
    await taper("Jaffa");
    await options.first().click();
    const hors = client.locator("[data-adresse-hors-zones]");
    await hors.waitFor();
    const texteHors = espaces(await hors.innerText());
    verifier(texteHors.includes("Nous n'avons pas reconnu la ville de cette adresse (Jerusalem) parmi nos zones de livraison.") && !texteHors.includes("{") && (await zone()) === "Kfar Saba", "Jérusalem n'est pas livrée : un avis qui nomme la ville, la zone choisie n'est pas touchée");
    verifier((await client.locator("bdi", { hasText: "Jerusalem" }).count()) === 1 && (await cache("villeGoogle")) === "Jerusalem | ירושלים", "le nom de la ville est isolé (bdi) ; ce que Google a reconnu part quand même");
    if (OUT) { await hors.scrollIntoViewIfNeeded(); await client.screenshot({ path: `${OUT}/google-3-hors-zones.png` }); }

    // ------------------------------------------------------------------------------------------------
    // 3. Deux commandes : une ville hors zones, puis un client qui garde la zone la moins chère
    // ------------------------------------------------------------------------------------------------
    const remplir = async (nom, mail) => {
      await client.getByLabel("Votre nom").fill(nom);
      await client.getByLabel("Votre numéro de téléphone (WhatsApp)").fill("+33 6 11 22 33 44");
      await client.getByLabel("Votre adresse e-mail").fill(`${mail}${Date.now() % 100000}@exemple.test`);
      await client.getByLabel("Étage", { exact: true }).fill("3");
      await client.getByLabel("N° d'appartement", { exact: true }).fill("12");
    };
    await client.getByLabel("Ville").selectOption("Netanya");
    await remplir("Jonas Horszones", "jonas");
    verifier(!(await client.getByRole("button", { name: /^Commander/ }).isDisabled()), "l'avis ne bloque rien : « Commander » reste possible");
    await client.getByRole("button", { name: /^Commander/ }).click();
    await client.waitForURL(/\/suivi\//);
    ok("commande n° 1 passée : Google situe l'adresse à Jérusalem, le client a choisi Netanya");

    await ouvrirLePanier(client);
    await client.getByText("Demain", { exact: true }).click();
    await client.getByText("19:00 – 20:00", { exact: true }).click();
    await client.getByText("Hôtel", { exact: true }).click();
    const hotel = client.getByLabel("Nom de l'hôtel", { exact: true });
    await hotel.click();
    await hotel.pressSequentially("Island", { delay: 25 });
    await liste.waitFor();
    verifier(espaces(await options.first().innerText()) === "Island Luxurious Suites Hotel Sderot Oved Ben Ami, Netanya, Israël", "un hôtel : son nom en premier, sa rue et sa ville dessous");
    await options.first().click();
    await reconnue.waitFor();
    verifier((await hotel.inputValue()) === "Island Luxurious Suites Hotel, Sderot Oved Ben Ami 10" && (await zone()) === "Netanya" && (await cache("adresseGoogle")) === "Sderot Oved Ben Ami 10, Netanya, 4220520, Israël", "l'hôtel choisi : son nom puis sa rue et son numéro dans le champ, sa zone, son adresse écrite par Google");
    await client.getByText("Appartement", { exact: true }).click();
    await taper("Ehud");
    await options.first().click();
    await client.waitForFunction((q) => document.querySelector("#ville").value === q, QUARTIER);
    await client.getByLabel("Ville").selectOption("Netanya");
    await avis.waitFor();
    verifier(espaces(await avis.innerText()).includes(`Cette adresse semble se trouver à ${QUARTIER}, et non à Netanya.`) && (await total()).includes("69,90"), "le client d'Ir Yamim rechoisit « Netanya » (30 ₪ au lieu de 40) : il est prévenu, total 69,90");
    await remplir("Dana Quartier", "dana");
    await client.getByRole("button", { name: /^Commander/ }).click();
    await client.waitForURL(/\/suivi\//);
    verifier(espaces(await client.locator("main").innerText()).includes("69,90"), "commande n° 2 passée telle quelle : rien n'est corrigé à la place du client");
    const autres = versGoogle.filter((u) => !u.includes("/maps/api/js") && !u.includes("gstatic.com"));
    verifier(versGoogle.filter((u) => u.includes("/maps/api/js")).length === 2 && autres.length === 0, "de bout en bout : le script de Maps une seule fois par panier ouvert (deux ici), et rien d'autre vers Google que son logo");

    // ------------------------------------------------------------------------------------------------
    // 4. Le gérant : signalement, adresse reconnue, changement de zone, Waze
    // ------------------------------------------------------------------------------------------------
    await admin.goto(BASE + "/admin");
    for (const nom of ["Jonas Horszones", "Dana Quartier"]) {
      verifier(espaces(await admin.locator("li", { hasText: nom }).first().innerText()).includes("Zone à vérifier"), `liste des commandes : « Zone à vérifier » sur la commande de ${nom}`);
    }
    await admin.locator("li", { hasText: "Jonas Horszones" }).first().getByRole("link").first().click();
    await admin.waitForURL(/\/admin\/commandes\//);
    const signal = admin.locator("[data-zone-a-verifier]");
    verifier(espaces(await signal.innerText()).includes("Google situe cette adresse à Jerusalem, qui n'est dans aucune de tes zones ; le client a choisi Netanya (livraison 30 ₪)."), "ville hors zones : la commande dit où Google situe l'adresse");
    verifier(espaces(await admin.locator("[data-adresse-google]").innerText()) === "Adresse reconnue par Google Jaffa St 20, Jerusalem, Israël", "« Adresse reconnue par Google : Jaffa St 20, Jerusalem, Israël »");
    if (OUT) { await signal.scrollIntoViewIfNeeded(); await admin.screenshot({ path: `${OUT}/google-4-gerant-hors-zones.png` }); }

    await admin.goto(BASE + "/admin");
    await admin.locator("li", { hasText: "Dana Quartier" }).first().getByRole("link").first().click();
    await admin.waitForURL(/\/admin\/commandes\//);
    const texteSignal = espaces(await signal.innerText());
    verifier(texteSignal.includes(`L'adresse désigne ${QUARTIER} (livraison 40 ₪)`) && texteSignal.includes("le client a choisi Netanya (livraison 30 ₪)"), "quartier : la commande dit quelle zone l'adresse désigne, avec les deux prix");
    verifier(espaces(await admin.locator("[data-adresse-google]").innerText()).includes("Ehud Manor St 5, Netanya, Israël"), "l'adresse reconnue par Google est affichée dans la commande");
    if (OUT) { await signal.scrollIntoViewIfNeeded(); await admin.screenshot({ path: `${OUT}/google-5-gerant-quartier.png` }); }
    await signal.getByRole("button", { name: `Passer la commande à ${QUARTIER}` }).click();
    await admin.getByText(`Zone changée : ${QUARTIER}, livraison 40,00 ₪. Le total est à jour.`).waitFor();
    verifier(espaces(await admin.locator("main").innerText()).includes("79,90") && (await signal.count()) === 0, "zone changée d'un geste : total 79,90, plus rien à vérifier");
    verifier(!(await deborde(admin)), "commande du gérant : pas de défilement horizontal sur téléphone");

    await admin.goto(`${BASE}/admin/journee?jour=${jour}`);
    const waze = (await admin.locator('a[href*="waze.com"]').evaluateAll((l) => l.map((a) => a.getAttribute("href")))).map(decodeURIComponent);
    verifier(waze.some((u) => u.includes("q=Ehud Manor St 5, Netanya, Israël&")) && waze.some((u) => u.includes("q=Jaffa St 20, Jerusalem, Israël&")), "Ma journée : Waze reçoit l'adresse que Google a reconnue");

    // ------------------------------------------------------------------------------------------------
    // 5. En hébreu, puis en russe : toujours les deux écritures
    // ------------------------------------------------------------------------------------------------
    const hebreu = await visiteur(navigateur);
    const he = hebreu.page;
    await ouvrirLePanier(he, "/he");
    await he.locator('label:has(input[name="logement"][value="MAISON"])').click();
    const rueHe = he.locator("#adresse");
    await rueHe.click();
    await rueHe.pressSequentially("אהוד", { delay: 25 });
    const listeHe = he.locator("[data-propositions]");
    await listeHe.waitFor();
    const jHe = await journal(he);
    verifier(jHe.parametres.language === "iw" && jHe.demandes.at(-1).language === "iw", "hébreu : Google est interrogé en hébreu");
    verifier(espaces(await listeHe.getByRole("option").first().innerText()).startsWith("אהוד מנור 5") && (await listeHe.locator("bdi").count()) === 2 && (await listeHe.locator("[data-mention-google]").getAttribute("dir")) === "ltr", "les propositions sont en hébreu, chaque texte isolé (bdi), la mention de Google de gauche à droite");
    verifier(!(await deborde(he)), "hébreu : pas de défilement horizontal");
    await he.waitForFunction(() => document.querySelector("[data-propositions]").getBoundingClientRect().bottom <= window.innerHeight, null, { timeout: 4000 });
    if (OUT) { await pause(450); await he.screenshot({ path: `${OUT}/google-6-hebreu.png` }); }
    await listeHe.getByRole("option").first().click();
    await he.locator("[data-adresse-reconnue]").waitFor();
    const texteHe = await he.locator("[data-adresse-reconnue]").innerText();
    const lecturesHe = (await journal(he)).lectures;
    verifier((await rueHe.inputValue()) === "אהוד מנור 5" && (await he.locator("#ville").inputValue()) === QUARTIER && texteHe.includes("עיר ימים") && !/\{\w+\}/.test(texteHe), "l'adresse choisie : la rue en hébreu, la phrase en hébreu, et la zone du quartier grâce au repère en lettres latines");
    verifier(lecturesHe.length === 2 && lecturesHe[0].langue === "iw" && lecturesHe[1].langue === "en", "site en hébreu : la seconde lecture se fait en anglais (les repères du gérant en lettres latines)");
    await hebreu.ctx.close();

    const russe = await visiteur(navigateur);
    const ru = russe.page;
    await ouvrirLePanier(ru, "/ru");
    await ru.locator('label:has(input[name="logement"][value="MAISON"])').click();
    await ru.locator("#adresse").click();
    await ru.locator("#adresse").pressSequentially("Ehud", { delay: 25 });
    await ru.locator("[data-propositions]").getByRole("option").first().click();
    await ru.locator("[data-adresse-reconnue]").waitFor();
    const lecturesRu = (await journal(ru)).lectures.map((l) => l.langue);
    verifier(JSON.stringify(lecturesRu) === '["ru","iw","en"]' && (await ru.locator("#ville").inputValue()) === QUARTIER, "site en russe : Google est lu en russe, en hébreu et en anglais, et la zone du quartier est posée");
    verifier((await ru.locator('input[name="adresseGoogle"]').inputValue()) === "Ehud Manor St 5, Netanya, Israel" && (await ru.locator('input[name="villeGoogle"]').inputValue()) === "Нетания | נתניה | Netanya", "… et le gérant recevra l'adresse en lettres latines, pas en cyrillique");
    await russe.ctx.close();

    // ------------------------------------------------------------------------------------------------
    // 6. Google ne répond pas, ou refuse la clé : le champ redevient un champ ordinaire, sans rien dire
    // ------------------------------------------------------------------------------------------------
    for (const [mode, quoi] of [["coupe", "le script de Google n'arrive pas"], ["refus", "la clé est refusée (« Permission denied on the service. »)"], ["auth", "Google refuse la clé après le chargement (gm_authFailure)"]]) {
      const v = await visiteur(navigateur, mode);
      await ouvrirLePanier(v.page);
      await v.page.getByLabel("Ville").selectOption("Netanya");
      await v.page.getByText("Maison", { exact: true }).click();
      const champ = v.page.getByLabel("Rue et numéro", { exact: true });
      await champ.click();
      await champ.pressSequentially("Ehud Manor 12", { delay: 25 });
      await v.page.waitForFunction(() => document.querySelector("#adresse").getAttribute("role") === null, null, { timeout: 8000 });
      await pause(500);
      verifier((await champ.inputValue()) === "Ehud Manor 12" && (await v.page.locator("[data-propositions]").count()) === 0 && (await champ.getAttribute("autocomplete")) === "address-line1", `${quoi} : le champ redevient le champ d'avant, ce qui est tapé reste`);
      const avantLaSuite = mode === "coupe" ? 0 : (await journal(v.page)).demandes.length;
      await champ.pressSequentially(" bis");
      await pause(600);
      const texteDeLaPage = espaces(await v.page.locator("main").innerText());
      verifier((await champ.inputValue()) === "Ehud Manor 12 bis" && (await v.page.evaluate(() => document.activeElement?.id)) === "adresse" && !/Google|Permission/i.test(texteDeLaPage), "… le client continue d'écrire, le curseur n'a pas quitté le champ, et la page ne lui dit rien de Google");
      if (mode === "refus") verifier(avantLaSuite === 2 && (await journal(v.page)).demandes.length === 2, "… et après ce refus (un essai, puis un second sans la région), plus rien n'est demandé à Google");
      await v.ctx.close();
    }
  }
} finally {
  await navigateur.close();
}

console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
if (OUT) writeFileSync(`${OUT}/resultat-adresse-google.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
if (erreurs.length) process.exit(1);
