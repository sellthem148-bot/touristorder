// Le relevé du 12 novembre 2026 sur Wolt Market (Netanya Center), d'après les captures du gérant :
// rayons poisson, pain, lait et œufs, yaourts et desserts (364 articles lus).
//
// - Les prix sont les prix NORMAUX : quand Wolt affichait une promotion, c'est le prix barré qui est relevé.
// - Tous les articles du relevé du 10 novembre revus ce jour-là sont restés au même prix, sauf le saumon
//   frais (vendu au poids : un ou deux centimes d'écart).
// - Six articles de la liste du gérant ont été retrouvés : leur vrai prix et leur nom exact sur Wolt sont
//   notés ici. Ceux que Wolt vend sous une autre forme (autre marque, autre format) ne sont pas touchés.
// - Trois articles que le site ne proposait pas sont ajoutés (le gérant : « sauf si tu vois quelque chose
//   d'intéressant ») : une hallah pour le Shabbat, un malabi, un café glacé.
import { enAgorot, type ArticleWolt } from "./articles-wolt";

export type LigneDeReleve = {
  /** Le nom de l'article sur le site, tel que le code l'a installé. */
  nom: string;
  /** Son nom exact sur Wolt (hébreu). */
  nomWolt: string;
  /** Le prix normal relevé sur Wolt, en shekels. */
  prix: number;
  /** Le prix que le code avait posé (relevé précédent, ou liste du gérant), en shekels. */
  ancien: number;
};

export const RELEVE_DU_12_NOVEMBRE: LigneDeReleve[] = [
  // Relevé du 10 novembre : vendus au poids, le prix a bougé de quelques centimes.
  { nom: "Filet de saumon frais, environ 650 g", nomWolt: "סלמון פילה נתחים טרי, ~650 g", prix: 99, ancien: 98.98 },
  { nom: "Pavé de saumon frais, environ 220 g", nomWolt: "פילה סלמון נתחים טרי, ~220 g", prix: 40.92, ancien: 40.91 },
  // Liste du gérant : articles retrouvés sur Wolt, avec leur vrai prix.
  { nom: "Müller Active Protein Vanille 200 g", nomWolt: "יוגורט מולר פרוטאין בטעם וניל 25 גרם חלבון 0% שומן", prix: 8, ancien: 7.5 },
  { nom: "Dessert végétal soja chocolat Alpro × 4", nomWolt: "אלפרו מעדן סויה בטעם שוקולד 125*4 מל", prix: 22.9, ancien: 18.9 },
  { nom: "Bagels de Jérusalem au sésame × 2", nomWolt: "בייגל ירושלמי - 2 יחידות", prix: 12.5, ancien: 12 },
  { nom: "Pain à burger brioché × 4", nomWolt: "לחמניות המבורגר בריוש - 4 יחידות", prix: 20.5, ancien: 14.9 },
  { nom: "Pains pitas fraîches × 5", nomWolt: "פיתות עבודת יד - 5 יחידות", prix: 10.5, ancien: 8.5 },
  // Sur Wolt : le pain 100 % seigle « Berlin » d'Agmi, 550 g.
  { nom: "Pain 100 % seigle complet tranché 500 g", nomWolt: "לחם שיפון 100% ברלין אגמי", prix: 16.9, ancien: 17.9 },
];

export type Remplacement = {
  /** Le nom de l'article de la liste du gérant, que Wolt ne vend pas tel quel. */
  ancien: string;
  /** Ce que Wolt vend vraiment : le nom, la description (seulement ce que montre la page de Wolt), le prix normal. */
  nom: string;
  description: string;
  prix: number;
  nomWolt: string;
};

/**
 * Sept articles de la liste du gérant que Wolt vend sous une autre marque ou un autre format. Le gérant,
 * à qui la liste a été montrée : « remplace ». L'article prend le nom, la description et le prix de ce que
 * Wolt vend vraiment (`remplacerLesArticles`, prisma/remplissage.ts).
 */
