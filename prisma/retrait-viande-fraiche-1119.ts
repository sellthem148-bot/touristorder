// Décision du gérant (19 novembre 2026) : « enlève-moi tout ce qui est viande, poulet frais ».
//
// Le 16 novembre, les 13 viandes et volailles qui avaient leur photo de Wolt étaient revenues en vente
// (prisma/remise-en-vente-1116.ts). Il retire maintenant la viande et le poulet FRAIS : les sept articles
// ci-dessous, tous vendus au poids au rayon « Boucherie & poisson ».
//
// Restent en vente, parce qu'il n'a parlé que du frais — on lui a dit lesquels, il les retire d'un mot s'il le
// veut : la charcuterie sous vide (deux saucisses et deux pastramis Tirat Zvi) et les deux surgelés (blanc de
// poulet, bœuf haché).
//
// MASQUÉS, pas supprimés (« retirer » = masquer, sauf demande expresse de suppression) : ils gardent leur nom,
// leur prix et leur photo de Wolt dans son espace. Une seule fois (`retirerLaViandeFraiche`,
// prisma/remplissage.ts) : ce qu'il remet en vente lui-même ensuite y reste. Une capture de Wolt ne les ramène
// plus : la viande et le poulet frais ne reviennent que sur sa demande.

export const CLE_RETRAIT_VIANDE_FRAICHE = "retrait-viande-fraiche-2026-11-19";

/** Sept des treize viandes revenues en vente le 16 novembre (`VIANDES_REMISES`) : celles qui sont fraîches. */
export const VIANDE_FRAICHE: string[] = [
  "Blanc de poulet frais, environ 1 kg",
  "Aiguillettes de poulet fraîches, environ 500 g",
  "Émincé de poulet frais, environ 1 kg",
  "Steaks de pargit frais, environ 800 g",
  "Assortiment de poulet frais, environ 1 kg",
  "Entrecôte de bœuf fraîche, environ 500 g",
  "Émincé de bœuf frais, environ 700 g",
];
