import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { estReglee, etatDuPaiement, libelleDuSolde, libellePaiement, messageDeReglement, paiementPourLeClient, resteAPayer } from "@/lib/paiement";
import { cellule, csv, derniersMois, exportDesAchats, exportDesVentes, moisValide, montantCsv, type CommandeAExporter } from "@/lib/export";
import { estJetonTelegram, texteDeLAlerte } from "@/lib/telegram";
import { commandeSchema } from "@/lib/validation";
import { ligneLibreSchema } from "@/lib/admin-schemas";

const nbsp = (t: string) => t.replace(/[  ]/g, " ");
const c = (total: number, montantPaye: number, payee: boolean, statut = "RECUE") => ({ total, montantPaye, payeLe: payee ? new Date("2026-11-11T10:00:00Z") : null, statut });

describe("paiement d'une commande (avant les achats)", () => {
  it("pas encore payée : tout le total est à payer, et elle n'est pas réglée", () => {
    const commande = c(17790, 0, false);
    expect(etatDuPaiement(commande)).toEqual({ etat: "A_PAYER", montant: 17790 });
    expect(estReglee(commande)).toBe(false);
    expect(resteAPayer(commande)).toBe(17790);
    expect(nbsp(libelleDuSolde(etatDuPaiement(commande))!)).toBe("Paiement reçu · 177,90 ₪");
  });
  it("payée : réglée, plus rien à faire", () => {
    const commande = c(17790, 17790, true);
    expect(etatDuPaiement(commande)).toEqual({ etat: "PAYEE", montant: 0 });
    expect(estReglee(commande)).toBe(true);
    expect(libelleDuSolde(etatDuPaiement(commande))).toBeNull();
    expect(libellePaiement(etatDuPaiement(commande))).toBe("Payée");
  });
  it("un article ajouté après le paiement : un complément reste dû, la commande n'est plus réglée", () => {
    const commande = c(19790, 17790, true);
    expect(etatDuPaiement(commande)).toEqual({ etat: "COMPLEMENT", montant: 2000 });
    expect(estReglee(commande)).toBe(false);
    expect(nbsp(libellePaiement(etatDuPaiement(commande)))).toBe("Reste 20,00 ₪");
  });
  it("un article indisponible après le paiement : la différence est à rembourser, la commande reste réglée", () => {
    const commande = c(15790, 17790, true);
    expect(etatDuPaiement(commande)).toEqual({ etat: "A_REMBOURSER", montant: 2000 });
    expect(estReglee(commande)).toBe(true);
    expect(resteAPayer(commande)).toBe(0);
  });
  it("annulée : rien n'est dû ; ce qui a été payé est à rembourser en entier", () => {
    expect(etatDuPaiement(c(17790, 0, false, "ANNULEE"))).toEqual({ etat: "RIEN", montant: 0 });
    expect(etatDuPaiement(c(17790, 17790, true, "ANNULEE"))).toEqual({ etat: "A_REMBOURSER", montant: 17790 });
  });
  it("demande hors catalogue sans article : rien à régler tant que le gérant n'a pas chiffré", () => {
    const commande = c(0, 0, false);
    expect(etatDuPaiement(commande)).toEqual({ etat: "RIEN", montant: 0 });
    // Rien à acheter sur Wolt non plus : elle n'entre pas dans la liste de courses.
    expect(estReglee(commande)).toBe(false);
    expect(paiementPourLeClient(etatDuPaiement(commande), "Bit")).toBeNull();
  });
  it("ce que lit le client : attente avec le mode, reçu, remboursement — toujours au vouvoiement", () => {
    const attente = paiementPourLeClient({ etat: "A_PAYER", montant: 17790 }, "Bit")!;
    expect(attente.ton).toBe("attente");
    expect(nbsp(attente.titre)).toBe("Paiement en attente · 177,90 ₪");
    expect(attente.texte).toContain("par Bit");
    expect(attente.texte).toContain("WhatsApp");
    expect(paiementPourLeClient({ etat: "PAYEE", montant: 0 }, "Bit")!.ton).toBe("recu");
    expect(nbsp(paiementPourLeClient({ etat: "A_REMBOURSER", montant: 2000 }, "")!.titre)).toBe("Remboursement à venir · 20,00 ₪");
    for (const e of [{ etat: "A_PAYER", montant: 1 }, { etat: "COMPLEMENT", montant: 1 }, { etat: "PAYEE", montant: 0 }, { etat: "A_REMBOURSER", montant: 1 }] as const) {
      const p = paiementPourLeClient(e, "Virement")!;
      expect(`${p.titre} ${p.texte}`).not.toMatch(/\b(tu|ta|ton|tes|toi|te)\b/i);
    }
  });
  it("le message du client pour régler : numéro, montant, mode", () => {
    expect(nbsp(messageDeReglement({ numero: 42, montant: 17790, mode: "PayBox", site: "Tourist Order" }))).toBe(
      "Bonjour ! Je souhaite régler ma commande n°42 sur Tourist Order (177,90 ₪) par PayBox.",
    );
  });
});

