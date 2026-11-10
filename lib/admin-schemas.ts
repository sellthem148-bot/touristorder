import { z } from "zod";
import { lirePrix } from "./argent";

const prixObligatoire = z
  .string()
  .transform((t, ctx) => {
    const p = lirePrix(t);
    if (p == null || p <= 0) {
      ctx.addIssue({ code: "custom", message: "Prix invalide (ex. 12,90)." });
      return z.NEVER;
    }
    return p;
  });

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
  prix: prixObligatoire,
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
});

export const categorieSchema = z.object({
  nom: z.string().trim().min(2, { error: "Nom trop court." }).max(60, { error: "60 caractères maximum." }),
  emoji: z.string().trim().max(16).transform((e) => e || "🛍️"),
  ordre: entier(0, 9999),
  active: z.boolean(),
});

const lignes = (max: number, longueur: number) =>
  z.string().transform((t, ctx) => {
    const liste = [...new Set(t.split("\n").map((l) => l.trim()).filter(Boolean))];
    if (liste.length === 0) {
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
  minimumCommande: prixOuZero,
  villes: lignes(40, 60),
  creneaux: lignes(20, 60),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .refine((t) => t === "" || /^\+?[\d\s().-]{8,30}$/.test(t), { error: "Numéro invalide (ex. +972 50 123 4567)." }),
  messageAccueil: z.string().trim().max(300, { error: "300 caractères maximum." }),
  ouvert: z.boolean(),
});
