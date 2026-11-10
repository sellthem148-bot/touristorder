import { describe, expect, it } from "vitest";
import { cleDeVariante, lireGroupes, lireOptionsSaisies, optionsEnTexte, resoudreSelection } from "@/lib/options";
import { calculerTotaux } from "@/lib/calcul";
import { commandeSchema, regrouperLignes } from "@/lib/validation";
import { produitSchema, reglagesSchema } from "@/lib/admin-schemas";
import { statistiques } from "@/lib/statistiques";

describe("options d'un produit", () => {
  it("lit la saisie de l'admin, suppléments compris", () => {
    const r = lireOptionsSaisies("Taille : 2 ans | 4 ans | 8 ans +10\nCouleur : Bleu | Rose +2,50");
    expect(r).toEqual({
      ok: true,
      groupes: [
        { nom: "Taille", choix: [{ libelle: "2 ans", supplement: 0 }, { libelle: "4 ans", supplement: 0 }, { libelle: "8 ans", supplement: 1000 }] },
        { nom: "Couleur", choix: [{ libelle: "Bleu", supplement: 0 }, { libelle: "Rose", supplement: 250 }] },
      ],
    });
  });
  it("un champ vide = pas d'options ; aller-retour texte ↔ options", () => {
    expect(lireOptionsSaisies("  \n ")).toEqual({ ok: true, groupes: [] });
    const r = lireOptionsSaisies("Taille : S | M | L +5");
    expect(r.ok && lireOptionsSaisies(optionsEnTexte(r.groupes))).toEqual(r);
  });
  it("refuse une saisie mal formée", () => {
    expect(lireOptionsSaisies("Taille S M L").ok).toBe(false);
    expect(lireOptionsSaisies("Taille :").ok).toBe(false);
    expect(lireOptionsSaisies("Taille : S | S").ok).toBe(false);
    expect(lireOptionsSaisies("Taille : S\ntaille : M").ok).toBe(false);
    expect(lireOptionsSaisies("A : 1\nB : 1\nC : 1\nD : 1\nE : 1").ok).toBe(false);
  });
  it("une colonne JSON abîmée vaut « pas d'options »", () => {
    expect(lireGroupes(null)).toEqual([]);
    expect(lireGroupes([{ nom: "Taille" }])).toEqual([]);
    expect(lireGroupes("n'importe quoi")).toEqual([]);
  });
  it("le choix du client : une valeur existante par groupe, rien d'autre", () => {
    const lu = lireOptionsSaisies("Taille : 4 ans | 8 ans +10\nCouleur : Bleu | Rose");
    if (!lu.ok) throw new Error(lu.erreur);
    const g = lu.groupes;
    expect(resoudreSelection(g, { Taille: "8 ans", Couleur: "Rose" })).toEqual({ ok: true, supplement: 1000, libelle: "Taille : 8 ans · Couleur : Rose" });
    expect(resoudreSelection(g, { Taille: "8 ans" }).ok).toBe(false); // couleur manquante
    expect(resoudreSelection(g, { Taille: "12 ans", Couleur: "Rose" }).ok).toBe(false); // inexistante
    expect(resoudreSelection(g, { Taille: "8 ans", Couleur: "Rose", Prix: "0" }).ok).toBe(false); // groupe inventé
    expect(resoudreSelection([], undefined)).toEqual({ ok: true, supplement: 0, libelle: "" });
    expect(resoudreSelection([], { Taille: "x" }).ok).toBe(false);
  });
  it("deux fois la même variante = une seule ligne, quel que soit l'ordre", () => {
    expect(cleDeVariante("p", { b: "1", a: "2" })).toBe(cleDeVariante("p", { a: "2", b: "1" }));
    expect(cleDeVariante("p", { a: "1" })).not.toBe(cleDeVariante("p", { a: "2" }));
    expect(cleDeVariante("p", undefined)).toBe("p");
    expect(
      regrouperLignes([
        { produitId: "p", quantite: 1, options: { Taille: "4" } },
        { produitId: "p", quantite: 2, options: { Taille: "4" } },
        { produitId: "p", quantite: 1, options: { Taille: "5" } },
      ]),
    ).toEqual([
      { produitId: "p", quantite: 3, options: { Taille: "4" } },
      { produitId: "p", quantite: 1, options: { Taille: "5" } },
    ]);
  });
});

