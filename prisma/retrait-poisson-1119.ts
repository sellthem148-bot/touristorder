// Décision du gérant (19 novembre 2026, devant le récapitulatif de ce que le site vend) :
// « enlève : Poisson surgelé - Poisson frais » — les deux sous-rayons de « Boucherie & poisson » qu'il a nommés.
//
// Le matin même il avait retiré la viande et le poulet frais (prisma/retrait-viande-fraiche-1119.ts). Vingt-deux
// articles de plus : les 9 de « Poisson frais » et les 13 de « Poisson surgelé ». Le rayon garde le poisson fumé
// et salé, la charcuterie sous vide et les sauces (24 articles).
//
// Il n'a nommé que ces deux sous-rayons : les 4 poissons fumés ou salés vendus surgelés (sous-rayon « Fumé &
// salé ») restent en vente — on le lui a dit. Les 6 poissons surgelés rangés au rayon « Surgelés & glaces », eux,
// sont partis quelques minutes plus tard, par sa décision suivante (prisma/retrait-surgeles-1119.ts).
//
// MASQUÉS, pas supprimés (« retirer » = masquer, sauf demande expresse de suppression) : ils gardent leur nom,
// leur prix et leur photo dans son espace. Une seule fois (`retirerLePoissonFraisEtSurgele`,
// prisma/remplissage.ts) : ce qu'il remet en vente lui-même ensuite y reste. Une capture de Wolt ne les ramène
// plus : ils ne reviennent que sur sa demande.

export const CLE_RETRAIT_POISSON = "retrait-poisson-frais-et-surgele-2026-11-19";

/** Le sous-rayon « Poisson frais » de « Boucherie & poisson », tel qu'il était en vente ce jour-là. */
export const POISSON_FRAIS_RETIRE: string[] = [
  "Filet de saumon frais, environ 650 g",
  "Pavé de saumon frais, environ 220 g",
  "Filets de dorade frais × 2, environ 220 g",
  "Pavés de saumon frais × 2, environ 280 g",
  "Filets de bar frais × 2, environ 220 g",
  "Filets de dorade frais, environ 550 g",
  "Filet de tilapia frais, environ 200 g",
  "Filet de bar frais, environ 220 g",
  "Filet de tilapia avec bande de peau 160 g",
];

/** Le sous-rayon « Poisson surgelé » de « Boucherie & poisson », tel qu'il était en vente ce jour-là. */
export const POISSON_SURGELE_RETIRE: string[] = [
  "Filets de dorade surgelés × 2, environ 220 g",
  "Merlu pané surgelé façon schnitzel, environ 480 g",
  "Filets de bar surgelés × 2, environ 220 g",
  "Nuggets de merlu en tempura surgelés, environ 500 g",
  "Pavés de saumon surgelés × 2, environ 300 g",
  "Filet de saumon surgelé Tnuva, environ 1,2 kg",
  "Filet de saumon surgelé Tnuva, environ 825 g",
  "Kebabs de poisson 400 g",
  "Filet de saumon surgelé Tnuva 150 g",
  "Pavés de saumon surgelés × 4, 720 g",
  "Filet de tilapia surgelé sous glaçage 150 g",
  "Schnitzel de filet de tilapia pané 450 g",
  "Nuggets de filet de poisson en tempura 450 g",
];

export const POISSON_RETIRE: string[] = [...POISSON_FRAIS_RETIRE, ...POISSON_SURGELE_RETIRE];
