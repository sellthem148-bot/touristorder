import { z } from "zod";
import { LIGNES_MAX, QUANTITE_MAX } from "./calcul";
import { cleDeVariante, type Selection } from "./options";
import { REMPLACEMENTS } from "./choix-commande";

const texte = (min: number, max: number, message: string) =>
  z.string({ error: message }).trim().min(min, { error: message }).max(max, { error: `${max} caractères maximum.` });

export const telephoneSchema = z
  .string({ error: "Numéro WhatsApp requis." })
  .trim()
  .max(30, { error: "Numéro trop long." })
  .refine((t) => /^[+\d\s().-]+$/.test(t), { error: "Numéro invalide." })
  .refine((t) => {
    const n = t.replace(/\D/g, "").length;
    return n >= 8 && n <= 15;
  }, { error: "Numéro invalide : indiquez-le avec l'indicatif (ex. +33 6 12 34 56 78)." });

/** Une adresse e-mail : nettoyée (espaces, majuscules) AVANT d'être vérifiée, comparée et enregistrée. */
export const emailSchema = z
  .string({ error: "Votre adresse e-mail est requise." })
  .trim()
  .toLowerCase()
  .min(1, { error: "Votre adresse e-mail est requise." })
  .pipe(z.email({ error: "Adresse e-mail invalide." }).max(254, { error: "Adresse e-mail trop longue." }));

export const ligneSchema = z.object({
  produitId: z.string().min(1).max(40),
  quantite: z.number().int().min(1).max(QUANTITE_MAX),
  options: z.record(z.string().max(40), z.string().max(40)).optional(),
});

export const commandeSchema = z.object({
  nomClient: texte(2, 80, "Votre nom est requis."),
  telephone: telephoneSchema,
  email: emailSchema,
  ville: texte(1, 80, "Choisissez une ville."),
  adresse: texte(5, 300, "Indiquez l'adresse ou le nom de l'hôtel (et le numéro de chambre)."),
  dateLivraison: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choisissez un jour." }),
  creneau: texte(1, 60, "Choisissez un créneau."),
  notes: z.string().trim().max(1000, { error: "1000 caractères maximum." }).default(""),
  // « Je ne trouve pas mon article » : ce que le client demande hors catalogue.
  demandeLibre: z.string().trim().max(600, { error: "600 caractères maximum." }).default(""),
  express: z.boolean().default(false),
  remplacement: z.enum(Object.keys(REMPLACEMENTS) as [keyof typeof REMPLACEMENTS, ...(keyof typeof REMPLACEMENTS)[]], {
    error: "Choisissez quoi faire si un article manque.",
  }),
  paiement: z.string().trim().max(40).default(""),
  pourboire: z.number().int().min(0).max(1_000_000).default(0),
  lignes: z.array(ligneSchema).max(LIGNES_MAX, { error: "Trop d'articles différents." }),
}).superRefine((c, ctx) => {
  // Un panier vide n'est une commande que s'il porte une demande d'article hors catalogue.
  if (c.lignes.length === 0 && c.demandeLibre === "") {
    ctx.addIssue({ code: "custom", path: ["lignes"], message: "Votre panier est vide." });
  }
});

export type CommandeSaisie = z.infer<typeof commandeSchema>;

/** Additionne les doublons d'une même variante (deux onglets, double ajout). */
export function regrouperLignes(lignes: { produitId: string; quantite: number; options?: Selection }[]) {
  const total = new Map<string, { produitId: string; quantite: number; options?: Selection }>();
  for (const l of lignes) {
    const cle = cleDeVariante(l.produitId, l.options);
    const avant = total.get(cle);
    total.set(cle, { produitId: l.produitId, options: l.options, quantite: Math.min((avant?.quantite ?? 0) + l.quantite, QUANTITE_MAX) });
  }
  return [...total.values()];
}

/** Premier message d'erreur par champ, pour l'afficher sous le champ. */
export function erreursParChamp(erreur: z.ZodError): Record<string, string> {
  const champs: Record<string, string> = {};
  for (const i of erreur.issues) {
    const cle = String(i.path[0] ?? "formulaire");
    if (!champs[cle]) champs[cle] = i.message;
  }
  return champs;
}
