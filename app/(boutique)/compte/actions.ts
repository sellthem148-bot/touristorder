"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { prisma } from "@/lib/prisma";
import { exigerClient } from "@/lib/client";
import { COOKIE_CLIENT, creerJetonClient, DUREE_LIEN_CONNEXION_MS } from "@/lib/session-client";
import { erreursParChamp, schemasPour } from "@/lib/validation";
import { traduction } from "@/lib/traduction";
import frSite from "@/lib/i18n/fr";
import { autoriser } from "@/lib/limite";
import { ipDuVisiteur } from "@/lib/ip";
import { adresseDuSite } from "@/lib/site";
import { envoyerCourriel } from "@/lib/courriel";
import { adresseDuLogo, courrielDeConnexion } from "@/lib/courriels";
import { produitsPourLePanier } from "@/lib/catalogue";
import { libelleAffiche, resoudreSelection, type Selection } from "@/lib/options";
import { deuxPointsDe } from "@/lib/i18n/catalogue";
import { selectionDepuisLibelle } from "@/lib/espace-client";
import { NOM_DU_SITE } from "@/lib/marque";

export type EtatConnexion = { envoye?: boolean; erreur?: string };

/**
 * Envoie un lien de connexion à l'adresse donnée, si un espace client existe pour elle.
 * La réponse est la même que l'adresse soit connue ou non : la page ne dit pas qui a un compte.
 */
export async function demanderLien(_avant: EtatConnexion, form: FormData): Promise<EtatConnexion> {
  const { langue, ts } = await traduction();
  const lecture = schemasPour(ts.erreurs).emailSchema.safeParse(String(form.get("email") ?? ""));
  if (!lecture.success) return { erreur: ts.erreurs.emailInvalide };
  const email = lecture.data;

  const ip = await ipDuVisiteur();
  if (!autoriser(`lien-ip:${ip}`, 8, 15 * 60 * 1000) || !autoriser(`lien-email:${email}`, 3, 60 * 60 * 1000)) {
    return { erreur: ts.erreurs.tropDeDemandes };
  }
  if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
    return { erreur: ts.erreurs.emailNonConfigure };
  }

  const client = await prisma.client.findUnique({ where: { email }, select: { id: true } });
  if (client) {
    const jeton = creerJetonClient("lien", client.id, DUREE_LIEN_CONNEXION_MS);
    if (jeton) {
      const site = await adresseDuSite();
      const lien = `${site}/compte/acces?jeton=${jeton}`;
      // Après la réponse : le temps d'envoi ne distingue pas une adresse connue d'une inconnue.
      after(() => envoyerCourriel({ a: email, ...courrielDeConnexion({ site: NOM_DU_SITE, logo: adresseDuLogo(site), lien, minutes: DUREE_LIEN_CONNEXION_MS / 60000 }, ts.courriel, langue) }));
    }
  }
  return { envoye: true };
}

export async function seDeconnecterClient() {
  (await cookies()).delete(COOKIE_CLIENT);
  redirect("/");
}

export type EtatProfil = { ok?: boolean; erreur?: string; champs?: Record<string, string> };

export async function enregistrerProfil(_avant: EtatProfil, form: FormData): Promise<EtatProfil> {
  const client = await exigerClient();
  const { ts } = await traduction();
  const lecture = schemasPour(ts.erreurs).profilSchema.safeParse({
    nom: String(form.get("nom") ?? ""),
    telephone: String(form.get("telephone") ?? ""),
    ville: String(form.get("ville") ?? ""),
    adresse: String(form.get("adresse") ?? ""),
    etage: String(form.get("etage") ?? ""),
    appartement: String(form.get("appartement") ?? ""),
    codeEntree: String(form.get("codeEntree") ?? ""),
  });
  if (!lecture.success) return { erreur: ts.erreurs.champs, champs: erreursParChamp(lecture.error) };
  // Une ville vide est permise ; sinon, seulement une ville livrée.
  if (lecture.data.ville && !(await prisma.ville.findFirst({ where: { nom: lecture.data.ville, active: true }, select: { id: true } }))) {
    return { erreur: ts.erreurs.champs, champs: { ville: ts.erreurs.villeNonLivree } };
  }
  await prisma.client.update({ where: { id: client.id }, data: lecture.data });
  return { ok: true };
}

export type ArticleARemettre = {
  produitId: string;
  nom: string;
  options?: Selection;
  optionsLibelle: string;
  prix: number;
  photoUrl: string;
  emoji: string;
  quantite: number;
};

/**
 * « Commander à nouveau » : les articles d'une de SES commandes encore disponibles,
 * aux prix et options d'aujourd'hui. Ce qui n'existe plus est compté, pas ajouté.
 */
export async function articlesPourRecommander(commandeId: string): Promise<{ articles: ArticleARemettre[]; manquants: number }> {
  const client = await exigerClient();
  const { langue } = await traduction();
  if (typeof commandeId !== "string" || commandeId.length === 0 || commandeId.length > 40) return { articles: [], manquants: 0 };
  // La commande doit être celle du client connecté : l'identifiant seul ne suffit pas.
  const commande = await prisma.commande.findFirst({
    where: { id: commandeId, clientId: client.id },
    select: { lignes: { where: { indisponible: false }, select: { produitId: true, options: true, quantite: true } } },
  });
  if (!commande) return { articles: [], manquants: 0 };

  const produits = new Map((await produitsPourLePanier(commande.lignes.flatMap((l) => (l.produitId ? [l.produitId] : [])), langue)).map((p) => [p.id, p]));
  const articles: ArticleARemettre[] = [];
  let manquants = 0;
  for (const l of commande.lignes) {
    const p = l.produitId ? produits.get(l.produitId) : undefined;
    const selection = selectionDepuisLibelle(l.options);
    const choix = p ? resoudreSelection(p.options, selection) : null;
    if (!p || !choix?.ok) {
      manquants += 1;
      continue;
    }
    articles.push({
      produitId: p.id,
      nom: p.nom,
      options: p.options.length ? selection : undefined,
      // Le nom et les options tels que le client les lit, dans sa langue ; le serveur recalcule tout à la commande.
      optionsLibelle: libelleAffiche(p.options, selection, deuxPointsDe(langue)) || choix.libelle,
      prix: p.prix + choix.supplement,
      photoUrl: p.photoUrl,
      emoji: p.categorie.emoji,
      quantite: l.quantite,
    });
  }
  return { articles, manquants };
}

/** Supprime l'espace client. Les commandes restent (comptabilité du gérant), détachées du compte. */
export async function supprimerMonEspace(form: FormData) {
  const client = await exigerClient();
  // Le mot à taper est celui de la langue du client (« supprimer », « delete »…) ; le mot français reste accepté.
  const { t } = await traduction();
  const tape = String(form.get("confirmation") ?? "").trim().toLowerCase();
  if (tape !== t.compte.motSupprimer.toLowerCase() && tape !== frSite.compte.motSupprimer) {
    redirect("/compte?erreur=confirmation#supprimer");
  }
  await prisma.client.delete({ where: { id: client.id } }); // Commande.clientId passe à null (onDelete: SetNull)
  (await cookies()).delete(COOKIE_CLIENT);
  redirect("/?espace=supprime");
}
