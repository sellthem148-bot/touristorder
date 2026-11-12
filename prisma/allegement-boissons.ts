// Le rayon « Boissons » ramené à une courte sélection : décision du gérant, le 12 novembre 2026. Après l'ajout
// des boissons de sa capture, le rayon comptait 173 articles ; comme pour la Crèmerie, il a demandé « une
// sélection courte ».
//
// La sélection : de quoi boire pendant un séjour — eau plate et gazeuse, glaçons, colas, quelques sodas, jus et
// boissons aux fruits, thé glacé, une boisson pour le sport et une boisson énergisante. Tous ont un prix vérifié
// sur Wolt (relevés de Wolt, ou articles de sa liste dont le prix a été relevé).
// Le reste est MASQUÉ, jamais supprimé : il remet en vente ce qu'il veut depuis son espace. L'alcool n'est pas
// concerné : le code ne l'a jamais mis en vente, c'est lui qui décide.
//
// Appliqué une seule fois par `allegerLesBoissons` (prisma/remplissage.ts). Ne pas regarnir le rayon par le
// code sans une demande du gérant.

export const RAYON_BOISSONS = "Boissons";

/** Ce que le rayon garde en vente, par famille. */
export const BOISSONS_GARDEES: string[] = [
  // Eau plate
  "Eau minérale Neviot 1,5 L",
  "Eau minérale Ein Gedi 2 L",
  "Eau Mei Eden 6 × 50 cl",
  "Eau Neviot To Go 6 × 50 cl",
  "Eau minérale Mei Eden 50 cl",
  // Eau gazeuse
  "San Pellegrino 1 L",
  "Perrier 4 × 33 cl",
  "Schweppes soda 1,5 L",
  // Glaçons
  "Sac de glaçons 2 kg",
  // Colas
  "Coca-Cola 1,5 L",
  "Coca-Cola Zero 1,5 L",
  "Coca-Cola canettes 6 × 33 cl",
  "Coca-Cola Zero canettes 6 × 33 cl",
  "Coca-Cola canette 33 cl",
  "Coca-Cola Zero canette 33 cl",
  "Pepsi 1,5 L",
  // Autres sodas
  "Sprite citron-lime 1,5 L",
  "Sprite Zero citron-lime 1,5 L",
  "Fanta Orange classique 1,5 L",
  "Fanta orange canette 33 cl",
  "7UP 1,5 L",
  "Schweppes Eau Tonique 1,5 L",
  // Jus, boissons aux fruits, thé glacé, eau aromatisée
  "Jus d'orange pressé Primor 1 L",
  "Prigat orange 1,5 L",
  "Prigat citron-menthe 1,5 L",
  "Spring mangue 1,5 L",
  "Fuze Tea pêche 1,5 L",
  "Eau aromatisée pêche Neviot+ 1,5 L",
  // Sport et énergie
  "Gatorade Cool Blue 50 cl",
  "Boisson énergisante XL 25 cl",
];
