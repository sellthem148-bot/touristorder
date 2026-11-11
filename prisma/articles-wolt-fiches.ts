// Les fiches produit de Wolt Market (Netanya Center) envoyées par le gérant le 11 novembre 2026 :
// la page de chaque article (nom, format, prix, étiquettes, texte de la fiche, photo de l'emballage).
// 78 fiches : 5 décrivaient un article déjà au catalogue (leur description est enrichie, voir
// DESCRIPTIONS_ENRICHIES), les 73 autres sont les articles ci-dessous.
//
// Mêmes règles que prisma/articles-wolt.ts, et deux de plus :
// - toutes ces fiches étaient en promotion ce jour-là : `prix` = le prix NORMAL (celui qui est barré
//   sur la fiche), jamais le prix promo ;
// - une description ne dit que ce que la fiche montre (son texte, ses étiquettes « casher »,
//   « sans gluten », « végétalien »…, ce qui est écrit sur l'emballage) : rien d'inventé sur les
//   ingrédients, les allergènes ou la cacherout. La première phrase est courte : c'est elle qui
//   s'affiche dans la liste, le reste se lit dans la fiche.
//
// Installé une seule fois (prisma/remplissage.ts) : ensuite tout se gère dans l'admin.
import type { ArticleWolt } from "./articles-wolt";

const CREMERIE = "Crèmerie & œufs";
const PAIN = "Pain & pâtisserie";
const BOUCHERIE = "Boucherie & poisson";
const SURGELES = "Surgelés & glaces";
const EPICERIE = "Courses & épicerie";
const BOISSONS = "Boissons";
const SNACKS = "Apéro & snacks";
const BEBE = "Bébé & enfants";
const MAISON = "Maison & entretien";

