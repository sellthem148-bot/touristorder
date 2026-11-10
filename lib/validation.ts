import { z } from "zod";
import { LIGNES_MAX, QUANTITE_MAX } from "./calcul";

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
  }, { error: "Numéro invalide : indique-le avec l'indicatif (ex. +33 6 12 34 56 78)." });

export const ligneSchema = z.object({
  produitId: z.string().min(1).max(40),
  quantite: z.number().int().min(1).max(QUANTITE_MAX),
});

export const commandeSchema = z.object({
  nomClient: texte(2, 80, "Ton nom est requis."),
  telephone: telephoneSchema,
  ville: texte(1, 80, "Choisis une ville."),
  adresse: texte(5, 300, "Indique l'adresse ou le nom de l'hôtel (et le numéro de chambre)."),
  dateLivraison: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: "Choisis un jour." }),
  creneau: texte(1, 60, "Choisis un créneau."),
  notes: z.string().trim().max(1000, { error: "1000 caractères maximum." }).default(""),
  lignes: z.array(ligneSchema).min(1, { error: "Ton panier est vide." }).max(LIGNES_MAX, { error: "Trop d'articles différents." }),
});

export type CommandeSaisie = z.infer<typeof commandeSchema>;

/** Additionne les doublons d'un même produit (deux onglets, double ajout). */
export function regrouperLignes(lignes: { produitId: string; quantite: number }[]) {
  const total = new Map<string, number>();
  for (const l of lignes) total.set(l.produitId, (total.get(l.produitId) ?? 0) + l.quantite);
  return [...total].map(([produitId, quantite]) => ({ produitId, quantite: Math.min(quantite, QUANTITE_MAX) }));
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
