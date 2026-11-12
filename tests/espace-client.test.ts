import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { creerJetonClient, lireJetonClient, DUREE_LIEN_CONNEXION_MS } from "@/lib/session-client";
import { creerJetonSession, jetonSessionValide } from "@/lib/session-admin";
import { adresseDeReponse, adresseDuLogo, corpsPourResend, courrielDeConfirmation, courrielDeConnexion, courrielNouvelleCommande, echapper, type CommandePourCourriel } from "@/lib/courriels";
import { produitsPreferes, resumeDuClient, selectionDepuisLibelle } from "@/lib/espace-client";
import { lignesDeMontants } from "@/lib/montants";
import { commandeSchema, emailSchema } from "@/lib/validation";
import { resoudreSelection } from "@/lib/options";

const ID = "cmwabc123def456ghi789jkl0";
const sansInsecable = (s: string) => s.replace(/[  ]/g, " ");

describe("jetons de l'espace client", () => {
  beforeEach(() => { process.env.SESSION_SECRET = "x".repeat(40); });
  afterEach(() => { delete process.env.SESSION_SECRET; });

  it("un lien valable ouvre le bon client, jusqu'à son expiration", () => {
    const t = 1_700_000_000_000;
    const j = creerJetonClient("lien", ID, DUREE_LIEN_CONNEXION_MS, t)!;
    expect(lireJetonClient("lien", j, t + 1000)).toBe(ID);
    expect(lireJetonClient("lien", j, t + DUREE_LIEN_CONNEXION_MS + 1)).toBeNull();
  });
  it("un lien de connexion ne vaut pas cookie de session, et inversement", () => {
    const lien = creerJetonClient("lien", ID, 60_000)!;
    const session = creerJetonClient("session", ID, 60_000)!;
    expect(lireJetonClient("session", lien)).toBeNull();
    expect(lireJetonClient("lien", session)).toBeNull();
    expect(lireJetonClient("session", session)).toBe(ID);
  });
  it("un jeton modifié, d'un autre client ou signé avec une autre clé est refusé", () => {
    const j = creerJetonClient("session", ID, 60_000)!;
    const [id, exp, sig] = j.split(".");
    expect(lireJetonClient("session", `${id.slice(0, -1)}x.${exp}.${sig}`)).toBeNull();
    expect(lireJetonClient("session", `${id}.${Number(exp) + 1}.${sig}`)).toBeNull();
    expect(lireJetonClient("session", `${j}.x`)).toBeNull();
    expect(lireJetonClient("session", "")).toBeNull();
    expect(lireJetonClient("session", null)).toBeNull();
    process.env.SESSION_SECRET = "y".repeat(40);
    expect(lireJetonClient("session", j)).toBeNull();
  });
  it("une session client n'ouvre pas l'admin, une session admin n'ouvre pas un espace client", () => {
    process.env.ADMIN_PASSWORD = "mot-de-passe-solide";
    const client = creerJetonClient("session", ID, 60_000)!;
    const admin = creerJetonSession()!;
    expect(jetonSessionValide(client)).toBe(false);
    expect(lireJetonClient("session", admin)).toBeNull();
    delete process.env.ADMIN_PASSWORD;
  });
  it("sans clé de signature, aucun jeton", () => {
    process.env.SESSION_SECRET = "court";
    expect(creerJetonClient("lien", ID, 60_000)).toBeNull();
  });
});

describe("adresse e-mail", () => {
  it("nettoyée avant d'être vérifiée", () => {
    expect(emailSchema.parse("  Sarah.Cohen@Exemple.FR ")).toBe("sarah.cohen@exemple.fr");
  });
  it("refuse ce qui n'est pas une adresse", () => {
    for (const mauvais of ["", "sarah", "sarah@", "@exemple.fr", "a b@exemple.fr", "sarah@exemple"]) {
      expect(emailSchema.safeParse(mauvais).success, mauvais).toBe(false);
    }
  });
  it("vide : « requise », pas « invalide »", () => {
    const r = emailSchema.safeParse("   ");
    expect(r.success).toBe(false);
    expect(r.error?.issues.map((i) => i.message)).toEqual(["Votre adresse e-mail est requise."]);
  });
  it("la commande exige une adresse e-mail", () => {
    const base = {
      nomClient: "Sarah", telephone: "+33612345678", ville: "Netanya", adresse: "Hôtel Dan", etage: "5", appartement: "512",
      dateLivraison: "2026-11-10", creneau: "19:00 – 20:00", remplacement: "CONTACTER", lignes: [{ produitId: "a", quantite: 1 }],
    };
    expect(commandeSchema.safeParse(base).success).toBe(false);
    expect(commandeSchema.parse({ ...base, email: "Sarah@Exemple.fr" }).email).toBe("sarah@exemple.fr");
  });
});