describe("demande d'article hors catalogue", () => {
  const base = {
    nomClient: "Sarah Cohen", telephone: "+33 6 12 34 56 78", email: "sarah@exemple.fr", ville: "Netanya", adresse: "Hôtel Dan", etage: "1", appartement: "5",
    dateLivraison: "2026-11-12", creneau: "20:00 – 21:00", remplacement: "CONTACTER", paiement: "Bit",
  };
  it("un panier vide n'est accepté qu'avec une demande", () => {
    expect(commandeSchema.safeParse({ ...base, lignes: [] }).success).toBe(false);
    expect(commandeSchema.safeParse({ ...base, lignes: [], demandeLibre: "   " }).success).toBe(false);
    const r = commandeSchema.safeParse({ ...base, lignes: [], demandeLibre: "  1 crème solaire enfant  " });
    expect(r.success).toBe(true);
    expect(r.data?.demandeLibre).toBe("1 crème solaire enfant");
  });
  it("une demande est bornée à 600 caractères, et facultative avec des articles", () => {
    expect(commandeSchema.safeParse({ ...base, lignes: [], demandeLibre: "x".repeat(601) }).success).toBe(false);
    const r = commandeSchema.safeParse({ ...base, lignes: [{ produitId: "abc", quantite: 1 }] });
    expect(r.success).toBe(true);
    expect(r.data?.demandeLibre).toBe("");
  });
  it("article ajouté par le gérant : nom, quantité et prix de vente obligatoires, prix d'achat facultatif", () => {
    const r = ligneLibreSchema.parse({ nom: "  Crème solaire  ", quantite: "2", prix: "59,90", prixAchat: "", boutique: "" });
    expect(r).toEqual({ nom: "Crème solaire", quantite: 2, prix: 5990, prixAchat: null, boutique: "" });
    expect(ligneLibreSchema.parse({ nom: "x", quantite: "1", prix: "10", prixAchat: "8,50", boutique: " Wolt " }).prixAchat).toBe(850);
    for (const mauvais of [
      { nom: "", quantite: "1", prix: "10" }, { nom: "x", quantite: "0", prix: "10" }, { nom: "x", quantite: "51", prix: "10" },
      { nom: "x", quantite: "1,5", prix: "10" }, { nom: "x", quantite: "1", prix: "0" }, { nom: "x", quantite: "1", prix: "abc" },
    ]) {
      expect(ligneLibreSchema.safeParse({ prixAchat: "", boutique: "", ...mauvais }).success, JSON.stringify(mauvais)).toBe(false);
    }
  });
});

