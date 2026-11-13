// Deux décisions du gérant, le 12 novembre 2026, après l'ajout des articles de ses captures :
//
// 1. Le rayon « Crèmerie & œufs » était monté à 280 articles (dont 183 venus des captures) : « pas autant,
//    il en faut quelques-uns, pas plus ». Le rayon garde donc une courte sélection — de quoi faire un
//    petit-déjeuner et un repas simple : œufs, lait, beurre, crème, quelques fromages, yaourts et desserts.
//    Tous sont des articles relevés sur Wolt (prix vérifié). Le reste est MASQUÉ, jamais supprimé : le
//    gérant remet en vente ce qu'il veut depuis son espace.
//
// 2. Cinq articles de sa liste que Wolt ne vend pas (aucune de ses captures ne les montre) : retirés de
//    la vente (« supprime ça »). Masqués eux aussi : un article supprimé de la base reviendrait à la
//    prochaine installation de la liste, et ses lignes de commande perdraient leur article.
//
// Appliqué une seule fois par `allegerLaCremerie` et `retirerLesIntrouvables` (prisma/remplissage.ts).
// Ne pas regarnir le rayon par le code sans une demande du gérant.

export const RAYON_CREMERIE = "Crèmerie & œufs";

/** Ce que le rayon garde en vente, par famille. */
export const CREMERIE_GARDEE: string[] = [
  // Œufs
  "Œufs calibre L × 12",
  "Œufs bio calibre L × 12",
  // Lait
  "Lait Tnuva 3 % 1 L",
  "Lait Tnuva 1 % 1 L",
  "Lait sans lactose Tnuva 2 % 1 L",
  "Lait chocolaté Yotvata 1 L",
  "Boisson au soja Alpro Barista sans sucres 1 L",
  // Beurre et crème
  "Beurre Tnuva 200 g",
  "Beurre français Président 200 g",
  "Crème de cuisson Yotvata 15 % 25 cl",
  "Crème à fouetter Tnuva 32 % 250 ml",
  // Fromages
  "Cottage Tnuva 5 % 250 g",
  "Fromage blanc Tnuva 5 % 500 g",
  "Philadelphia 25 % 150 g",
  "Fromage en tranches Emek 28 % 200 g",
  "Mozzarella râpée Gad 22 % 300 g",
  "Boule de mozzarella Piraeus 100 g",
  "Fromage bulgare doux Piraeus 5 % 250 g",
  "Mini Babybel × 5 (100 g)",
  // Yaourts
  "Yaourt grec Danone 6,5 %",
  "Yaourt nature Tnuva Bio 3 % 500 g",
  "Yaourts Tnuva Bio 3 % × 8 (150 g)",
  "Yaourt Müller Simply Fruit fraise 3 % 150 ml",
  "Actimel fraise × 8",
  "Yaourt protéiné Danone Pro vanille 200 g",
  // Desserts
  "Milky chocolat × 8",
  "Milky chocolat 133 g",
  "Dessert au fromage Daniela fraise",
  "Malabi Gad 160 g",
  // Boisson lactée
  "Café glacé Yotvata 1 L",
];

/** Articles de la liste du gérant introuvables sur Wolt : retirés de la vente le 12 novembre 2026, supprimés le 13 (sa demande). */
export const INTROUVABLES_SUR_WOLT: string[] = [
  "Truite saumonée fraîche sous vide, environ 300 g",
  "Lait frais Tara 1 % 1 L",
  "Beurre doux Tnuva 100 g",
  "Œufs de caille × 18",
  "Pitas complètes artisanales × 5",
];
