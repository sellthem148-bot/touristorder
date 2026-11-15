// Relevé du 15 novembre 2026, d'après trois captures du gérant de Wolt Market Netanya Center (« Les plus
// commandés », « Promotions », « Tous les articles » : 616 cartes) envoyées pour les photos repère
// (« regarde les photos des produits qu'on a »).
// - 215 articles du site y sont, reconnus à leur nom exact sur Wolt : leurs prix n'ont pas bougé, sauf un.
// - Onze articles de la LISTE du gérant y sont aussi, sous la même marque et le même format : plutôt que de
//   les laisser « prix non vérifié », on note leur prix NORMAL (le prix barré quand Wolt affiche une
//   promotion) et leur nom exact sur Wolt. `ancien` = le prix de sa liste.
// Ne sont PAS rapprochés (autre marque, autre format ou marque absente du nom) : le riz basmati (Daawat chez
// Wolt, Sugat dans la liste), le chocolat Cow pétillant (90 g chez Wolt, 100 g dans la liste), le Bisli
// « גריל » (la liste dit Barbecue), la crème 15 % Yotvata, le lait d'amande Alpro sans sucre.
import type { LigneDeReleve } from "./releve-wolt-1112";

export const RELEVE_DU_15_NOVEMBRE: LigneDeReleve[] = [
  // Liste du gérant : le vrai prix.
  { nom: "Bamba Osem classique 80 g", nomWolt: "במבה - 80 גרם", prix: 5.9, ancien: 5.5 },
  { nom: "Menthe fraîche Nana, la botte", nomWolt: "נענע", prix: 5.9, ancien: 4.5 },
  { nom: "Biscuits Petit Beurre classiques Osem 500 g", nomWolt: "פתי בר קלאסי אסם - 500 גרם", prix: 13.9, ancien: 13.9 },
  { nom: "Canette Red Bull Energy Drink 25 cl", nomWolt: "משקה אנרגיה רדבול", prix: 7.9, ancien: 8.5 },
  { nom: "Betteraves rouges cuites sous vide 500 g", nomWolt: "סלק בואקום", prix: 9.3, ancien: 9.9 },
  { nom: "Ketchup Heinz classique 700 g", nomWolt: "קטשופ היינץ - 700 גרם", prix: 15.9, ancien: 14.9 },
  { nom: "Burekas aux pommes de terre Maadanot 800 g", nomWolt: "בורקס תפו\"א מעדנות - 800 גרם", prix: 26.5, ancien: 24.9 },
  { nom: "Lait d'avoine Barista Oatly 1 L", nomWolt: "משקה שיבולת שועל להקצפה בריסטה אוטלי - 1 ליטר", prix: 17.9, ancien: 14.9 },
  { nom: "Gaufrettes Loacker Quadratini Noisette 250 g", nomWolt: "לואקר קואדרטיני קרם אגוזים", prix: 18.9, ancien: 16.9 },
  { nom: "Gaufrettes fines au citron Elite Bafle 200 g", nomWolt: "בפלות בטעם לימון", prix: 8.9, ancien: 8.5 },
  { nom: "Crème aigre Shamenet Shel Paam 27 % 200 g", nomWolt: "תנובה שמנת חמוצה 27% - 200 מ\"ל", prix: 5.5, ancien: 5.5 },
  // Relevé du 10 novembre : le seul prix qui a changé depuis.
  { nom: "Mini pitas épeautre complet Agmi 450 g", nomWolt: "פיתה ביס כוסמין מלא אגמי", prix: 17.9, ancien: 18.9 },
];
