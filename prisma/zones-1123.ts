// La grille des zones de livraison du gérant (23 novembre 2026) : « Netanya, ça va être 30 shekels ; après
// il y en a qui vont être à 40 ; 50 shekels pour tout le Sharon, plus ou moins ; 100 shekels Herzliya ;
// 150 Tel Aviv ». Ses réponses le même jour : la zone à 40 ₪ est un QUARTIER de Netanya (Ir Yamim / Poleg),
// et pour les villes qu'il n'avait pas citées — 100 ₪ Ramat HaSharon, 150 ₪ Ramat Gan, Givatayim et Petah
// Tikva, 50 ₪ Hadera et Césarée. Les villages autour de Netanya suivent sa règle « tout le Sharon » : 50 ₪.
// Le soir même, devant le tableau de ces prix, il a corrigé : « toute la ligne Ra'anana, Kfar Saba, Hadera,
// c'est 70 ; Césarée, 100 » — la ligne portait aussi Hod Hasharon, qui suit donc à 70 ₪ (ZONES_CORRIGEES).
//
// Les prix sont ceux de la livraison au tarif de base, en agorot. Le site garde « livraison du moment +
// supplément de la zone » (lib/villes.ts) : le supplément se déduit de la livraison de base des Réglages.
// L'ordre de la liste est celui du choix proposé au client.

import { LIVRAISON_A_KIRYAT_NORDAU, QUARTIER_KIRYAT_NORDAU } from "./kiryat-nordau-1124";

export const CLE_GRILLE_DES_ZONES = "zones-1123";

/** Le quartier de Netanya vendu à son propre prix : avant le tiret la ville, après lui les quartiers (lib/zones.ts). */
export const QUARTIER_IR_YAMIM = "Netanya – Ir Yamim / Poleg";

export const GRILLE_DES_ZONES: { nom: string; livraison: number }[] = [
  { nom: "Netanya", livraison: 3000 },
  { nom: QUARTIER_IR_YAMIM, livraison: 4000 },
  // Ajouté le 24 novembre (« mets Kiryat Nordau à 40 aussi ») : l'autre quartier de Netanya vendu à son prix.
  // Sur sa base, déjà réglée par la grille, c'est une opération à elle qui le crée (prisma/kiryat-nordau-1124.ts).
  { nom: QUARTIER_KIRYAT_NORDAU, livraison: LIVRAISON_A_KIRYAT_NORDAU },
  // Le Sharon : les villages autour de Netanya, puis ses villes
  { nom: "Even Yehuda", livraison: 5000 },
  { nom: "Kfar Yona", livraison: 5000 },
  { nom: "Kadima-Tsoran", livraison: 5000 },
  { nom: "Pardesia", livraison: 5000 },
  { nom: "Beit Yitzhak", livraison: 5000 },
  { nom: "Tsur Moshe", livraison: 5000 },
  { nom: "Udim", livraison: 5000 },
  // Les villes du Sharon, plus loin
  { nom: "Ra'anana", livraison: 7000 },
  { nom: "Kfar Saba", livraison: 7000 },
  { nom: "Hod Hasharon", livraison: 7000 },
  { nom: "Hadera", livraison: 7000 },
  { nom: "Césarée", livraison: 10000 },
  { nom: "Herzliya", livraison: 10000 },
  { nom: "Ramat HaSharon", livraison: 10000 },
  // Tel Aviv et sa région
  { nom: "Tel Aviv", livraison: 15000 },
  { nom: "Ramat Gan", livraison: 15000 },
  { nom: "Givatayim", livraison: 15000 },
  { nom: "Petah Tikva", livraison: 15000 },
];

/**
 * Sa correction du 23 novembre au soir : ces cinq villes étaient à 50 ₪ dans la première grille, déjà
 * appliquée — elles prennent leur nouveau prix par une opération à elle, une seule fois.
 */
export const CLE_CORRECTION_DE_LA_GRILLE = "zones-1123-sharon";
export const ZONES_CORRIGEES = ["Ra'anana", "Kfar Saba", "Hod Hasharon", "Hadera", "Césarée"];

/** Le supplément de chaque zone pour une livraison de base donnée (jamais négatif). Pur. */
export function supplementsDeLaGrille(livraisonDeBase: number): { nom: string; supplementLivraison: number }[] {
  return GRILLE_DES_ZONES.map((z) => ({ nom: z.nom, supplementLivraison: Math.max(0, z.livraison - livraisonDeBase) }));
}
