// Les photos libres de droits du catalogue (fruits, légumes, viande, poisson, œufs) : d'où elles
// viennent, qui les a faites, sous quelle licence. Elles sont dans public/produits/frais, recadrées
// en carré et allégées. La page /credits affiche cette liste : c'est l'attribution que les licences
// demandent. Ajouter une photo = ajouter sa ligne ici (tests/photos.test.ts le vérifie).
export type CreditPhoto = {
  fichier: string;
  sujet: string;
  auteur: string;
  licence: string;
  lienLicence: string; // vide pour le domaine public
  source: string; // la page de la photo sur Wikimedia Commons
};

export const DOSSIER_PHOTOS_FRAIS = "/produits/frais";

/** Les licences acceptées : domaine public, CC0, CC BY et CC BY-SA (attribution sur /credits). Jamais la GFDL seule. */
export const LICENCES_ACCEPTEES = /^(CC0|Domaine public|CC BY(-SA)? \d\.\d)$/;

export const CREDITS_PHOTOS: CreditPhoto[] = [
  { fichier: "ail.jpg", sujet: "Ail", auteur: "Dubravko Sorić SoraZG on Flickr", licence: "CC BY 2.0", lienLicence: "https://creativecommons.org/licenses/by/2.0", source: "https://commons.wikimedia.org/wiki/File:Opened_garlic_bulb_with_garlic_clove.jpg" },
  { fichier: "ail-epluche.jpg", sujet: "Ail épluché", auteur: "Fumikas Sagisavas", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Peeled_garlic_cloves.jpg" },
  { fichier: "aubergines.jpg", sujet: "Aubergines", auteur: "MBATAKA", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Une_aubergine.jpg" },
  { fichier: "avocats.jpg", sujet: "Avocats", auteur: "Fumikas Sagisavas", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Avocados_sold_in_supermarkets.jpg" },
  { fichier: "avocats-coupes.jpg", sujet: "Avocats mûrs", auteur: "Wilfredor", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Persea_americana_from_Canadian_supermarket.jpg" },
  { fichier: "bananes.jpg", sujet: "Bananes", auteur: "Wilfredor", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Cavendish_banana_from_Maracaibo.jpg" },
  { fichier: "poulet-blanc.jpg", sujet: "Blanc de poulet", auteur: "kakyusei", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Raw_chicken_slices.jpg" },
  { fichier: "carottes.jpg", sujet: "Carottes", auteur: "domdomegg", licence: "CC BY 4.0", lienLicence: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Carrots_at_Ljubljana_Central_Market.JPG" },
  { fichier: "champignons.jpg", sujet: "Champignons de Paris", auteur: "Darkone", licence: "CC BY-SA 2.5", lienLicence: "https://creativecommons.org/licenses/by-sa/2.5", source: "https://commons.wikimedia.org/wiki/File:Champignons_Agaricus.jpg" },
  { fichier: "chou.jpg", sujet: "Chou blanc", auteur: "Scot Nelson", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Cabbage_(Brassica_oleracea)_Black_rot_(35710676671).jpg" },
  { fichier: "citrons.jpg", sujet: "Citrons", auteur: "André Karwath (Aka)", licence: "CC BY-SA 2.5", lienLicence: "https://creativecommons.org/licenses/by-sa/2.5", source: "https://commons.wikimedia.org/wiki/File:Lemon.jpg" },
  { fichier: "concombres.jpg", sujet: "Concombres", auteur: "Jason Zhang", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Ryerson_Market_cucumbers_on_sale.jpg" },
  { fichier: "coriandre.jpg", sujet: "Coriandre", auteur: "Kpsudeep", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Bunches_of_coriander_leaves.jpg" },
  { fichier: "courgettes.jpg", sujet: "Courgettes", auteur: "Alexei Hulsov (alex80)", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Zucchini_vegetable_closeup_1637435.jpg" },
  { fichier: "entrecote.jpg", sujet: "Entrecôte", auteur: "HaJunkiyada", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Ribeye_steak_preparation_with_garlic_and_fresh_herbs_before_cooking.jpg" },
  { fichier: "poulet-cuisses.jpg", sujet: "Hauts de cuisse de poulet", auteur: "gran", licence: "CC BY 3.0", lienLicence: "https://creativecommons.org/licenses/by/3.0", source: "https://commons.wikimedia.org/wiki/File:Raw_chicken_thighs.jpg" },
  { fichier: "laitue.jpg", sujet: "Laitue", auteur: "Jeffery Martin", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Lettuce_in_a_stack.jpg" },
  { fichier: "romaine.jpg", sujet: "Laitue romaine", auteur: "Rainer Zenz", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0/", source: "https://commons.wikimedia.org/wiki/File:Romaine_lettuce.jpg" },
  { fichier: "melon.jpg", sujet: "Melon", auteur: "Bartleby08", licence: "CC BY 4.0", lienLicence: "https://creativecommons.org/licenses/by/4.0/", source: "https://commons.wikimedia.org/wiki/File:Nationalist_product_labeling_of_a_cantaloupe_2024.jpg" },
  { fichier: "mini-poivrons.jpg", sujet: "Mini poivrons", auteur: "HaJunkiyada", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Liat_Portal_for_Foodie_Disorder_-_Mini_Sweet_Peppers.jpg" },
  { fichier: "myrtilles.jpg", sujet: "Myrtilles", auteur: "Evan-Amos", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Blueberries-In-Pack.jpg" },
  { fichier: "oignons.jpg", sujet: "Oignons jaunes", auteur: "Colin", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Onion_on_White.JPG" },
  { fichier: "oignons-rouges.jpg", sujet: "Oignons rouges", auteur: "Colin", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Red_Onion_on_White.JPG" },
  { fichier: "oignons-verts.jpg", sujet: "Oignons verts", auteur: "Kolforn", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:-2021-11-06_Harvest_of_Scallions_(spring_onions),_Trimingham,_Norfolk.JPG" },
  { fichier: "patates-douces.jpg", sujet: "Patates douces", auteur: "Melsj", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Sweet_potatoes_2.jpg" },
  { fichier: "persil.jpg", sujet: "Persil", auteur: "Garitzko", licence: "Domaine public", lienLicence: "", source: "https://commons.wikimedia.org/wiki/File:Petersilie.jpg" },
  { fichier: "piments-verts.jpg", sujet: "Piments verts", auteur: "U.S. Air Force photo by Tech. Sgt. Michael B. Keller", licence: "Domaine public", lienLicence: "", source: "https://commons.wikimedia.org/wiki/File:Peppers_for_sale.JPG" },
  { fichier: "poivrons-rouges.jpg", sujet: "Poivrons rouges", auteur: "AntanO", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Red_bell_pepper.jpg" },
  { fichier: "poivrons-tricolores.jpg", sujet: "Poivrons tricolores", auteur: "Kham Tran - www.khamtran.com", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Green-Yellow-Red-Pepper-2009.jpg" },
  { fichier: "pommes-assorties.jpg", sujet: "Pommes assorties", auteur: "NaJina McEnany (préparée par Ram-Man)", licence: "CC BY-SA 2.5", lienLicence: "https://creativecommons.org/licenses/by-sa/2.5", source: "https://commons.wikimedia.org/wiki/File:Assorted_Red_and_Green_Apples_2120px.jpg" },
  { fichier: "pommes-de-terre.jpg", sujet: "Pommes de terre", auteur: "Judgefloro", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:2402Baby_potatoes_of_the_Philippines_06.jpg" },
  { fichier: "pommes-de-terre-rouges.jpg", sujet: "Pommes de terre rouges", auteur: "Bff", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Solanum_tuberosum_Red_Scarlett20170523_7825.jpg" },
  { fichier: "pommes-granny.jpg", sujet: "Pommes Granny Smith", auteur: "Yinan Chen", licence: "Domaine public", lienLicence: "", source: "https://commons.wikimedia.org/wiki/File:Gfp-granny-smith-apples.jpg" },
  { fichier: "pommes-pink.jpg", sujet: "Pommes roses", auteur: "Fructibus", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Pink_Lady_apples_2017_A.jpg" },
  { fichier: "poulet-decoupe.jpg", sujet: "Poulet découpé", auteur: "Dnor", licence: "Domaine public", lienLicence: "", source: "https://commons.wikimedia.org/wiki/File:Kycklingfil%C3%A9.jpg" },
  { fichier: "raisin-blanc.jpg", sujet: "Raisin blanc", auteur: "Alabama Extension", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:BUNCH_WINE_GRAPES_green_close_up_(48986980497).jpg" },
  { fichier: "raisin-rouge.jpg", sujet: "Raisin rouge", auteur: "A S M Jobaer", licence: "CC BY-SA 4.0", lienLicence: "https://creativecommons.org/licenses/by-sa/4.0", source: "https://commons.wikimedia.org/wiki/File:Close_up_of_fresh_red_grapes_at_Sadarghat_fruit_market_Dhaka.jpg" },
  { fichier: "saumon.jpg", sujet: "Saumon", auteur: "Tiia Monto", licence: "CC BY-SA 3.0", lienLicence: "https://creativecommons.org/licenses/by-sa/3.0", source: "https://commons.wikimedia.org/wiki/File:Salmon2.jpg" },
  { fichier: "tomates.jpg", sujet: "Tomates", auteur: "Jeffery Martin", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Tomatoes_for_sale.jpg" },
  { fichier: "tomates-cerises.jpg", sujet: "Tomates cerises", auteur: "Evan-Amos", licence: "CC0", lienLicence: "https://creativecommons.org/publicdomain/zero/1.0/", source: "https://commons.wikimedia.org/wiki/File:Cherry-Tomatoes-in-Pack.jpg" },
  { fichier: "oeufs.jpg", sujet: "Œufs", auteur: "Evan-Amos", licence: "Domaine public", lienLicence: "", source: "https://commons.wikimedia.org/wiki/File:6-Pack-Chicken-Eggs.jpg" },
];