describe("export comptable", () => {
  const ligne = (nom: string, quantite: number, prixUnitaire: number, prixAchatUnitaire: number | null, indisponible = false) =>
    ({ nom, options: "", boutique: "Wolt Market", quantite, prixUnitaire, prixAchatUnitaire, indisponible, produit: { nomWolt: "מים" } });
  const commande = (numero: number, statut: CommandeAExporter["statut"], extra: Partial<CommandeAExporter> = {}): CommandeAExporter => ({
    numero, statut, createdAt: new Date("2026-11-10T08:30:00Z"), dateLivraison: "2026-11-12", nomClient: "Sarah Cohen", ville: "Netanya",
    paiement: "Bit", payeLe: new Date("2026-11-10T09:00:00Z"), montantPaye: 6500,
    sousTotal: 2000, majoration: 0, fraisService: 1500, fraisLivraison: 3000, pourboire: 0, total: 6500,
    lignes: [ligne("Eau", 2, 1000, 800), ligne("Pain", 1, 900, 700, true)],
    ...extra,
  });

  it("une cellule qui ressemble à une formule est neutralisée, les guillemets sont doublés", () => {
    expect(cellule("=SOMME(A1)")).toBe(`"'=SOMME(A1)"`);
    expect(cellule("+33 6 12")).toBe(`"'+33 6 12"`);
    expect(cellule("-5")).toBe(`"'-5"`);
    expect(cellule("@nom")).toBe(`"'@nom"`);
    expect(cellule('Hôtel "Dan"; chambre 5')).toBe('"Hôtel ""Dan""; chambre 5"');
    expect(cellule(42)).toBe('"42"');
  });
  it("le fichier : encodage signalé, séparateur « ; », une ligne par rang", () => {
    const f = csv(["A", "B"], [["x", 1], ["y;z", 2]]);
    expect(f.startsWith("﻿")).toBe(true);
    expect(f.slice(1)).toBe('"A";"B"\r\n"x";"1"\r\n"y;z";"2"\r\n');
  });
  it("montants à virgule, mois valides, douze derniers mois", () => {
    expect(montantCsv(17790)).toBe("177,90");
    expect(montantCsv(0)).toBe("0,00");
    expect(montantCsv(null)).toBe("");
    expect(moisValide("2026-11")).toBe("2026-11");
    expect(moisValide("tout")).toBe("tout");
    for (const mauvais of ["2026-13", "2026-1", "11-2026", "", null, "2026-11-01", "' OR 1=1"]) expect(moisValide(mauvais), String(mauvais)).toBeNull();
    const mois = derniersMois("2026-01-15", 3);
    expect(mois).toEqual([
      { valeur: "2026-01", libelle: "Janvier 2026" },
      { valeur: "2025-12", libelle: "Décembre 2025" },
      { valeur: "2025-11", libelle: "Novembre 2025" },
    ]);
  });
  it("ventes : une ligne par commande, avec ce qui est encaissé, dû, à rembourser, et la marge", () => {
    const f = exportDesVentes([commande(1, "LIVREE"), commande(2, "RECUE", { montantPaye: 0, payeLe: null }), commande(3, "ANNULEE")]);
    const rangs = f.slice(1).trim().split("\r\n");
    expect(rangs).toHaveLength(4);
    expect(rangs[0]).toContain('"N° commande";"Commandée le";"Livraison";"Client"');
    // Payée et livrée : 65 encaissés, achats 16 (l'article indisponible ne compte pas), marge 49.
    expect(rangs[1]).toContain('"1";"10/11/2026 10:30";"12/11/2026";"Sarah Cohen";"Netanya";"Livrée";"Bit";"10/11/2026 11:00"');
    expect(rangs[1].endsWith('"65,00";"65,00";"0,00";"0,00";"16,00";"49,00"')).toBe(true);
    // Pas encore payée : tout reste à recevoir.
    expect(rangs[2].endsWith('"65,00";"0,00";"65,00";"0,00";"16,00";"49,00"')).toBe(true);
    // Annulée après paiement : tout est à rembourser, rien n'a été acheté.
    expect(rangs[3]).toContain('"Annulée"');
    expect(rangs[3].endsWith('"65,00";"65,00";"0,00";"65,00";"0,00";"0,00"')).toBe(true);
  });
  it("achats Wolt : seulement les articles réellement achetés (commande passée sur Wolt, article disponible)", () => {
    const f = exportDesAchats([commande(1, "LIVREE"), commande(2, "RECUE"), commande(3, "ANNULEE"), commande(4, "COMMANDEE", { lignes: [ligne("Lait", 3, 700, null)] })]);
    const rangs = f.slice(1).trim().split("\r\n");
    expect(rangs).toHaveLength(3);
    expect(rangs[1]).toBe('"12/11/2026";"1";"Wolt Market";"Eau";"מים";"";"2";"8,00";"16,00";"10,00";"20,00"');
    // Sans prix d'achat connu : les cellules d'achat restent vides plutôt que fausses.
    expect(rangs[2]).toBe('"12/11/2026";"4";"Wolt Market";"Lait";"מים";"";"3";"";"";"7,00";"21,00"');
  });
});