const commande: CommandePourCourriel = {
  site: "Courses Express",
  numero: 42,
  reference: "SC-45240",
  nomClient: "Sarah Cohen",
  prenom: "Sarah",
  telephone: "+33 6 12 34 56 78",
  ville: "Herzliya",
  adresse: "Hôtel Daniel,\nchambre 120",
  jour: "Demain",
  creneau: "20:00 – 21:00",
  paiement: "Bit",
  notes: "",
  demandeLibre: "",
  lignes: [
    { nom: "Couches Huggies", options: "Taille : 4", quantite: 2, prixUnitaire: 6990 },
    { nom: "Pack d'eau 6 × 1,5 L", options: "", quantite: 1, prixUnitaire: 2490 },
  ],
  totaux: { sousTotal: 16470, majoration: 0, fraisService: 1500, fraisLivraison: 4500, pourboire: 1000, total: 23470 },
  presentation: { regroupes: false, express: false, tarifNom: "Tarif de base", majorationPct: 0, ville: "Herzliya" },
  lienSuivi: "https://exemple.test/suivi/abc",
  lienEspace: "https://exemple.test/compte/acces?jeton=xyz",
  lienWhatsapp: "https://wa.me/972501234567?text=Bonjour",
  lienPaiement: "https://wa.me/972501234567?text=Regler",
};

