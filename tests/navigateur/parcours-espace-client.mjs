// E-mail de confirmation, avis au gérant, espace client (lien de connexion, tableau de bord,
// commander à nouveau, profil, déconnexion, suppression).
// En développement, sans clé Resend, les e-mails sont écrits dans .courriels/ : ce parcours les y lit.
import { chromium, devices } from "playwright";
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3100";
const OUT = process.argv[2];
const BOITE = path.join(process.cwd(), ".courriels");
const erreurs = [];
const etapes = [];
const ok = (m) => { etapes.push("✓ " + m); console.log("✓", m); };
const verifier = (cond, m) => { if (!cond) throw new Error("ÉCHEC : " + m); ok(m); };
const espaces = (t) => t.replace(/[\s  ]+/g, " ");
const SARAH = `sarah.${Date.now() % 1000000}@exemple.test`;
const DAVID = `david.${Date.now() % 1000000}@exemple.test`;

/** Les e-mails écrits pour une adresse (les plus récents d'abord), une fois le serveur passé par after(). */
async function courriels(adresse, sujetContient, attendre = true) {
  for (let i = 0; i < (attendre ? 40 : 4); i++) {
    const trouves = (existsSync(BOITE) ? readdirSync(BOITE) : [])
      .filter((f) => f.endsWith(".html"))
      .sort()
      .reverse()
      .map((f) => ({ fichier: path.join(BOITE, f), html: readFileSync(path.join(BOITE, f), "utf8") }))
      .filter((c) => c.html.startsWith(`<!-- À : ${adresse} |`) && c.html.split("\n")[0].includes(sujetContient));
    if (trouves.length) return trouves;
    await new Promise((r) => setTimeout(r, 250));
  }
  return [];
}
const lienDAcces = (html) => (html.match(/href="([^"]*\/compte\/acces\?jeton=[^"]+)"/) ?? [])[1]?.replace(/&amp;/g, "&");

