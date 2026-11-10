import { z } from "zod";
import { lirePrix } from "./argent";
import { lireOptionsSaisies } from "./options";
import { BADGES } from "./choix-commande";

const prixFacultatif = z.string().transform((t, ctx) => {
  if (t.trim() === "") return null;
  const p = lirePrix(t);
  if (p == null) {
    ctx.addIssue({ code: "custom", message: "Prix invalide (ex. 9,50)." });
    return z.NEVER;
  }
  return p;
});

const prixOuZero = z.string().transform((t, ctx) => {
  if (t.trim() === "") return 0;
  const p = lirePrix(t);
  if (p == null) {
    ctx.addIssue({ code: "custom", message: "Montant invalide (ex. 15 ou 15,00)." });
    return z.NEVER;
  }
  return p;
});

const entier = (min: number, max: number) =>
  z.string().transform((t, ctx) => {
    const n = t.trim() === "" ? 0 : Number(t);
    if (!Number.isInteger(n) || n < min || n > max) {
      ctx.addIssue({ code: "custom", message: `Nombre entier entre ${min} et ${max}.` });
      return z.NEVER;
    }
    return n;
  });

export const produitSchema = z.object({
  nom: z.string().trim().min(2, { error: "Nom trop court." }).max(120, { error: "120 caractères maximum." }),
  description: z.string().trim().max(1000, { error: "1000 caractères maximum." }),
  // Vide = « à définir » : l'article reste masqué tant qu'il n'a pas de prix.
  prix: prixOuZero,
  prixAchat: prixFacultatif,
  categorieId: z.string().min(1, { error: "Choisis une catégorie." }).max(40),
  boutique: z.string().trim().max(120, { error: "120 caractères maximum." }),
  lienWolt: z
    .string()
    .trim()
    .max(500, { error: "Lien trop long." })
    .refine((t) => t === "" || /^https:\/\/[^\s]+$/.test(t), { error: "Le lien doit commencer par https://" }),
  ordre: entier(0, 9999),
  actif: z.boolean(),
  epuise: z.boolean(),
  badge: z.enum(["", ...Object.keys(BADGES)] as ["", ...string[]], { error: "Badge inconnu." }),
  prixBarre: prixFacultatif,
  options: z.string().max(3000, { error: "Trop long." }).transform((t, ctx) => {
    const r = lireOptionsSaisies(t);
    if (!r.ok) {
      ctx.addIssue({ code: "custom", message: r.erreur });
      return z.NEVER;
    }
    return r.groupes;
  }),
}).superRefine((p, ctx) => {
  if (p.actif && p.prix === 0) {
    ctx.addIssue({ code: "custom", path: ["prix"], message: "Mets un prix pour mettre l'article en ligne (ou décoche « En ligne »)." });
  }
  if (p.prixBarre != null && p.prixBarre <= p.prix) {
    ctx.addIssue({ code: "custom", path: ["prixBarre"], message: "L'ancien prix doit être plus élevé que le prix de vente." });
  }
});

export const categorieSchema = z.object({
  nom: z.string().trim().min(2, { error: "Nom trop court." }).max(60, { error: "60 caractères maximum." }),
  emoji: z.string().trim().max(16).transform((e) => e || "🛍️"),
  ordre: entier(0, 9999),
  active: z.boolean(),
});

const lignes = (max: number, longueur: number, vide = false) =>
  z.string().transform((t, ctx) => {
    const liste = [...new Set(t.split("\n").map((l) => l.trim()).filter(Boolean))];
    if (liste.length === 0 && !vide) {
      ctx.addIssue({ code: "custom", message: "Au moins une ligne." });
      return z.NEVER;
    }
    if (liste.length > max || liste.some((l) => l.length > longueur)) {
      ctx.addIssue({ code: "custom", message: `${max} lignes de ${longueur} caractères au maximum.` });
      return z.NEVER;
    }
    return liste;
  });

export const reglagesSchema = z.object({
  fraisService: prixOuZero,
  fraisLivraison: prixOuZero,
  fraisExpress: prixOuZero,
  minimumCommande: prixOuZero,
  pourboires: z.string().transform((t, ctx) => {
    const montants: number[] = [];
    for (const morceau of t.split(/[;\s]+/).map((m) => m.trim()).filter(Boolean)) {
      const p = lirePrix(morceau);
      if (p == null) {
        ctx.addIssue({ code: "custom", message: `« ${morceau.slice(0, 20)} » n'est pas un montant.` });
        return z.NEVER;
      }
      if (!montants.includes(p)) montants.push(p);
    }
    if (montants.length > 6) {
      ctx.addIssue({ code: "custom", message: "6 montants au maximum." });
      return z.NEVER;
    }
    return montants.sort((a, b) => a - b);
  }),
  paiements: lignes(8, 40, true),
  villes: lignes(40, 60),
  creneaux: lignes(20, 60),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .refine((t) => t === "" || /^\+?[\d\s().-]{8,30}$/.test(t), { error: "Numéro invalide (ex. +972 50 123 4567)." }),
  messageAccueil: z.string().trim().max(300, { error: "300 caractères maximum." }),
  ouvert: z.boolean(),
  fraisRegroupes: z.boolean(),
});

const heure = z.string().trim().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, { error: "Heure au format HH:MM (ex. 08:00, 21:30)." });

export const plageSchema = z.object({
  nom: z.string().trim().min(2, { error: "Nom trop court." }).max(40, { error: "40 caractères maximum." }),
  jours: z
    .array(z.coerce.number().int().min(0).max(6))
    .min(1, { error: "Coche au moins un jour." })
    .transform((j) => [...new Set(j)].sort((a, b) => a - b)),
  debut: heure,
  fin: heure,
  fraisService: prixOuZero,
  fraisLivraison: prixOuZero,
  fraisExpress: prixOuZero,
  majorationPct: entier(0, 100),
  ordre: entier(0, 999),
  active: z.boolean(),
});
