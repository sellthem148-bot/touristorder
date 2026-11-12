"use server";

import { redirect } from "next/navigation";
import { after } from "next/server";
import { creerCommande } from "@/lib/commandes";
import { etatDuPanier } from "@/lib/catalogue";
import { autoriser } from "@/lib/limite";
import { ipDuVisiteur } from "@/lib/ip";
import { prisma } from "@/lib/prisma";
import { clientConnecte } from "@/lib/client";
import { envoyerCourrielsDeCommande } from "@/lib/commande-courriels";
import { adresseDuSite } from "@/lib/site";
import { traduction } from "@/lib/traduction";

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
  const { langue, ts } = await traduction();
  // Champ piège invisible : un humain ne le remplit pas.
  if (String(form.get("site") ?? "") !== "") return { erreur: ts.erreurs.refusee };

  const ip = await ipDuVisiteur();
  if (!autoriser(`commande:${ip}`, 15, 10 * 60 * 1000)) {
    return { erreur: ts.erreurs.tropDeCommandes };
  }

  let lignes: unknown = [];
  try {
    lignes = JSON.parse(String(form.get("lignes") ?? "[]"));
  } catch {
    return { erreur: ts.erreurs.panierIllisible };
  }

  // Un client connecté commande toujours avec l'adresse de son espace.
  const client = await clientConnecte();
  const resultat = await creerCommande({
    nomClient: form.get("nomClient") ?? "",
    telephone: form.get("telephone") ?? "",
    email: client?.email ?? form.get("email") ?? "",
    ville: form.get("ville") ?? "",
    adresse: form.get("adresse") ?? "",
    etage: form.get("etage") ?? "",
    appartement: form.get("appartement") ?? "",
    codeEntree: form.get("codeEntree") ?? "",
    dateLivraison: form.get("dateLivraison") ?? "",
    creneau: form.get("creneau") ?? "",
    notes: form.get("notes") ?? "",
    demandeLibre: form.get("demandeLibre") ?? "",
    express: form.get("express") === "1",
    remplacement: form.get("remplacement") ?? "",
    paiement: form.get("paiement") ?? "",
    pourboire: Number(form.get("pourboire") ?? 0),
    lignes,
  }, { clientConnecteId: client?.id, langue });

  if (!resultat.ok) {
    return { erreur: resultat.erreur, champs: resultat.champs, panierPerime: resultat.panierPerime };
  }
  // Les e-mails (confirmation au client, avis au gérant) partent après la réponse : la commande n'attend pas.
  const site = await adresseDuSite();
  const commandeId = resultat.id;
  after(() => envoyerCourrielsDeCommande(commandeId, site));
  redirect(`/suivi/${resultat.jeton}?nouvelle=1`);
}

/**
 * « Mes commandes » : le navigateur garde les liens de suivi de ses commandes
 * (pas de compte). On ne rend que ce que la page de suivi montre déjà.
 */
export async function mesCommandes(jetons: string[]) {
  if (!Array.isArray(jetons)) return [];
  const valides = jetons.filter((j) => typeof j === "string" && /^[A-Za-z0-9_-]{20,40}$/.test(j)).slice(0, 20);
  if (valides.length === 0) return [];
  return prisma.commande.findMany({
    where: { jeton: { in: valides } },
    orderBy: { createdAt: "desc" },
    select: {
      jeton: true, numero: true, statut: true, total: true, dateLivraison: true, creneau: true, createdAt: true,
      _count: { select: { lignes: true } },
    },
  });
}
