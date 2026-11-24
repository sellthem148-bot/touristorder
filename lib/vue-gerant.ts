import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { estAdmin } from "./admin";
import { prisma } from "./prisma";
import { photoRepere } from "./reperes-wolt";

// Les photos de Wolt sur les pages de la boutique : qui les voit, et comment.
//
// Ce sont les photos repère du gérant (tirées de ses captures de Wolt). Sur une carte ou une fiche, elles
// prennent la place de l'icône du rayon quand l'article n'a pas encore sa photo. Deux décisions du gérant, le
// 17 novembre 2026 :
// 1. « Grâce à ces images de Wolt je peux chercher les images qui correspondent à chaque produit — alors
//    mets-moi les images » : connecté à son espace, il les voit sur son site, avec son raccourci « Changer la
//    photo » sur la fiche d'un article. (L'étiquette « Wolt » qu'il voyait sur chaque photo a été retirée à sa
//    demande le 24 novembre 2026, une fois toutes les photos retouchées : components/admin/ApercuGerant.tsx.)
// 2. « Le site a 0 client, on est 2 à bosser dessus et on ne peut pas se connecter à l'admin à chaque fois :
//    active-moi les photos pour tout le monde » : le réglage `Reglages.photosWoltPourTous` (Réglages → « Photos
//    de Wolt pour tout le monde ») les montre à tous les visiteurs, sans étiquette. Prévenu deux fois que ces
//    photos sont celles de Wolt et des marques, c'est lui qui a choisi ; c'est lui qui décoche la case.
//
// C'est la SEULE porte par laquelle une photo de Wolt arrive sur une page de la boutique. Réglage décoché, un
// visiteur ne reçoit ni la photo (la route `/admin/repere/…` exige alors la connexion du gérant) ni son adresse.
// `tests/reperes-wolt.test.ts` et `tests/navigateur/vue-gerant.mjs` le vérifient.

/** Posé quand le gérant demande à voir son site comme un client (sans ses repères). */
export const COOKIE_VUE_CLIENT = "vue_client";
/** Douze heures : passé ce délai, la vue du gérant revient d'elle-même. */
export const DUREE_VUE_CLIENT_S = 12 * 60 * 60;

// Le réglage est relu au plus toutes les dix secondes : chaque photo demandée et chaque page le consultent.
const DUREE_DU_REGLAGE = 10_000;
let reglage: { lu: number; pourTous: boolean } | null = null;

/** Le réglage « Photos de Wolt pour tout le monde » (Reglages.photosWoltPourTous). */
export async function photosDeWoltPourTous(): Promise<boolean> {
  if (reglage && Date.now() - reglage.lu < DUREE_DU_REGLAGE) return reglage.pourTous;
  const r = await prisma.reglages.findUnique({ where: { id: 1 }, select: { photosWoltPourTous: true } });
  reglage = { lu: Date.now(), pourTous: r?.photosWoltPourTous === true };
  return reglage.pourTous;
}

/** Après un changement des réglages : le relire à la prochaine demande. */
export function oublierLeReglageDesPhotos(): void {
  reglage = null;
}

export type VueDuSite = {
  /** Le visiteur est le gérant, connecté à son espace sur cet appareil. */
  gerant: boolean;
  /** Le réglage « Photos de Wolt pour tout le monde » est coché. */
  pourTous: boolean;
  /** Ce visiteur voit la photo de Wolt sur les articles sans photo. */
  photosDeWolt: boolean;
  /** Avec les repères du gérant : « Changer la photo » sur la fiche d'un article (jamais pour un client). */
  etiquettes: boolean;
};

/** Qui regarde la page, et ce qu'il voit : lu une fois par requête. */
export const vueDuGerant = cache(async (): Promise<VueDuSite> => {
  const pourTous = await photosDeWoltPourTous();
  if (!(await estAdmin())) return { gerant: false, pourTous, photosDeWolt: pourTous, etiquettes: false };
  const commeUnClient = (await cookies()).get(COOKIE_VUE_CLIENT)?.value === "1";
  return { gerant: true, pourTous, photosDeWolt: pourTous || !commeUnClient, etiquettes: !commeUnClient };
});

/** La photo de Wolt d'un article, telle qu'une page la reçoit. */
export type Repere = { photo: string; etiquette: boolean };

/**
 * La photo de Wolt de chaque article de la liste qui n'a pas encore de photo sur le site (id → photo), pour
 * qui a le droit de la voir : le gérant connecté, ou tout le monde si le réglage est coché. Sinon rien, et la
 * base n'est même pas relue.
 * `nom` est le nom FRANÇAIS de la base ; le nom exact sur Wolt, relu ici, retrouve un article renommé — il ne
 * quitte pas cette fonction.
 */
export async function reperesPour(produits: { id: string; nom: string; photoUrl: string }[]): Promise<Map<string, Repere>> {
  const reperes = new Map<string, Repere>();
  const sansPhoto = produits.filter((p) => !p.photoUrl);
  if (sansPhoto.length === 0) return reperes;
  const vue = await vueDuGerant();
  if (!vue.photosDeWolt) return reperes;
  const releves = await prisma.produit.findMany({ where: { id: { in: sansPhoto.map((p) => p.id) } }, select: { id: true, nomWolt: true } });
  const nomWolt = new Map(releves.map((r) => [r.id, r.nomWolt]));
  for (const p of sansPhoto) {
    const photo = photoRepere(p.nom, nomWolt.get(p.id));
    if (photo) reperes.set(p.id, { photo, etiquette: vue.etiquettes });
  }
  return reperes;
}