describe("pourboire et express", () => {
  it("le pourboire s'ajoute au total, et disparaît si tout est indisponible", () => {
    expect(calculerTotaux([{ prixUnitaire: 1000, quantite: 1 }], { fraisService: 500, fraisLivraison: 3000, pourboire: 1000 }).total).toBe(5500);
    expect(calculerTotaux([{ prixUnitaire: 1000, quantite: 1, indisponible: true }], { fraisService: 500, fraisLivraison: 3000, pourboire: 1000 }).total).toBe(0);
  });
  it("le formulaire de commande exige un choix de remplacement valide", () => {
    const base = {
      nomClient: "Sarah", telephone: "+33612345678", ville: "Tel Aviv", adresse: "Hôtel Dan 512",
      dateLivraison: "2026-11-10", creneau: "Dès que possible", lignes: [{ produitId: "a", quantite: 1 }],
    };
    expect(commandeSchema.safeParse({ ...base, remplacement: "EQUIVALENT" }).success).toBe(true);
    expect(commandeSchema.safeParse({ ...base, remplacement: "N_IMPORTE_QUOI" }).success).toBe(false);
    expect(commandeSchema.safeParse({ ...base, remplacement: "CONTACTER", pourboire: -5 }).success).toBe(false);
  });
});

describe("formulaires admin (nouveaux champs)", () => {
  const produit = {
    nom: "Maillot", description: "", prix: "89,90", prixAchat: "", prixBarre: "", categorieId: "c", boutique: "", lienWolt: "",
    ordre: "", actif: true, epuise: false, badge: "", options: "",
  };
  it("prix barré : seulement s'il est plus cher", () => {
    expect(produitSchema.safeParse({ ...produit, prixBarre: "99,90" }).success).toBe(true);
    expect(produitSchema.safeParse({ ...produit, prixBarre: "80" }).success).toBe(false);
  });
  it("badge connu seulement, options lues", () => {
    expect(produitSchema.safeParse({ ...produit, badge: "promo" }).success).toBe(true);
    expect(produitSchema.safeParse({ ...produit, badge: "<script>" }).success).toBe(false);
    const r = produitSchema.parse({ ...produit, options: "Taille : 4 ans | 6 ans" });
    expect(r.options).toHaveLength(1);
    expect(produitSchema.safeParse({ ...produit, options: "Taille sans deux-points" }).success).toBe(false);
  });
  it("réglages : pourboires (espaces, décimales à la virgule), paiements facultatifs", () => {
    const r = reglagesSchema.parse({
      fraisService: "15", fraisLivraison: "30", fraisExpress: "20", minimumCommande: "",
      pourboires: "20 10 12,50 10", paiements: "", creneaux: "Dès que possible",
      whatsapp: "", messageAccueil: "", ouvert: true, fraisRegroupes: true, joursLivres: ["1"], delaiPreparation: "",
    });
    expect(r.pourboires).toEqual([1000, 1250, 2000]);
    expect(r.paiements).toEqual([]);
    expect(r.fraisExpress).toBe(2000);
  });
});

describe("statistiques", () => {
  const maintenant = new Date("2026-11-10T12:00:00Z");
  const c = (iso: string, total: number, statut = "LIVREE", achat: number | null = 500) => ({
    createdAt: new Date(iso), statut, total, pourboire: 0, express: false,
    lignes: [{ nom: "Eau", quantite: 2, prixUnitaire: 1000, prixAchatUnitaire: achat, indisponible: false }],
  });
  it("aujourd'hui, 7 jours, annulées exclues, marge", () => {
    const s = statistiques([c("2026-11-10T08:00:00Z", 5000), c("2026-11-08T08:00:00Z", 3000), c("2026-11-10T09:00:00Z", 9999, "ANNULEE")], maintenant);
    expect(s.aujourdhui).toEqual({ commandes: 1, chiffre: 5000, marge: 4000, panierMoyen: 5000 });
    expect(s.semaine.commandes).toBe(2);
    expect(s.annulees).toBe(1);
    expect(s.meilleures[0]).toEqual({ nom: "Eau", quantite: 4, chiffre: 4000 });
    expect(s.parJour).toHaveLength(14);
    expect(s.parJour[13]).toEqual({ jour: "2026-11-10", chiffre: 5000, commandes: 1 });
  });
});
