// Mesurer un quartier chez Google, pour en faire une zone de livraison (prisma/kiryat-nordau-1124.ts,
// prisma/sud-de-netanya-1124.ts) : les rues que Google connaît dans une boîte, leur écriture en hébreu et en
// lettres latines, puis dix adresses numérotées sur chacune, avec leur position. LECTURE SEULE : rien n'est écrit
// sur le site, aucune commande n'est passée. Chaque lancement coûte quelques centaines de demandes à Google sur la
// clé du gérant : ne pas le lancer pour rien.
//
// Le navigateur ouvre une page servie à l'adresse du site (la seule que la clé accepte) ; la clé est lue là où elle
// vit, lib/google-maps.ts — elle n'est écrite nulle part ailleurs.
//
//   node tests/outils/mesurer-un-quartier.mjs '<boîte>' ['<lieux à situer>'] [fichier.json]
//   node tests/outils/mesurer-un-quartier.mjs '{"north":32.2892,"south":32.2830,"west":34.8350,"east":34.8530}' '["גבעת האירוסים נתניה"]'
//
// La boîte : les quatre bords, en degrés. Les rues d'une autre ville que Netanya sont listées, sans numéros.
// Un « quartier » que Google connaît n'est qu'un point, sans étendue : ce sont les adresses numérotées qui disent
// où passe une limite (le milieu d'une rue sans numéro peut tromper).
import { chromium } from "playwright";
import { readFileSync, writeFileSync } from "node:fs";

