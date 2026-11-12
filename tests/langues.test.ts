// Les cinq langues du site : choix de la langue, traductions complètes, formats, adresse obligatoire.
import { describe, expect, it } from "vitest";
import { choisirLangue, compter, estLangue, heureLisible, jourDansPhrase, langueDepuisEntete, LANGUES, pluriel, remplir, sens } from "@/lib/langues";
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
  it("aucune traduction ne promet un service dans la langue du client", () => {
    // Le gérant répond en français : seul le site français l'annonce.
    expect(DICTIONNAIRES.fr.contact.intro).toContain("en français");
    expect(DICTIONNAIRES.en.accueil.surtitre).not.toMatch(/english|french/i);
    expect(DICTIONNAIRES.ru.accueil.surtitre).not.toMatch(/русск/i);
    expect(DICTIONNAIRES.es.accueil.surtitre).not.toMatch(/español/i);
    expect(DICTIONNAIRES.he.accueil.surtitre).not.toMatch(/עברית/);
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
  it("adresse entière : la rue, puis étage, appartement et code ; une ancienne commande n'a que la rue", () => {
    expect(adresseComplete({ adresse: "Rue Herzl 12", etage: "3", appartement: "12", codeEntree: "1234#" })).toBe("Rue Herzl 12\nÉtage 3 · Appt / chambre 12 · Code 1234#");
    expect(adresseComplete({ adresse: "Rue Herzl 12", etage: "0", appartement: "2", codeEntree: "" })).toBe("Rue Herzl 12\nÉtage 0 · Appt / chambre 2");
    expect(adresseComplete({ adresse: "Hôtel Dan, chambre 512" })).toBe("Hôtel Dan, chambre 512");
    expect(precisionsAdresse({ adresse: "x", etage: "3", appartement: "12" }, dictionnaire("en").adresse)).not.toContain("Étage");
  });
});

describe("e-mails et messages dans la langue du client", () => {
  const commande: CommandePourCourriel = {
    site: "Tourist Order", numero: 42, nomClient: "Anna Petrova", prenom: "Anna", telephone: "+7 912 345-67-89", ville: "Netanya",
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
    expect(c.html).toContain("42");
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
  it.each(LANGUES)("%s : les messages WhatsApp du gérant portent le numéro, le montant et ses coordonnées de paiement", (langue) => {
    const l = langueDesMessages(langue);
    const infos = {
      prenom: "Anna", numero: 12, total: 8970, lienSuivi: "https://x/suivi/a", site: "Tourist Order",
      paiement: { etat: "A_PAYER" as const, montant: 8970 }, mode: l.mode("Virement"), coordonnees: "IBAN IL00 0000",
    };
    for (const statut of ["RECUE", "COMMANDEE", "EN_LIVRAISON", "LIVREE", "ANNULEE"] as const) {
      const m = messagePourLeClient(statut, infos, l);
      expect(m, statut).not.toMatch(/\{\w+\}/);
      expect(m, statut).toContain("12");
      expect(m, statut).toContain("Anna");
    }
    const recue = messagePourLeClient("RECUE", infos, l);
    expect(recue).toContain(formatPrix(8970, langue));
    expect(recue).toContain("IBAN IL00 0000");
    expect(recue).toContain("https://x/suivi/a");
    const arrive = messageJArrive({ prenom: "Anna", numero: 12, reste: 8970, mode: "Bit", site: "Tourist Order" }, l);
    expect(arrive).not.toMatch(/\{\w+\}/);
    expect(arrive).toContain("(Bit)");
  });
  it("une commande sans langue connue reçoit ses messages en français", () => {
    expect(langueDesMessages("").langue).toBe("fr");
    expect(langueDesMessages("xx").m).toBe(dictionnaireServeur("fr").messages);
  });
});
