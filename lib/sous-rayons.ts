// Les sous-rayons : ce qui permet à un rayon de plusieurs centaines d'articles de rester facile à parcourir
// (« Eaux », « Colas », « Jus »… dans « Boissons »), comme sur Wolt ou Uber Eats.
//
// Un article n'a pas de sous-rayon enregistré : il est rangé d'après son nom FRANÇAIS (celui de la base),
// par la première règle de son rayon qui le reconnaît — un article que le gérant crée ou renomme est donc
// rangé tout seul. Ce qu'aucune règle ne reconnaît va dans « Autres ». Pur : partagé serveur / tests.
// Les noms des sous-rayons sont dans les dictionnaires (`t.sousRayons`), dans les cinq langues.

export const AUTRES = "autres";

type Regle = { cle: string; motif: RegExp };

/** « Œufs bio » → « oeufs bio » : sans accents ni lettres liées, en minuscules — les règles s'écrivent ainsi. */
export function sansAccents(texte: string): string {
  return texte.replace(/œ/gi, "oe").replace(/æ/gi, "ae").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

const r = (cle: string, motif: RegExp): Regle => ({ cle, motif });

// L'ordre des règles compte : la première qui reconnaît un nom l'emporte (« Lait chocolaté » est une boisson
// lactée avant d'être du lait, « Sauce au mascarpone » une sauce avant d'être un fromage).
const REGLES: Record<string, Regle[]> = {
  boissons: [
    r("alcools", /\b(biere|bieres|vin|vodka|whisky|gin|tequila|rhum|arak|prosecco|aperol|campari|baileys|liqueur|cidre|breezer|bourbon|chianti|sauvignon|chardonnay|cabernet|marselan)\b/),
    r("sirops", /\b(sirop|concentre)\b/),
    r("energie", /\b(energisante|red bull|monster|gatorade)\b/),
    r("sodas", /\bfever-tree\b/),
    r("eaux-aromatisees", /eau (gazeuse )?aromatisee/),
    r("eaux", /^eau\b|\b(pack d'eau|san pellegrino|perrier|borjomi|evian|glacons)\b|\bsoda\b/),
    r("colas", /\b(coca-cola|pepsi)\b/),
    r("thes-glaces", /\b(fuze tea|the vert|the glace|cafe glace)\b/),
    r("jus", /\b(jus|prigat|spring|fruit & veg|nectar|smoothie|kombucha)\b/),
    r("sodas", /\b(sprite|fanta|7up|schweppes|nordic mist|kristal|boisson gazeuse|ginger|tonic)\b/),
  ],
  "cremerie-oeufs": [
    r("oeufs", /^oeufs\b/),
    r("boissons-lactees", /\b(lait chocolate|cafe glace|cafe latte|boisson lactee|boisson proteinee|milkshake|frappuccino|repas vegetalien)\b/),
    r("beurre-creme", /^(sauce|chantilly|beurre|margarine|base pour chantilly)\b/),
    r("desserts", /\b(dessert|desserts|milky|creme dessert|malabi|riz au lait|gelee|tiramisu|cheesecake|gateaux|sticky rice)\b/),
    r("yaourts", /\b(yaourt|yaourts|actimel|danone|muller|fromage blanc gamadim|fromage blanc vanille)\b/),
    r("fromages", /\b(fromage|cottage|mozzarella|burrata|philadelphia|feta|halloumi|labne|gvina|ricotta|mascarpone|brie|camembert|cheddar|gouda|parmigiano|manchego|gorgonzola|babybel)\b/),
    r("beurre-creme", /\b(beurre|margarine|tartinable|creme|chantilly|sauce|lait concentre|oeufs au plat vegetaux)\b/),
    r("lait", /\b(lait|boisson au soja|boisson soja|boisson noisette)\b/),
  ],
  "courses-epicerie": [
    r("cafe-the", /\b(cafe|capsules|nescafe|the|infusion)\b/),
    r("petit-dejeuner", /\b(cereales|flocons|confiture|miel|nutella|pate a tartiner|beurre de cacahuete|cacao)\b|^sucre\b/),
    r("cuisine-du-monde", /\b(nori|gari|curry|lait de coco|nam pla|soja|teriyaki|nouilles|feuilles de riz|vermicelles|sesame|sushi|sriracha)\b/),
    r("conserves", /\b(thon|mais|pois chiches|haricots|olives|artichauts|cornichons|capres|feuilles de vigne|concentre de tomates)\b/),
    r("pates-riz", /\b(pates|riz|quinoa|lentilles|ptitim|gnocchis|raviolis|tortellini|farine)\b/),
    r("frais", /\b(houmous|salade|tofu|yaourts|baguette|tahina|lait|oeufs|beurre|fromage|pain|pitas)\b/),
    r("sauces-epices", /\b(sauce|ketchup|mayonnaise|moutarde|vinaigre|huile|sel|poivre|epices|zaatar|harissa|schug|pesto|bouillon|oignons frits)\b/),
  ],
  "pain-patisserie": [
    r("sans-gluten", /sans gluten/),
    r("patisseries", /\b(cheesecake|gateau|croissants|babka|muffins|gaufres|madeleines)\b/),
    r("pates-a-cuire", /^pate\b|feuilles de brick/),
    r("pitas-wraps", /\b(pitas|tortillas)\b/),
    r("petits-pains", /\b(petits pains|mini pains|pains a|pain a burger|bretzel|bretzels|bagels|focaccias|mini-baguettes|demi-baguettes)\b/),
    r("crackers", /\b(crackers|azyme|galettes de riz)\b/),
    r("pains", /\b(pain|pains|baguette|hallah)\b/),
  ],
  "fruits-legumes": [
    r("herbes-salades", /\b(laitue|roquette|epinards|kale|coriandre|persil|menthe|basilic|aneth|thym|romarin|gingembre)\b/),
    r("legumes", /\b(pommes? de terre|patates|tomates|concombres|poivrons|piments|aubergines|courgettes|carottes|oignons|ail|chou|champignons|courge|celeri|poireaux|radis|betteraves|navets|fenouil|avocats)\b/),
    r("fruits", /\b(pasteque|dattes|fruits|bananes|pommes?|raisins?|melon|myrtilles|citrons|fraises|oranges|pamplemousses|clementines|poires|kiwi|mangue|grenade|prunes|peches|nectarines)\b/),
  ],
  poisson: [
    r("viande", /\b(poulet|boeuf|dinde|pastrami|saucisses?|salami|agneau|pargit|pargiyot|bacon|kabana|foies)\b/),
    r("sauces", /\b(sauce|huile pimentee)\b/),
    r("fume-sale", /\b(fume|fumee|sale|hareng|ikra|caviar)\b/),
    r("surgele", /\b(surgele|surgeles|surgelee|surgelees|tempura|pane|kebabs)\b/),
    r("frais", /\b(frais|fraiche|fraiches|tilapia)\b/),
  ],
  "surgeles-glaces": [
    r("glaces", /\b(glace|glaces|glacee|glaces|magnum|ben & jerry's|haagen-dazs|cornetto|gelato|franui|max brenner|oreo cups)\b/),
    r("vegetarien", /\b(vegetaux|vegetarien|falafel)\b/),
    r("poisson", /\b(saumon|tilapia|cabillaud|poisson|rouget)\b/),
    r("viande", /\b(poulet|boeuf|schnitzels?|burgers?|steak|entrecote|nuggets)\b/),
    r("pizzas-plats", /\b(pizza|pizzas|burekas|malawach|jachnun|samosas|ravioles|pate feuilletee)\b/),
    r("legumes-fruits", /\b(frites|petits pois|brocolis|haricots|mais|chou-fleur|baies)\b/),
  ],
  "apero-snacks": [
    r("fruits-secs", /\b(fruits secs|graines|amandes|noix de (cajou|grenoble)|pistaches|dattes|figues|abricots|cranberries|chataignes|chips de banane)\b/),
    r("chocolat", /\b(kinder|barre chocolatee|barre cow)\b/),
    r("barres", /\bbarres?\b/),
    r("bonbons", /\b(bonbons|haribo|skittles|chewing-gums)\b/),
    r("chips", /\b(bissli|bisli|bamba|chips|doritos|pop-corn|popcorn|crackers|triangles|dubonim)\b/),
    r("biscuits", /\b(biscuits|cookies|oreo|gaufrettes|gateaux|shortbreads|galettes|rouleaux)\b/),
    r("chocolat", /\b(chocolat|chocolats|kinder|tablette|ferrero|raffaello)\b/),
  ],
  "maison-entretien": [
    r("animaux", /\b(chien|chat|pedigree|litiere)\b/),
    r("eau-gazeuse", /\b(brita|sodastream)\b/),
    r("papier", /\b(papier toilette|essuie-tout|serviettes de table)\b/),
    r("cuisine-jetable", /\b(vaisselle jetable|gobelets|aluminium|papier cuisson|film alimentaire|sachets|sacs poubelle|briquet|bougies)\b/),
    r("nettoyage", /\b(lessive|vaisselle|eponges|nettoyant|cillit|deboucheur|wc|desinfectant|finish|lingettes|serpilleres|gants|savon)\b/),
  ],
  "pharmacie-hygiene": [
    r("dents", /\b(dentifrice|brosses? a dents|bain de bouche)\b/),
    r("intime", /\b(serviettes hygieniques|tampons|preservatifs|lubrifiant)\b/),
    r("sante", /\b(paracetamol|ibuprofene|pansements|thermometre|hydroalcoolique|anti-moustiques|piqures|fer|melatonine|lentilles|mouchoirs)\b/),
    r("corps", /\b(shampoing|apres-shampoing|gel douche|savon|deodorant|creme|baume|demaquillants|coton-tiges|mousse|rasoirs)\b/),
  ],
  "chargeurs-electronique": [
    r("accessoires", /^(support|kit d'urgence|kit de nettoyage|lampe|perche|lingettes|souris)\b/),
    r("jeux", /\b(ps5|xbox|playstation|nintendo|manette)\b/),
    r("audio", /\b(ecouteurs|enceinte|casque|airpods|buds|sony w[hf]|jbl|marshall|bose|homepod)\b/),
    r("protection", /\b(coque|verre trempe|etui|kit samsung)\b/),
    r("chargeurs-cables", /\b(chargeur|cable|adaptateur|batterie|alimentation|multiprise|parafoudre|parasurtenseur|piles|powerbank)\b/),
    r("montres-objets", /\b(montre|watch|garmin|smart band|bracelet|airtag|camera|ampoule|boitier tv|imprimante|interrupteur|telecommande|souris)\b/),
    r("telephones-tablettes", /\b(galaxy|iphone|tablette|smartphone|ipad|pixel|xiaomi (14t|redmi|poco|pad)|nokia|first phone|climex|carte sim|macbook|lenovo)\b/),
    r("accessoires", /\b(support|perche|lampe|guirlande|compresseur|rasoir|nettoyage|lingettes|kit|dyson|roborock|dreame|vacuum|purifier|nespresso|kettle|ninja|dji|logitech|pencil)\b/),
  ],
};
// Le rayon « Boucherie & poisson » a gardé son adresse sur une base où il n'a pas été renommé.
REGLES["boucherie-poisson"] = REGLES.poisson;

// L'ordre dans lequel le client lit les sous-rayons d'un rayon (ce qu'on achète le plus d'abord).
const ORDRE: Record<string, string[]> = {
  boissons: ["eaux", "eaux-aromatisees", "colas", "sodas", "jus", "thes-glaces", "energie", "sirops", "alcools"],
  "cremerie-oeufs": ["oeufs", "lait", "beurre-creme", "fromages", "yaourts", "desserts", "boissons-lactees"],
  "courses-epicerie": ["pates-riz", "conserves", "sauces-epices", "petit-dejeuner", "cafe-the", "cuisine-du-monde", "frais"],
  "pain-patisserie": ["pains", "petits-pains", "pitas-wraps", "patisseries", "pates-a-cuire", "crackers", "sans-gluten"],
  "fruits-legumes": ["fruits", "legumes", "herbes-salades"],
  poisson: ["frais", "surgele", "fume-sale", "sauces", "viande"],
  "surgeles-glaces": ["glaces", "pizzas-plats", "legumes-fruits", "poisson", "vegetarien", "viande"],
  "apero-snacks": ["chips", "biscuits", "chocolat", "bonbons", "barres", "fruits-secs"],
  "maison-entretien": ["papier", "nettoyage", "cuisine-jetable", "eau-gazeuse", "animaux"],
  "pharmacie-hygiene": ["corps", "dents", "intime", "sante"],
  "chargeurs-electronique": ["chargeurs-cables", "audio", "telephones-tablettes", "protection", "montres-objets", "jeux", "accessoires"],
};
ORDRE["boucherie-poisson"] = ORDRE.poisson;

/** Les sous-rayons d'un rayon, dans l'ordre d'affichage ; aucun pour un petit rayon (ou un rayon créé par le gérant). */
export function sousRayonsDe(slugRayon: string): string[] {
  return ORDRE[slugRayon] ?? [];
}

/** Le sous-rayon d'un article, d'après son nom français ; « autres » si aucune règle ne le reconnaît. */
export function sousRayonDe(slugRayon: string, nomFrancais: string): string {
  const nom = sansAccents(nomFrancais);
  return REGLES[slugRayon]?.find((regle) => regle.motif.test(nom))?.cle ?? AUTRES;
}

/** Tous les rayons qui ont des sous-rayons, avec leurs clés : pour vérifier que chacune a un nom dans chaque langue. */
export const RAYONS_A_SOUS_RAYONS: Record<string, string[]> = ORDRE;

/** Les clés que les règles d'un rayon peuvent rendre : chacune doit avoir sa place dans l'ordre d'affichage. */
export const clesDesRegles = (slugRayon: string): string[] => [...new Set((REGLES[slugRayon] ?? []).map((regle) => regle.cle))];

/**
 * Range des articles par sous-rayon, dans l'ordre d'affichage (« autres » en dernier). Chaque article garde
 * sa place dans son groupe. Un rayon sans règle rend un seul groupe, « autres ».
 */
export function grouperParSousRayon<T extends { sousRayon: string }>(slugRayon: string, articles: T[]): { cle: string; articles: T[] }[] {
  const groupes = new Map<string, T[]>([...sousRayonsDe(slugRayon), AUTRES].map((cle) => [cle, []]));
  for (const a of articles) (groupes.get(a.sousRayon) ?? groupes.get(AUTRES)!).push(a);
  return [...groupes].filter(([, liste]) => liste.length > 0).map(([cle, liste]) => ({ cle, articles: liste }));
}

/**
 * Les articles qui ont une photo d'abord : dans une grille, les grandes tuiles se suivent et les autres aussi.
 * L'ordre de chaque groupe ne change pas.
 */
export function photosDAbord<T extends { photoUrl: string }>(articles: T[]): T[] {
  return [...articles.filter((a) => a.photoUrl), ...articles.filter((a) => !a.photoUrl)];
}
