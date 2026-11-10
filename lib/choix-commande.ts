// Les choix que le client fait en commandant, en dehors des articles.

export const REMPLACEMENTS = {
  CONTACTER: { libelle: "Me contacter sur WhatsApp", court: "Le contacter" },
  EQUIVALENT: { libelle: "Le remplacer par un équivalent", court: "Remplacer par un équivalent" },
  RETIRER: { libelle: "Le retirer de ma commande", court: "Retirer l'article" },
} as const;

export type Remplacement = keyof typeof REMPLACEMENTS;

export function estRemplacement(x: unknown): x is Remplacement {
  return typeof x === "string" && x in REMPLACEMENTS;
}

export type Badge = "" | "populaire" | "nouveau" | "promo";

export const BADGES: Record<Exclude<Badge, "">, { libelle: string; classes: string }> = {
  populaire: { libelle: "Populaire", classes: "bg-soleil text-slate-900" },
  nouveau: { libelle: "Nouveau", classes: "bg-emerald-500 text-white" },
  promo: { libelle: "Promo", classes: "bg-rose-500 text-white" },
};

export function estBadge(x: unknown): x is Badge {
  return x === "" || (typeof x === "string" && x in BADGES);
}
