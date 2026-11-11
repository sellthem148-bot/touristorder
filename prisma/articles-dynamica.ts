// Les articles de la boutique Dynamica (Netanya) sur Wolt : téléphones, accessoires, électronique.
// Relevé du 11 novembre 2026 (page « Les plus commandés »). Mêmes règles que prisma/articles-wolt.ts :
// prix de Wolt, nom français pour le client, nom Wolt gardé pour le gérant, installé une seule fois.
import type { ArticleWolt } from "./articles-wolt";

export const BOUTIQUE_DYNAMICA = "Dynamica Netanya";

const ELEC = "Chargeurs & électronique";

export const ARTICLES_DYNAMICA: ArticleWolt[] = [
  // ── Chargeurs et batteries ───────────────────────────────────────────────────
  { categorie: ELEC, nom: "Chargeur Apple 20 W USB-C", description: "Adaptateur secteur Apple", prix: 119, nomWolt: "Apple | 20W | USB-C", populaire: true },
  { categorie: ELEC, nom: "Chargeur Samsung 25 W + câble USB-C noir", description: "Adaptateur secteur et câble USB-C vers USB-C", prix: 99, nomWolt: "ראש מטען 25W + כבל Samsung Charger C to C | שחור", populaire: true },
  { categorie: ELEC, nom: "Chargeur USB-C 25 W blanc", description: "Adaptateur secteur seul", prix: 99, nomWolt: "ראש מטען 25W | type c | לבן" },
  { categorie: ELEC, nom: "Chargeur rapide PureGear 45 W USB-C noir", description: "Chargeur mural rapide", prix: 139, nomWolt: "ראש מטען קיר מהיר PureGear Type C + 45W | שחור" },
  { categorie: ELEC, nom: "Batterie externe magnétique Samsung blanc", description: "Recharge sans fil aimantée", prix: 199, nomWolt: "Samsung Magnetic Battery סוללת טעינה מגנטית | לבן" },
  { categorie: ELEC, nom: "Alimentation pour routeur noir", description: "Transformateur secteur pour box ou routeur", prix: 50, nomWolt: "שנאי נתב | שחור" },

  // ── Écouteurs, casques et enceintes ──────────────────────────────────────────
  { categorie: ELEC, nom: "Écouteurs filaires Samsung AKG jack 3,5 mm noir", description: "Prise jack 3,5 mm", prix: 69, nomWolt: "אוזניות סמסונג Samsung AKG Earphone 3.5 | שחור" },
  { categorie: ELEC, nom: "Écouteurs filaires d'origine Samsung AKG noir", description: "Écouteurs filaires d'origine Samsung", prix: 119, nomWolt: "אוזניות חוטיות מקוריות Samsung AKG | שחור" },
  { categorie: ELEC, nom: "Écouteurs filaires d'origine Samsung AKG blanc", description: "Écouteurs filaires d'origine Samsung", prix: 119, nomWolt: "אוזניות חוטיות מקוריות Samsung AKG | לבן" },
  { categorie: ELEC, nom: "Écouteurs sans fil Samsung Galaxy Buds Core noir", description: "Écouteurs Bluetooth avec boîtier de charge", prix: 299, nomWolt: "אוזניות אלחוטיות Samsung Galaxy Buds Core | שחור" },
  { categorie: ELEC, nom: "Écouteurs sans fil Samsung Galaxy Buds Core blanc", description: "Écouteurs Bluetooth avec boîtier de charge", prix: 299, nomWolt: "אוזניות אלחוטיות Samsung Galaxy Buds Core | לבן" },
  { categorie: ELEC, nom: "Étui silicone pour AirPods 4 rose", description: "CaseGuard Essentials", prix: 49, nomWolt: "כיסוי סיליקון לאוזניות Essentials CaseGuard Airpods 4 | ורוד" },
  { categorie: ELEC, nom: "Enceinte Bluetooth JBL Grip noir", description: "Enceinte sans fil compacte", prix: 239, nomWolt: "רמקול אלחוטי שחור JBL GRIP | שחור" },
  { categorie: ELEC, nom: "Enceinte Bluetooth JBL Flip 7 rouge", description: "Enceinte sans fil", prix: 319, nomWolt: "רמקול אלחוטי JBL FLIP 7 | אדום" },
  { categorie: ELEC, nom: "Enceinte Bluetooth JBL Charge 6 rouge", description: "Enceinte sans fil", prix: 455, nomWolt: "רמקול אלחוטי JBL CHARGE 6 | אדום" },

  // ── Téléphones et tablettes ──────────────────────────────────────────────────
  { categorie: ELEC, nom: "Samsung Galaxy A07 64 Go noir", description: "Smartphone", prix: 529, nomWolt: "סמסונג גלקסי Samsung Galaxy A07 64GB | שחור" },
  { categorie: ELEC, nom: "Tablette Samsung Galaxy Tab A11 8,7 pouces Wi-Fi gris", description: "Tablette Wi-Fi", prix: 599, nomWolt: "טאבלט Galaxy Tab A11 8.7 WIFI | אפור" },

  // ── Protections pour téléphone ───────────────────────────────────────────────
  { categorie: ELEC, nom: "Verre trempé PG Glass iPhone 16/17/18 Pro Max", description: "Protection d'écran transparente", prix: 99, nomWolt: "PG Glass iPhone 16/17/18 Pro Max מגן מסך זכוכית | שקוף" },
  { categorie: ELEC, nom: "Verre trempé anti-regards PG Glass iPhone 17 Pro", description: "Protection d'écran teintée, confidentialité", prix: 119, nomWolt: "PG Glass Privacy iPhone 17 Pro" },
  { categorie: ELEC, nom: "Verre trempé anti-regards PG Glass iPhone 17/18 Pro", description: "Protection d'écran teintée, confidentialité", prix: 119, nomWolt: "מגן מסך זכוכית כהה | PG Glass Privacy iPhone 17/18 Pro" },
  { categorie: ELEC, nom: "Verre trempé anti-regards PG Glass iPhone 17/18 Pro Max", description: "Protection d'écran teintée, confidentialité", prix: 119, nomWolt: "מגן מסך זכוכית כהה | PG Glass Privacy iPhone 17/18 Pro Max" },
  { categorie: ELEC, nom: "Verre trempé OtterBox iPhone 17/18 Pro", description: "Protection d'écran transparente", prix: 119, nomWolt: "OtterBox Glass iPhone 17/18 Pro מגן מסך זכוכית | שקוף" },
  { categorie: ELEC, nom: "Verre trempé OtterBox iPhone 17/18 Pro Max", description: "Protection d'écran transparente", prix: 119, nomWolt: "OtterBox Glass iPhone 17/18 Pro Max מגן מסך זכוכית | שקוף" },
  { categorie: ELEC, nom: "Coque transparente Hard Shell iPhone 17/18 Pro", description: "Coque arrière rigide", prix: 99, nomWolt: "Hard Shell M.S iPhone 18/17 Pro כיסוי אחורי | שקוף" },
  { categorie: ELEC, nom: "Coque MagSafe transparente Dualtek iPhone 17 Pro Max", description: "Coque arrière compatible MagSafe", prix: 149, nomWolt: "Dualtek magsafe iphone 17 Pro Max כיסוי אחורי | שקוף" },
  { categorie: ELEC, nom: "Kit Samsung Galaxy S25 : coque React + verre trempé", description: "Coque arrière transparente et protection d'écran", prix: 179, nomWolt: "קיט S25 כיסוי אחורי React ומגן מסך זכוכית | שקוף" },

  // ── Jeux vidéo et télévision ─────────────────────────────────────────────────
  { categorie: ELEC, nom: "Manette PS5 DualSense rouge", description: "Manette sans fil pour PlayStation 5", prix: 329, nomWolt: "בקר אלחוטי Dualsense PS5 V3 | אדום" },
  { categorie: ELEC, nom: "Casque sans fil PS5 Pulse Elite noir", description: "Casque pour PlayStation 5", prix: 599, nomWolt: "אוזניות אלחוטיות PS5 Pulse Elite | שחור" },
  { categorie: ELEC, nom: "Manette Xbox sans fil rouge", description: "Pour Xbox Series X|S, PC, Android et iOS", prix: 299, nomWolt: "בקר אלחוטי XBOX Series 2026 X | S למחשב, אנדרואיד ו-iOS" },
  { categorie: ELEC, nom: "Télécommande MB Pro pour décodeur MasterBox", description: "Pour le décodeur MasterBox SEI500C (Android TV 4K)", prix: 59, nomWolt: "שלט MB PRO לממיר MasterBox SEI500C ATV 4K" },
];
