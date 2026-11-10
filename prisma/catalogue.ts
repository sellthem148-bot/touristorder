// La base du catalogue : les articles dont un touriste français a besoin en
// Israël. SANS PRIX : ils arrivent masqués et « à compléter » ; le gérant met
// les prix dans Admin → Prix rapides, et ils passent en ligne.
// Options : une par ligne, « Nom : choix 1 | choix 2 » (voir lib/options.ts).

export const CATEGORIES = [
  { nom: "Courses & épicerie", emoji: "🛒" },
  { nom: "Boissons", emoji: "🥤" },
  { nom: "Fruits & légumes", emoji: "🍉" },
  { nom: "Apéro & snacks", emoji: "🥨" },
  { nom: "Bébé & enfants", emoji: "🍼" },
  { nom: "Plage & soleil", emoji: "🏖️" },
  { nom: "Chargeurs & électronique", emoji: "🔌" },
  { nom: "Vêtements", emoji: "👕" },
  { nom: "Pharmacie & hygiène", emoji: "🧴" },
  { nom: "Maison & entretien", emoji: "🧽" },
  { nom: "Shabbat & casher", emoji: "🕯️" },
  { nom: "Cadeaux & fleurs", emoji: "🎁" },
] as const;

export type ArticleCatalogue = {
  categorie: (typeof CATEGORIES)[number]["nom"];
  nom: string;
  description: string;
  boutique: string;
  options?: string;
  badge?: "populaire" | "nouveau";
};

const MARKET = "Wolt Market";
const PHARMA = "Super-Pharm";
const ELEC = "Boutique électronique";
const VETEMENTS = "Boutique vêtements";

const TAILLES_ADULTE = "Taille : S | M | L | XL | XXL";
const TAILLES_ENFANT = "Taille : 2 ans | 4 ans | 6 ans | 8 ans | 10 ans | 12 ans";