export const ARTICLES_WOLT_FICHES: ArticleWolt[] = [
  // ── Boissons ─────────────────────────────────────────────────────────────────
  { categorie: BOISSONS, nom: "Pepsi 1,5 L", description: "Cola, la bouteille de 1,5 L. Casher.", prix: 8.5, nomWolt: "פפסי בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Pepsi canettes 6 × 33 cl", description: "Cola, le pack de 6 canettes de 33 cl. Casher.", prix: 21.9, nomWolt: "שישיית פחיות פפסי" },
  { categorie: BOISSONS, nom: "7UP Zero canettes 6 × 33 cl", description: "Boisson gazeuse zéro au citron et au citron vert, sans caféine. Le pack de 6 canettes de 33 cl. Casher.", prix: 21.9, nomWolt: "שישיית פחיות סבן אפ זירו - 330 מ״ל * 6" },
  { categorie: BOISSONS, nom: "Prigat citron-menthe 1,5 L", description: "Boisson au citron et à la menthe, la « limonana ». Bouteille de 1,5 L. Casher.", prix: 10.5, nomWolt: "פריגת לימונענע בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Prigat orange 1,5 L", description: "Boisson à l'orange, la bouteille de 1,5 L. Casher.", prix: 10.5, nomWolt: "פריגת תפוזים בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Prigat raisin 1,5 L", description: "Boisson au raisin, la bouteille de 1,5 L. Casher.", prix: 10.5, nomWolt: "פריגת משקה ענבים בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Prigat fraise-banane 1,5 L", description: "Boisson à la fraise et à la banane, la bouteille de 1,5 L. Casher.", prix: 10.5, nomWolt: "פריגת תות בננה בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Spring mangue 1,5 L", description: "Boisson aux fruits goût mangue, la bouteille de 1,5 L. Sans gluten.", prix: 9.9, nomWolt: "ספרינג מנגו בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Spring raisin 1,5 L", description: "Boisson aux fruits goût raisin, la bouteille de 1,5 L. Sans gluten.", prix: 9.9, nomWolt: "ספרינג ענבים בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Spring fruits tropicaux 1,5 L", description: "Boisson aux fruits tropicaux, la bouteille de 1,5 L. Sans gluten.", prix: 9.9, nomWolt: "ספרינג פירות טרופיים בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "San Pellegrino 1 L", description: "Eau minérale gazeuse, la bouteille d'un litre. Casher.", prix: 11.5, nomWolt: "סאן פלגרינו מים מינרליים מוגזים בקבוק - 1 ליטר" },

  // ── Crèmerie & œufs ──────────────────────────────────────────────────────────
  { categorie: CREMERIE, nom: "Lait chocolaté Tnuva 2,7 % 1 L", description: "Lait au chocolat en brique d'un litre, 2,7 % de matières grasses. Casher.", prix: 12.9, nomWolt: "שוקו תנובה 2.7% בקרטון - 1 ליטר" },
  { categorie: CREMERIE, nom: "Lait chocolaté sans sucre ajouté Tara 1 L", description: "Lait au chocolat enrichi, sans sucre ajouté. La bouteille d'un litre. Sans gluten.", prix: 15.5, nomWolt: "שוקו מועשר טרה - 1 ליטר" },
  { categorie: CREMERIE, nom: "Lait sans lactose goût vanille Tara 2 % 1 L", description: "Lait sans lactose à la vanille, 2 % de matières grasses. Sans sucre ajouté, sans conservateurs, enrichi en vitamine D. Sans gluten. Casher.", prix: 14.3, nomWolt: "חלב נטול לקטוז בטעם וניל 2% טרה - 1 ליטר" },
  { categorie: CREMERIE, nom: "Boisson au soja Alpro Barista sans sucres 1 L", description: "Boisson végétale au soja, spéciale café (Barista), sans sucres. Au rayon frais : à garder au réfrigérateur. Végétalien, sans lactose. Casher.", prix: 14.5, nomWolt: "משקה סויה אלפרו בריסטה ללא סוכר בקירור - 1 ליטר" },
  { categorie: CREMERIE, nom: "Yaourt Müller Protein cacahuètes caramélisées 170 g", description: "Yaourt protéiné, avec ses cacahuètes et ses billes croustillantes caramélisées à mélanger. 22 g de protéines. Casher.", prix: 9, nomWolt: "יוגורט מולר פרוטאין טופ בוטנים ופצפוצים מקורמלים" },
  { categorie: CREMERIE, nom: "Mini Babybel × 5 (100 g)", description: "5 petits fromages à pâte demi-dure, 24 % de matières grasses. Casher.", prix: 25.9, nomWolt: "גבינת בייבי בל 24%" },
  { categorie: CREMERIE, nom: "Mozzarella râpée Gad 22 % 300 g", description: "Mozzarella râpée à l'italienne, 22 % de matières grasses. Casher.", prix: 29.9, nomWolt: "גבינת מוצרלה מגורדת גד 22% - 300 גרם" },
  { categorie: CREMERIE, nom: "Burrata Gad 125 g", description: "Mozzarella au cœur de crème, 28 % de matières grasses. 125 g une fois égouttée. Casher.", prix: 27.9, nomWolt: "גבינת בוראטה גד 28% - 125 גרם" },
  { categorie: CREMERIE, nom: "Boule de mozzarella Piraeus 100 g", description: "Mozzarella en boule, 100 g. Casher.", prix: 13.9, nomWolt: "כדור מוצרלה פיראוס - 100 גרם" },
  { categorie: CREMERIE, nom: "Billes de mozzarella Meshek Yaakobs 18 % 150 g", description: "Petites billes de mozzarella à l'italienne : un fromage frais et tendre au lait de vache, au goût délicat. 18 % de matières grasses. Casher.", prix: 16.4, nomWolt: "מוצרלה בייבי 18% משק יעקבס - 150 גרם" },
  { categorie: CREMERIE, nom: "Fromage tzfatit doux Gad 5 % 200 g", description: "Fromage blanc ferme de Safed (la « tzfatit »), version douce, au lait de vache. 5 % de matières grasses. Casher.", prix: 20.9, nomWolt: "גבינה צפתית מעודנת גד 5% - 200 גרם" },
  { categorie: CREMERIE, nom: "Fromage bulgare doux Piraeus 5 % 250 g", description: "Fromage blanc en saumure à la bulgare, version douce. 5 % de matières grasses. Casher.", prix: 28.9, nomWolt: "גבינה בולגרית מעודנת פיראוס 5% - 250 גרם" },

  // ── Pain & pâtisserie ────────────────────────────────────────────────────────
  { categorie: PAIN, nom: "Pains à hot-dog × 6", description: "6 pains longs très moelleux façon américaine, au sésame, 540 g. Végétalien. Casher. Produit frais : se conserve jusqu'à 5 jours.", prix: 17.9, nomWolt: "לחמניות ארוכות בסגנון אמריקה - 6 יח׳" },
  { categorie: PAIN, nom: "Mini pains à hamburger Angel × 8", description: "8 petits pains à hamburger façon américaine, 400 g. Casher.", prix: 17.9, nomWolt: "מיני לחמניות המבורגר אמריקה אנג׳ל - 8 יח׳" },
  { categorie: PAIN, nom: "Baguette blanche 340 g", description: "Baguette à la farine blanche et au levain, à fermentation longue. Du rayon boulangerie de Wolt Market. Végétalien.", prix: 15, nomWolt: "בגט לבן | דליקטסן & בייקרי" },
  { categorie: PAIN, nom: "Pâte feuilletée Shimrit 300 g", description: "Pâte feuilletée fraîche, prête à l'emploi. À garder au réfrigérateur. Casher.", prix: 19.5, nomWolt: "בצק עלים מצונן לאפייה שמרית - 300 גרם" },
  { categorie: PAIN, nom: "Pâte filo Shimrit 300 g", description: "14 feuilles de pâte filo fraîche, pour les recettes sucrées comme salées. Casher.", prix: 19.5, nomWolt: "בצק פילו מצונן לאפייה שימרית - 300 גרם" },
  { categorie: PAIN, nom: "Pâte à pizza fine Shimrit 415 g", description: "Pâte à pizza fine, fraîche et prête à cuire. À garder au réfrigérateur. Casher.", prix: 18.9, nomWolt: "בצק פיצה דק מצונן ומוכן לאפייה שמרית" },

  // ── Boucherie & poisson (charcuterie) ────────────────────────────────────────
  { categorie: BOUCHERIE, nom: "Pastrami de dinde grillée Zoglobek 330 g", description: "Dinde rôtie façon grillade, en tranches. 2 % de matières grasses, riche en protéines, recette allégée en sel. Casher.", prix: 36.9, nomWolt: "פסטרמה גחלים / הודו צלויה על לבנים זוגלובק" },
  { categorie: BOUCHERIE, nom: "Pastrami au miel Zoglobek 330 g", description: "Pastrami au miel en tranches, la barquette de 330 g. Casher.", prix: 36.9, nomWolt: "פסטרמה בדבש זוגלובק - 330 גרם" },
  { categorie: BOUCHERIE, nom: "Chiffonnade de pastrami de dinde grillée Tirat Zvi 120 g", description: "Pastrami de dinde goût grillé, en tranches très fines. 1 % de matières grasses. Sans gluten.", prix: 19.5, nomWolt: "סלסולי פסטרמה גחלים טירת צבי" },
  { categorie: BOUCHERIE, nom: "Chiffonnade de pastrami au miel Tirat Zvi 120 g", description: "Pastrami au miel, en tranches très fines. Sans gluten.", prix: 19.5, nomWolt: "סלסולי פסטרמה דבש טירת צבי" },

  // ── Courses & épicerie ───────────────────────────────────────────────────────
  { categorie: EPICERIE, nom: "Houmous piquant Achla 400 g", description: "Houmous et sa sauce piquante, le pot de 400 g. Sans gluten.", prix: 13.5, nomWolt: "חומוס עם חריף אחלה - 400 גרם" },
  { categorie: EPICERIE, nom: "Salade d'aubergines piquante Achla 400 g", description: "Salade d'aubergines relevée, le pot de 400 g. Sans gluten. Casher.", prix: 14.3, nomWolt: "סלט חציל פיקנטי אחלה - 400 גרם" },
  { categorie: EPICERIE, nom: "Salade de thon du traiteur 250 g", description: "Salade de thon à l'oignon, à la mayonnaise et aux poivrons rouges. Préparée par le rayon traiteur de Wolt Market. Sans lactose.", prix: 30.8, nomWolt: "סלט טונה | דליקטסן & בייקרי" },
  { categorie: EPICERIE, nom: "Salade d'aubergines à la mayonnaise du traiteur 250 g", description: "Aubergines grillées à la flamme, ail, citron et mayonnaise. Préparées par le rayon traiteur de Wolt Market. Végétarien, sans lactose.", prix: 26.4, nomWolt: "סלט חצילים במיונז | דליקטסן & בייקרי" },
  { categorie: EPICERIE, nom: "Feuilles de vigne farcies au riz Willi Food 360 g", description: "Feuilles de vigne farcies au riz, la boîte de 360 g. Casher.", prix: 17.5, nomWolt: "עלי גפן ממולאים וילי פוד - 360 גרם" },
  { categorie: EPICERIE, nom: "Pois chiches cuits Taam HaTeva 380 g", description: "Pois chiches déjà cuits, prêts à manger. Sans gluten.", prix: 9.9, nomWolt: "גרגירי חומוס מבושלים ומוכנים לאכילה טעם הטבע" },
  { categorie: EPICERIE, nom: "Tofu nature Alternative 300 g", description: "Tofu nature de la gamme Alternative de Tnuva. 48 g de protéines. Végétalien. Casher.", prix: 14.7, nomWolt: "טופו בטעם טבעי אלטרנטיב" },
  { categorie: EPICERIE, nom: "Pâtes Barilla conchiglie rigate 500 g", description: "Pâtes courtes en forme de coquillage, à la semoule de blé dur. Casher.", prix: 9.9, nomWolt: "ברילה פסטה קונצילה ריגטה - 500 גר" },
  { categorie: EPICERIE, nom: "Sauce tomate Pomodoro Barilla 400 g", description: "Sauce tomate pour les pâtes ou la pizza, le pot de 400 g. Sans gluten.", prix: 18.9, nomWolt: "רוטב עגבניות פומודורו ברילה - 400 גרם" },
  { categorie: EPICERIE, nom: "Mayonnaise hollandaise Master Chef 435 g", description: "Mayonnaise à la hollandaise, en flacon souple de 435 g. Casher.", prix: 16.5, nomWolt: "מיונז הולנדי מאסטר שף בקבוק לחיץ - 435 גרם" },

  // ── Apéro & snacks (biscuits, chocolat, bonbons) ─────────────────────────────
  { categorie: SNACKS, nom: "Oreo vanille 176 g", description: "Biscuits au cacao fourrés à la crème à la vanille. Casher.", prix: 11.9, nomWolt: "אוראו עוגיות סנדוויץ ממולאות בקרם וניל" },
  { categorie: SNACKS, nom: "Oreo Double Crème 115 g", description: "Biscuits au cacao, double dose de crème à la vanille. Casher.", prix: 11.9, nomWolt: "עוגיות אוראו קרם וניל כפול" },
  { categorie: SNACKS, nom: "Biscuits Milka au chocolat au lait 150 g", description: "Biscuits croustillants nappés de chocolat au lait Milka, au lait des Alpes. Casher.", prix: 17.9, nomWolt: "מילקה ביסקוויטים מצופים שוקולד חלב" },
  { categorie: SNACKS, nom: "Cookies Milka Sensations fourrés Oreo 156 g", description: "Cookies au cacao et aux pépites de chocolat, façon américaine, fourrés à la crème Oreo. Casher.", prix: 17.9, nomWolt: "מילקה עוגיות שוקולד צ׳יפס קקאו ממולאות בקרם אוראו" },
  { categorie: SNACKS, nom: "Gaufrettes Milka au cacao × 5 (150 g)", description: "5 gaufrettes fourrées à la crème au cacao et enrobées de chocolat au lait. Casher.", prix: 17.9, nomWolt: "מילקה וופלים ממולאים בקרם קקאו ומצופים שוקולד חלב" },
  { categorie: SNACKS, nom: "Gâteaux moelleux Milka Soft Moo 140 g", description: "Petits gâteaux moelleux et aérés en forme de vache, goût chocolat-vanille, aux pépites de chocolat. Casher.", prix: 17.9, nomWolt: "עוגיות רכות מילקה מו" },
  { categorie: SNACKS, nom: "Cookies aux pépites de chocolat parvé 150 g", description: "Cookies aux pépites de chocolat. Parvé, casher.", prix: 8.5, nomWolt: "עוגיות שוקולד צ׳יפס מרבה פרווה - 150 גרם" },
  { categorie: SNACKS, nom: "Biscuits roulés à la fraise Osem 300 g", description: "Les « Argaliot » : petits biscuits roulés à la fraise, un classique d'Osem depuis plus de 40 ans. Casher.", prix: 14.5, nomWolt: "ערגליות תות אסם" },
  { categorie: SNACKS, nom: "Chocolat au lait Elite Crunch biscuit 100 g", description: "Tablette de chocolat au lait Elite au biscuit croustillant. Casher.", prix: 10.5, nomWolt: "עלית קראנץ׳ ביסקוויט" },
  { categorie: SNACKS, nom: "Chocolat noir Elite Splendid 70 % 100 g", description: "Tablette de chocolat noir à 70 % de cacao. Sans gluten.", prix: 19.9, nomWolt: "שוקולד ספלנדיד מריר מעולה 70%" },
  { categorie: SNACKS, nom: "Barres de céréales Slim Delice chocolat au lait × 6", description: "6 barres aux céréales complètes enrobées de chocolat au lait (120 g). Casher.", prix: 16.5, nomWolt: "מארז חטיף דגנים שוקולד חלב סלים דליס - 6 יח׳" },
  { categorie: SNACKS, nom: "Barres de céréales Slim Delice chocolat blanc × 6", description: "6 barres aux céréales complètes enrobées de chocolat blanc (120 g). Casher.", prix: 16.5, nomWolt: "מארז חטיף דגנים שוקולד לבן סלים דליס - 6 יח׳" },
  { categorie: SNACKS, nom: "Barres de céréales Slim Delice Kids chocolat blanc × 6", description: "6 barres aux céréales complètes pour les enfants, enrobage extra chocolat blanc (120 g). Casher.", prix: 16.5, nomWolt: "מארז חטיף דגנים אקסטרא שוקולד לבן סלים דליס קידס - 6 יח׳" },
  { categorie: SNACKS, nom: "Triangles soufflés betterave et sel de mer 30 g", description: "Galettes croustillantes de pomme de terre, riz et betterave, au sel de mer. Snack cuit au four, 126 kcal le sachet. Casher.", prix: 6.9, nomWolt: "חטיף פריכיות משולשות סלק מלח ים - 30 גרם" },
  { categorie: SNACKS, nom: "Triangles soufflés pomme de terre et petits pois 30 g", description: "Galettes croustillantes de pomme de terre, riz et petits pois, assaisonnées au sel de mer. Végétalien, sans gluten. Casher.", prix: 6.9, nomWolt: "חטיף פריכיות משולשות תפוא ואפונה - 30 גרם" },
  { categorie: SNACKS, nom: "Pop-corn Popco beurre et miel 80 g", description: "Pop-corn goût beurre et miel. Sans gluten. Attention : risque d'étouffement pour les enfants de moins de 5 ans.", prix: 6.9, nomWolt: "פופקו - 80 גרם" },
  { categorie: SNACKS, nom: "Bonbons Yogueta rubans acidulés multifruits 50 g", description: "Rubans gélifiés acidulés, parfums variés. Casher.", prix: 5.5, nomWolt: "שטיחי גומי חמוצים בטעמים שונים יוגוטה" },
  { categorie: SNACKS, nom: "Bonbons Yogueta rubans acidulés fraise 50 g", description: "Rubans gélifiés acidulés, goût fraise. Casher.", prix: 5.5, nomWolt: "שטיחי גומי חמוצים בטעם תות יוגוטה" },
  { categorie: SNACKS, nom: "Bonbons Yogueta bâtonnets acidulés cola 50 g", description: "Bâtonnets gélifiés acidulés, goût cola. Casher.", prix: 5.5, nomWolt: "מקלות גומי חמוצים בטעם קולה יוגוטה" },
  { categorie: SNACKS, nom: "Bonbons Yogueta serpents acidulés 150 g", description: "Bonbons gélifiés en forme de serpents, acidulés et sucrés, aux parfums de fruits. Végétarien.", prix: 13.9, nomWolt: "סוכריות גומי נחשים פירות יוגטה" },

  // ── Surgelés & glaces ────────────────────────────────────────────────────────
  { categorie: SURGELES, nom: "Magnum mini amandes × 5", description: "5 mini bâtonnets : glace à la vanille enrobée de chocolat au lait et d'amandes (250 g).", prix: 36.9, nomWolt: "מאגדת מגנום מיני שקדים" },
  { categorie: SURGELES, nom: "Magnum mini Duet chocolat-nougat 310 g", description: "Mini bâtonnets de glace à la vanille, enrobage chocolat et nougat. La boîte de 310 g. Casher.", prix: 36.9, nomWolt: "מאגדת מיני מגנום דואט שוקולד נוגט" },
  { categorie: SURGELES, nom: "Glace Crunch vanille-nougat 100 g", description: "Glace à la vanille au cœur de nougat crémeux, enrobée de chocolat au lait croustillant. Végétarien. Casher.", prix: 13.9, nomWolt: "קראנץ׳ וניל נוגט" },
  { categorie: SURGELES, nom: "Glace Crunch America nougat-cacahuète 100 g", description: "Glace Crunch goût nougat et cacahuète, édition limitée. Casher.", prix: 13.9, nomWolt: "גלידת קראנץ׳ אמריקה בטעם נוגט בוטנים" },

  // ── Bébé & enfants ───────────────────────────────────────────────────────────
  { categorie: BEBE, nom: "Couches Pampers Premium Care taille 5 × 24", description: "24 couches taille 5, avec la couche Derma Comfort.", prix: 39.5, nomWolt: "חיתולים פמפרס פרימיום מידה 5 - 24 יחידות" },

  // ── Maison & entretien ───────────────────────────────────────────────────────
  { categorie: MAISON, nom: "Papier toilette humide Lily × 4 paquets", description: "Lingettes de papier toilette humide : 4 paquets de 40, soit 160 lingettes.", prix: 25.5, nomWolt: "מארז רביעיית נייר טואלט לח לילי - 4 יחידות" },
  { categorie: MAISON, nom: "Lessive Ariel capsules taches difficiles × 23", description: "23 capsules de lessive concentrée, pour les taches tenaces et un lavage en profondeur du linge (625 g).", prix: 40.9, nomWolt: "אריאל קפסולות ג׳ל לכביסה לכתמים קשים - 23 יחידות" },
  { categorie: MAISON, nom: "Lessive Ariel capsules parfum Lenor × 23", description: "23 capsules de lessive All-in-1 au parfum frais de l'adoucissant Lenor (506 g).", prix: 40.9, nomWolt: "אריאל קפסולות ג׳ל לכביסה בניחוח לנור - 23 יחידות" },
  { categorie: MAISON, nom: "Sacs poubelle XL extra-résistants Nicol × 20", description: "20 sacs poubelle XL très résistants, pour les grandes poubelles.", prix: 29.9, nomWolt: "ניקול שקיות אשפה לפחים ענקיים 20 יח׳" },
  { categorie: MAISON, nom: "Savon mains Palmolive lait et miel 300 ml", description: "Savon liquide pour les mains, en flacon-pompe de 300 ml.", prix: 13.5, nomWolt: "סבון ידיים חלב ודבש פלמוליב - 300 מ״ל" },
];

/**
 * Les cinq fiches qui décrivaient un article déjà au catalogue (prisma/articles-wolt.ts) : sa
 * description de départ et son nouveau texte. La mise en ligne ne remplace que la description
 * restée telle quelle (retrouvée par le nom de l'article sur Wolt) : jamais un texte du gérant.
 */
export const DESCRIPTIONS_ENRICHIES: { nomWolt: string; ancienne: string; nouvelle: string }[] = [
  {
    nomWolt: "לחם בסגנון אמריקה אנג׳ל",
    ancienne: "Pain de mie moelleux",
    nouvelle: "Pain de mie moelleux façon américaine. Casher. Produit frais : se conserve jusqu'à 4 jours.",
  },
  {
    nomWolt: "לחמניות המבורגר אמריקה - 6 יח׳",
    ancienne: "6 pains moelleux, 510 g",
    nouvelle: "6 pains à hamburger façon américaine, au sésame, 510 g. Casher.",
  },
  {
    nomWolt: "נקניקיות עוף טירת צבי - 400 גרם",
    ancienne: "Saucisses type hot-dog",
    nouvelle: "Saucisses de poulet type hot-dog. Sans gluten. Pour un enfant de moins de 5 ans, le fabricant demande de les couper en fines lamelles dans la longueur, pas en rondelles.",
  },
  {
    nomWolt: "שישיית פחיות פפסי ZERO",
    ancienne: "Le pack de 6",
    nouvelle: "Cola zéro, le pack de 6 canettes de 33 cl. Casher.",
  },
  {
    nomWolt: "ניקול שקיות אשפה גודל ענק 20 יח׳",
    ancienne: "20 grands sacs",
    nouvelle: "20 sacs poubelle XXL, pour les très grandes poubelles.",
  },
];
