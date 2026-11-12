// Les articles réels de Wolt Market (Netanya Center), avec leur prix : relevé du 10 novembre 2026.
//
// - `prix` = le prix NORMAL sur Wolt (en shekels). Quand Wolt affichait une promotion ce jour-là,
//   on a gardé « l'ancien prix » : une promo s'arrête sans prévenir, le prix du site ne doit pas
//   devenir plus bas que ce que l'article coûte.
// - `nomWolt` = le nom exact sur Wolt (hébreu) : réservé au gérant, pour retrouver l'article.
// - `environ` = vendu au poids chez Wolt : le prix est celui du poids annoncé, il varie un peu.
// - `horsLigne` = installé mais pas montré aux clients tant que le gérant ne l'a pas mis en ligne.
//
// Installé une seule fois (prisma/remplissage.ts) : ensuite les prix se gèrent dans l'admin.

export const CATEGORIES_WOLT = [
  { nom: "Crèmerie & œufs", emoji: "🥛", ordre: 12 },
  { nom: "Pain & pâtisserie", emoji: "🥖", ordre: 14 },
  { nom: "Boucherie & poisson", emoji: "🥩", ordre: 32 },
  { nom: "Surgelés & glaces", emoji: "🧊", ordre: 34 },
] as const;

export type CategorieWolt =
  | (typeof CATEGORIES_WOLT)[number]["nom"]
  // Le rayon « Boucherie & poisson » depuis que la viande est retirée (prisma/retrait-viande.ts).
  | "Poisson"
  | "Courses & épicerie"
  | "Boissons"
  | "Fruits & légumes"
  | "Apéro & snacks"
  | "Bébé & enfants"
  | "Maison & entretien"
  | "Shabbat & casher"
  | "Chargeurs & électronique";

export type ArticleWolt = {
  categorie: CategorieWolt;
  nom: string;
  description: string;
  /** Prix normal sur Wolt, en shekels. */
  prix: number;
  nomWolt: string;
  populaire?: boolean;
  environ?: boolean;
  horsLigne?: boolean;
};

export const BOUTIQUE_WOLT = "Wolt Market Netanya Center";

const CREMERIE = "Crèmerie & œufs";
const PAIN = "Pain & pâtisserie";
const BOUCHERIE = "Boucherie & poisson";
const SURGELES = "Surgelés & glaces";
const EPICERIE = "Courses & épicerie";
const BOISSONS = "Boissons";
const FRUITS = "Fruits & légumes";
const SNACKS = "Apéro & snacks";
const BEBE = "Bébé & enfants";
const MAISON = "Maison & entretien";
const SHABBAT = "Shabbat & casher";

const POIDS = "Vendu au poids : le poids, et donc le prix, peut varier un peu.";

