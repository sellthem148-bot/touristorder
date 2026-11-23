// La grille des zones de livraison du gérant (23 novembre 2026) : « Netanya, ça va être 30 shekels ; après
// il y en a qui vont être à 40 ; 50 shekels pour tout le Sharon, plus ou moins ; 100 shekels Herzliya ;
// 150 Tel Aviv ». Ses réponses le même jour : la zone à 40 ₪ est un QUARTIER de Netanya (Ir Yamim / Poleg),
// et pour les villes qu'il n'avait pas citées — 100 ₪ Ramat HaSharon, 150 ₪ Ramat Gan, Givatayim et Petah
// Tikva, 50 ₪ Hadera et Césarée. Les villages autour de Netanya suivent sa règle « tout le Sharon » : 50 ₪.
//
// Les prix sont ceux de la livraison au tarif de base, en agorot. Le site garde « livraison du moment +
// supplément de la zone » (lib/villes.ts) : le supplément se déduit de la livraison de base des Réglages.
// L'ordre de la liste est celui du choix proposé au client.

export const CLE_GRILLE_DES_ZONES = "zones-1123";

/** Le quartier de Netanya vendu à son propre prix : avant le tiret la ville, après lui les quartiers (lib/zones.ts). */
export const QUARTIER_IR_YAMIM = "Netanya – Ir Yamim / Poleg";

export const GRILLE_DES_ZONES: { nom: string; livraison: number }[] = [
  { nom: "Netanya", livraison: 3000 },
  { nom: QUARTIER_IR_YAMIM, livraison: 4000 },
  // Le Sharon : les villages autour de Netanya, puis ses villes
  { nom: "Even Yehuda", livraison: 5000 },
  { nom: "Kfar Yona", livraison: 5000 },
  { nom: "Kadima-Tsoran", livraison: 5000 },
  { nom: "Pardesia", livraison: 5000 },
  { nom: "Beit Yitzhak", livraison: 5000 },
  { nom: "Tsur Moshe", livraison: 5000 },
  { nom: "Udim", livraison: 5000 },
  { nom: "Ra'anana", livraison: 5000 },
  { nom: "Kfar Saba", livraison: 5000 },
  { nom: "Hod Hasharon", livraison: 5000 },
  { nom: "Hadera", livraison: 5000 },
  { nom: "Césarée", livraison: 5000 },
  { nom: "Herzliya", livraison: 10000 },
  { nom: "Ramat HaSharon", livraison: 10000 },
  // Tel Aviv et sa région
  { nom: "Tel Aviv", livraison: 15000 },
  { nom: "Ramat Gan", livraison: 15000 },
  { nom: "Givatayim", livraison: 15000 },
  { nom: "Petah Tikva", livraison: 15000 },
];

/** Le supplément de chaque zone pour une livraison de base donnée (jamais négatif). Pur. */
export function supplementsDeLaGrille(livraisonDeBase: number): { nom: string; supplementLivraison: number }[] {
  return GRILLE_DES_ZONES.map((z) => ({ nom: z.nom, supplementLivraison: Math.max(0, z.livraison - livraisonDeBase) }));
}
