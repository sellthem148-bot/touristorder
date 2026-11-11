// Les photos libres de droits des produits frais : quel article reçoit quelle photo.
// Les fichiers sont dans public/produits/frais, leurs auteurs et licences dans lib/credits-photos.ts.
// Ce sont des photos d'illustration (le produit, pas l'emballage exact) : seulement pour des produits
// sans marque — fruits, légumes, œufs, viande et poisson à la coupe. Jamais pour un article de marque.
// Installées UNE SEULE FOIS (prisma/remplissage.ts), et seulement sur un article qui n'a pas de photo :
// une photo posée par le gérant n'est jamais remplacée.

/** Nom de l'article (celui de prisma/articles-wolt.ts) → fichier de public/produits/frais. */
export const PHOTOS_FRAIS: Record<string, string> = {
  // Fruits
  "Bananes 1 kg": "bananes.jpg",
  "Bananes bio 600 g": "bananes.jpg",
  "Pommes Pink Crispy 1 kg": "pommes-pink.jpg",
  "Pommes Granny Smith 1 kg": "pommes-granny.jpg",
  "Pommes assorties 1 kg": "pommes-assorties.jpg",
  "Raisin rouge 1,1 kg": "raisin-rouge.jpg",
  "Raisin blanc Autumn Crisp 1,2 kg": "raisin-blanc.jpg",
  "Melon": "melon.jpg",
  "Myrtilles 125 g": "myrtilles.jpg",
  "Citrons 1 kg": "citrons.jpg",
  "Avocats mûrs × 2": "avocats-coupes.jpg",
  "Avocats à mûrir 1 kg": "avocats.jpg",
  // Légumes
  "Tomates 850 g": "tomates.jpg",
  "Tomates Tamar 1 kg": "tomates.jpg",
  "Tomates Maggie 1,35 kg": "tomates.jpg",
  "Tomates cerises Tamar 450 g": "tomates-cerises.jpg",
  "Tomates cerises Lobello 950 g": "tomates-cerises.jpg",
  "Concombres 1 kg": "concombres.jpg",
  "Concombres bio 500 g": "concombres.jpg",
  "Mini concombres 300 g": "concombres.jpg",
  "Poivrons rouges 700 g": "poivrons-rouges.jpg",
  "Poivrons tricolores 500 g": "poivrons-tricolores.jpg",
  "Mini poivrons doux 250 g": "mini-poivrons.jpg",
  "Piments verts forts 500 g": "piments-verts.jpg",
  "Aubergines 650 g": "aubergines.jpg",
  "Courgettes 1 kg": "courgettes.jpg",
  "Carottes 1,3 kg": "carottes.jpg",
  "Patates douces 1 kg": "patates-douces.jpg",
  "Pommes de terre Butter 1,3 kg": "pommes-de-terre.jpg",
  "Pommes de terre gourmet 2,75 kg": "pommes-de-terre.jpg",
  "Pommes de terre rouges 2,75 kg": "pommes-de-terre-rouges.jpg",
  "Oignons jaunes 900 g": "oignons.jpg",
  "Oignons rouges 900 g": "oignons-rouges.jpg",
  "Oignons verts": "oignons-verts.jpg",
  "Ail": "ail.jpg",
  "Ail épluché 170 g": "ail-epluche.jpg",
  "Chou blanc": "chou.jpg",
  "Laitue Lalique": "laitue.jpg",
  "Cœurs de laitue romaine 400 g": "romaine.jpg",
  "Champignons de Paris 250 g": "champignons.jpg",
  "Champignons, lot de 2 barquettes 500 g": "champignons.jpg",
  "Coriandre fraîche": "coriandre.jpg",
  "Persil frais": "persil.jpg",
  // Œufs
  "Œufs calibre L × 12": "oeufs.jpg",
  "Œufs calibre M × 12": "oeufs.jpg",
  "Œufs calibre L × 18": "oeufs.jpg",
  "Œufs bio calibre L × 12": "oeufs.jpg",
  // Viande et poisson à la coupe
  "Blanc de poulet frais, environ 1 kg": "poulet-blanc.jpg",
  "Escalopes de poulet fraîches (schnitzel), environ 1 kg": "poulet-decoupe.jpg",
  "Aiguillettes de poulet fraîches, environ 500 g": "poulet-decoupe.jpg",
  "Émincé de poulet frais, environ 1 kg": "poulet-decoupe.jpg",
  "Steaks de pargit frais, environ 800 g": "poulet-cuisses.jpg",
  "Entrecôte de bœuf fraîche, environ 500 g": "entrecote.jpg",
  "Filet de saumon frais, environ 650 g": "saumon.jpg",
  "Pavé de saumon frais, environ 220 g": "saumon.jpg",
};
