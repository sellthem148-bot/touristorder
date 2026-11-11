// Décision du gérant (11 novembre 2026) : plus de viande ni de volaille sur le site. « Problème de
// cacheroute : c'est trop compliqué » — pour la viande, le niveau de certification compte pour chaque
// client, et le site ne peut pas le garantir article par article.
//
// Retirés de la vente (masqués, jamais supprimés : les commandes passées gardent leurs lignes, et le
// gérant peut remettre un article en ligne depuis son espace) : la viande et la volaille fraîches,
// surgelées, la charcuterie, les plats à base de viande. Le poisson reste, comme les produits
// végétariens (steaks végétaux, schnitzel de maïs) et la nourriture pour animaux.
//
// Une seule fois (prisma/remplissage.ts, `retirerLaViande`). Ne plus ajouter de viande au catalogue :
// tests/retrait-viande.test.ts refuse un article du rayon boucherie qui ne serait ni ici ni du poisson.

/** Les articles retirés, par leur nom au catalogue (prisma/articles-wolt*.ts et prisma/articles-liste.ts). */
export const VIANDE_ET_VOLAILLE: string[] = [
  // Volaille et viande fraîches (Wolt Market)
  "Blanc de poulet frais, environ 1 kg",
  "Escalopes de poulet fraîches (schnitzel), environ 1 kg",
  "Aiguillettes de poulet fraîches, environ 500 g",
  "Émincé de poulet frais, environ 1 kg",
  "Pilons de poulet frais, environ 1 kg",
  "Steaks de pargit frais, environ 800 g",
  "Assortiment de poulet frais, environ 1 kg",
  "Poulet entier frais, environ 2,1 kg",
  "Entrecôte de bœuf fraîche, environ 500 g",
  "Émincé de bœuf frais, environ 700 g",
  // Charcuterie (Wolt Market)
  "Saucisses de poulet Tirat Zvi 400 g",
  "Saucisses Kafri Tirat Zvi, lot de 2 (800 g)",
  "Pastrami de dinde grillée Zoglobek 330 g",
  "Pastrami au miel Zoglobek 330 g",
  "Chiffonnade de pastrami de dinde grillée Tirat Zvi 120 g",
  "Chiffonnade de pastrami au miel Tirat Zvi 120 g",
  // Surgelés (Wolt Market)
  "Blanc de poulet surgelé, environ 1 kg",
  "Bœuf haché surgelé 10 % MG 500 g",
  "Schnitzels fins croustillants Mama Of 700 g",
  "Mini schnitzels au sésame Mama Of 500 g",
  // La liste du gérant : boucherie
  "Cuisses de poulet fraîches, environ 1 kg",
  "Bœuf haché frais premium, environ 500 g",
  "Pastrami de dinde épicé Tirat Zvi 300 g",
  "Salami sec italien en tranches 100 g",
  "Ailes de poulet marinées, environ 800 g",
  "Poitrine de dinde fumée au miel 200 g",
  "Boulettes de bœuf précuites 400 g",
  "Foies de poulet frais casherisés, environ 500 g",
  "Rôti de bœuf faux-filet frais, environ 1 kg",
  "Côtes d'agneau fraîches sous vide, environ 400 g",
  "Brochettes Pargiyot marinées 500 g",
  "Brochettes de blanc de poulet aux herbes 500 g",
  "Bacon de dinde fumé casher 150 g",
  "Saucisse sèche Kabana épicée 180 g",
  // La liste du gérant : surgelés et épicerie
  "Mini-burgers pour enfants Baladi 700 g",
  "Nuggets de poulet panés Mama Of 700 g",
  "Steak haché pur bœuf Baladi 4 × 100 g",
  "Pavé d'entrecôte surgelée Baladi 250 g",
  "Pépites de poulet façon pop-corn 500 g",
  "Nouilles instantanées Mama poulet × 5",
];

/** Ce qui reste au rayon boucherie : du poisson. Le rayon est renommé en conséquence. */
export const POISSONS_GARDES: string[] = [
  "Filet de saumon frais, environ 650 g",
  "Pavé de saumon frais, environ 220 g",
  "Saumon fumé norvégien 100 g",
  "Truite saumonée fraîche sous vide, environ 300 g",
];

export const RAYON_BOUCHERIE = "Boucherie & poisson";
export const RAYON_POISSON = { nom: "Poisson", slug: "poisson" };
