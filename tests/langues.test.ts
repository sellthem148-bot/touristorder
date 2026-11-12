// Les cinq langues du site : choix de la langue, traductions complètes, formats, adresse obligatoire.
import { describe, expect, it } from "vitest";
import { adressesParLangue, aiguiller, choisirLangue, compter, estLangue, heureLisible, jourDansPhrase, langueDepuisEntete, langueDuChemin, LANGUES, lienPour, pluriel, prefixeDe, remplir, sens } from "@/lib/langues";
import { DICTIONNAIRES, DICTIONNAIRES_SERVEUR, dictionnaire, dictionnaireServeur, langueDesMessages, langueDuCourriel, langueEnregistree, libelleDuMode, nomDuRayon } from "@/lib/i18n";
import { comparer } from "@/lib/i18n/verifier";
import { formatPrix, formatPrixCourt } from "@/lib/argent";
import { libelleDuJour } from "@/lib/dates";
import { adresseComplete, precisionsAdresse } from "@/lib/adresse";
import { commandeSchema, erreursParChamp, schemasPour } from "@/lib/validation";
import { courrielDeConfirmation, courrielDeConnexion, type CommandePourCourriel } from "@/lib/courriels";
import { messageJArrive, messagePourLeClient } from "@/lib/messages-client";
import { lignesDeMontants } from "@/lib/montants";
import { paiementPourLeClient } from "@/lib/paiement";

const nbsp = (t: string) => t.replace(/[  ]/g, " ");
const AUTRES = LANGUES.filter((l) => l !== "fr");

/** Tous les textes d'un dictionnaire, à plat. */
function textes(x: unknown): string[] {
  if (typeof x === "string") return [x];
  if (Array.isArray(x)) return x.flatMap(textes);
  if (x && typeof x === "object") return Object.values(x).flatMap(textes);
  return [];
}

describe("choix de la langue", () => {
  it("cinq langues ; l'hébreu s'écrit de droite à gauche", () => {
    expect([...LANGUES].sort()).toEqual(["en", "es", "fr", "he", "ru"]);
    expect(sens("he")).toBe("rtl");
    for (const l of ["fr", "en", "ru", "es"] as const) expect(sens(l)).toBe("ltr");
    expect(estLangue("ru")).toBe(true);
    expect(estLangue("de")).toBe(false);
    expect(estLangue(undefined)).toBe(false);
  });
  it("le choix du client (cookie) passe avant la langue du navigateur ; sinon le français", () => {
    expect(choisirLangue("he", "ru-RU,ru;q=0.9")).toBe("he");
    expect(choisirLangue(undefined, "ru-RU,ru;q=0.9,en;q=0.8")).toBe("ru");
    expect(choisirLangue("klingon", "es-MX,es;q=0.9")).toBe("es");
    expect(choisirLangue(undefined, "de-DE,de;q=0.9")).toBe("fr");
    expect(choisirLangue(undefined, null)).toBe("fr");
  });
  it("langue du navigateur : la préférée parmi celles du site, « iw » = hébreu", () => {
    expect(langueDepuisEntete("de-DE,de;q=0.9,en-US;q=0.8,fr;q=0.7")).toBe("en");
    expect(langueDepuisEntete("en;q=0.3, es;q=0.9")).toBe("es");
    expect(langueDepuisEntete("iw-IL")).toBe("he");
    expect(langueDepuisEntete("fr;q=0")).toBeNull();
    expect(langueDepuisEntete("")).toBeNull();
  });
  it("une langue enregistrée inconnue retombe sur le français", () => {
    expect(langueEnregistree("ru")).toBe("ru");
    expect(langueEnregistree("")).toBe("fr");
    expect(langueEnregistree(null)).toBe("fr");
  });
});