export const ARTICLES_WOLT: ArticleWolt[] = [
  // ── Crèmerie & œufs ──────────────────────────────────────────────────────────
  { categorie: CREMERIE, nom: "Œufs calibre L × 12", description: "Boîte de 12 gros œufs", prix: 14.54, nomWolt: "קרטון ביצים רגילות L יח׳ 12 - מחיר מפוקח", populaire: true },
  { categorie: CREMERIE, nom: "Œufs calibre M × 12", description: "Boîte de 12 œufs moyens", prix: 13.4, nomWolt: "קרטון ביצים רגילות M יח׳ 12 - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Œufs calibre L × 18", description: "Boîte de 18 gros œufs", prix: 21.81, nomWolt: "קרטון ביצים רגילות L יח׳ 18 - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Œufs bio calibre L × 12", description: "Boîte de 12 gros œufs bio", prix: 28.9, nomWolt: "קרטון ביצים אורגניות L - יח׳ 12" },
  { categorie: CREMERIE, nom: "Lait Tnuva 3 % 1 L", description: "Lait frais, 1 litre", prix: 7.35, nomWolt: "חלב תנובה מהדרין 3% 1 ליטר - מחיר מפוקח", populaire: true },
  { categorie: CREMERIE, nom: "Lait Tnuva 1 % 1 L", description: "Lait frais à 1 % de matière grasse, 1 litre", prix: 6.92, nomWolt: "חלב תנובה 1% 1 ליטר - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Lait Tara 3 % 1 L", description: "Lait frais, 1 litre", prix: 7.35, nomWolt: "חלב טרה 3% 1 ליטר - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Lait Tara 3 % 2 L", description: "Lait frais, brique de 2 litres", prix: 14.7, nomWolt: "חלב טרה 3% בקרטון 2 ליטר - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Lait enrichi Yotvata 3 % 1 L", description: "Lait frais enrichi, bouteille de 1 litre", prix: 9.9, nomWolt: "יטבתה בקבוק חלב מועשר 3% - 1 ליטר" },
  { categorie: CREMERIE, nom: "Lait sans lactose Yotvata 2 % 1 L", description: "Bouteille de 1 litre", prix: 10.7, nomWolt: "חלב נטול לקטוז 2% יטבתה - 1 ליטר" },
  { categorie: CREMERIE, nom: "Lait sans lactose Tara 2 % 1 L", description: "Bouteille de 1 litre", prix: 11.2, nomWolt: "טרה בקבוק חלב נטול לקטוז 2% - 1 ליטר" },
  { categorie: CREMERIE, nom: "Lait sans lactose Tnuva 2 % 1 L", description: "Brique de 1 litre", prix: 10.5, nomWolt: "חלב נטול לקטוז 2% תנובה - 1 ליטר" },
  { categorie: CREMERIE, nom: "Lait pour café Tnuva 2 % 80 cl", description: "Lait spécial café, 800 ml", prix: 9.9, nomWolt: "חלב לקפה 2% תנובה - 800 מ״ל" },
  { categorie: CREMERIE, nom: "Lait chocolaté Yotvata 1 L", description: "Le « Choco » israélien, bouteille de 1 litre", prix: 14.2, nomWolt: "יטבתה שוקו בקבוק - 1 ליטר" },
  { categorie: CREMERIE, nom: "Boisson au soja vanille Alternative 1 L", description: "Boisson végétale, 1 litre", prix: 14.1, nomWolt: "משקה סויה וניל אלטרנטיב - 1 ליטר" },
  { categorie: CREMERIE, nom: "Beurre Tnuva 200 g", description: "Beurre doux", prix: 10.5, nomWolt: "חמאה מהדרין תנובה - 200 גרם" },
  { categorie: CREMERIE, nom: "Crème de cuisson Yotvata 15 % 25 cl", description: "Crème liquide pour la cuisine", prix: 9.7, nomWolt: "שמנת לבישול 15% יטבתה - 250 מ\"ל" },
  { categorie: CREMERIE, nom: "Crème à fouetter Tnuva 38 % 50 cl", description: "Crème entière, pour la chantilly", prix: 15.28, nomWolt: "שמנת להקצפה 38% תנובה 500 מ״ל - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Cottage Tnuva 5 % 250 g", description: "Fromage frais en grains, le classique israélien", prix: 6.4, nomWolt: "קוטג׳ תנובה 5% מהדרין - 250 גרם" },
  { categorie: CREMERIE, nom: "Cottage Tnuva 9 % 250 g", description: "Fromage frais en grains, plus crémeux", prix: 6.4, nomWolt: "קוטג׳ תנובה 9% מהדרין - 250 גרם" },
  { categorie: CREMERIE, nom: "Cottage Tara 5 % 250 g", description: "Fromage frais en grains", prix: 7.2, nomWolt: "קוטג׳ טרה 5% - 250 גרם" },
  { categorie: CREMERIE, nom: "Cottage Strauss 5 % 250 g", description: "Fromage frais en grains", prix: 7.2, nomWolt: "קוטג׳ שטראוס 5% - 250 גרם" },
  { categorie: CREMERIE, nom: "Fromage blanc Tnuva 5 % 500 g", description: "La « gvina levana » israélienne, à tartiner", prix: 11.74, nomWolt: "גבינה לבנה תנובה 5% 500 גרם - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Fromage blanc Strauss 5 % 500 g", description: "La « gvina levana » israélienne, à tartiner", prix: 11.74, nomWolt: "גבינה לבנה שטראוס 5% 500 גרם - מחיר מפוקח" },
  { categorie: CREMERIE, nom: "Philadelphia 25 % 150 g", description: "Fromage frais à tartiner", prix: 17.5, nomWolt: "גבינת שמנת פילדלפיה 25% - 150 גרם" },
  { categorie: CREMERIE, nom: "Fromage à tartiner Napoléon 25 % 225 g", description: "Fromage frais crémeux", prix: 17.9, nomWolt: "גבינת שמנת נפוליאון 25% - 225 גרם" },
  { categorie: CREMERIE, nom: "Fromage en tranches Emek 28 % 200 g", description: "Le « fromage jaune » israélien, pour sandwichs et toasts", prix: 19.9, nomWolt: "גבינה צהובה עמק 28% - 200 גרם" },
  { categorie: CREMERIE, nom: "Fromage en tranches Emek 28 % 400 g", description: "Le « fromage jaune » israélien, grand format", prix: 37, nomWolt: "גבינה צהובה עמק 28% - 400 גרם" },
  { categorie: CREMERIE, nom: "Fromage en tranches Emek allégé 15 % 200 g", description: "Fromage jaune allégé", prix: 19.9, nomWolt: "גבינה צהובה עמק מהדרין 15% - 200 גרם" },
  { categorie: CREMERIE, nom: "Fromage en tranches Emek léger 9 % 400 g", description: "Fromage jaune léger, grand format", prix: 37.9, nomWolt: "גבינה צהובה לייט עמק 9% - 400 גרם" },
  { categorie: CREMERIE, nom: "Fromage en tranches Gilboa 22 % 400 g", description: "Fromage jaune, grand format", prix: 28.9, nomWolt: "גבינה צהובה גלבוע 22% - 400 גרם" },
  { categorie: CREMERIE, nom: "Bâtonnets de mozzarella Emek 172 g", description: "À grignoter", prix: 21.9, nomWolt: "אצבעות מוצרלה 20% עמק - 172 גרם" },
  { categorie: CREMERIE, nom: "Yaourt grec Danone 6,5 %", description: "Pot de 130 g", prix: 4.1, nomWolt: "יוגורט דנונה יווני 6.5%" },
  { categorie: CREMERIE, nom: "Danone Crunch riz soufflé", description: "Yaourt et billes croustillantes, 173 g", prix: 5.6, nomWolt: "דנונה קראנצ' פצפוצים שטראוס" },
  { categorie: CREMERIE, nom: "Actimel fraise × 8", description: "8 petites bouteilles", prix: 23.9, nomWolt: "אקטימל משקה יוגורט פרוביוטי בטעם תות - 8 יח׳" },
  { categorie: CREMERIE, nom: "Milky chocolat × 8", description: "La crème dessert chocolat et chantilly, 8 pots", prix: 24.2, nomWolt: "מאגדת מילקי מעדן שוקולד - 170 מ\"ל * 8" },
  { categorie: CREMERIE, nom: "Milky Top", description: "Crème dessert chocolat et chantilly, 170 ml", prix: 5.7, nomWolt: "מעדן מילקי טופ מגולגלת" },
  { categorie: CREMERIE, nom: "Dessert au fromage Daniela vanille", description: "Petit pot de 88 g", prix: 4.4, nomWolt: "מעדן גבינה דניאלה בטעם וניל" },
  { categorie: CREMERIE, nom: "Dessert au fromage Daniela fraise", description: "Petit pot de 88 g", prix: 4.4, nomWolt: "מעדן גבינה דניאלה בטעם תות" },
  { categorie: CREMERIE, nom: "Boisson protéinée Yotvata Pro café 35 cl", description: "Sans sucres ajoutés", prix: 8.9, nomWolt: "משקה חלבון יטבתה פרו ללא סוכר קפה" },
  { categorie: CREMERIE, nom: "Boisson protéinée Yotvata Pro chocolat-noisette 35 cl", description: "Sans sucres ajoutés", prix: 8.9, nomWolt: "משקה חלבון יטבתה פרו ללא סוכר שוקולד ואגוזים" },
  { categorie: CREMERIE, nom: "Boisson protéinée Müller café 35 cl", description: "0 % de matières grasses", prix: 9.2, nomWolt: "משקה חלבון מולר בטעם קפה 0% שומן - 350 מ״ל" },

  // ── Pain & pâtisserie ────────────────────────────────────────────────────────
  { categorie: PAIN, nom: "Pain tranché Angel 900 g", description: "Pain blanc tranché, le pain de tous les jours", prix: 9.96, nomWolt: "לחם אחיד פרוס אנג׳ל 900 גרם - מחיר מפוקח", populaire: true },
  { categorie: PAIN, nom: "Pain de mie américain Angel 500 g", description: "Pain de mie moelleux façon américaine. Casher. Produit frais : se conserve jusqu'à 4 jours.", prix: 19.5, nomWolt: "לחם בסגנון אמריקה אנג׳ל" },
  { categorie: PAIN, nom: "Pain de mie pour toasts Agmi 500 g", description: "Pain de mie tranché", prix: 14.9, nomWolt: "לחם טוסט אמריקה אגמי" },
  { categorie: PAIN, nom: "Pain épeautre et blé complet Angel 750 g", description: "Pain complet tranché", prix: 19.9, nomWolt: "לחם כוסמין וחיטה מלאה אנג׳ל" },
  { categorie: PAIN, nom: "Pain protéiné pauvre en glucides Agmi 400 g", description: "Pain tranché riche en protéines", prix: 24.9, nomWolt: "לחם פרו דל פחמימות אגמי" },
  { categorie: PAIN, nom: "Pitas Angel × 8", description: "8 pitas, 880 g", prix: 16.9, nomWolt: "פיתות אנג׳ל 8 יח׳", populaire: true },
  { categorie: PAIN, nom: "Pitas à l'épeautre Angel × 8", description: "8 pitas, 400 g", prix: 18.5, nomWolt: "פיתות כוסמין אנג׳ל 8 יח׳" },
  { categorie: PAIN, nom: "Pitas protéinées Angel Pro × 8", description: "8 pitas, 500 g", prix: 22.9, nomWolt: "פיתות פרו אנג׳ל - 8 פיתות" },
  { categorie: PAIN, nom: "Mini pitas épeautre complet Agmi 450 g", description: "Petites pitas à garnir", prix: 18.9, nomWolt: "פיתה ביס כוסמין מלא אגמי" },
  { categorie: PAIN, nom: "Petits pains allongés Agmi × 10", description: "Pour sandwichs et hot-dogs, 750 g", prix: 16.9, nomWolt: "לחמניות אצבע 10 יחידות אגמי" },
  { categorie: PAIN, nom: "Pains à hamburger × 6", description: "6 pains à hamburger façon américaine, au sésame, 510 g. Casher.", prix: 17.9, nomWolt: "לחמניות המבורגר אמריקה - 6 יח׳" },
  { categorie: PAIN, nom: "Cheesecake Lotus Daniel Amit 1 kg", description: "Gâteau au fromage et au spéculoos, du pâtissier Daniel Amit", prix: 169, nomWolt: "עוגת גבינה לוטוס של דניאל עמית" },
  { categorie: PAIN, nom: "Gâteau au chocolat Daniel Amit 950 g", description: "Du pâtissier Daniel Amit", prix: 139.9, nomWolt: "עוגת השוקולד של דניאל עמית" },

  // ── Fruits & légumes ─────────────────────────────────────────────────────────
  { categorie: FRUITS, nom: "Bananes 1 kg", description: "Environ 1 kg", prix: 18.9, nomWolt: "בננה כ- 1 ק״ג", populaire: true },
  { categorie: FRUITS, nom: "Bananes bio 600 g", description: "Environ 600 g", prix: 19.9, nomWolt: "בננה אורגנית כ- 600 גרם" },
  { categorie: FRUITS, nom: "Pommes Pink Crispy 1 kg", description: "Environ 1 kg", prix: 24.9, nomWolt: "תפוח עץ פינק קריספי כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Pommes Granny Smith 1 kg", description: "Environ 1 kg", prix: 19.9, nomWolt: "תפוח עץ סמיט כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Pommes assorties 1 kg", description: "Environ 1 kg", prix: 17.9, nomWolt: "מיקס תפוחים כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Raisin rouge 1,1 kg", description: "Environ 1,1 kg", prix: 44.9, nomWolt: "ענבים אדומים כ- 1.1 ק״ג" },
  { categorie: FRUITS, nom: "Raisin blanc Autumn Crisp 1,2 kg", description: "Environ 1,2 kg", prix: 44.9, nomWolt: "ענבים אוטום קריספ כ- 1.2 ק״ג" },
  { categorie: FRUITS, nom: "Melon", description: "Environ 1 kg", prix: 24, nomWolt: "מלון כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Myrtilles 125 g", description: "La barquette", prix: 24.9, nomWolt: "אוכמניות מארז" },
  { categorie: FRUITS, nom: "Citrons 1 kg", description: "Environ 1 kg", prix: 16.9, nomWolt: "לימון כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Avocats mûrs × 2", description: "Prêts à manger", prix: 15.9, nomWolt: "אבוקדו בשל כ- 2 יחידות" },
  { categorie: FRUITS, nom: "Avocats à mûrir 1 kg", description: "À laisser mûrir quelques jours", prix: 17.9, nomWolt: "מארז אבוקדו להבשלה בבית כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Tomates 850 g", description: "Environ 850 g", prix: 18.9, nomWolt: "עגבנייה כ- 850 גרם", populaire: true },
  { categorie: FRUITS, nom: "Tomates Tamar 1 kg", description: "Tomates allongées, environ 1 kg", prix: 18.9, nomWolt: "עגבנייה תמר כ-1 ק״ג" },
  { categorie: FRUITS, nom: "Tomates Maggie 1,35 kg", description: "Environ 1,35 kg", prix: 31.9, nomWolt: "עגבנייה מגי כ- 1.35 ק״ג" },
  { categorie: FRUITS, nom: "Tomates cerises Tamar 450 g", description: "Environ 450 g", prix: 20.9, nomWolt: "שרי תמר כ- 450 גרם" },
  { categorie: FRUITS, nom: "Tomates cerises Lobello 950 g", description: "Environ 950 g", prix: 38.9, nomWolt: "שרי לובלו כ- 950 גרם" },
  { categorie: FRUITS, nom: "Concombres 1 kg", description: "Environ 1 kg", prix: 14.9, nomWolt: "מלפפון כ- 1 ק״ג", populaire: true },
  { categorie: FRUITS, nom: "Concombres bio 500 g", description: "Environ 500 g", prix: 14.9, nomWolt: "מלפפון אורגני כ- 500 גרם" },
  { categorie: FRUITS, nom: "Mini concombres 300 g", description: "Environ 300 g", prix: 11.2, nomWolt: "מלפפון בייבי כ- 300 גרם" },
  { categorie: FRUITS, nom: "Poivrons rouges 700 g", description: "Environ 700 g", prix: 15.9, nomWolt: "פלפל אדום כ- 700 גרם" },
  { categorie: FRUITS, nom: "Poivrons tricolores 500 g", description: "Rouge, jaune, orange, environ 500 g", prix: 19.9, nomWolt: "מארז פלפל צבעוני כ- 500 גרם" },
  { categorie: FRUITS, nom: "Mini poivrons doux 250 g", description: "Environ 250 g, à croquer", prix: 10.9, nomWolt: "פלפל טינקרבל כ- 250 גרם" },
  { categorie: FRUITS, nom: "Piments verts forts 500 g", description: "Environ 500 g", prix: 14.9, nomWolt: "פלפל חריף (ירוק) כ- 500 גרם" },
  { categorie: FRUITS, nom: "Aubergines 650 g", description: "Environ 650 g", prix: 13.9, nomWolt: "חציל כ- 650 גרם" },
  { categorie: FRUITS, nom: "Courgettes 1 kg", description: "Environ 1 kg", prix: 19.9, nomWolt: "קישוא כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Carottes 1,3 kg", description: "Environ 1,3 kg", prix: 11.9, nomWolt: "גזר כ- 1.3 ק״ג" },
  { categorie: FRUITS, nom: "Patates douces 1 kg", description: "Environ 1 kg", prix: 18.9, nomWolt: "בטטה כ- 1 ק״ג" },
  { categorie: FRUITS, nom: "Pommes de terre Butter 1,3 kg", description: "Environ 1,3 kg", prix: 9.9, nomWolt: "תפוח אדמה באטר כ -1.3 ק״ג" },
  { categorie: FRUITS, nom: "Pommes de terre gourmet 2,75 kg", description: "Le sac David Moshe", prix: 33.9, nomWolt: "תפוח אדמה דוד משה גורמה" },
  { categorie: FRUITS, nom: "Pommes de terre rouges 2,75 kg", description: "Le sac David Moshe", prix: 33.9, nomWolt: "תפוח אדמה דוד משה אדום" },
  { categorie: FRUITS, nom: "Oignons jaunes 900 g", description: "Environ 900 g", prix: 9.9, nomWolt: "בצל יבש כ- 900 גרם" },
  { categorie: FRUITS, nom: "Oignons rouges 900 g", description: "Environ 900 g", prix: 9.9, nomWolt: "בצל אדום כ- 900 גרם" },
  { categorie: FRUITS, nom: "Oignons verts", description: "La botte, environ 100 g", prix: 6.6, nomWolt: "בצל ירוק" },
  { categorie: FRUITS, nom: "Ail", description: "Environ 100 g", prix: 9.9, nomWolt: "שום" },
  { categorie: FRUITS, nom: "Ail épluché 170 g", description: "Gousses prêtes à cuisiner", prix: 12.9, nomWolt: "שום קלוף כ- 170 גרם" },
  { categorie: FRUITS, nom: "Chou blanc", description: "La pièce, environ 1,1 kg", prix: 9.9, nomWolt: "כרוב לבן (יחידה) כ- 1.1 ק״ג" },
  { categorie: FRUITS, nom: "Laitue Lalique", description: "La pièce", prix: 14.9, nomWolt: "חסה לאליק" },
  { categorie: FRUITS, nom: "Cœurs de laitue romaine 400 g", description: "Pour la salade César", prix: 11.9, nomWolt: "לבבות קיסר" },
  { categorie: FRUITS, nom: "Champignons de Paris 250 g", description: "Environ 250 g", prix: 12.9, nomWolt: "פטריות שמפניון כ- 250 גרם" },
  { categorie: FRUITS, nom: "Champignons, lot de 2 barquettes 500 g", description: "Le « duo italien »", prix: 21.9, nomWolt: "מארז פטריות צמד איטלקי" },
  { categorie: FRUITS, nom: "Coriandre fraîche", description: "La botte", prix: 5.9, nomWolt: "כוסברה" },
  { categorie: FRUITS, nom: "Persil frais", description: "La botte", prix: 5.9, nomWolt: "פטרוזיליה" },

  // ── Boucherie & poisson (frais) ──────────────────────────────────────────────
  { categorie: BOUCHERIE, nom: "Blanc de poulet frais, environ 1 kg", description: POIDS, prix: 67.91, nomWolt: "חזה עוף טרי, ~1000 g", environ: true },
  { categorie: BOUCHERIE, nom: "Escalopes de poulet fraîches (schnitzel), environ 1 kg", description: `Fines tranches de blanc, à paner. ${POIDS}`, prix: 72.92, nomWolt: "שניצל עוף טרי, ~1000 g", environ: true },
  { categorie: BOUCHERIE, nom: "Aiguillettes de poulet fraîches, environ 500 g", description: POIDS, prix: 36.95, nomWolt: "פילה עוף טרי, ~500 g", environ: true },
  { categorie: BOUCHERIE, nom: "Émincé de poulet frais, environ 1 kg", description: `Lanières prêtes à poêler. ${POIDS}`, prix: 74.83, nomWolt: "רצועות עוף טרי, ~1000 g", environ: true },
  { categorie: BOUCHERIE, nom: "Pilons de poulet frais, environ 1 kg", description: POIDS, prix: 72.82, nomWolt: "שוקיים עוף טרי, ~1000 g", environ: true },
  { categorie: BOUCHERIE, nom: "Steaks de pargit frais, environ 800 g", description: `Haut de cuisse de poulet désossé. ${POIDS}`, prix: 76.71, nomWolt: "סטייק פרגית טרי, ~800 g", environ: true },
  { categorie: BOUCHERIE, nom: "Assortiment de poulet frais, environ 1 kg", description: `Morceaux variés. ${POIDS}`, prix: 59.21, nomWolt: "מיקס עוף טרי , ~1000 g", environ: true },
  { categorie: BOUCHERIE, nom: "Poulet entier frais, environ 2,1 kg", description: POIDS, prix: 64.67, nomWolt: "עוף שלם טרי , ~2100 g", environ: true },
  { categorie: BOUCHERIE, nom: "Entrecôte de bœuf fraîche, environ 500 g", description: POIDS, prix: 148.64, nomWolt: "אנטריקוט עגלה טרי, ~500 g", environ: true },
  { categorie: BOUCHERIE, nom: "Émincé de bœuf frais, environ 700 g", description: `Lanières à saisir à la poêle ou au wok. ${POIDS}`, prix: 95.12, nomWolt: "רצועות בקר להקפצה טרי ״חוות הבוקרים״, ~700 g", environ: true },
  { categorie: BOUCHERIE, nom: "Filet de saumon frais, environ 650 g", description: `En pavés. ${POIDS}`, prix: 98.98, nomWolt: "סלמון פילה נתחים טרי, ~650 g", environ: true },
  { categorie: BOUCHERIE, nom: "Pavé de saumon frais, environ 220 g", description: POIDS, prix: 40.91, nomWolt: "פילה סלמון נתחים טרי, ~220 g", environ: true },
  { categorie: BOUCHERIE, nom: "Saumon fumé norvégien 100 g", description: "En tranches", prix: 24.5, nomWolt: "סלמון נורווגי מעושן - 100 גרם" },
  { categorie: BOUCHERIE, nom: "Saucisses de poulet Tirat Zvi 400 g", description: "Saucisses de poulet type hot-dog. Sans gluten. Pour un enfant de moins de 5 ans, le fabricant demande de les couper en fines lamelles dans la longueur, pas en rondelles.", prix: 16.5, nomWolt: "נקניקיות עוף טירת צבי - 400 גרם" },
  { categorie: BOUCHERIE, nom: "Saucisses Kafri Tirat Zvi, lot de 2 (800 g)", description: "Saucisses façon campagnarde", prix: 34.9, nomWolt: "מארז צמד כפרי טירת צבי - 800 גרם" },

  // ── Surgelés & glaces ────────────────────────────────────────────────────────
  { categorie: SURGELES, nom: "Blanc de poulet surgelé, environ 1 kg", description: `Qualité premium. ${POIDS}`, prix: 65.89, nomWolt: "חזה עוף פרימיום קפוא, ~1000 g", environ: true },
  { categorie: SURGELES, nom: "Bœuf haché surgelé 10 % MG 500 g", description: "Viande hachée de bœuf", prix: 54.98, nomWolt: "בשר טחון מוקפא מובחר 10% שומן\"חוות הבוקרים\"- 500 גרם" },
  { categorie: SURGELES, nom: "Schnitzels fins croustillants Mama Of 700 g", description: "Escalopes de poulet panées, à réchauffer", prix: 52.5, nomWolt: "שניצל דק פריך מאמא עוף" },
  { categorie: SURGELES, nom: "Mini schnitzels au sésame Mama Of 500 g", description: "Petites escalopes de poulet panées au sésame", prix: 35.9, nomWolt: "שניצלונים דקים בציפוי שומשום מאמא עוף" },
  { categorie: SURGELES, nom: "Pavés de saumon surgelés avec peau 600 g", description: "Saumon norvégien", prix: 59.9, nomWolt: "מנות סלמון נורווגי עם עור קפוא" },
  { categorie: SURGELES, nom: "Pavés de saumon surgelés sans peau 500 g", description: "Saumon norvégien", prix: 59.9, nomWolt: "מנות סלמון ללא עור נורווגי קפוא" },
  { categorie: SURGELES, nom: "Filets de tilapia surgelés 800 g", description: "Sans peau", prix: 36.9, nomWolt: "אמנון פילה ללא עור 100% דג - סדרת המאה" },
  { categorie: SURGELES, nom: "Pizza margherita Mamma Mia 470 g", description: "Pizza surgelée", prix: 29.9, nomWolt: "פיצה מרגריטה מאמאמיה" },
  { categorie: SURGELES, nom: "Pizza aux olives Mamma Mia 510 g", description: "Pizza surgelée", prix: 29.9, nomWolt: "פיצה עם זיתים מאמאמיה" },
  { categorie: SURGELES, nom: "Mini pizzas Maadanot 650 g", description: "Bouchées de pizza à réchauffer", prix: 39.9, nomWolt: "חטיפי פיצה מעדנות - 650 גרם" },
  { categorie: SURGELES, nom: "Framboises au chocolat Franui 150 g", description: "Framboises glacées enrobées de chocolat blanc et au lait", prix: 35.9, nomWolt: "פטל קפוא מצופה בשוקולד לבן ושוקלד חלב פראנוי" },
  { categorie: SURGELES, nom: "Glaces à l'eau Gomigam, la boîte", description: "Bâtonnets glacés, 450 g", prix: 37.9, nomWolt: "מאגדת שלגון גומיגם" },

  // ── Courses & épicerie ───────────────────────────────────────────────────────
  { categorie: EPICERIE, nom: "Nutella 400 g", description: "Pâte à tartiner", prix: 23.9, nomWolt: "ממרח נוטלה 400 גרם", populaire: true },
  { categorie: EPICERIE, nom: "Céréales coussins au nougat 686 g", description: "Céréales fourrées à la crème de nougat", prix: 34.5, nomWolt: "דגני בוקר כריות נוגט" },
  { categorie: EPICERIE, nom: "Nescafé Taster's Choice 200 g", description: "Café soluble", prix: 42.9, nomWolt: "נסקפה טייסטרס צ'ויס אורגינל" },
  { categorie: EPICERIE, nom: "Sucre blanc 1 kg", description: "Sucre en poudre", prix: 5.9, nomWolt: "סוכר לבן קלאסי - 1 ק״ג" },
  { categorie: EPICERIE, nom: "Farine de blé Stybel 1 kg", description: "Farine blanche, sans tamisage", prix: 9.9, nomWolt: "קמח חיטה לבן ללא צורך בניפוי שטיבל 1 ק״ג" },
  { categorie: EPICERIE, nom: "Riz persan Sugat 1 kg", description: "Riz long grain", prix: 12.9, nomWolt: "אורז פרסי קלאסי סוגת - 1 ק״ג" },
  { categorie: EPICERIE, nom: "Huile de colza 1 L", description: "Pour la cuisson", prix: 18.5, nomWolt: "שמן קנולה בריאות מהטבע - 1 ליטר" },
  { categorie: EPICERIE, nom: "Mayonnaise Hellmann's 394 g", description: "Le pot", prix: 16.5, nomWolt: "מיונז הלמנס" },
  { categorie: EPICERIE, nom: "Concentré de tomates Yachin 100 g", description: "Petite boîte", prix: 3.9, nomWolt: "רסק עגבניות מרוכז 22% יכין - 100 גרם" },
  { categorie: EPICERIE, nom: "Thon à l'huile Starkist × 4 boîtes", description: "Lot de 4 boîtes", prix: 27.5, nomWolt: "מארז רביעיית טונה בשמן סטארקיסט - 448 גרם" },
  { categorie: EPICERIE, nom: "Thon au naturel Starkist × 4 boîtes", description: "Lot de 4 boîtes", prix: 27.5, nomWolt: "מארז רביעיית טונה במים סטארקיסט - 448 גרם" },

  // ── Boissons ─────────────────────────────────────────────────────────────────
  { categorie: BOISSONS, nom: "Eau minérale Neviot 1,5 L", description: "La bouteille", prix: 5.5, nomWolt: "נביעות מים מינרליים בקבוק - 1.5 ליטר", populaire: true },
  { categorie: BOISSONS, nom: "Eau minérale Ein Gedi 2 L", description: "La bouteille", prix: 4.5, nomWolt: "עין גדי מים מינרליים בקבוק - 2 ליטר" },
  { categorie: BOISSONS, nom: "Eau Mei Eden 6 × 50 cl", description: "Petites bouteilles, bouchon sport", prix: 17.5, nomWolt: "מארז שישיית מי עדן פקק ספורט - 500 מ״ל", populaire: true },
  { categorie: BOISSONS, nom: "Eau Neviot To Go 6 × 50 cl", description: "Petites bouteilles", prix: 19.5, nomWolt: "שישיית נביעות TOGO מים מינרליים - 500 מ״ל" },
  { categorie: BOISSONS, nom: "Sac de glaçons 2 kg", description: "Mister Ice", prix: 11.9, nomWolt: "שקית קרח מיסטר אייס- 2 ק״ג", populaire: true },
  { categorie: BOISSONS, nom: "Coca-Cola 1,5 L", description: "La bouteille", prix: 9.5, nomWolt: "קוקה קולה בקבוק - 1.5 ליטר", populaire: true },
  { categorie: BOISSONS, nom: "Coca-Cola 1 L", description: "La bouteille", prix: 8.9, nomWolt: "קוקה קולה בקבוק - 1 ליטר" },
  { categorie: BOISSONS, nom: "Coca-Cola canettes 6 × 33 cl", description: "Le pack de 6", prix: 26.9, nomWolt: "מארז שישיית פחיות קולה - 330 מ״ל" },
  { categorie: BOISSONS, nom: "Coca-Cola Zero 1,5 L", description: "La bouteille", prix: 9.5, nomWolt: "קוקה קולה זירו בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Coca-Cola Zero 1 L", description: "La bouteille", prix: 8.9, nomWolt: "קוקה קולה זירו בקבוק - 1 ליטר" },
  { categorie: BOISSONS, nom: "Coca-Cola Zero canettes 6 × 33 cl", description: "Le pack de 6", prix: 26.9, nomWolt: "מארז שישיית פחיות קולה זירו - 330 מ״ל" },
  { categorie: BOISSONS, nom: "Sprite Zero canettes 6 × 33 cl", description: "Le pack de 6", prix: 26.9, nomWolt: "מארז שישיית פחיות ספרייט זירו - 330 מ״ל" },
  { categorie: BOISSONS, nom: "Pepsi Zero canettes 6 × 33 cl", description: "Cola zéro, le pack de 6 canettes de 33 cl. Casher.", prix: 21.9, nomWolt: "שישיית פחיות פפסי ZERO" },
  { categorie: BOISSONS, nom: "Fuze Tea pêche 1,5 L", description: "Thé glacé", prix: 9.9, nomWolt: "פיוז טי אפרסק בקבוק - 1.5 ליטר" },
  { categorie: BOISSONS, nom: "Jus d'orange pressé Primor 1 L", description: "Jus pressé, la bouteille", prix: 22.9, nomWolt: "פרימור מיץ תפוזים סחוט בקבוק - 1 ליטר" },
  { categorie: BOISSONS, nom: "Jus d'orange pressé Prigat 2 L", description: "Jus pressé, la bouteille", prix: 36.9, nomWolt: "פריגת תפוזים סחוט טבעי בקבוק - 2 ליטר" },
  { categorie: BOISSONS, nom: "Sirop Vitaminchik raisin 1 L", description: "Concentré à diluer dans l'eau", prix: 17.9, nomWolt: "תרכיז ויטמינצ׳יק בטעם ענבים - 1 ליטר" },
  { categorie: BOISSONS, nom: "Boisson énergisante XL 25 cl", description: "La canette", prix: 5.5, nomWolt: "משקה אנרגיה אקסל - 250 מ״ל" },
  { categorie: BOISSONS, nom: "Bière Corona 6 × 35,5 cl", description: "Le pack de 6 bouteilles. Alcool : réservé aux adultes.", prix: 45.9, nomWolt: "מארז קורונה שישייה - 355 מ\"ל", horsLigne: true },
  { categorie: BOISSONS, nom: "Vin blanc sec Segal 75 cl", description: "Vin israélien. Alcool : réservé aux adultes.", prix: 26.9, nomWolt: "יין לבן יבש סגל", horsLigne: true },

  // ── Apéro & snacks ───────────────────────────────────────────────────────────
  { categorie: SNACKS, nom: "Bamba × 10 sachets", description: "Le snack soufflé à la cacahuète, 10 petits sachets (250 g)", prix: 21.5, nomWolt: "מארז במבה 10 יח׳ - 250 גרם", populaire: true },
  { categorie: SNACKS, nom: "Bamba fourré nougat 60 g", description: "Bamba fourré à la crème de nougat", prix: 6.5, nomWolt: "במבה במילוי קרם נוגט - 60 גרם" },
  { categorie: SNACKS, nom: "Dubonim 40 g", description: "Snack croustillant en forme d'oursons", prix: 6.5, nomWolt: "דובונים - 40 גרם" },
  { categorie: SNACKS, nom: "Chips Tapuchips nature × 6 sachets", description: "6 sachets de 40 g", prix: 16.9, nomWolt: "מארז תפוצ׳יפס טבעי 6 יח׳ - 40 גרם" },
  { categorie: SNACKS, nom: "Graines de tournesol grillées 400 g", description: "Les « garinim » à décortiquer", prix: 24.9, nomWolt: "גרעיני חמניה פיצוחי זריפה - 400 גרם" },
  { categorie: SNACKS, nom: "Kinder Chocolat × 16 barres", description: "200 g", prix: 19.5, nomWolt: "קינדר אצבעות שוקולד - 16 יח׳ במארז" },
  { categorie: SNACKS, nom: "Kinder Délice × 10", description: "10 gâteaux individuels, 390 g", prix: 27.9, nomWolt: "קינדר דליס עוגות אישיות - 10 יח׳ במארז" },

  // ── Bébé & enfants ───────────────────────────────────────────────────────────
  { categorie: BEBE, nom: "Lait infantile Materna Extra Care 2e âge 700 g", description: "Lait en poudre, étape 2", prix: 69.9, nomWolt: "מטרנה אקסטרה קר שלב 2 מהדרין - 700 גרם" },
  { categorie: BEBE, nom: "Lingettes humides sans parfum × 4 paquets", description: "Lot de 4 paquets", prix: 25.5, nomWolt: "מארז מגבונים לחים ללא בישום - 4 יחידות" },

  // ── Maison & entretien ───────────────────────────────────────────────────────
  { categorie: MAISON, nom: "Papier toilette Soft × 24", description: "Double épaisseur, 24 rouleaux", prix: 27.9, nomWolt: "סופט לבן נייר טואלט דו שכבתי - 24 יחידות", populaire: true },
  { categorie: MAISON, nom: "Papier toilette Lily Mega Roll × 18", description: "Double épaisseur, 18 grands rouleaux", prix: 37.9, nomWolt: "נייר טואלט לילי מגה רול דו שכבתי - 18 גלילים" },
  { categorie: MAISON, nom: "Papier toilette Lily Mega Roll × 24", description: "24 grands rouleaux", prix: 49.9, nomWolt: "נייר טואלט לילי מגה רול - 24 יח׳" },
  { categorie: MAISON, nom: "Essuie-tout Nicol × 6", description: "6 rouleaux", prix: 13.9, nomWolt: "מגבות נייר ניקול - 6 גלילים" },
  { categorie: MAISON, nom: "Essuie-tout Nicol Mega × 6", description: "6 grands rouleaux très absorbants", prix: 22.9, nomWolt: "מגבות נייר סופג מגה ניקול - 6 יחידות" },
  { categorie: MAISON, nom: "Essuie-tout Sano Sushi × 6", description: "6 rouleaux", prix: 15.9, nomWolt: "מגבות נייר סנו סושי - 6 גלילים" },
  { categorie: MAISON, nom: "Sacs poubelle très grands Nicol × 20", description: "20 sacs poubelle XXL, pour les très grandes poubelles.", prix: 29.9, nomWolt: "ניקול שקיות אשפה גודל ענק 20 יח׳" },
  { categorie: MAISON, nom: "Sacs poubelle XXL, lot de 2 rouleaux", description: "Très grands sacs", prix: 22.9, nomWolt: "שקיות אשפה גדולות XXL - מארז 2 יחידות" },
  { categorie: MAISON, nom: "Lessive liquide Persil 2,5 L", description: "Gel pour linge blanc et couleurs", prix: 35.9, nomWolt: "פרסיל - ג׳ל לכביסה רגילה וצבעונית 2.5 ליטר" },
  { categorie: MAISON, nom: "Lessive liquide spéciale bébé 2 L", description: "Lessive concentrée pour le linge de bébé", prix: 45.9, nomWolt: "נוזל כביסה כביסכל בייבי מועשר - 2 ליטר" },
  { categorie: MAISON, nom: "Gobelets en plastique 33 cl × 40", description: "Pour boissons froides", prix: 6.9, nomWolt: "כוסות פלסטיק משובחות לשתייה קרה 330 מ״ל - 40 יח׳" },

  // ── Shabbat & casher ─────────────────────────────────────────────────────────
  { categorie: SHABBAT, nom: "Jus de raisin Tirosh Carmel 1 L", description: "Pour le Kiddoush, sans alcool", prix: 22.5, nomWolt: "מיץ ענבים תירוש יקבי כרמל 1 ליטר" },
];

