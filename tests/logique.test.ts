import { describe, expect, it } from "vitest";
import { formatPrix, lirePrix, prixPourChamp } from "@/lib/argent";
import { calculerTotaux, margeEstimee } from "@/lib/calcul";
import { ajouterJours, jourEnIsrael, joursProposes, libelleDuJour } from "@/lib/dates";
import { lienWhatsapp, numeroPourWhatsapp } from "@/lib/whatsapp";
import { slugDe } from "@/lib/slug";
import { typeDImage } from "@/lib/image";
import { commandeSchema, regrouperLignes } from "@/lib/validation";
import { produitSchema, reglagesSchema } from "@/lib/admin-schemas";
import { autoriser, reinitialiserLimites } from "@/lib/limite";
import { messagePourLeClient } from "@/lib/messages-client";

const nbsp = (s: string) => s.replace(/[  ]/g, " ");

describe("argent (agorot)", () => {
  it("formate en shekels à la française", () => {
    expect(nbsp(formatPrix(1290))).toBe("12,90 ₪");
    expect(nbsp(formatPrix(123456))).toBe("1 234,56 ₪");
  });
  it("lit un champ saisi", () => {
    expect(lirePrix("12,90")).toBe(1290);
    expect(lirePrix("12.9")).toBe(1290);
    expect(lirePrix(" 15 ₪")).toBe(1500);
    expect(lirePrix("0,1")).toBe(10);
    expect(lirePrix("abc")).toBeNull();
    expect(lirePrix("-3")).toBeNull();
    expect(lirePrix("1,234")).toBeNull();
    expect(lirePrix("")).toBeNull();
  });
  it("aller-retour champ ↔ agorot sans erreur de virgule flottante", () => {
    for (const a of [1, 10, 99, 1290, 4999, 19990, 100000]) expect(lirePrix(prixPourChamp(a))).toBe(a);
    expect(lirePrix("0,29")).toBe(29);
    expect(lirePrix("4,35")).toBe(435);
  });
});

describe("calcul d'une commande", () => {
  const frais = { fraisService: 1500, fraisLivraison: 3000 };
  it("additionne articles et frais", () => {
    const t = calculerTotaux([{ prixUnitaire: 990, quantite: 2 }, { prixUnitaire: 2490, quantite: 1 }], frais);
    expect(t).toEqual({ sousTotal: 4470, majoration: 0, fraisService: 1500, fraisLivraison: 3000, pourboire: 0, total: 8970 });
  });
  it("n'inclut pas les articles indisponibles", () => {
    const t = calculerTotaux([{ prixUnitaire: 990, quantite: 2 }, { prixUnitaire: 2490, quantite: 1, indisponible: true }], frais);
    expect(t.sousTotal).toBe(1980);
    expect(t.total).toBe(6480);
  });
  it("une commande entièrement indisponible ne coûte rien", () => {
    const t = calculerTotaux([{ prixUnitaire: 990, quantite: 2, indisponible: true }], frais);
    expect(t.total).toBe(0);
  });
  it("estime la marge, et signale un prix d'achat manquant", () => {
    const lignes = [
      { prixUnitaire: 1000, quantite: 2, prixAchatUnitaire: 800 },
      { prixUnitaire: 500, quantite: 1, prixAchatUnitaire: null },
    ];
    const t = calculerTotaux(lignes, frais);
    const m = margeEstimee(lignes, t);
    expect(m.cout).toBe(1600);
    expect(m.marge).toBe(t.total - 1600);
    expect(m.complete).toBe(false);
  });
});

describe("dates (jour israélien)", () => {
  it("le jour en Israël diffère du jour UTC le soir", () => {
    // 22:30 UTC le 10 novembre = 00:30 le 11 en Israël (UTC+2 en hiver).
    expect(jourEnIsrael(new Date("2026-11-10T22:30:00Z"))).toBe("2026-11-11");
  });
  it("ajoute des jours sans fuseau", () => {
    expect(ajouterJours("2026-02-28", 1)).toBe("2026-03-01");
    expect(ajouterJours("2026-12-31", 1)).toBe("2027-01-01");
  });
  it("propose aujourd'hui et les jours suivants", () => {
    const jours = joursProposes(3, new Date("2026-11-10T10:00:00Z"));
    expect(jours).toEqual(["2026-11-10", "2026-11-11", "2026-11-12"]);
  });
  it("nomme les jours", () => {
    const m = new Date("2026-11-10T10:00:00Z");
    expect(libelleDuJour("2026-11-10", m)).toBe("Aujourd'hui");
    expect(libelleDuJour("2026-11-11", m)).toBe("Demain");
    expect(libelleDuJour("2026-11-13", m)).toBe("Vendredi 13 novembre");
  });
});