describe("une adresse par langue", () => {
  it("le français n'a pas de préfixe ; les autres langues ont le leur", () => {
    expect(prefixeDe("fr")).toBe("");
    expect(prefixeDe("he")).toBe("/he");
    expect(lienPour("fr", "/panier")).toBe("/panier");
    expect(lienPour("he", "/panier")).toBe("/he/panier");
    expect(lienPour("ru", "/")).toBe("/ru");
    expect(lienPour("en", "/?espace=supprime")).toBe("/en?espace=supprime");
    expect(lienPour("es", "/panier?demande=lait")).toBe("/es/panier?demande=lait");
    expect(lienPour("en", "/compte?erreur=confirmation#supprimer")).toBe("/en/compte?erreur=confirmation#supprimer");
    // Une ancre ou un lien externe ne change pas.
    expect(lienPour("he", "#rayons")).toBe("#rayons");
    expect(lienPour("he", "https://wa.me/972")).toBe("https://wa.me/972");
    expect(lienPour("he", "//exemple.test/x")).toBe("//exemple.test/x");
  });
  it("lire la langue d'une adresse", () => {
    expect(langueDuChemin("/he/panier")).toEqual({ langue: "he", chemin: "/panier", prefixe: true });
    expect(langueDuChemin("/he")).toEqual({ langue: "he", chemin: "/", prefixe: true });
    expect(langueDuChemin("/ru/categorie/boissons")).toEqual({ langue: "ru", chemin: "/categorie/boissons", prefixe: true });
    expect(langueDuChemin("/panier")).toEqual({ langue: "fr", chemin: "/panier", prefixe: false });
    expect(langueDuChemin("/")).toEqual({ langue: "fr", chemin: "/", prefixe: false });
    // Un mot qui commence comme un code de langue n'en est pas un.
    expect(langueDuChemin("/hello")).toEqual({ langue: "fr", chemin: "/hello", prefixe: false });
    expect(langueDuChemin("/categorie/he")).toEqual({ langue: "fr", chemin: "/categorie/he", prefixe: false });
    for (const l of LANGUES) expect(langueDuChemin(lienPour(l, "/suivi/abc")).langue).toBe(l);
  });
  it("un moteur de recherche (aucune langue demandée) lit le français sans préfixe, et chaque langue à son adresse", () => {
    expect(aiguiller({ chemin: "/" })).toEqual({ action: "suivre", langue: "fr" });
    expect(aiguiller({ chemin: "/categorie/boissons" })).toEqual({ action: "suivre", langue: "fr" });
    expect(aiguiller({ chemin: "/he" })).toEqual({ action: "reecrire", langue: "he", chemin: "/" });
    expect(aiguiller({ chemin: "/ru/categorie/boissons" })).toEqual({ action: "reecrire", langue: "ru", chemin: "/categorie/boissons" });
    // L'adresse commande : un cookie ou un navigateur d'une autre langue n'y change rien.
    expect(aiguiller({ chemin: "/en/contact", cookie: "he", entete: "ru-RU" })).toEqual({ action: "reecrire", langue: "en", chemin: "/contact" });
  });
  it("sans préfixe, le visiteur est envoyé vers l'adresse de sa langue : son choix d'abord, sinon son navigateur", () => {
    expect(aiguiller({ chemin: "/contact", recherche: "?a=1", entete: "ru-RU,ru;q=0.9" })).toEqual({ action: "rediriger", vers: "/ru/contact?a=1", permanent: false });
    expect(aiguiller({ chemin: "/", entete: "he-IL" })).toEqual({ action: "rediriger", vers: "/he", permanent: false });
    expect(aiguiller({ chemin: "/suivi/abc", cookie: "en", entete: "fr-FR" })).toEqual({ action: "rediriger", vers: "/en/suivi/abc", permanent: false });
    // Il a choisi le français : il y reste, même avec un navigateur russe.
    expect(aiguiller({ chemin: "/", cookie: "fr", entete: "ru-RU" })).toEqual({ action: "suivre", langue: "fr" });
    expect(aiguiller({ chemin: "/", entete: "fr-FR,fr;q=0.9,en;q=0.8" })).toEqual({ action: "suivre", langue: "fr" });
    expect(aiguiller({ chemin: "/", entete: "de-DE" })).toEqual({ action: "suivre", langue: "fr" });
    // Un envoi de formulaire n'est jamais redirigé (il perdrait ce qu'il porte).
    expect(aiguiller({ chemin: "/panier", methode: "POST", entete: "ru-RU" })).toEqual({ action: "suivre", langue: "fr" });
  });
  it("« /fr/… » revient à l'adresse sans préfixe ; l'espace gérant et le lien de connexion n'ont pas de langue", () => {
    expect(aiguiller({ chemin: "/fr/contact", recherche: "?x=1" })).toEqual({ action: "rediriger", vers: "/contact?x=1", permanent: true });
    expect(aiguiller({ chemin: "/fr" })).toEqual({ action: "rediriger", vers: "/", permanent: true });
    // L'espace gérant : toujours en français, jamais redirigé, même avec un navigateur en hébreu.
    expect(aiguiller({ chemin: "/admin", entete: "he-IL", cookie: "he" })).toEqual({ action: "suivre", langue: "fr" });
    expect(aiguiller({ chemin: "/admin/commandes/abc", methode: "POST", entete: "ru" })).toEqual({ action: "suivre", langue: "fr" });
    expect(aiguiller({ chemin: "/he/admin/journee" })).toEqual({ action: "rediriger", vers: "/admin/journee", permanent: false });
    // Le lien de connexion reçu par e-mail : il passe tel quel (il choisit lui-même la langue du client).
    expect(aiguiller({ chemin: "/compte/acces", recherche: "?jeton=x", entete: "he-IL" })).toEqual({ action: "laisser" });
    expect(aiguiller({ chemin: "/ru/compte/acces", recherche: "?jeton=x" })).toEqual({ action: "rediriger", vers: "/compte/acces?jeton=x", permanent: false });
    // « /compte » lui-même est une page comme une autre.
    expect(aiguiller({ chemin: "/compte", entete: "he" })).toEqual({ action: "rediriger", vers: "/he/compte", permanent: false });
  });
  it("pour les moteurs de recherche : l'adresse de référence et la même page dans chaque langue", () => {
    expect(adressesParLangue("/contact", "he")).toEqual({
      canonical: "/he/contact",
      languages: { fr: "/contact", en: "/en/contact", ru: "/ru/contact", he: "/he/contact", es: "/es/contact", "x-default": "/contact" },
    });
    expect(adressesParLangue("/", "fr").canonical).toBe("/");
    expect(adressesParLangue("/", "en").languages.en).toBe("/en");
  });
});