/**
 * Les articles « à compléter » de la base du catalogue (prisma/catalogue.ts) que ces articles
 * réels remplacent : on ne les installe plus, pour ne pas avoir deux fois « du lait » dans l'admin.
 * (Le jeu de démonstration `seed:demo`, lui, garde la base entière : les parcours de test en dépendent.)
 */
export const REMPLACES_PAR_WOLT: ReadonlySet<string> = new Set([
  "Lait 3 % 1 L",
  "Lait sans lactose 1 L",
  "Œufs × 12",
  "Beurre 200 g",
  "Fromage blanc 5 % 250 g",
  "Fromage en tranches 200 g",
  "Pain de mie tranché",
  "Pitas × 10",
  "Thon en boîte × 4",
  "Riz 1 kg",
  "Sucre 1 kg",
  "Café soluble 200 g",
  "Céréales",
  "Pâte à tartiner chocolat 400 g",
  "Petites bouteilles d'eau 6 × 50 cl",
  "Coca-Cola 1,5 L",
  "Thé glacé 1,5 L",
  "Jus d'orange 1 L",
  "Glaçons 2 kg",
  "Bananes 1 kg",
  "Pommes 1 kg",
  "Tomates 1 kg",
  "Concombres 1 kg",
  "Avocats × 3",
  "Citrons 500 g",
  "Salade verte",
  "Bamba",
  "Chips",
  "Lingettes bébé",
  "Lait infantile en poudre",
  "Papier toilette × 8",
  "Essuie-tout × 2",
  "Sacs poubelle",
  "Gobelets jetables × 50",
  "Jus de raisin pour Kiddoush",
  // Remplacés par les articles de Dynamica (prisma/articles-dynamica.ts)
  "Chargeur téléphone 20 W",
  "Écouteurs filaires",
]);

/** Le prix en agorot. */
export const enAgorot = (shekels: number): number => Math.round(shekels * 100);
