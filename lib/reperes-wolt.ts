// Les photos repère du gérant : la photo que Wolt montre pour un article, découpée dans SES captures
// d'écran de Wolt Market (relevé du 12 novembre 2026). Elles l'aident à reconnaître un article qu'il ne
// connaît pas, pour le retrouver sur Wolt et pour chercher ou prendre sa propre photo.
//
// RÉSERVÉES À L'ESPACE GÉRANT : ces photos appartiennent à Wolt et aux marques. Elles ne sont pas dans
// `public/` (dossier `prive/reperes-wolt`), ne sont servies que par la route `/admin/repere/[fichier]`,
// qui exige la session du gérant, et ne sont jamais montrées à un client.
//
// Un article est reconnu à son nom exact sur Wolt (`Produit.nomWolt`), sinon à son nom sur le site.
// Ajouter des photos : nouvelles captures du gérant → nouvelles lignes ici + fichiers dans le dossier.
export type PhotoRepere = { nom: string; nomWolt: string; fichier: string };

export const PHOTOS_REPERE: PhotoRepere[] = [
  { nom: "Lait sans lactose goût vanille Tara 2 % 1 L", nomWolt: "חלב נטול לקטוז בטעם וניל 2% טרה - 1 ליטר", fichier: "lait-sans-lactose-gout-vanille-tara-2-1-l.jpg" },
  { nom: "Lait Tara 3 % 1 L", nomWolt: "חלב טרה 3% 1 ליטר - מחיר מפוקח", fichier: "lait-tara-3-1-l.jpg" },
  { nom: "Lait Tnuva 1 % 1 L", nomWolt: "חלב תנובה 1% 1 ליטר - מחיר מפוקח", fichier: "lait-tnuva-1-1-l.jpg" },
  { nom: "Lait Tnuva 3 % 1 L", nomWolt: "חלב תנובה מהדרין 3% 1 ליטר - מחיר מפוקח", fichier: "lait-tnuva-3-1-l.jpg" },
  { nom: "Lait Tara 3 % 2 L", nomWolt: "חלב טרה 3% בקרטון 2 ליטר - מחיר מפוקח", fichier: "lait-tara-3-2-l.jpg" },
  { nom: "Lait enrichi Yotvata 3 % 1 L", nomWolt: "יטבתה בקבוק חלב מועשר 3% - 1 ליטר", fichier: "lait-enrichi-yotvata-3-1-l.jpg" },
  { nom: "Lait sans lactose Yotvata 2 % 1 L", nomWolt: "חלב נטול לקטוז 2% יטבתה - 1 ליטר", fichier: "lait-sans-lactose-yotvata-2-1-l.jpg" },
  { nom: "Lait sans lactose Tara 2 % 1 L", nomWolt: "טרה בקבוק חלב נטול לקטוז 2% - 1 ליטר", fichier: "lait-sans-lactose-tara-2-1-l.jpg" },
  { nom: "Lait sans lactose Tnuva 2 % 1 L", nomWolt: "חלב נטול לקטוז 2% תנובה - 1 ליטר", fichier: "lait-sans-lactose-tnuva-2-1-l.jpg" },
  { nom: "Lait pour café Tnuva 2 % 80 cl", nomWolt: "חלב לקפה 2% תנובה - 800 מ״ל", fichier: "lait-pour-cafe-tnuva-2-80-cl.jpg" },
  { nom: "Œufs bio calibre L × 12", nomWolt: "קרטון ביצים אורגניות L - יח׳ 12", fichier: "oeufs-bio-calibre-l-12.jpg" },
  { nom: "Œufs calibre L × 12", nomWolt: "קרטון ביצים רגילות L יח׳ 12 - מחיר מפוקח", fichier: "oeufs-calibre-l-12.jpg" },
  { nom: "Œufs calibre M × 12", nomWolt: "קרטון ביצים רגילות M יח׳ 12 - מחיר מפוקח", fichier: "oeufs-calibre-m-12.jpg" },
  { nom: "Œufs calibre L × 18", nomWolt: "קרטון ביצים רגילות L יח׳ 18 - מחיר מפוקח", fichier: "oeufs-calibre-l-18.jpg" },
  { nom: "Crème à fouetter Tnuva 38 % 50 cl", nomWolt: "שמנת להקצפה 38% תנובה 500 מ״ל - מחיר מפוקח", fichier: "creme-a-fouetter-tnuva-38-50-cl.jpg" },
  { nom: "Crème à fouetter Yotvata 38 % 250 g", nomWolt: "שמנת להקצפה 38% מהדרין יטבתה 250 גרם - מחיר מפוקח", fichier: "creme-a-fouetter-yotvata-38-250-g.jpg" },
  { nom: "Crème de cuisson Yotvata 15 % 25 cl", nomWolt: "שמנת לבישול 15% יטבתה - 250 מ\"ל", fichier: "creme-de-cuisson-yotvata-15-25-cl.jpg" },
  { nom: "Beurre tartinable salé Lurpak 250 g", nomWolt: "ממרח חמאה עם מלח לורפק - 250 גרם", fichier: "beurre-tartinable-sale-lurpak-250-g.jpg" },
  { nom: "Beurre Tnuva 200 g", nomWolt: "חמאה מהדרין תנובה - 200 גרם", fichier: "beurre-tnuva-200-g.jpg" },
  { nom: "Lait chocolaté sans sucre ajouté Tara 1 L", nomWolt: "שוקו מועשר טרה - 1 ליטר", fichier: "lait-chocolate-sans-sucre-ajoute-tara-1-l.jpg" },
  { nom: "Lait chocolaté Tnuva 2,7 % 1 L", nomWolt: "שוקו תנובה 2.7% בקרטון - 1 ליטר", fichier: "lait-chocolate-tnuva-2-7-1-l.jpg" },
  { nom: "Yaourt Müller Protein cacahuètes caramélisées 170 g", nomWolt: "יוגורט מולר פרוטאין טופ בוטנים ופצפוצים מקורמלים", fichier: "yaourt-muller-protein-cacahuetes-caramelisees-170-g.jpg" },
  { nom: "Milky Top", nomWolt: "מעדן מילקי טופ מגולגלת", fichier: "milky-top.jpg" },
  { nom: "Dessert au fromage Daniela fraise", nomWolt: "מעדן גבינה דניאלה בטעם תות", fichier: "dessert-au-fromage-daniela-fraise.jpg" },
  { nom: "Milky chocolat × 8", nomWolt: "מאגדת מילקי מעדן שוקולד - 170 מ\"ל * 8", fichier: "milky-chocolat-8.jpg" },
  { nom: "Dessert au fromage Daniela vanille", nomWolt: "מעדן גבינה דניאלה בטעם וניל", fichier: "dessert-au-fromage-daniela-vanille.jpg" },
  { nom: "Malabi Gad 160 g", nomWolt: "מלבי גד - 160 גרם", fichier: "malabi-gad-160-g.jpg" },
  { nom: "Yaourt grec Danone 6,5 %", nomWolt: "יוגורט דנונה יווני 6.5%", fichier: "yaourt-grec-danone-6-5.jpg" },
  { nom: "Danone Crunch riz soufflé", nomWolt: "דנונה קראנצ' פצפוצים שטראוס", fichier: "danone-crunch-riz-souffle.jpg" },
  { nom: "Actimel fraise × 8", nomWolt: "אקטימל משקה יוגורט פרוביוטי בטעם תות - 8 יח׳", fichier: "actimel-fraise-8.jpg" },
  { nom: "Yaourts Danone Bio 3 % × 8 (150 g)", nomWolt: "מאגדת יוגורט ביו דנונה 3% - 150 גרם * 8", fichier: "yaourts-danone-bio-3-8-150-g.jpg" },
  { nom: "Yaourt protéiné GO fraise 200 g", nomWolt: "יוגורט גו קרמי תות 20 ג' חלבון", fichier: "yaourt-proteine-go-fraise-200-g.jpg" },
  { nom: "Müller Active Protein Vanille 200 g", nomWolt: "יוגורט מולר פרוטאין בטעם וניל 25 גרם חלבון 0% שומן", fichier: "muller-active-protein-vanille-200-g.jpg" },
  { nom: "Boisson protéinée Yotvata Pro chocolat-noisette 35 cl", nomWolt: "משקה חלבון יטבתה פרו ללא סוכר שוקולד ואגוזים", fichier: "boisson-proteinee-yotvata-pro-chocolat-noisette-35-cl.jpg" },
  { nom: "Boisson protéinée Müller café 35 cl", nomWolt: "משקה חלבון מולר בטעם קפה 0% שומן - 350 מ״ל", fichier: "boisson-proteinee-muller-cafe-35-cl.jpg" },
  { nom: "Boisson protéinée Yotvata Pro café 35 cl", nomWolt: "משקה חלבון יטבתה פרו ללא סוכר קפה", fichier: "boisson-proteinee-yotvata-pro-cafe-35-cl.jpg" },
  { nom: "Dessert végétal soja chocolat Alpro × 4", nomWolt: "אלפרו מעדן סויה בטעם שוקולד 125*4 מל", fichier: "dessert-vegetal-soja-chocolat-alpro-4.jpg" },
  { nom: "Lait chocolaté Yotvata 1 L", nomWolt: "יטבתה שוקו בקבוק - 1 ליטר", fichier: "lait-chocolate-yotvata-1-l.jpg" },
  { nom: "Café glacé Yotvata 1 L", nomWolt: "יטבתה אייס קפה - 1 ליטר", fichier: "cafe-glace-yotvata-1-l.jpg" },
  { nom: "Filet de saumon frais, environ 650 g", nomWolt: "סלמון פילה נתחים טרי, ~650 g", fichier: "filet-de-saumon-frais-environ-650-g.jpg" },
  { nom: "Pavé de saumon frais, environ 220 g", nomWolt: "פילה סלמון נתחים טרי, ~220 g", fichier: "pave-de-saumon-frais-environ-220-g.jpg" },
  { nom: "Saumon fumé norvégien 100 g", nomWolt: "סלמון נורווגי מעושן - 100 גרם", fichier: "saumon-fume-norvegien-100-g.jpg" },
  { nom: "Pains à hamburger × 6", nomWolt: "לחמניות המבורגר אמריקה - 6 יח׳", fichier: "pains-a-hamburger-6.jpg" },
  { nom: "Pain de mie américain Angel 500 g", nomWolt: "לחם בסגנון אמריקה אנג׳ל", fichier: "pain-de-mie-americain-angel-500-g.jpg" },
  { nom: "Mini pains à hamburger Angel × 8", nomWolt: "מיני לחמניות המבורגר אמריקה אנג׳ל - 8 יח׳", fichier: "mini-pains-a-hamburger-angel-8.jpg" },
  { nom: "Pains à hot-dog × 6", nomWolt: "לחמניות ארוכות בסגנון אמריקה - 6 יח׳", fichier: "pains-a-hot-dog-6.jpg" },
  { nom: "Pain tranché Angel 900 g", nomWolt: "לחם אחיד פרוס אנג׳ל 900 גרם - מחיר מפוקח", fichier: "pain-tranche-angel-900-g.jpg" },
  { nom: "Pain épeautre et blé complet Angel 750 g", nomWolt: "לחם כוסמין וחיטה מלאה אנג׳ל", fichier: "pain-epeautre-et-ble-complet-angel-750-g.jpg" },
  { nom: "Hallah tressée Angel 500 g", nomWolt: "חלה מתוקה קלועה אנג'ל - 500 גרם", fichier: "hallah-tressee-angel-500-g.jpg" },
  { nom: "Pain de mie pour toasts Agmi 500 g", nomWolt: "לחם טוסט אמריקה אגמי", fichier: "pain-de-mie-pour-toasts-agmi-500-g.jpg" },
  { nom: "Pain 100 % seigle complet tranché 500 g", nomWolt: "לחם שיפון 100% ברלין אגמי", fichier: "pain-100-seigle-complet-tranche-500-g.jpg" },
  { nom: "Pain protéiné pauvre en glucides Agmi 400 g", nomWolt: "לחם פרו דל פחמימות אגמי", fichier: "pain-proteine-pauvre-en-glucides-agmi-400-g.jpg" },
  { nom: "Pitas à l'épeautre Angel × 8", nomWolt: "פיתות כוסמין אנג׳ל 8 יח׳", fichier: "pitas-a-l-epeautre-angel-8.jpg" },
  { nom: "Pitas Angel × 8", nomWolt: "פיתות אנג׳ל 8 יח׳", fichier: "pitas-angel-8.jpg" },
  { nom: "Pain blanc tranché sans gluten 500 g (surgelé)", nomWolt: "לחם לבן פרוס ללא גלוטן קפוא שרהל'ה", fichier: "pain-blanc-tranche-sans-gluten-500-g-surgele.jpg" },
  { nom: "Petits pains allongés Agmi × 10", nomWolt: "לחמניות אצבע 10 יחידות אגמי", fichier: "petits-pains-allonges-agmi-10.jpg" },
  { nom: "Tortillas de blé Mexifoods 20 cm × 8", nomWolt: "טורטיות קמח חיטה 20 ס\"מ מקסיפוד - 8 יח'", fichier: "tortillas-de-ble-mexifoods-20-cm-8.jpg" },
  { nom: "Pitas protéinées Angel Pro × 8", nomWolt: "פיתות פרו אנג׳ל - 8 פיתות", fichier: "pitas-proteinees-angel-pro-8.jpg" },
  { nom: "Mini pitas épeautre complet Agmi 450 g", nomWolt: "פיתה ביס כוסמין מלא אגמי", fichier: "mini-pitas-epeautre-complet-agmi-450-g.jpg" },
  { nom: "Petits pains moelleux Angel × 6", nomWolt: "לחמניה רכה אנג'ל - 6 יח'", fichier: "petits-pains-moelleux-angel-6.jpg" },
  { nom: "Pain à burger brioché × 4", nomWolt: "לחמניות המבורגר בריוש - 4 יחידות", fichier: "pain-a-burger-brioche-4.jpg" },
  { nom: "Pains pitas fraîches × 5", nomWolt: "פיתות עבודת יד - 5 יחידות", fichier: "pains-pitas-fraiches-5.jpg" },
  { nom: "Bagels de Jérusalem au sésame × 2", nomWolt: "בייגל ירושלמי - 2 יחידות", fichier: "bagels-de-jerusalem-au-sesame-2.jpg" },
  { nom: "Baguette blanche 340 g", nomWolt: "בגט לבן | דליקטסן & בייקרי", fichier: "baguette-blanche-340-g.jpg" },
];

export const DOSSIER_DES_REPERES = "prive/reperes-wolt";

const PAR_NOM_WOLT = new Map(PHOTOS_REPERE.map((p) => [p.nomWolt, p.fichier]));
const PAR_NOM = new Map(PHOTOS_REPERE.map((p) => [p.nom, p.fichier]));
const FICHIERS = new Set(PHOTOS_REPERE.map((p) => p.fichier));

/** Vrai si ce nom de fichier est celui d'une photo repère (la route ne lit jamais autre chose). */
export const estPhotoRepere = (fichier: string) => FICHIERS.has(fichier);

/** L'adresse (réservée au gérant) de la photo Wolt d'un article ; `null` si ses captures ne la contiennent pas. */
export function photoRepere(nom: string, nomWolt: string | null | undefined): string | null {
  const fichier = PAR_NOM_WOLT.get((nomWolt ?? "").trim()) ?? PAR_NOM.get(nom);
  return fichier ? `/admin/repere/${fichier}` : null;
}