const cle = (readFileSync(new URL("../../lib/google-maps.ts", import.meta.url), "utf8").match(/CLE_GOOGLE_MAPS_DU_SITE: string = "([^"]+)"/) ?? [])[1];
if (!cle) throw new Error("La clé du site est vide (lib/google-maps.ts) : rien à mesurer.");
const origine = "https://www.touristorder.com";
const [boiteTexte, lieuxTexte, sortie] = process.argv.slice(2);
if (!boiteTexte) throw new Error("Donner la boîte : '{\"north\":…,\"south\":…,\"west\":…,\"east\":…}'");
const boite = JSON.parse(boiteTexte);
const lieux = JSON.parse(lieuxTexte || "[]");
const numeros = [1, 3, 6, 10, 14, 20, 28, 40, 60, 90];
const html = `<!doctype html><meta charset="utf-8"><title>quartier</title>
<script>
window.resultats = { erreurs: [], rues: {}, lieux: [], fait: 0 };
async function init() {
  try {
    const { AutocompleteSuggestion, AutocompleteSessionToken } = await google.maps.importLibrary("places");
    const boite = ${JSON.stringify(boite)}, numeros = ${JSON.stringify(numeros)};
    for (const saisie of ${JSON.stringify(lieux)}) {
      try {
        const r = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: saisie, includedRegionCodes: ["il"], language: "iw", region: "il", sessionToken: new AutocompleteSessionToken() });
        for (const s of r.suggestions.slice(0, 2)) {
          const p = s.placePrediction; if (!p) continue;
          const lieu = p.toPlace();
          await lieu.fetchFields({ fields: ["types", "location", "addressComponents"] });
          resultats.lieux.push({ saisie, texte: p.text.text, types: (lieu.types || []).slice(0, 2), lat: lieu.location && lieu.location.lat(), lng: lieu.location && lieu.location.lng(), ville: ((lieu.addressComponents || []).find((c) => c.types.includes("locality")) || {}).longText });
        }
      } catch (e) { resultats.erreurs.push(saisie + " : " + e.message); }
    }
    const vues = {};
    const prefixes = "אבגדהוזחטיכלמנסעפצקרשת".split("").flatMap((l) => [l, "ה" + l, "ש" + l]);
    for (let i = 0; i < prefixes.length; i += 4) {
      await Promise.all(prefixes.slice(i, i + 4).map(async (prefixe) => {
        try {
          const r = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: prefixe, includedRegionCodes: ["il"], language: "iw", region: "il", includedPrimaryTypes: ["route"], locationRestriction: boite, sessionToken: new AutocompleteSessionToken() });
          for (const s of r.suggestions) { const p = s.placePrediction; if (p && !vues[p.mainText.text]) vues[p.mainText.text] = p; }
        } catch (e) { resultats.erreurs.push(prefixe + " : " + e.message); }
      }));
    }
    const noms = Object.keys(vues);
    for (let i = 0; i < noms.length; i += 4) {
      await Promise.all(noms.slice(i, i + 4).map(async (n) => {
        try {
          const he = vues[n].toPlace();
          await he.fetchFields({ fields: ["location", "viewport", "id", "addressComponents"] });
          const en = new google.maps.places.Place({ id: he.id, requestedLanguage: "en" });
          await en.fetchFields({ fields: ["addressComponents"] });
          const route = (en.addressComponents || []).find((c) => c.types.includes("route"));
          const ville = ((he.addressComponents || []).find((c) => c.types.includes("locality")) || {}).longText;
          resultats.rues[n] = { lat: he.location.lat(), lng: he.location.lng(), v: he.viewport && he.viewport.toJSON(), latin: route ? route.longText : "", ville, texte: vues[n].text.text, points: [] };
        } catch (e) { resultats.erreurs.push(n + " : " + e.message); }
      }));
    }
    const saisies = Object.entries(resultats.rues).filter(([, x]) => x.ville === "נתניה").flatMap(([rue]) => numeros.map((n) => ({ rue, n })));
    const une = async ({ rue, n }) => {
      try {
        const r = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: rue.replace(/^רחוב /, "") + " " + n + " נתניה", includedRegionCodes: ["il"], language: "iw", region: "il", sessionToken: new AutocompleteSessionToken() });
        const p = r.suggestions.map((x) => x.placePrediction).filter(Boolean).find((x) => /נתניה/.test(x.text.text) && x.text.text.includes(String(n)));
        if (p) {
          const lieu = p.toPlace();
          await lieu.fetchFields({ fields: ["types", "location"] });
          if ((lieu.types || []).some((t) => /street_address|premise/.test(t))) resultats.rues[rue].points.push({ n, lat: lieu.location.lat(), lng: lieu.location.lng() });
        }
      } catch (e) { resultats.erreurs.push(rue + " " + n + " : " + e.message); }
      resultats.fait++;
    };
    for (let i = 0; i < saisies.length; i += 4) await Promise.all(saisies.slice(i, i + 4).map(une));
  } catch (e) { resultats.erreurs.push(e.message); }
  resultats.fini = true;
}
</script>
<script async src="https://maps.googleapis.com/maps/api/js?key=${cle}&v=weekly&loading=async&callback=init&language=iw&region=IL"></script>`;
const navigateur = await chromium.launch({ proxy: { server: process.env.HTTPS_PROXY } });
const page = await navigateur.newPage();
await page.route(origine + "/quartier.html", (route) => route.fulfill({ contentType: "text/html", body: html }));
await page.goto(origine + "/quartier.html");
await page.waitForFunction(() => window.resultats && window.resultats.fini, null, { timeout: 560000 }).catch(() => console.log("pas fini"));
const r = await page.evaluate(() => window.resultats);
if (sortie) writeFileSync(sortie, JSON.stringify(r, null, 1));
for (const l of r.lieux) console.log("lieu :", l.saisie, "→", l.texte, "|", (l.types || []).join(","), "|", l.lat && l.lat.toFixed(5), l.lng && l.lng.toFixed(5), "|", l.ville);
console.log(Object.keys(r.rues).length, "rues,", r.fait, "adresses demandées | erreurs :", r.erreurs.slice(0, 3));
for (const [n, x] of Object.entries(r.rues).sort((a, b) => b[1].lat - a[1].lat)) {
  const pts = [...new Map(x.points.map((p) => [p.lat.toFixed(5) + p.lng.toFixed(5), p])).values()];
  console.log(n.padEnd(26), (x.ville || "?").padEnd(8), x.lat.toFixed(4), x.lng.toFixed(4), x.v ? `[${x.v.south.toFixed(4)}–${x.v.north.toFixed(4)} × ${x.v.west.toFixed(4)}–${x.v.east.toFixed(4)}]` : "", "|", x.latin, "|", pts.map((p) => p.n + ":" + p.lat.toFixed(5).slice(3) + "/" + p.lng.toFixed(5).slice(3)).join(" "));
}
await navigateur.close();
