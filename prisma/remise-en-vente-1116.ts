// Décision du gérant (16 novembre 2026) : « mets-moi même les produits que tu as supprimés, si tu as les images ».
// Les 21 articles SUPPRIMÉS n'ont aucune image (ils l'ont été parce que Wolt ne les montrait pas) : rien à
// remettre. Mais 40 articles MASQUÉS avaient leur photo de Wolt : la question lui a été posée groupe par groupe,
// chaque groupe avec la raison pour laquelle il avait été masqué — et il a choisi les trois.
//
// Sa règle, depuis le 15 novembre : un article qu'il peut reconnaître (il a sa photo de Wolt) se vend ; sans
// photo, il reste masqué. Elle passe désormais AVANT ses décisions précédentes sur la viande (11 novembre,
// la cacherout) et sur le poisson surgelé (15 novembre) — pour ces 40 articles-là, pas pour les autres : les
// 27 viandes et les 2 poissons surgelés qui n'ont pas de photo restent masqués.
//
// Une seule fois (`remettreEnVenteCeQuiAUnePhoto`, prisma/remplissage.ts) : ce qu'il remasque ensuite le reste.
// Chaque nom ci-dessous a sa photo dans lib/reperes-wolt.ts (tests/remise-en-vente-avec-photo.test.ts).

export const CLE_REMISE_EN_VENTE_AVEC_PHOTO = "remise-en-vente-avec-photo-2026-11-16";

/** Sept boissons que Wolt affichait le 12 novembre et plus le 15 (`BOISSONS_PLUS_SUR_WOLT`) : il sait qu'il risque de ne pas les trouver. */
export const BOISSONS_REMISES_AVEC_PHOTO: string[] = [
  "Boisson maltée Nesher Malt 1,5 L",
  "Eau enrichie en minéraux ACTIPH 60 cl",
  "Eau gazeuse San Pellegrino 75 cl",
  "Kristal menthe canette 33 cl",
  "Schweppes citron-lime canette 33 cl",
  "Schweppes pêche légèrement pétillant 1,5 L",
  "Sirop SodaStream Pepsi Zero 44 cl",
];

/** Vingt des 22 poissons surgelés masqués le 15 novembre (`POISSON_SURGELE`) : ceux que ses captures montrent. */
export const POISSONS_SURGELES_REMIS: string[] = [
  "Filets de dorade surgelés × 2, environ 220 g",
  "Merlu pané surgelé façon schnitzel, environ 480 g",
  "Filets de bar surgelés × 2, environ 220 g",
  "Nuggets de merlu en tempura surgelés, environ 500 g",
  "Pavés de saumon surgelés × 2, environ 300 g",
  "Filet de saumon surgelé Tnuva, environ 1,2 kg",
  "Filet de saumon surgelé Tnuva, environ 825 g",
  "Filet de saumon surgelé Tnuva 150 g",
  "Pavés de saumon surgelés × 4, 720 g",
  "Filet de tilapia surgelé sous glaçage 150 g",
  "Saumon fumé norvégien surgelé 100 g",
  "Truite de mer fumée surgelée, environ 100 g",
  "Filet de saumon salé prêt à manger, surgelé 200 g",
  "Saumon salé tranché prêt à manger, surgelé 100 g",
  "Pavés de saumon surgelés avec peau 600 g",
  "Pavés de saumon surgelés sans peau 500 g",
  "Filets de tilapia surgelés 800 g",
  "Filets de rouget barbet surgelés 400 g",
  "Saumon Coho sauvage d'Alaska surgelé × 2",
  "Bâtonnets de poisson pané Dagim 400 g",
];

/** Treize des 40 viandes et volailles masquées le 11 novembre (`VIANDE_ET_VOLAILLE`) : celles que ses captures montrent. */
export const VIANDES_REMISES: string[] = [
  "Blanc de poulet frais, environ 1 kg",
  "Aiguillettes de poulet fraîches, environ 500 g",
  "Émincé de poulet frais, environ 1 kg",
  "Steaks de pargit frais, environ 800 g",
  "Assortiment de poulet frais, environ 1 kg",
  "Entrecôte de bœuf fraîche, environ 500 g",
  "Émincé de bœuf frais, environ 700 g",
  "Saucisses de poulet Tirat Zvi 400 g",
  "Saucisses Kafri Tirat Zvi, lot de 2 (800 g)",
  "Chiffonnade de pastrami de dinde grillée Tirat Zvi 120 g",
  "Chiffonnade de pastrami au miel Tirat Zvi 120 g",
  "Blanc de poulet surgelé, environ 1 kg",
  "Bœuf haché surgelé 10 % MG 500 g",
];

export const REMIS_EN_VENTE_AVEC_PHOTO: string[] = [...BOISSONS_REMISES_AVEC_PHOTO, ...POISSONS_SURGELES_REMIS, ...VIANDES_REMISES];