describe("whatsapp", () => {
  it("normalise les numéros", () => {
    expect(numeroPourWhatsapp("+33 6 12 34 56 78")).toBe("33612345678");
    expect(numeroPourWhatsapp("06 12 34 56 78")).toBe("33612345678");
    expect(numeroPourWhatsapp("054-123-4567")).toBe("972541234567");
    expect(numeroPourWhatsapp("0033612345678")).toBe("33612345678");
  });
  it("construit un lien, ou rien pour un numéro vide", () => {
    expect(lienWhatsapp("+972501234567", "Bonjour & merci")).toBe("https://wa.me/972501234567?text=Bonjour%20%26%20merci");
    expect(lienWhatsapp("", "x")).toBeNull();
  });
  it("le message « en livraison » annonce le montant à régler", () => {
    const m = messagePourLeClient("EN_LIVRAISON", { prenom: "Sarah", numero: 12, total: 8970, lienSuivi: "https://x/suivi/a", site: "Site" });
    expect(nbsp(m)).toContain("89,70 ₪");
    expect(m).toContain("n°12");
  });
});

describe("divers", () => {
  it("slug", () => {
    expect(slugDe("Bébé & enfants")).toBe("bebe-enfants");
    expect(slugDe("Chargeurs & électronique")).toBe("chargeurs-electronique");
    expect(slugDe("🎁")).toBe("categorie");
  });
  it("reconnaît une image à ses octets, pas à son nom", () => {
    expect(typeDImage(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))?.mime).toBe("image/jpeg");
    expect(typeDImage(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))?.mime).toBe("image/png");
    expect(typeDImage(new TextEncoder().encode("RIFF1234WEBPVP8 "))?.mime).toBe("image/webp");
    expect(typeDImage(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
  });
  it("limiteur", () => {
    reinitialiserLimites();
    const t = 1_000_000;
    expect(autoriser("k", 2, 1000, t)).toBe(true);
    expect(autoriser("k", 2, 1000, t)).toBe(true);
    expect(autoriser("k", 2, 1000, t)).toBe(false);
    expect(autoriser("k", 2, 1000, t + 1001)).toBe(true);
  });
});

describe("validation d'une commande", () => {
  const base = {
    nomClient: "  Sarah Cohen ",
    telephone: "+33 6 12 34 56 78",
    ville: "Tel Aviv",
    adresse: "Hôtel Dan, chambre 512",
    dateLivraison: "2026-11-10",
    creneau: "Dès que possible",
    notes: "",
    remplacement: "CONTACTER",
    lignes: [{ produitId: "abc", quantite: 2 }],
  };
  it("accepte une commande correcte (et nettoie les espaces)", () => {
    const r = commandeSchema.safeParse(base);
    expect(r.success).toBe(true);
    expect(r.data?.nomClient).toBe("Sarah Cohen");
  });
  it("refuse un panier vide, une quantité folle, un prix envoyé par le navigateur ignoré", () => {
    expect(commandeSchema.safeParse({ ...base, lignes: [] }).success).toBe(false);
    expect(commandeSchema.safeParse({ ...base, lignes: [{ produitId: "a", quantite: 999 }] }).success).toBe(false);
    expect(commandeSchema.safeParse({ ...base, lignes: [{ produitId: "a", quantite: 1.5 }] }).success).toBe(false);
    const avecPrix = commandeSchema.safeParse({ ...base, lignes: [{ produitId: "a", quantite: 1, prix: 1 }] });
    expect(avecPrix.success && "prix" in avecPrix.data.lignes[0]).toBe(false);
  });
  it("refuse un téléphone illisible", () => {
    expect(commandeSchema.safeParse({ ...base, telephone: "abc" }).success).toBe(false);
    expect(commandeSchema.safeParse({ ...base, telephone: "123" }).success).toBe(false);
  });
  it("regroupe les doublons", () => {
    expect(regrouperLignes([{ produitId: "a", quantite: 2 }, { produitId: "a", quantite: 3 }, { produitId: "b", quantite: 1 }])).toEqual([
      { produitId: "a", quantite: 5 },
      { produitId: "b", quantite: 1 },
    ]);
  });
});

describe("formulaires admin", () => {
  const produit = {
    nom: "Chargeur", description: "", prix: "49,90", prixAchat: "", prixBarre: "", categorieId: "c1", boutique: "", lienWolt: "",
    ordre: "", actif: true, epuise: false, badge: "", options: "",
  };
  it("produit : prix en agorot, prix d'achat facultatif", () => {
    const r = produitSchema.parse(produit);
    expect(r.prix).toBe(4990);
    expect(r.prixAchat).toBeNull();
    expect(r.ordre).toBe(0);
  });
  it("produit : refuse un prix nul et un lien non https", () => {
    expect(produitSchema.safeParse({ ...produit, prix: "0" }).success).toBe(false);
    expect(produitSchema.safeParse({ ...produit, lienWolt: "javascript:alert(1)" }).success).toBe(false);
  });
  it("réglages : listes nettoyées", () => {
    const r = reglagesSchema.parse({
      fraisService: "15", fraisLivraison: "30", fraisExpress: "", minimumCommande: "", pourboires: "", paiements: "Espèces",
      villes: "Tel Aviv\n\n Netanya \nTel Aviv", creneaux: "Dès que possible",
      whatsapp: "+972 50 123 4567", messageAccueil: "", ouvert: true, fraisRegroupes: false,
    });
    expect(r.villes).toEqual(["Tel Aviv", "Netanya"]);
    expect(r.fraisService).toBe(1500);
    expect(r.minimumCommande).toBe(0);
  });
});