describe("alerte Telegram", () => {
  it("reconnaît la forme d'un jeton de robot", () => {
    expect(estJetonTelegram("123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw")).toBe(true);
    for (const mauvais of ["", "123456789", "abc:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw", "123456789:court", "123456789:AAHdqTcvCH1vGWJxfSeofSAs0K5PALDsaw/../x"]) {
      expect(estJetonTelegram(mauvais), mauvais).toBe(false);
    }
  });
  it("le texte : numéro, client, créneau, montant à recevoir, demande hors catalogue, lien", () => {
    const base = { numero: 42, nomClient: "Sarah Cohen", ville: "Netanya", jour: "Demain", creneau: "20:00 – 21:00", total: 17790, paiement: "Bit", lienAdmin: "https://x.test/admin/commandes/abc" };
    expect(nbsp(texteDeLAlerte({ ...base, nombreArticles: 3, demandeLibre: "" }))).toBe(
      "Nouvelle commande n°42\nSarah Cohen · Netanya\nDemain, 20:00 – 21:00\n3 articles · 177,90 ₪ à recevoir (Bit)\nhttps://x.test/admin/commandes/abc",
    );
    const demande = texteDeLAlerte({ ...base, total: 0, nombreArticles: 0, demandeLibre: "1 crème\nsolaire   enfant" });
    expect(demande).toContain("Aucun article du catalogue");
    expect(demande).toContain("Demande hors catalogue : 1 crème solaire enfant");
    expect(texteDeLAlerte({ ...base, nombreArticles: 1, demandeLibre: "x".repeat(500) }).length).toBeLessThan(500);
  });
});

describe("ce qui reste privé", () => {
  // Les coordonnées de paiement ne sont données que sur WhatsApp, par le gérant ; le jeton Telegram est un secret.
  const fichiers = (dossier: string): string[] =>
    readdirSync(dossier).flatMap((nom) => {
      const chemin = join(dossier, nom);
      return statSync(chemin).isDirectory() ? fichiers(chemin) : /\.(ts|tsx)$/.test(nom) ? [chemin] : [];
    });
  const racine = process.cwd();

  it("aucune page publique ni composant du site ne lit les coordonnées de paiement ou le jeton Telegram", () => {
    const publics = [...fichiers(join(racine, "app", "(boutique)")), ...fichiers(join(racine, "components")).filter((f) => !f.includes(`${join("components", "admin")}`))];
    expect(publics.length).toBeGreaterThan(20);
    for (const f of publics) {
      const source = readFileSync(f, "utf8");
      expect(source, f).not.toMatch(/coordonneesPaiement|telegramJeton|telegramDiscussion/);
    }
  });
  it("les réglages publics ne les contiennent pas", () => {
    const source = readFileSync(join(racine, "lib", "reglages.ts"), "utf8");
    const publics = source.slice(source.indexOf("export async function reglagesPublics"), source.indexOf("export type ReglagesPublics"));
    expect(publics).toContain("paiements: r.paiements");
    expect(publics).not.toMatch(/coordonneesPaiement|telegram/);
    const legales = source.slice(source.indexOf("export async function infosLegales"));
    expect(legales.slice(0, legales.indexOf("\n}\n"))).not.toMatch(/coordonneesPaiement|telegram/);
  });
  it("les e-mails ne portent jamais les coordonnées de paiement", () => {
    expect(readFileSync(join(racine, "lib", "courriels.ts"), "utf8")).not.toMatch(/coordonneesPaiement|coordonnees\b/);
    expect(readFileSync(join(racine, "lib", "commande-courriels.ts"), "utf8")).not.toContain("coordonneesPaiement");
  });
});
