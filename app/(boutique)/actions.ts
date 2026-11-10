"use server";

import { redirect } from "next/navigation";
import { creerCommande } from "@/lib/commandes";
import { etatDuPanier } from "@/lib/catalogue";
import { autoriser } from "@/lib/limite";
import { ipDuVisiteur } from "@/lib/ip";

export type EtatCommande = {
  erreur?: string;
  champs?: Record<string, string>;
  panierPerime?: boolean;
};

/** Prix et disponibilité actuels des articles du panier. */
export async function actualiserPanier(ids: string[]) {
  if (!Array.isArray(ids)) return [];
  return etatDuPanier(ids);
}

export async function passerCommande(_avant: EtatCommande, form: FormData): Promise<EtatCommande> {
  // Champ piège invisible : un humain ne le remplit pas.
  if (String(form.get("site") ?? "") !== "") return { erreur: "Commande refusée." };

  const ip = await ipDuVisiteur();
  if (!autoriser(`commande:${ip}`, 15, 10 * 60 * 1000)) {
    return { erreur: "Trop de commandes en peu de temps. Réessaie dans quelques minutes." };
  }

  let lignes: unknown = [];
  try {
    lignes = JSON.parse(String(form.get("lignes") ?? "[]"));
  } catch {
    return { erreur: "Panier illisible, recharge la page." };
  }

  const resultat = await creerCommande({
    nomClient: form.get("nomClient") ?? "",
    telephone: form.get("telephone") ?? "",
    ville: form.get("ville") ?? "",
    adresse: form.get("adresse") ?? "",
    dateLivraison: form.get("dateLivraison") ?? "",
    creneau: form.get("creneau") ?? "",
    notes: form.get("notes") ?? "",
    lignes,
  });

  if (!resultat.ok) {
    return { erreur: resultat.erreur, champs: resultat.champs, panierPerime: resultat.panierPerime };
  }
  redirect(`/suivi/${resultat.jeton}?nouvelle=1`);
}