export const REMPLACEMENTS_DU_12_NOVEMBRE: Remplacement[] = [
  { ancien: "Beurre Lurpak salé 200 g", nom: "Beurre tartinable salé Lurpak 250 g", description: "Beurre à tartiner salé, 250 g", prix: 20.6, nomWolt: "ממרח חמאה עם מלח לורפק - 250 גרם" },
  { ancien: "Tortillas de blé wrap × 6", nom: "Tortillas de blé Mexifoods 20 cm × 8", description: "Tortillas à la farine de blé de 20 cm, le paquet de 8 (320 g)", prix: 8.9, nomWolt: "טורטיות קמח חיטה 20 ס\"מ מקסיפוד - 8 יח'" },
  { ancien: "Petits pains au lait briochés × 6", nom: "Petits pains moelleux Angel × 6", description: "Petits pains moelleux, le sachet de 6 (450 g)", prix: 12.9, nomWolt: "לחמניה רכה אנג'ל - 6 יח'" },
  { ancien: "Pain de mie sans gluten Schär 300 g", nom: "Pain blanc tranché sans gluten 500 g (surgelé)", description: "Pain blanc en tranches, sans gluten, surgelé, 500 g", prix: 21.5, nomWolt: "לחם לבן פרוס ללא גלוטן קפוא שרהל'ה" },
  { ancien: "Yaourt brassé Danone Bio nature × 4", nom: "Yaourts Danone Bio 3 % × 8 (150 g)", description: "Pack de 8 yaourts de 150 g, à 3 % de matière grasse", prix: 22.5, nomWolt: "מאגדת יוגורט ביו דנונה 3% - 150 גרם * 8" },
  { ancien: "Yaourt protéiné GO Tnuva fruits bois 200 g", nom: "Yaourt protéiné GO fraise 200 g", description: "Yaourt crémeux à la fraise, 20 g de protéines, le pot de 200 g", prix: 7.2, nomWolt: "יוגורט גו קרמי תות 20 ג' חלבון" },
  { ancien: "Crème fraîche 38 % Chef Lavan 250 ml", nom: "Crème à fouetter Yotvata 38 % 250 g", description: "Crème à fouetter à 38 % de matière grasse, 250 g", prix: 7.64, nomWolt: "שמנת להקצפה 38% מהדרין יטבתה 250 גרם - מחיר מפוקח" },
];

/** Les trois articles ajoutés ce jour-là (descriptions : seulement ce que montre la page de Wolt). */
export const ARTICLES_WOLT_DU_12_NOVEMBRE: ArticleWolt[] = [
  { categorie: "Pain & pâtisserie", nom: "Hallah tressée Angel 500 g", description: "Hallah sucrée tressée, 500 g", prix: 18.9, nomWolt: "חלה מתוקה קלועה אנג'ל - 500 גרם" },
  { categorie: "Crèmerie & œufs", nom: "Malabi Gad 160 g", description: "Malabi, le pot de 160 g", prix: 8.6, nomWolt: "מלבי גד - 160 גרם" },
  { categorie: "Crèmerie & œufs", nom: "Café glacé Yotvata 1 L", description: "Café glacé, 1 litre", prix: 14.2, nomWolt: "יטבתה אייס קפה - 1 ליטר" },
];

/** Ce que l'opération lit d'un article pour décider. Les prix sont en agorot, comme dans la base. */
export type ProduitReleve = { id: string; nom: string; nomWolt: string; prix: number; prixAchat: number | null };
export type ChangementDePrix = { id: string; nom: string; data: { prix?: number; prixAchat?: number; nomWolt?: string } };

/**
 * Ce que le relevé change, article par article (pur) :
 * - un article dont le prix est resté celui que le code avait posé (et dont le prix d'achat est vide, ou
 *   ce même prix) passe au prix relevé — prix de vente ET prix d'achat : la marge est sur les frais ;
 * - un article dont le gérant a changé le prix lui-même garde son prix et son prix d'achat ;
 * - dans les deux cas, le nom exact sur Wolt est noté s'il manquait.
 * Un article est reconnu à son nom, ou à son nom sur Wolt (le gérant a pu le renommer).
 */
export function changementsDuReleve(produits: ProduitReleve[], releve: LigneDeReleve[] = RELEVE_DU_12_NOVEMBRE): ChangementDePrix[] {
  const changements: ChangementDePrix[] = [];
  for (const ligne of releve) {
    const ancien = enAgorot(ligne.ancien);
    const prix = enAgorot(ligne.prix);
    for (const p of produits) {
      if (p.nom !== ligne.nom && p.nomWolt !== ligne.nomWolt) continue;
      const data: ChangementDePrix["data"] = {};
      const intact = p.prix === ancien && (p.prixAchat === null || p.prixAchat === ancien);
      if (intact) {
        data.prix = prix;
        data.prixAchat = prix;
      }
      if (!p.nomWolt.trim()) data.nomWolt = ligne.nomWolt;
      if (Object.keys(data).length > 0) changements.push({ id: p.id, nom: p.nom, data });
    }
  }
  return changements;
}
