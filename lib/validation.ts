import { z } from "zod";
import { LIGNES_MAX, QUANTITE_MAX } from "./calcul";
import { cleDeVariante, type Selection } from "./options";
import { REMPLACEMENTS } from "./choix-commande";
import frServeur, { type DictionnaireServeur } from "./i18n/serveur/fr";

export const ligneSchema = z.object({
  produitId: z.string().min(1).max(40),
  quantite: z.number().int().min(1).max(QUANTITE_MAX),
  options: z.record(z.string().max(40), z.string().max(40)).optional(),
});

type MessagesErreur = DictionnaireServeur["erreurs"];

/**
 * Les schémas de saisie, avec leurs messages dans une langue (les erreurs s'affichent sous les champs).
 * Le client doit donner son nom, son téléphone, son e-mail et son adresse entière (rue ou hôtel,
 * étage, numéro d'appartement ou de chambre) AVANT que la commande soit enregistrée.
 */
export function schemasPour(m: MessagesErreur) {
  const max = (n: number) => m.maxCaracteres.replace("{max}", String(n));
  const texte = (min: number, n: number, message: string) =>
    z.string({ error: message }).trim().min(min, { error: message }).max(n, { error: max(n) });

  const telephoneSchema = z
    .string({ error: m.telephoneRequis })
    .trim()
    .min(1, { error: m.telephoneRequis })
    .max(30, { error: m.telephoneLong })
    .refine((t) => /^[+\d\s().-]+$/.test(t), { error: m.telephoneInvalide })
    .refine((t) => {
      const n = t.replace(/\D/g, "").length;
      return n >= 8 && n <= 15;
    }, { error: m.telephoneIndicatif });

  /** Une adresse e-mail : nettoyée (espaces, majuscules) AVANT d'être vérifiée, comparée et enregistrée. */
  const emailSchema = z
    .string({ error: m.emailRequis })
    .trim()
    .toLowerCase()
    .min(1, { error: m.emailRequis })
    .pipe(z.email({ error: m.emailInvalide }).max(254, { error: m.emailLong }));

  const commandeSchema = z.object({
    nomClient: texte(2, 80, m.nomRequis),
    telephone: telephoneSchema,
    email: emailSchema,
    ville: texte(1, 80, m.villeRequise),
    adresse: texte(5, 200, m.adresseRequise),
    etage: texte(1, 20, m.etageRequis),
    appartement: texte(1, 20, m.appartementRequis),
    codeEntree: z.string().trim().max(40, { error: max(40) }).default(""),
    dateLivraison: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { error: m.jourRequis }),
    creneau: texte(1, 60, m.creneauRequis),
    notes: z.string().trim().max(1000, { error: max(1000) }).default(""),
    // « Je ne trouve pas mon article » : ce que le client demande hors catalogue.
    demandeLibre: z.string().trim().max(600, { error: max(600) }).default(""),
    express: z.boolean().default(false),
    remplacement: z.enum(Object.keys(REMPLACEMENTS) as [keyof typeof REMPLACEMENTS, ...(keyof typeof REMPLACEMENTS)[]], {
      error: m.remplacementRequis,
    }),
    paiement: z.string().trim().max(40).default(""),
    pourboire: z.number().int().min(0).max(1_000_000).default(0),
    lignes: z.array(ligneSchema).max(LIGNES_MAX, { error: m.tropArticles }),
  }).superRefine((c, ctx) => {
    // Un panier vide n'est une commande que s'il porte une demande d'article hors catalogue.
    if (c.lignes.length === 0 && c.demandeLibre === "") {
      ctx.addIssue({ code: "custom", path: ["lignes"], message: m.panierVide });
    }
  });

  /** L'espace client : les mêmes champs, facultatifs sauf le nom et le téléphone. */
  const profilSchema = z.object({
    nom: texte(2, 80, m.nomRequis),
    telephone: telephoneSchema,
    ville: z.string().trim().max(80),
    adresse: z.string().trim().max(200, { error: max(200) }),
    etage: z.string().trim().max(20, { error: max(20) }),
    appartement: z.string().trim().max(20, { error: max(20) }),
    codeEntree: z.string().trim().max(40, { error: max(40) }),
  });

  return { telephoneSchema, emailSchema, commandeSchema, profilSchema };
}

// Les schémas en français : l'espace gérant et les tests.
export const { telephoneSchema, emailSchema, commandeSchema, profilSchema } = schemasPour(frServeur.erreurs);

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
