// Ce que Wolt ne vend pas est supprimé du site : la décision du gérant (15 novembre 2026, « tout ce que tu ne vois
// pas sur les photos, tu me le supprimes : je ne peux pas faire des produits que Wolt n'a pas »).
//
// La seule preuve qu'un article n'est pas chez Wolt, c'est la page ENTIÈRE de son rayon : une liste par page
// entière reçue. Une page partielle (« Les plus commandés », « Promotions », des captures d'écran qui ne se
// recouvrent pas) ne prouve rien — on ne supprime rien d'après elle.
//
// Supprimés pour de bon (pas masqués : masqués, ils restaient dans son espace), une seule fois par liste
// (`supprimerLesAbsentsDeWolt`, prisma/remplissage.ts). Ne sont PAS dans ces listes :
// - un article que Wolt affichait lors d'un relevé précédent et plus ce jour-là (il a son nom exact, son prix
//   et souvent sa photo : Wolt peut le remettre en rayon) — on le signale au gérant ;
// - un article dont le gérant a noté lui-même le prix d'achat : c'est qu'il l'a trouvé sur Wolt.
// Ils restent dans prisma/articles-liste.ts, qui est SA liste telle qu'il l'a donnée : elle ne s'installe qu'une
// fois, ils ne reviennent donc pas.

export type AbsentsDeWolt = {
  cle: string;
  titre: string;
  /** Articles de la liste du gérant : supprimés tant que leur prix d'achat est resté vide (« prix non vérifié »). */
  deLaListe: string[];
  /** Articles relevés un jour sur Wolt que le gérant a fait supprimer en connaissance de cause. */
  releves: string[];
};

/**
 * Rayon « משקאות קלים » de Wolt Market Netanya Center, page entière du 15 novembre 2026 (261 cartes, jusqu'à la
 * dernière rangée) : ces seize boissons n'y sont pas. Le gérant en a vu la liste avant de décider.
 */
export const BOISSONS_ABSENTES: AbsentsDeWolt = {
  cle: "suppression-boissons-absentes-2026-11-15",
  titre: "Boissons que Wolt ne vend pas",
  deLaListe: [
    // Absentes du rayon.
    "Jus d'orange pressé 100 % Prigat 1 L",
    "Prigat Nectar de Mangue 1,5 L",
    "Prigat Jus de Pomme clair 1,5 L",
    "Eau minérale Mei Eden 6 × 1,5 L",
    "Eau minérale Evian des Alpes 1 L",
    "Eau gazeuse aromatisée lime Perrier canette 33 cl",
    "Boisson de malt sans alcool Malt Star 6 × 33 cl",
    "Kombucha bio gingembre-citron 33 cl",
    "Sirop de menthe Teisseire 70 cl",
    "Sirop de grenadine Teisseire 70 cl",
    // Wolt vend autre chose : d'autres Monster, le sac de glaçons de 2 kg (déjà sur le site), d'autres shots,
    // une eau de coco de 240 ml.
    "Canette Monster Mango Loco 50 cl",
    "Poches de glaçons Mister Ice 1 kg",
    "Shot de jus gingembre-curcuma à froid 60 ml",
    "Shot Smoothie détox pressé frais 100 ml",
    "Eau de coco naturelle 100 % sans sucres 33 cl",
  ],
  // Relevé les 10-11 novembre, jamais vu sur une capture depuis : le gérant l'a vu dans la liste et l'a fait supprimer.
  releves: ["Pepsi Zero canettes 6 × 33 cl"],
};

/** Les listes, dans l'ordre : chacune a sa clé et ne s'applique qu'une fois. */
export const ABSENTS_DE_WOLT: AbsentsDeWolt[] = [BOISSONS_ABSENTES];
