import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { estAdmin } from "./admin";
import { prisma } from "./prisma";
import { photoRepere } from "./reperes-wolt";

// La vue du gérant sur SON site (sa demande du 17 novembre 2026 : « grâce à ces images de Wolt je peux chercher
// les images qui correspondent à chaque produit — alors mets-moi les images »). Quand il est connecté à son
// espace sur l'appareil, les articles du site qui n'ont pas encore leur photo montrent celle de Wolt, à lui
// SEUL : il reconnaît l'article et sait quelle image chercher. Un client ne reçoit jamais rien de tout cela —
// ni la photo (la route `/admin/repere/…` exige la connexion du gérant), ni même son adresse.
//
// C'est la SEULE porte par laquelle une photo de Wolt arrive sur une page de la boutique : tout passe par
// `estAdmin()`, lu ici. `tests/reperes-wolt.test.ts` et `tests/navigateur/vue-gerant.mjs` le vérifient.

/** Posé quand le gérant demande à voir son site comme un client (sans les photos de Wolt). */
export const COOKIE_VUE_CLIENT = "vue_client";
/** Douze heures : passé ce délai, les photos de Wolt reviennent d'elles-mêmes. */
export const DUREE_VUE_CLIENT_S = 12 * 60 * 60;

export type VueDuGerant = {
  /** Le visiteur est le gérant, connecté à son espace sur cet appareil. */
  gerant: boolean;
  /** Il voit les photos de Wolt sur les articles sans photo (faux s'il a demandé la vue du client). */
  photosDeWolt: boolean;
};

/** Qui regarde la page : lu une fois par requête. */
export const vueDuGerant = cache(async (): Promise<VueDuGerant> => {
  if (!(await estAdmin())) return { gerant: false, photosDeWolt: false };
  const c = await cookies();
  return { gerant: true, photosDeWolt: c.get(COOKIE_VUE_CLIENT)?.value !== "1" };
});

/**
 * Pour le gérant connecté : la photo de Wolt de chaque article de la liste qui n'a pas encore de photo sur le
 * site (id → adresse `/admin/repere/…`). Pour tout autre visiteur : rien, et la base n'est même pas relue.
 * `nom` est le nom FRANÇAIS de la base ; le nom exact sur Wolt, relu ici, retrouve un article renommé — il ne
 * quitte pas cette fonction.
 */
export async function reperesDuGerant(produits: { id: string; nom: string; photoUrl: string }[]): Promise<Map<string, string>> {
  const reperes = new Map<string, string>();
  const sansPhoto = produits.filter((p) => !p.photoUrl);
  if (sansPhoto.length === 0 || !(await vueDuGerant()).photosDeWolt) return reperes;
  const releves = await prisma.produit.findMany({ where: { id: { in: sansPhoto.map((p) => p.id) } }, select: { id: true, nomWolt: true } });
  const nomWolt = new Map(releves.map((r) => [r.id, r.nomWolt]));
  for (const p of sansPhoto) {
    const photo = photoRepere(p.nom, nomWolt.get(p.id));
    if (photo) reperes.set(p.id, photo);
  }
  return reperes;
}