export const CATALOGUE: ArticleCatalogue[] = [
  // Courses & épicerie
  { categorie: "Courses & épicerie", nom: "Lait 3 % 1 L", description: "Bouteille de 1 litre", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Lait sans lactose 1 L", description: "Bouteille de 1 litre", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Œufs × 12", description: "Boîte de 12 œufs", boutique: MARKET, badge: "populaire" },
  { categorie: "Courses & épicerie", nom: "Beurre 200 g", description: "Doux", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Fromage blanc 5 % 250 g", description: "La « gvina levana » israélienne", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Fromage en tranches 200 g", description: "Fromage jaune pour sandwichs", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Yaourts nature × 4", description: "Pots individuels", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Pain de mie tranché", description: "Sachet", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Pitas × 10", description: "Pains pita frais", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Baguette", description: "Fraîche", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Houmous 400 g", description: "Pot familial", boutique: MARKET, badge: "populaire" },
  { categorie: "Courses & épicerie", nom: "Thon en boîte × 4", description: "À l'huile", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Pâtes 500 g", description: "Paquet", boutique: MARKET, options: "Forme : Spaghetti | Penne | Coquillettes" },
  { categorie: "Courses & épicerie", nom: "Riz 1 kg", description: "Riz blanc", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Sauce tomate", description: "Bocal", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Huile d'olive 750 ml", description: "Vierge extra", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Sel 1 kg", description: "Sel fin", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Sucre 1 kg", description: "Sucre blanc", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Café turc 200 g", description: "Café moulu à l'israélienne", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Café en capsules × 10", description: "Compatibles Nespresso", boutique: MARKET, options: "Intensité : Doux | Corsé" },
  { categorie: "Courses & épicerie", nom: "Café soluble 200 g", description: "Bocal", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Thé × 25 sachets", description: "Boîte", boutique: MARKET, options: "Sorte : Noir | Vert | Menthe" },
  { categorie: "Courses & épicerie", nom: "Céréales", description: "Petit-déjeuner", boutique: MARKET, options: "Variété : Corn flakes | Chocolat | Muesli" },
  { categorie: "Courses & épicerie", nom: "Confiture", description: "Pot", boutique: MARKET, options: "Parfum : Fraise | Abricot" },
  { categorie: "Courses & épicerie", nom: "Pâte à tartiner chocolat 400 g", description: "Pot", boutique: MARKET },
  { categorie: "Courses & épicerie", nom: "Miel 350 g", description: "Pot", boutique: MARKET },

  // Boissons
  { categorie: "Boissons", nom: "Pack d'eau 6 × 1,5 L", description: "Eau minérale", boutique: MARKET, badge: "populaire" },
  { categorie: "Boissons", nom: "Petites bouteilles d'eau 6 × 50 cl", description: "Pratique pour la plage", boutique: MARKET },
  { categorie: "Boissons", nom: "Eau gazeuse 1,5 L", description: "Bouteille", boutique: MARKET },
  { categorie: "Boissons", nom: "Coca-Cola 1,5 L", description: "Bouteille", boutique: MARKET, options: "Version : Classique | Zéro" },
  { categorie: "Boissons", nom: "Soda 1,5 L", description: "Bouteille", boutique: MARKET, options: "Goût : Sprite | Fanta" },
  { categorie: "Boissons", nom: "Thé glacé 1,5 L", description: "Pêche", boutique: MARKET },
  { categorie: "Boissons", nom: "Jus d'orange 1 L", description: "Brique", boutique: MARKET },
  { categorie: "Boissons", nom: "Bière Goldstar × 6", description: "Bouteilles de 33 cl — vente aux majeurs", boutique: MARKET },
  { categorie: "Boissons", nom: "Bouteille de vin israélien", description: "75 cl — vente aux majeurs", boutique: MARKET, options: "Type : Rouge | Blanc | Rosé" },
  { categorie: "Boissons", nom: "Glaçons 2 kg", description: "Sac", boutique: MARKET },

  // Fruits & légumes
  { categorie: "Fruits & légumes", nom: "Bananes 1 kg", description: "Environ 6 bananes", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Pommes 1 kg", description: "Environ 6 pommes", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Pastèque (demie)", description: "Bien fraîche", boutique: MARKET, badge: "populaire" },
  { categorie: "Fruits & légumes", nom: "Tomates 1 kg", description: "", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Concombres 1 kg", description: "Petits concombres israéliens", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Avocats × 3", description: "Prêts à manger", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Citrons 500 g", description: "", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Dattes Medjool 500 g", description: "Barquette", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Salade verte", description: "Une salade", boutique: MARKET },
  { categorie: "Fruits & légumes", nom: "Barquette de fruits coupés", description: "Prête à déguster", boutique: MARKET },

  // Apéro & snacks
  { categorie: "Apéro & snacks", nom: "Bamba", description: "Le snack cacahuète israélien", boutique: MARKET, options: "Format : Petit | Familial", badge: "populaire" },
  { categorie: "Apéro & snacks", nom: "Bissli", description: "Snack croustillant", boutique: MARKET, options: "Goût : Grill | Barbecue | Pizza" },
  { categorie: "Apéro & snacks", nom: "Chips", description: "Grand paquet", boutique: MARKET, options: "Goût : Nature | Paprika" },
  { categorie: "Apéro & snacks", nom: "Fruits secs salés 200 g", description: "Sachet", boutique: MARKET, options: "Sorte : Cacahuètes | Pistaches | Mélange" },
  { categorie: "Apéro & snacks", nom: "Tablette de chocolat au lait", description: "100 g", boutique: MARKET },
  { categorie: "Apéro & snacks", nom: "Biscuits petit-beurre", description: "Paquet", boutique: MARKET },
  { categorie: "Apéro & snacks", nom: "Pot de glace 1 L", description: "Livré bien froid", boutique: MARKET, options: "Parfum : Vanille | Chocolat | Fraise" },
  { categorie: "Apéro & snacks", nom: "Bonbons", description: "Sachet", boutique: MARKET },

  // Bébé & enfants
  { categorie: "Bébé & enfants", nom: "Couches Huggies", description: "Grand paquet", boutique: PHARMA, options: "Taille : 1 | 2 | 3 | 4 | 5 | 6", badge: "populaire" },
  { categorie: "Bébé & enfants", nom: "Couches-culottes de piscine", description: "Paquet", boutique: PHARMA, options: "Taille : S | M | L" },
  { categorie: "Bébé & enfants", nom: "Lingettes bébé", description: "Paquet de 72", boutique: PHARMA },
  { categorie: "Bébé & enfants", nom: "Lait infantile en poudre", description: "Précise la marque en note si besoin", boutique: PHARMA, options: "Âge : 1er âge | 2e âge | 3e âge" },
  { categorie: "Bébé & enfants", nom: "Petits pots × 4", description: "Dès 6 mois", boutique: PHARMA, options: "Goût : Légumes | Fruits" },
  { categorie: "Bébé & enfants", nom: "Biberon 250 ml", description: "", boutique: PHARMA },
  { categorie: "Bébé & enfants", nom: "Tétine", description: "", boutique: PHARMA, options: "Âge : 0-6 mois | 6-18 mois" },
  { categorie: "Bébé & enfants", nom: "Crème pour le change", description: "Tube", boutique: PHARMA },
  { categorie: "Bébé & enfants", nom: "Sérum physiologique", description: "Dosettes × 30", boutique: PHARMA },
  { categorie: "Bébé & enfants", nom: "Body bébé coton", description: "Lot de 2", boutique: VETEMENTS, options: "Taille : 3 mois | 6 mois | 12 mois | 18 mois" },

  // Plage & soleil
  { categorie: "Plage & soleil", nom: "Crème solaire SPF 50", description: "200 ml", boutique: PHARMA, options: "Pour : Adulte | Enfant", badge: "populaire" },
  { categorie: "Plage & soleil", nom: "Crème solaire SPF 30", description: "200 ml", boutique: PHARMA },
  { categorie: "Plage & soleil", nom: "Après-soleil", description: "Lait apaisant", boutique: PHARMA },
  { categorie: "Plage & soleil", nom: "Serviette de plage", description: "Grande taille", boutique: VETEMENTS },
  { categorie: "Plage & soleil", nom: "Chapeau de soleil", description: "", boutique: VETEMENTS, options: "Taille : Enfant | Adulte" },
  { categorie: "Plage & soleil", nom: "Lunettes de soleil", description: "Protection UV", boutique: VETEMENTS, options: "Taille : Enfant | Adulte" },
  { categorie: "Plage & soleil", nom: "Tongs adulte", description: "", boutique: VETEMENTS, options: "Pointure : 36-37 | 38-39 | 40-41 | 42-43 | 44-45" },
  { categorie: "Plage & soleil", nom: "Maillot de bain enfant", description: "", boutique: VETEMENTS, options: `${TAILLES_ENFANT}\nModèle : Garçon | Fille` },
  { categorie: "Plage & soleil", nom: "Maillot de bain homme", description: "Short de bain", boutique: VETEMENTS, options: TAILLES_ADULTE },
  { categorie: "Plage & soleil", nom: "Maillot de bain femme", description: "", boutique: VETEMENTS, options: `${TAILLES_ADULTE}\nModèle : Une pièce | Deux pièces` },
  { categorie: "Plage & soleil", nom: "Brassards de natation", description: "Pour enfant", boutique: PHARMA },
  { categorie: "Plage & soleil", nom: "Bouée enfant", description: "Gonflable", boutique: PHARMA },
  { categorie: "Plage & soleil", nom: "Matkot (raquettes de plage)", description: "Le jeu de plage israélien, avec balle", boutique: VETEMENTS, badge: "nouveau" },
  { categorie: "Plage & soleil", nom: "Seau et pelle de plage", description: "Pour les petits", boutique: PHARMA },
  { categorie: "Plage & soleil", nom: "Glacière souple", description: "Pour pique-nique et plage", boutique: MARKET },

  // Chargeurs & électronique
  { categorie: "Chargeurs & électronique", nom: "Chargeur téléphone 20 W", description: "Avec câble", boutique: ELEC, options: "Modèle : iPhone (Lightning) | iPhone 15 et + (USB-C) | Android (USB-C)", badge: "populaire" },
  { categorie: "Chargeurs & électronique", nom: "Câble de recharge 1 m", description: "", boutique: ELEC, options: "Type : USB-C | Lightning | Micro-USB" },
  { categorie: "Chargeurs & électronique", nom: "Adaptateur prise Israël (type H)", description: "Pour brancher tes appareils français", boutique: ELEC, badge: "populaire" },
  { categorie: "Chargeurs & électronique", nom: "Batterie externe 10 000 mAh", description: "Recharge 2 téléphones", boutique: ELEC },
  { categorie: "Chargeurs & électronique", nom: "Écouteurs filaires", description: "", boutique: ELEC, options: "Prise : USB-C | Lightning | Jack" },
  { categorie: "Chargeurs & électronique", nom: "Multiprise 3 prises", description: "Prises israéliennes", boutique: ELEC },
  { categorie: "Chargeurs & électronique", nom: "Chargeur voiture USB", description: "Allume-cigare", boutique: ELEC },
  { categorie: "Chargeurs & électronique", nom: "Carte SIM israélienne prépayée", description: "Internet et appels — préciser la durée du séjour en note", boutique: ELEC },
  { categorie: "Chargeurs & électronique", nom: "Piles AA × 4", description: "", boutique: ELEC, options: "Format : AA | AAA" },

  // Vêtements
  { categorie: "Vêtements", nom: "T-shirt adulte", description: "Coton", boutique: VETEMENTS, options: `${TAILLES_ADULTE}\nCouleur : Blanc | Noir` },
  { categorie: "Vêtements", nom: "T-shirt enfant", description: "Coton", boutique: VETEMENTS, options: TAILLES_ENFANT },
  { categorie: "Vêtements", nom: "Short adulte", description: "", boutique: VETEMENTS, options: TAILLES_ADULTE },
  { categorie: "Vêtements", nom: "Short enfant", description: "", boutique: VETEMENTS, options: TAILLES_ENFANT },
  { categorie: "Vêtements", nom: "Chaussettes × 3 paires", description: "", boutique: VETEMENTS, options: "Pointure : Enfant | 36-40 | 41-46" },
  { categorie: "Vêtements", nom: "Sous-vêtements (lot de 3)", description: "", boutique: VETEMENTS, options: `Pour : Homme | Femme\n${TAILLES_ADULTE}` },
  { categorie: "Vêtements", nom: "Sweat léger", description: "Pour les soirées fraîches", boutique: VETEMENTS, options: TAILLES_ADULTE },
  { categorie: "Vêtements", nom: "Pyjama enfant", description: "", boutique: VETEMENTS, options: TAILLES_ENFANT },

  // Pharmacie & hygiène
  { categorie: "Pharmacie & hygiène", nom: "Paracétamol (Acamol)", description: "Boîte de comprimés", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Ibuprofène (Advil)", description: "Boîte de comprimés", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Pansements", description: "Boîte assortie", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Anti-moustiques", description: "Spray corps", boutique: PHARMA, options: "Pour : Adulte | Enfant", badge: "populaire" },
  { categorie: "Pharmacie & hygiène", nom: "Crème apaisante piqûres", description: "Tube", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Thermomètre", description: "Électronique", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Brosse à dents + dentifrice", description: "Kit voyage", boutique: PHARMA, options: "Pour : Adulte | Enfant" },
  { categorie: "Pharmacie & hygiène", nom: "Déodorant", description: "", boutique: PHARMA, options: "Pour : Homme | Femme" },
  { categorie: "Pharmacie & hygiène", nom: "Shampoing", description: "Flacon", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Gel douche", description: "Flacon", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Rasoirs jetables × 5", description: "", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Serviettes hygiéniques", description: "Paquet", boutique: PHARMA, options: "Taille : Normal | Long | Nuit" },
  { categorie: "Pharmacie & hygiène", nom: "Tampons", description: "Boîte", boutique: PHARMA, options: "Taille : Normal | Super" },
  { categorie: "Pharmacie & hygiène", nom: "Solution pour lentilles 360 ml", description: "Avec étui", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Coton-tiges", description: "Boîte", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Mouchoirs × 10 paquets", description: "", boutique: PHARMA },
  { categorie: "Pharmacie & hygiène", nom: "Gel hydroalcoolique", description: "Flacon de poche", boutique: PHARMA },

  // Maison & entretien
  { categorie: "Maison & entretien", nom: "Papier toilette × 8", description: "", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Essuie-tout × 2", description: "", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Sacs poubelle", description: "Rouleau", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Liquide vaisselle", description: "Flacon", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Éponges × 3", description: "", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Lessive en capsules", description: "Boîte", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Vaisselle jetable (10 personnes)", description: "Assiettes, couverts et gobelets", boutique: MARKET },
  { categorie: "Maison & entretien", nom: "Gobelets jetables × 50", description: "", boutique: MARKET },

  // Shabbat & casher
  { categorie: "Shabbat & casher", nom: "Bougies de Shabbat", description: "Boîte", boutique: MARKET, badge: "populaire" },
  { categorie: "Shabbat & casher", nom: "Vin de Kiddoush", description: "Bouteille 75 cl, casher — vente aux majeurs", boutique: MARKET },
  { categorie: "Shabbat & casher", nom: "Jus de raisin pour Kiddoush", description: "Bouteille 1 L, casher", boutique: MARKET },
  { categorie: "Shabbat & casher", nom: "Challot × 2", description: "Pains de Shabbat", boutique: MARKET },
  { categorie: "Shabbat & casher", nom: "Allumettes", description: "", boutique: MARKET },
  { categorie: "Shabbat & casher", nom: "Plata (plaque chauffante de Shabbat)", description: "Pour garder les plats au chaud", boutique: ELEC },
  { categorie: "Shabbat & casher", nom: "Minuterie de Shabbat", description: "Prise programmable", boutique: ELEC },
  { categorie: "Shabbat & casher", nom: "Bougie de Havdala", description: "", boutique: MARKET },

  // Cadeaux & fleurs
  { categorie: "Cadeaux & fleurs", nom: "Bouquet de fleurs", description: "Composé le jour même", boutique: "Fleuriste", options: "Taille : Moyen | Grand" },
  { categorie: "Cadeaux & fleurs", nom: "Boîte de chocolats", description: "À offrir", boutique: MARKET },
  { categorie: "Cadeaux & fleurs", nom: "Ballon à l'hélium", description: "Pour un anniversaire — précise le message en note", boutique: "Boutique de fête", options: "Forme : Cœur | Étoile | Chiffre" },
  { categorie: "Cadeaux & fleurs", nom: "Gâteau d'anniversaire", description: "Commande la veille si possible", boutique: "Pâtisserie", options: "Taille : 6 parts | 10 parts\nParfum : Chocolat | Fruits" },
  { categorie: "Cadeaux & fleurs", nom: "Bougies d'anniversaire", description: "Avec chiffres", boutique: MARKET },
  { categorie: "Cadeaux & fleurs", nom: "Carte de vœux", description: "", boutique: MARKET },
];

// Des plages tarifaires d'exemple, créées seulement si aucune n'existe encore.
// Montants à ajuster dans Admin → Tarifs.
export const PLAGES_EXEMPLE = [
  { nom: "Week-end", jours: [5, 6], debut: "00:00", fin: "00:00", fraisService: 2000, fraisLivraison: 4000, fraisExpress: 3000, majorationPct: 0, ordre: 10 },
  { nom: "Soirée & nuit", jours: [0, 1, 2, 3, 4, 5, 6], debut: "21:00", fin: "08:00", fraisService: 2000, fraisLivraison: 4500, fraisExpress: 0, majorationPct: 10, ordre: 20 },
];