describe("traductions", () => {
  it.each(AUTRES)("%s : mêmes textes que le français, mêmes {valeurs}, mêmes liens", (langue) => {
    expect(comparer(DICTIONNAIRES.fr, DICTIONNAIRES[langue], langue)).toEqual([]);
    expect(comparer(DICTIONNAIRES_SERVEUR.fr, DICTIONNAIRES_SERVEUR[langue], `serveur/${langue}`)).toEqual([]);
  });
  it("le vérificateur voit un texte manquant, une valeur oubliée, un lien changé", () => {
    expect(comparer({ a: "Bonjour {prenom}", b: "x" }, { a: "Hello" })).toEqual([". b : manquant".replace(". ", "."), "a : valeurs {…} différentes — attendu {prenom}, trouvé aucune"]);
    expect(comparer({ a: "Voir [la page](/contact)" }, { a: "See [the page](/autre)" })[0]).toContain("liens différents");
    expect(comparer({ n: { one: "{n} article", other: "{n} articles" } }, { n: { one: "{n} товар", few: "{n} товара", many: "{n} товаров", other: "{n} товара" } })).toEqual([]);
  });
  it("le français vouvoie le client", () => {
    for (const t of [...textes(DICTIONNAIRES.fr), ...textes(DICTIONNAIRES_SERVEUR.fr)]) {
      expect(t, t).not.toMatch(/(^|[\s«(])(tu|ta|ton|tes|toi)\b/i);
    }
  });
  it("le gérant répond en français, en anglais ou en hébreu : le site ne promet ni le russe ni l'espagnol", () => {
    // Ces trois langues annoncent un service dans la langue du client.
    expect(DICTIONNAIRES.fr.accueil.surtitre).toContain("en français");
    expect(DICTIONNAIRES.en.accueil.surtitre).toMatch(/in English/);
    expect(DICTIONNAIRES.he.accueil.surtitre).toMatch(/בעברית/);
    // La page de contact dit partout dans quelles langues on répond.
    expect(DICTIONNAIRES.fr.contact.intro).toContain("en français, en anglais ou en hébreu");
    expect(DICTIONNAIRES.en.contact.intro).toMatch(/English, French or Hebrew/);
    expect(DICTIONNAIRES.he.contact.intro).toMatch(/בעברית, באנגלית או בצרפתית/);
    expect(DICTIONNAIRES.ru.contact.intro).toMatch(/на английском, иврите или французском/);
    expect(DICTIONNAIRES.es.contact.intro).toMatch(/en inglés, hebreo o francés/);
    // Le russe et l'espagnol ne sont promis nulle part.
    const textes = (x: unknown): string[] => (typeof x === "string" ? [x] : x && typeof x === "object" ? Object.values(x).flatMap(textes) : []);
    for (const t of [...textes(DICTIONNAIRES.ru), ...textes(DICTIONNAIRES_SERVEUR.ru)]) expect(t, t).not.toMatch(/на русском|по-русски/i);
    for (const t of [...textes(DICTIONNAIRES.es), ...textes(DICTIONNAIRES_SERVEUR.es)]) expect(t, t).not.toMatch(/en español|en castellano/i);
  });
  it("chaque langue a ses propres textes", () => {
    const titres = new Set(LANGUES.map((l) => dictionnaire(l).panier.titreCommande));
    expect(titres.size).toBe(5);
    expect(dictionnaire("he").panier.etage).toMatch(/[֐-׿]/);
    expect(dictionnaire("ru").panier.etage).toMatch(/[Ѐ-ӿ]/);
  });
  it("rayon de départ : traduit ; renommé ou créé par le gérant : son nom", () => {
    const en = dictionnaire("en");
    expect(nomDuRayon({ slug: "boissons", nom: "Boissons" }, en)).toBe(en.rayons.boissons);
    expect(nomDuRayon({ slug: "boissons", nom: "Boissons fraîches" }, en)).toBe("Boissons fraîches");
    expect(nomDuRayon({ slug: "ma-categorie", nom: "Ma catégorie" }, en)).toBe("Ma catégorie");
    expect(nomDuRayon({ slug: "boissons", nom: "Boissons" }, dictionnaire("fr"))).toBe("Boissons");
  });
  it("mode de paiement de départ : traduit ; les autres gardent leur nom", () => {
    expect(libelleDuMode("Virement", dictionnaire("en"))).not.toBe("Virement");
    expect(libelleDuMode("Bit", dictionnaire("ru"))).toBe("Bit");
    expect(libelleDuMode("Virement", dictionnaire("fr"))).toBe("Virement");
  });
});

describe("formats", () => {
  it("valeurs et pluriels", () => {
    expect(remplir("Bonjour {prenom}, n°{numero}", { prenom: "Léa", numero: 4 })).toBe("Bonjour Léa, n°4");
    expect(remplir("{a} {inconnu}", { a: "x" })).toBe("x {inconnu}");
    const fr = { one: "{n} article", other: "{n} articles" };
    expect([0, 1, 2].map((n) => compter("fr", n, fr))).toEqual(["0 article", "1 article", "2 articles"]);
    const ru = { one: "{n} товар", few: "{n} товара", many: "{n} товаров", other: "{n} товара" };
    expect([1, 2, 5, 21, 22, 25].map((n) => compter("ru", n, ru))).toEqual(["1 товар", "2 товара", "5 товаров", "21 товар", "22 товара", "25 товаров"]);
    expect(pluriel("en", 1, { one: "item", other: "items" })).toBe("item");
    expect(pluriel("en", 0, { one: "item", other: "items" })).toBe("items");
  });
  it("prix : la virgule ou le point de la langue, le signe ₪ devant en anglais", () => {
    expect(nbsp(formatPrix(1290))).toBe("12,90 ₪");
    expect(nbsp(formatPrix(1290, "fr"))).toBe("12,90 ₪");
    expect(formatPrix(1290, "en")).toBe("₪12.90");
    expect(nbsp(formatPrix(1290, "ru"))).toBe("12,90 ₪");
    expect(nbsp(formatPrix(1290, "es"))).toBe("12,90 ₪");
    expect(nbsp(formatPrix(1290, "he"))).toBe("12.90 ₪");
    expect(formatPrixCourt(3000, "en")).toBe("₪30");
    expect(nbsp(formatPrixCourt(3000, "he"))).toBe("30 ₪");
  });
  it("jours et heures", () => {
    const m = new Date("2026-11-10T10:00:00Z");
    expect(libelleDuJour("2026-11-10", m, "en")).toBe("Today");
    expect(libelleDuJour("2026-11-11", m, "ru")).toBe("Завтра");
    expect(libelleDuJour("2026-11-11", m, "he")).toBe("מחר");
    expect(libelleDuJour("2026-11-13", m, "es")).toBe("Viernes, 13 de noviembre");
    expect(libelleDuJour("2026-11-13", m, "en")).toBe("Friday 13 November");
    expect(heureLisible("17:00", "fr")).toBe("17h");
    expect(heureLisible("17:30", "fr")).toBe("17h30");
    expect(heureLisible("17:00", "en")).toBe("17:00");
    expect(jourDansPhrase("Demain", "fr")).toBe("demain");
    expect(jourDansPhrase("Friday 13 November", "en")).toBe("Friday 13 November");
  });
  it("montants et paiement dans la langue du client", () => {
    const totaux = { sousTotal: 1680, majoration: 0, fraisService: 1500, fraisLivraison: 3000, pourboire: 500 };
    const p = { regroupes: false, express: true, tarifNom: "Tarif de base", majorationPct: 0 };
    const en = dictionnaire("en");
    expect(lignesDeMontants(totaux, p, en.montants).map((l) => l.libelle)).toEqual([en.montants.articles, en.montants.fraisService, en.montants.livraisonExpress, en.montants.pourboire]);
    const attente = paiementPourLeClient({ etat: "A_PAYER", montant: 17790 }, "Bit", en.paiement, "en")!;
    expect(attente.titre).toContain("₪177.90");
    expect(attente.texte).toContain("Bit");
    expect(attente.texte).not.toContain("{");
  });
});

describe("adresse de livraison", () => {
  const base = {
    nomClient: "Sarah Cohen", telephone: "+33 6 12 34 56 78", email: "sarah@exemple.fr", ville: "Netanya",
    adresse: "Rue Herzl 12", etage: "3", appartement: "12", dateLivraison: "2026-11-10", creneau: "20:00 – 21:00",
    remplacement: "CONTACTER", lignes: [{ produitId: "abc", quantite: 1 }],
  };
  it("la commande est refusée sans rue, sans étage, sans numéro d'appartement ou sans téléphone", () => {
    expect(commandeSchema.safeParse(base).success).toBe(true);
    for (const champ of ["adresse", "etage", "appartement", "telephone", "nomClient", "email", "ville"] as const) {
      const r = commandeSchema.safeParse({ ...base, [champ]: "  " });
      expect(r.success, champ).toBe(false);
      expect(Object.keys(erreursParChamp(r.error!)), champ).toEqual([champ]);
      const absent = commandeSchema.safeParse({ ...base, [champ]: undefined });
      expect(absent.success, champ).toBe(false);
    }
  });
  it("le code d'entrée est facultatif ; l'étage 0 (rez-de-chaussée) est accepté", () => {
    const r = commandeSchema.parse({ ...base, etage: "0", codeEntree: " 1234# " });
    expect(r.etage).toBe("0");
    expect(r.codeEntree).toBe("1234#");
    expect(commandeSchema.parse(base).codeEntree).toBe("");
  });
  it("les messages d'erreur sont dans la langue du client", () => {
    for (const langue of LANGUES) {
      const m = dictionnaireServeur(langue).erreurs;
      const r = schemasPour(m).commandeSchema.safeParse({ ...base, etage: "", appartement: "", telephone: "" });
      expect(erreursParChamp(r.error!)).toEqual({ etage: m.etageRequis, appartement: m.appartementRequis, telephone: m.telephoneRequis });
    }
    expect(dictionnaireServeur("en").erreurs.etageRequis).not.toBe(dictionnaireServeur("fr").erreurs.etageRequis);
  });
  it("maison : ni étage ni appartement à donner ; hôtel : le nom de l'hôtel suffit, la chambre est facultative", () => {
    const maison = commandeSchema.parse({ ...base, logement: "MAISON", etage: "", appartement: "", codeEntree: "12" });
    expect([maison.logement, maison.etage, maison.appartement]).toEqual(["MAISON", "", ""]);
    const hotel = commandeSchema.parse({ ...base, logement: "HOTEL", adresse: "Hôtel Dan", etage: undefined, appartement: "512" });
    expect([hotel.logement, hotel.appartement]).toEqual(["HOTEL", "512"]);
    expect(commandeSchema.safeParse({ ...base, logement: "HOTEL", adresse: "Hôtel Dan", etage: "", appartement: "" }).success).toBe(true);
    // Un appartement garde son étage et son numéro obligatoires ; sans choix, ou avec un choix inconnu, rien ne passe.
    const appartement = commandeSchema.safeParse({ ...base, logement: "APPARTEMENT", etage: "", appartement: "" });
    expect(Object.keys(erreursParChamp(appartement.error!)).sort()).toEqual(["appartement", "etage"]);
    for (const mauvais of ["", "VILLA", "maison"]) {
      const r = commandeSchema.safeParse({ ...base, logement: mauvais });
      expect(r.success, mauvais).toBe(false);
      expect(Object.keys(erreursParChamp(r.error!)), mauvais).toEqual(["logement"]);
    }
    for (const langue of LANGUES) {
      const m = dictionnaireServeur(langue).erreurs;
      expect(erreursParChamp(schemasPour(m).commandeSchema.safeParse({ ...base, logement: "" }).error!)).toEqual({ logement: m.logementRequis });
    }
  });
  it("hôtel : on ne monte pas dans les chambres — écrit pour le livreur, pour le client et dans les messages du gérant", () => {
    const hotel = { adresse: "Hôtel Dan", logement: "HOTEL", etage: "", appartement: "512", codeEntree: "" };
    expect(adresseComplete(hotel)).toBe("Hôtel Dan\nHôtel · Chambre 512 · Ne pas monter : appeler le client, il descend chercher sa commande");
    expect(precisionsAdresse({ ...hotel, appartement: "" })).toBe("Hôtel · Ne pas monter : appeler le client, il descend chercher sa commande");
    expect(precisionsAdresse({ adresse: "Rue des Fleurs 4", logement: "MAISON", codeEntree: "12" })).toBe("Maison · Code 12");
    expect(precisionsAdresse({ adresse: "Rue des Fleurs 4", logement: "MAISON" })).toBe("Maison");
    for (const langue of LANGUES) {
      const t = dictionnaire(langue);
      const l = langueDesMessages(langue);
      // Ce que le client lit : sa chambre, et la remise à la réception (jamais la consigne du livreur).
      const lu = precisionsAdresse(hotel, t.adresse);
      expect(lu, langue).toContain("512");
      expect(lu, langue).toContain(t.adresse.remiseHotel);
      expect(lu, langue).not.toContain("Ne pas monter");
      expect(t.panier.hotelAvis.length, langue).toBeGreaterThan(30);
      const infos = {
        prenom: "Anna", reference: "AN-15210", total: 8970, lienSuivi: "https://x/suivi/a", site: "Tourist Order",
        paiement: { etat: "PAYEE" as const, montant: 0 as const }, mode: "Bit", coordonnees: "",
      };
      // « En route » et « j'arrive » : la consigne de l'hôtel, seulement pour une commande à l'hôtel.
      expect(messagePourLeClient("EN_LIVRAISON", { ...infos, hotel: true }, l), langue).toContain(l.m.hotel);
      expect(messagePourLeClient("EN_LIVRAISON", infos, l), langue).not.toContain(l.m.hotel);
      expect(messagePourLeClient("RECUE", { ...infos, hotel: true }, l), langue).not.toContain(l.m.hotel);
      const arrive = { prenom: "Anna", reference: "AN-15210", reste: 0, mode: "Bit", site: "Tourist Order" };
      expect(messageJArrive({ ...arrive, hotel: true }, l), langue).toContain(l.m.hotel);
      expect(messageJArrive(arrive, l), langue).not.toContain(l.m.hotel);
    }
  });
  it("adresse entière : la rue, puis étage, appartement et code ; une ancienne commande n'a que la rue", () => {
    expect(adresseComplete({ adresse: "Rue Herzl 12", etage: "3", appartement: "12", codeEntree: "1234#" })).toBe("Rue Herzl 12\nÉtage 3 · Appt / chambre 12 · Code 1234#");
    expect(adresseComplete({ adresse: "Rue Herzl 12", etage: "0", appartement: "2", codeEntree: "" })).toBe("Rue Herzl 12\nÉtage 0 · Appt / chambre 2");
    expect(adresseComplete({ adresse: "Hôtel Dan, chambre 512" })).toBe("Hôtel Dan, chambre 512");
    expect(precisionsAdresse({ adresse: "x", etage: "3", appartement: "12" }, dictionnaire("en").adresse)).not.toContain("Étage");
  });
});

describe("e-mails et messages dans la langue du client", () => {
  const commande: CommandePourCourriel = {
    site: "Tourist Order", numero: 42, reference: "AP-45240", nomClient: "Anna Petrova", prenom: "Anna", telephone: "+7 912 345-67-89", ville: "Netanya",
    adresse: "Rue Herzl 12\nÉtage 3", jour: "Demain", creneau: "20:00 – 21:00", paiement: "Bit", notes: "", demandeLibre: "",
    lignes: [{ nom: "Lait 3 % 1 L", options: "", quantite: 2, prixUnitaire: 990 }],
    totaux: { sousTotal: 1980, majoration: 0, fraisService: 1500, fraisLivraison: 3000, pourboire: 0, total: 6480 },
    presentation: { regroupes: false, express: false, tarifNom: "Tarif de base", majorationPct: 0, ville: "Netanya" },
    lienSuivi: "https://exemple.test/suivi/abc", lienEspace: "https://exemple.test/compte/acces?jeton=xyz",
    lienWhatsapp: "https://wa.me/972501234567?text=x", lienPaiement: "https://wa.me/972501234567?text=y",
  };
  it.each(LANGUES)("%s : confirmation complète, sans {valeur} oubliée", (langue) => {
    const c = courrielDeConfirmation(commande, langueDuCourriel(langue));
    for (const texte of [c.sujet, c.texte, c.html]) expect(texte).not.toMatch(/\{\w+\}/);
    expect(c.html).toContain(`<html lang="${langue}" dir="${sens(langue)}">`);
    expect(c.html).toContain('href="https://exemple.test/suivi/abc"');
    // Le client lit sa référence, jamais le numéro d'ordre de la commande.
    expect(c.html).toContain("AP-45240");
    expect(`${c.sujet} ${c.texte}`).toContain("AP-45240");
    expect(`${c.sujet} ${c.html} ${c.texte}`).not.toMatch(/(n°|#|№|n\.º|מס')\s?42\b/);
    expect(c.texte).toContain("Lait 3 % 1 L");
    expect(c.html).toContain(formatPrix(6480, langue));
    const lien = courrielDeConnexion({ site: "Tourist Order", lien: "https://exemple.test/x", minutes: 30 }, dictionnaireServeur(langue).courriel, langue);
    expect(`${lien.sujet}${lien.texte}${lien.html}`).not.toMatch(/\{\w+\}/);
    expect(lien.texte).toContain("https://exemple.test/x");
    expect(lien.html).toContain("30");
  });
  it("en français, l'e-mail est le même qu'avant (langue par défaut)", () => {
    expect(courrielDeConfirmation(commande, langueDuCourriel("fr"))).toEqual(courrielDeConfirmation(commande));
  });
  it("en hébreu, les montants s'alignent à gauche", () => {
    expect(courrielDeConfirmation(commande, langueDuCourriel("he")).html).toContain('align="left"');
    expect(courrielDeConfirmation(commande).html).not.toContain('align="left"');
  });
  it.each(LANGUES)("%s : les messages WhatsApp du gérant portent la référence, le montant et ses coordonnées de paiement", (langue) => {
    const l = langueDesMessages(langue);
    const infos = {
      prenom: "Anna", reference: "AN-15210", total: 8970, lienSuivi: "https://x/suivi/a", site: "Tourist Order",
      paiement: { etat: "A_PAYER" as const, montant: 8970 }, mode: l.mode("Virement"), coordonnees: "IBAN IL00 0000",
    };
    for (const statut of ["RECUE", "COMMANDEE", "EN_LIVRAISON", "LIVREE", "ANNULEE"] as const) {
      const m = messagePourLeClient(statut, infos, l);
      expect(m, statut).not.toMatch(/\{\w+\}/);
      expect(m, statut).toContain("AN-15210");
      expect(m, statut).toContain("Anna");
    }
    const recue = messagePourLeClient("RECUE", infos, l);
    expect(recue).toContain(formatPrix(8970, langue));
    expect(recue).toContain("IBAN IL00 0000");
    expect(recue).toContain("https://x/suivi/a");
    const arrive = messageJArrive({ prenom: "Anna", reference: "AN-15210", reste: 8970, mode: "Bit", site: "Tourist Order" }, l);
    expect(arrive).not.toMatch(/\{\w+\}/);
    expect(arrive).toContain("(Bit)");
  });
  it("une commande sans langue connue reçoit ses messages en français", () => {
    expect(langueDesMessages("").langue).toBe("fr");
    expect(langueDesMessages("xx").m).toBe(dictionnaireServeur("fr").messages);
  });
});