rmSync(BOITE, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const navigateur = await chromium.launch();
const nouveau = async () => {
  const p = await (await navigateur.newContext({ ...devices["iPhone 13"] })).newPage();
  p.on("pageerror", (e) => erreurs.push(String(e)));
  return p;
};

async function remplirEtCommander(p, { nom, tel, email, adresse }) {
  await p.goto(BASE + "/panier");
  await p.getByText("Pack d'eau").first().waitFor();
  await p.getByText("Demain", { exact: true }).click();
  await p.getByText("19:00 – 20:00", { exact: true }).click();
  if (nom) await p.getByLabel("Ton nom").fill(nom);
  if (tel) await p.getByLabel("Ton numéro WhatsApp").fill(tel);
  if (email) await p.getByLabel("Ton adresse e-mail").fill(email);
  await p.getByLabel("Ville").selectOption("Netanya");
  if (adresse) await p.getByLabel("Adresse ou hôtel (avec n° de chambre)").fill(adresse);
  await p.getByText("Bit", { exact: true }).click();
  await p.getByRole("button", { name: /^Commander/ }).click();
  await p.waitForURL(/\/suivi\//);
  return Number((await p.getByText(/Commande n°\d+/).first().innerText()).match(/\d+/)[0]);
}

try {
  // 1. Sarah commande sans compte : adresse e-mail obligatoire, nettoyée
  const sarah = await nouveau();
  await sarah.goto(BASE + "/");
  await sarah.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  await sarah.getByRole("button", { name: "Choisir les options de Couches Huggies" }).first().click();
  const fiche = sarah.getByRole("dialog", { name: "Couches Huggies" });
  await fiche.getByRole("radio", { name: /^4/ }).check({ force: true });
  await fiche.getByRole("button", { name: /^Ajouter ·/ }).click();
  await fiche.waitFor({ state: "hidden" });
  await sarah.goto(BASE + "/panier");
  await sarah.getByText("Pack d'eau").first().waitFor();
  await sarah.getByLabel("Ton nom").fill("Sarah Cohen");
  await sarah.getByLabel("Ton numéro WhatsApp").fill("+33 6 12 34 56 78");
  await sarah.getByLabel("Ville").selectOption("Netanya");
  await sarah.getByLabel("Adresse ou hôtel (avec n° de chambre)").fill("Résidence Sea View, appartement 12");
  await sarah.getByRole("button", { name: /^Commander/ }).click();
  await sarah.getByText("Ton adresse e-mail est requise.").waitFor();
  ok("commande sans adresse e-mail : refusée, le champ le dit");
  const numero1 = await remplirEtCommander(sarah, {
    nom: "Sarah Cohen", tel: "+33 6 12 34 56 78", email: `  ${SARAH.toUpperCase()} `, adresse: "Résidence Sea View, appartement 12",
  });

  // 2. Les deux e-mails sont partis
  const [confirmation] = await courriels(SARAH, `Ta commande n°${numero1} est enregistrée`);
  verifier(!!confirmation, "e-mail de confirmation envoyé à l'adresse nettoyée (minuscules, sans espaces)");
  const texteConfirmation = espaces(confirmation.html.replace(/<[^>]+>/g, " "));
  verifier(texteConfirmation.includes("Merci Sarah !") && texteConfirmation.includes("Couches Huggies") && texteConfirmation.includes("Taille : 4"), "confirmation : prénom, articles et option");
  verifier(texteConfirmation.includes("139,80 ₪") && texteConfirmation.includes("Demain, 19:00 – 20:00"), "confirmation : total 139,80 ₪ et créneau");
  verifier(!/Super-Pharm|Wolt Market|prixAchat/.test(confirmation.html), "confirmation : ni boutique ni prix d'achat");
  const [avis] = await courriels("gerant@exemple.test", `Nouvelle commande n°${numero1}`);
  verifier(!!avis && avis.html.includes("/admin/commandes/"), "avis de nouvelle commande envoyé au gérant, avec le lien admin");

  // Aperçu de l'e-mail, comme dans une boîte mail
  const apercu = await navigateur.newPage({ viewport: { width: 680, height: 900 }, deviceScaleFactor: 2 });
  await apercu.goto("file://" + confirmation.fichier);
  await apercu.screenshot({ path: `${OUT}/v7-1-email-confirmation.png`, fullPage: true });
  await apercu.close();

  // 3. Le lien de l'e-mail ouvre l'espace client
  const lien = lienDAcces(confirmation.html);
  verifier(!!lien, "la confirmation contient le lien « Ouvrir mon espace »");
  await sarah.goto(lien);
  await sarah.waitForURL(BASE + "/compte");
  let page = espaces(await sarah.locator("main").innerText());
  verifier(page.includes("Bonjour Sarah") && page.includes(SARAH), "tableau de bord : « Bonjour Sarah » et son adresse");
  verifier(page.includes("Commandes 1 En cours 1"), "tableau de bord : 1 commande, 1 en cours");
  verifier(page.includes(`Commande n°${numero1}`) && page.includes("On a bien reçu ta commande"), "commande en cours avec son avancement");
  verifier(page.includes("Tes articles préférés"), "articles préférés");
  verifier(!/Super-Pharm|Wolt Market/.test(await sarah.content()), "espace client : aucune boutique affichée");
  await sarah.screenshot({ path: `${OUT}/v7-2-espace-client.png`, fullPage: true });

  // 4. Profil
  const profil = sarah.locator("section", { hasText: "Mes informations" });
  await profil.getByLabel("Adresse ou logement habituel").fill("Résidence Sea View, appartement 14");
  await profil.getByLabel("Ville").selectOption("Netanya");
  await profil.getByRole("button", { name: "Enregistrer" }).click();
  await profil.getByText(/^Enregistré :/).waitFor();
  ok("profil enregistré");

  // 5. Commander à nouveau : panier rempli, formulaire pré-rempli, adresse e-mail verrouillée
  await sarah.locator("details", { hasText: `n°${numero1}` }).locator("summary").click();
  await sarah.getByRole("button", { name: "Commander à nouveau" }).click();
  await sarah.waitForURL(BASE + "/panier");
  await sarah.getByText("Taille : 4").waitFor();
  verifier(await sarah.getByRole("link", { name: "Panier, 2 articles" }).isVisible(), "commander à nouveau : les 2 articles sont dans le panier");
  verifier((await sarah.getByLabel("Ton nom").inputValue()) === "Sarah Cohen" && (await sarah.getByLabel("Adresse ou hôtel (avec n° de chambre)").inputValue()).endsWith("appartement 14"), "commande pré-remplie avec le profil");
  verifier((await sarah.getByLabel("Ton adresse e-mail").inputValue()) === SARAH && (await sarah.getByLabel("Ton adresse e-mail").getAttribute("readonly")) !== null, "adresse e-mail du compte, non modifiable");
  const numero2 = await remplirEtCommander(sarah, {});
  await sarah.goto(BASE + "/compte");
  page = espaces(await sarah.locator("main").innerText());
  verifier(page.includes(`n°${numero2}`) && page.includes(`n°${numero1}`), "les deux commandes sont dans l'historique");

  // 6. Sans session : pas d'accès ; lien falsifié refusé ; adresse inconnue = même réponse, aucun e-mail
  const inconnu = await nouveau();
  await inconnu.goto(BASE + "/compte");
  await inconnu.waitForURL(BASE + "/compte/connexion");
  ok("sans session : /compte renvoie à la connexion");
  await inconnu.goto(lien.slice(0, -3) + "abc");
  await inconnu.waitForURL(/\/compte\/connexion\?erreur=lien/);
  verifier(await inconnu.getByText("Ce lien n'est plus valable.").isVisible(), "lien falsifié : refusé");
  await inconnu.getByLabel("Ton adresse e-mail").fill("personne@exemple.test");
  await inconnu.getByRole("button", { name: "Recevoir mon lien" }).click();
  await inconnu.getByText("Regarde ta boîte mail").waitFor();
  verifier((await courriels("personne@exemple.test", "", false)).length === 0, "adresse sans compte : même message, aucun e-mail envoyé");

  // 7. David a son propre espace : il ne voit pas les commandes de Sarah
  const david = await nouveau();
  await david.goto(BASE + "/");
  await david.getByRole("button", { name: "Ajouter Pack d'eau 6 × 1,5 L au panier" }).first().click();
  const numero3 = await remplirEtCommander(david, { nom: "David Lévy", tel: "+33 6 99 88 77 66", email: DAVID, adresse: "Hôtel Carmel, chambre 7" });
  const [confirmationDavid] = await courriels(DAVID, `Ta commande n°${numero3}`);
  await david.goto(lienDAcces(confirmationDavid.html));
  await david.waitForURL(BASE + "/compte");
  page = espaces(await david.locator("main").innerText());
  verifier(page.includes(`n°${numero3}`) && !page.includes(`n°${numero1}`) && !page.includes(`n°${numero2}`) && !page.includes("Sarah"), "David ne voit que sa commande");

  // 8. Admin : l'adresse sur la commande, la page Clients, et « Livrée » met à jour le total dépensé
  const admin = await nouveau();
  await admin.goto(BASE + "/admin/connexion");
  await admin.getByLabel("Mot de passe").fill(process.env.ADMIN_PASSWORD || "admin123");
  await admin.getByRole("button", { name: "Se connecter" }).click();
  await admin.waitForURL(BASE + "/admin");
  await admin.goto(BASE + "/admin/clients?q=" + encodeURIComponent(SARAH));
  const ligneSarah = espaces(await admin.locator("main li").first().innerText());
  verifier(ligneSarah.includes("Sarah Cohen") && ligneSarah.includes("2 commandes"), "admin → Clients : Sarah, 2 commandes");
  await admin.screenshot({ path: `${OUT}/v7-3-admin-clients.png` });
  await admin.goto(BASE + "/admin?filtre=en-cours");
  await admin.locator("a", { hasText: `n°${numero1}` }).first().click();
  await admin.waitForURL(/\/admin\/commandes\//);
  verifier(await admin.getByText(SARAH).isVisible(), "admin : l'adresse e-mail du client sur la commande");
  await admin.getByText("Changer l'étape à la main").click();
  await admin.getByLabel("Étape").selectOption("LIVREE");
  await admin.locator("details").getByRole("button", { name: "OK" }).click();
  await admin.getByText("Livrée", { exact: true }).first().waitFor();
  await sarah.goto(BASE + "/compte");
  verifier(espaces(await sarah.locator("main").innerText()).includes("139,80 ₪"), "après livraison : « Total dépensé » = 139,80 ₪");

  // 9. Déconnexion, puis retour par un lien demandé sur la page de connexion
  await sarah.getByRole("button", { name: "Me déconnecter" }).click();
  await sarah.waitForURL(BASE + "/");
  await sarah.goto(BASE + "/compte");
  await sarah.waitForURL(BASE + "/compte/connexion");
  await sarah.getByLabel("Ton adresse e-mail").fill(SARAH);
  await sarah.getByRole("button", { name: "Recevoir mon lien" }).click();
  await sarah.getByText("Regarde ta boîte mail").waitFor();
  const [connexion] = await courriels(SARAH, "Ton lien de connexion");
  verifier(!!connexion, "e-mail « lien de connexion » envoyé");
  await sarah.goto(lienDAcces(connexion.html));
  await sarah.waitForURL(BASE + "/compte");
  ok("retour dans l'espace par le lien de connexion");

  // 10. Suppression de l'espace : confirmation exigée ; les commandes restent côté gérant
  await sarah.getByText("Supprimer mon espace client").click();
  await sarah.getByLabel("Écris « supprimer » pour confirmer").fill("non");
  await sarah.getByRole("button", { name: "Supprimer définitivement" }).click();
  await sarah.getByText("Écris le mot « supprimer » pour confirmer.").waitFor();
  await sarah.getByLabel("Écris « supprimer » pour confirmer").fill("supprimer");
  await sarah.getByRole("button", { name: "Supprimer définitivement" }).click();
  await sarah.waitForURL(/\/\?espace=supprime/);
  await sarah.goto(BASE + "/compte");
  await sarah.waitForURL(BASE + "/compte/connexion");
  await admin.goto(BASE + "/admin/clients?q=" + encodeURIComponent(SARAH));
  verifier(await admin.getByText("Aucun client trouvé.").isVisible(), "espace supprimé : Sarah n'est plus dans les clients");
  await admin.goto(BASE + "/admin?filtre=livrees");
  verifier(await admin.locator("a", { hasText: `n°${numero1}` }).first().isVisible(), "ses commandes restent dans l'admin");
} finally {
  writeFileSync(`${OUT}/resultat-espace-client.txt`, etapes.join("\n") + "\n\nErreurs JS : " + (erreurs.length ? "\n" + erreurs.join("\n") : "aucune") + "\n");
  console.log("Erreurs JS :", erreurs.length ? erreurs : "aucune");
  await navigateur.close();
}