describe("e-mail de confirmation", () => {
  it("contient la commande, la livraison, le total et les deux liens", () => {
    const c = courrielDeConfirmation(commande);
    const html = sansInsecable(c.html);
    expect(c.sujet).toBe("Votre commande SC-45240 est enregistrée — livraison demain, 20:00 – 21:00");
    expect(html).toContain("Merci Sarah !");
    expect(html).toContain("<strong>2 ×</strong> Couches Huggies");
    expect(html).toContain("Taille : 4");
    expect(html).toContain("139,80 ₪"); // 2 × 69,90
    expect(html).toContain("Livraison · Herzliya");
    expect(html).toContain("234,70 ₪");
    expect(html).toContain('href="https://exemple.test/suivi/abc"');
    expect(html).toContain('href="https://exemple.test/compte/acces?jeton=xyz"');
    // Le paiement se fait à la commande ; les coordonnées ne sont jamais dans l'e-mail, on les demande sur WhatsApp.
    expect(html).toContain("Paiement à la commande : 234,70 ₪ par Bit.");
    expect(html).not.toContain("à la livraison");
    expect(html).toContain('href="https://wa.me/972501234567?text=Regler"');
    expect(html).toContain("Recevoir les coordonnées de paiement");
    expect(html).toContain("Hôtel Daniel,<br>chambre 120, Herzliya");
    const texte = sansInsecable(c.texte);
    expect(texte).toContain("- 2 × Couches Huggies (Taille : 4) : 139,80 ₪");
    expect(texte).toContain("TOTAL À PAYER : 234,70 ₪");
    expect(texte).toContain("https://exemple.test/suivi/abc");
  });
  it("ne laisse passer aucun HTML venu d'un client ou du catalogue", () => {
    const mechant = '<img src=x onerror="alert(1)">';
    const c = courrielDeConfirmation({
      ...commande, prenom: mechant, nomClient: mechant, adresse: `${mechant}\n</td><script>alert(2)</script>`, notes: mechant,
      lignes: [{ nom: mechant, options: mechant, quantite: 1, prixUnitaire: 100 }],
    });
    expect(c.html).not.toContain("<img");
    expect(c.html).not.toContain("<script");
    expect(c.html).toContain("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(echapper(`a&b<c>"d"'e'`)).toBe("a&amp;b&lt;c&gt;&quot;d&quot;&#39;e&#39;");
  });
  it("demande d'article hors catalogue : affichée, échappée, et sans rien à régler si le panier est vide", () => {
    const avec = courrielDeConfirmation({ ...commande, demandeLibre: "1 crème solaire <b>enfant</b>" });
    expect(avec.html).toContain("Votre demande hors catalogue :");
    expect(avec.html).toContain("1 crème solaire &lt;b&gt;enfant&lt;/b&gt;");
    expect(avec.texte).toContain("Votre demande hors catalogue : 1 crème solaire <b>enfant</b>");

    const seule = courrielDeConfirmation({
      ...commande, demandeLibre: "1 crème solaire", lignes: [], lienPaiement: null,
      totaux: { sousTotal: 0, majoration: 0, fraisService: 0, fraisLivraison: 0, pourboire: 0, total: 0 },
    });
    expect(seule.sujet).toBe("Votre demande SC-45240 est enregistrée — livraison demain, 20:00 – 21:00");
    expect(seule.html).toContain("Demande enregistrée");
    expect(seule.html).toContain("avant tout paiement");
    expect(seule.html).not.toContain("Paiement à la commande");
    expect(seule.texte).not.toContain("TOTAL À PAYER");
  });
  it("vouvoie le client", () => {
    for (const c of [courrielDeConfirmation(commande), courrielDeConnexion({ site: "Courses Express", lien: "https://exemple.test/x", minutes: 30 })]) {
      expect(`${c.sujet}\n${c.texte}`).not.toMatch(/\b(tu|ta|ton|tes|toi|te)\b/i);
    }
  });
  it("sans espace client ni WhatsApp : pas de bloc ni de lien correspondants", () => {
    const c = courrielDeConfirmation({ ...commande, lienEspace: null, lienWhatsapp: null, lienPaiement: null });
    expect(c.html).not.toContain("Ouvrir mon espace");
    expect(c.html).not.toContain("wa.me");
  });
  it("supplément horaire et frais regroupés : les mêmes lignes que sur le site", () => {
    const totaux = { sousTotal: 1680, majoration: 168, fraisService: 1500, fraisLivraison: 5000, pourboire: 0, total: 8348 };
    const p = { regroupes: true, express: false, tarifNom: "Fin de soirée", majorationPct: 10, ville: "Netanya" };
    expect(lignesDeMontants(totaux, p)).toEqual([
      { libelle: "Articles", montant: 1680 },
      { libelle: "Supplément fin de soirée (+10 %)", montant: 168 },
      { libelle: "Frais de service (livraison comprise) · Netanya", montant: 6500 },
    ]);
    const html = sansInsecable(courrielDeConfirmation({ ...commande, totaux, presentation: p }).html);
    expect(html).toContain("Supplément fin de soirée (+10 %)");
    expect(html).toContain("65,00 ₪");
  });
});

describe("autres e-mails", () => {
  it("avis au gérant : client, total, lien vers la commande", () => {
    const c = courrielNouvelleCommande({ ...commande, lienAdmin: "https://exemple.test/admin/commandes/1" });
    expect(sansInsecable(c.sujet)).toBe("Nouvelle commande n°42 (SC-45240) — Herzliya, demain 20:00 – 21:00 — 234,70 ₪");
    expect(c.html).toContain("Sarah Cohen");
    expect(c.html).toContain('href="https://exemple.test/admin/commandes/1"');
  });
  it("lien de connexion", () => {
    const c = courrielDeConnexion({ site: "Courses Express", lien: "https://exemple.test/compte/acces?jeton=a.b.c", minutes: 30 });
    expect(c.html).toContain('href="https://exemple.test/compte/acces?jeton=a.b.c"');
    expect(c.html).toContain("30 minutes");
    expect(c.texte).toContain("https://exemple.test/compte/acces?jeton=a.b.c");
  });
  it("logo : une image à côté du nom quand son adresse est fournie, le nom seul sinon", () => {
    expect(adresseDuLogo("https://exemple.test/")).toBe("https://exemple.test/logo/tourist-order-sigle-clair.png");
    const logo = adresseDuLogo("https://exemple.test");
    for (const html of [
      courrielDeConfirmation({ ...commande, logo }).html,
      courrielNouvelleCommande({ ...commande, logo, lienAdmin: "https://exemple.test/admin/commandes/1" }).html,
      courrielDeConnexion({ site: "Courses Express", logo, lien: "https://exemple.test/x", minutes: 30 }).html,
    ]) {
      // Taille fixée et aucun texte de remplacement : une messagerie qui bloque les images n'affiche que le nom.
      expect(html).toContain(`<img src="${logo}" width="36" height="36" alt=""`);
      expect(html.match(/<img /g)).toHaveLength(1);
      expect(html).toContain(">Courses Express</td>");
    }
    const sans = courrielDeConfirmation(commande);
    expect(sans.html).not.toContain("<img");
    expect(sans.html).toContain(">Courses Express</span>");
    // Le texte brut ne change pas.
    expect(courrielDeConfirmation({ ...commande, logo }).texte).toBe(sans.texte);
  });
  it("logo : son adresse est rendue inoffensive comme tout texte externe", () => {
    const html = courrielDeConnexion({ site: "Courses Express", logo: 'https://x.test/a.png" onerror="alert(1)', lien: "https://exemple.test/x", minutes: 30 }).html;
    expect(html).not.toContain('onerror="alert');
    expect(html).toContain("&quot; onerror=&quot;");
  });
});

describe("tableau de bord du client", () => {
  const ligne = (produitId: string | null, quantite: number, indisponible = false) => ({ produitId, nom: "x", quantite, indisponible });
  const commandes = [
    { statut: "LIVREE", total: 10000, createdAt: new Date(), lignes: [ligne("eau", 2), ligne("couches", 1)] },
    { statut: "RECUE", total: 5000, createdAt: new Date(), lignes: [ligne("eau", 3), ligne("lait", 1, true)] },
    { statut: "ANNULEE", total: 9999, createdAt: new Date(), lignes: [ligne("lait", 10)] },
  ];
  it("commandes, en cours, articles ; « dépensé » = livrées seulement", () => {
    expect(resumeDuClient(commandes)).toEqual({ commandes: 2, enCours: 1, depense: 10000, articles: 6 });
    expect(resumeDuClient([])).toEqual({ commandes: 0, enCours: 0, depense: 0, articles: 0 });
  });
  it("articles préférés : par quantité, sans les annulées ni les indisponibles", () => {
    expect(produitsPreferes(commandes)).toEqual(["eau", "couches"]);
    expect(produitsPreferes(commandes, 1)).toEqual(["eau"]);
  });
});

describe("commander à nouveau", () => {
  it("retrouve le choix d'options depuis le libellé d'une ligne", () => {
    expect(selectionDepuisLibelle("Taille : 4 ans · Couleur : Bleu")).toEqual({ Taille: "4 ans", Couleur: "Bleu" });
    expect(selectionDepuisLibelle("")).toBeUndefined();
    expect(selectionDepuisLibelle("n'importe quoi")).toBeUndefined();
  });
  it("le choix retrouvé est revérifié contre les options d'aujourd'hui", () => {
    const options = [{ nom: "Taille", choix: [{ libelle: "4 ans", supplement: 0 }, { libelle: "8 ans", supplement: 1000 }] }];
    expect(resoudreSelection(options, selectionDepuisLibelle("Taille : 8 ans"))).toEqual({ ok: true, supplement: 1000, libelle: "Taille : 8 ans" });
    expect(resoudreSelection(options, selectionDepuisLibelle("Taille : 12 ans")).ok).toBe(false); // taille retirée depuis
    expect(resoudreSelection([], selectionDepuisLibelle("Taille : 4 ans")).ok).toBe(false); // le produit n'a plus d'options
  });
});

describe("envoi : l'adresse de réponse", () => {
  const courriel = { a: "sarah@exemple.test", sujet: "Ta commande n°12", html: "<p>Merci</p>", texte: "Merci" };
  const expediteur = "Tourist Order <commandes@touristorder.com>";

  it("sans EMAIL_REPONSE : pas d'en-tête de réponse", () => {
    expect(adresseDeReponse({})).toBeUndefined();
    expect(corpsPourResend(courriel, expediteur, {})).toEqual({
      from: expediteur, to: ["sarah@exemple.test"], subject: "Ta commande n°12", html: "<p>Merci</p>", text: "Merci",
    });
  });

  it("avec EMAIL_REPONSE : le client qui répond écrit à cette adresse", () => {
    const corps = corpsPourResend(courriel, expediteur, { EMAIL_REPONSE: "  contact@touristorder.com " });
    expect(corps.reply_to).toBe("contact@touristorder.com");
    expect(corps.from).toBe(expediteur);
  });

  it("une valeur qui n'est pas une adresse est ignorée (jamais d'en-tête injecté)", () => {
    for (const valeur of ["", "pas une adresse", "a@b", "a@b.c, autre@d.e", "a@b.c\nBcc: x@y.z", "<a@b.c>", "x".repeat(250) + "@exemple.test"]) {
      expect(adresseDeReponse({ EMAIL_REPONSE: valeur }), valeur).toBeUndefined();
    }
  });
});
