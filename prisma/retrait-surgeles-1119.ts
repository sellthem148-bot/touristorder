// Décision du gérant (19 novembre 2026, quelques minutes après le poisson frais et surgelé) :
// « supprime : Viande & volaille - Poisson - Glaces » — trois des quatre sous-rayons de « Surgelés & glaces »,
// tels qu'il les lisait sur la page du rayon. Onze articles ; le rayon ne garde que « Pizzas & plats » (trois).
//
// « Viande & volaille » existe aussi au rayon « Boucherie & poisson » (la charcuterie sous vide, quatre articles) :
// il venait de passer ce rayon en revue sans la nommer — elle reste en vente, et on le lui a dit.
//
// « Supprime » : comme « enlève » le matin même et dans le message d'avant, il parle de ce que le SITE vend. Les
// articles sont donc MASQUÉS, pas effacés de sa base (effacer ne se défait pas : seulement sur sa demande expresse,
// et on lui a dit qu'ils restent dans son espace). Une seule fois (`retirerLesSurgeles`, prisma/remplissage.ts) :
// ce qu'il remet en vente lui-même ensuite y reste. Une capture de Wolt ne les ramène plus.

export const CLE_RETRAIT_SURGELES = "retrait-surgeles-viande-poisson-glaces-2026-11-19";

/** Sous-rayon « Viande & volaille » de « Surgelés & glaces ». */
export const VIANDE_SURGELEE_RETIREE: string[] = ["Blanc de poulet surgelé, environ 1 kg", "Bœuf haché surgelé 10 % MG 500 g"];

/** Sous-rayon « Poisson » de « Surgelés & glaces ». */
export const POISSON_DES_SURGELES_RETIRE: string[] = [
  "Pavés de saumon surgelés avec peau 600 g",
  "Pavés de saumon surgelés sans peau 500 g",
  "Filets de tilapia surgelés 800 g",
  "Bâtonnets de poisson pané Dagim 400 g",
  "Filets de rouget barbet surgelés 400 g",
  "Saumon Coho sauvage d'Alaska surgelé × 2",
];

/** Sous-rayon « Glaces » de « Surgelés & glaces ». */
export const GLACES_RETIREES: string[] = ["Framboises au chocolat Franui 150 g", "Glace Crunch vanille-nougat 100 g", "Glace Crunch America nougat-cacahuète 100 g"];

export const SURGELES_RETIRES: string[] = [...VIANDE_SURGELEE_RETIREE, ...POISSON_DES_SURGELES_RETIRE, ...GLACES_RETIREES];
