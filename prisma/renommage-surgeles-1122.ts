// Décision du gérant (22 novembre 2026) : « oui, renomme-le en Surgelés ». Depuis ses retraits du 19 novembre,
// le rayon « Surgelés & glaces » ne vend plus que des pizzas et des plats : plus une glace.
//
// Seul le NOM change (dans les cinq langues : `rayons["surgeles-glaces"]` des dictionnaires). L'adresse du rayon
// reste `surgeles-glaces` : son icône, sa couleur, ses sous-rayons et les liens déjà partagés en dépendent.
// Les fichiers d'articles gardent « Surgelés & glaces » comme nom d'installation : `rayonsDe` retrouve le rayon
// renommé par son adresse, il n'en crée jamais un second.
//
// Une seule fois (`renommerLesSurgeles`, prisma/remplissage.ts), et seulement si le rayon porte encore son nom de
// départ : s'il l'a renommé lui-même dans son espace, son nom reste.

export const CLE_RENOMMAGE_SURGELES = "renommage-surgeles-2026-11-22";

export const RAYON_SURGELES = { ancien: "Surgelés & glaces", nom: "Surgelés", slug: "surgeles-glaces" } as const;
