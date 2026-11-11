// Le nom du site : un seul endroit à changer (ou la variable d'environnement NEXT_PUBLIC_NOM_DU_SITE).
export const NOM_DU_SITE = process.env.NEXT_PUBLIC_NOM_DU_SITE || "Tourist Order";

export const SLOGAN = "Vos courses et vos oublis, livrés à votre logement en Israël.";

export const FUSEAU = "Asia/Jerusalem";

// L'adresse publique du site, sans barre finale : liens absolus (aperçu de partage, plan du site, référencement).
export const ADRESSE_DU_SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://www.touristorder.com").replace(/\/$/, "");

// Ce que les moteurs de recherche affichent sous le titre du site.
export const DESCRIPTION_DU_SITE =
  "Courses, produits pour bébé, hygiène, chargeurs et oublis de vacances : commandez en français, nous vous livrons le soir à votre logement ou à votre hôtel, à Netanya et dans les villes voisines.";

// Le message d'accueil d'un site neuf, et les modes de paiement proposés par défaut.
export const MESSAGE_ACCUEIL_PAR_DEFAUT = "Commandez quand vous voulez, nous vous livrons le soir à votre logement : chargeur oublié, couches, maillot, courses…";
export const PAIEMENTS_PAR_DEFAUT = ["Bit", "PayBox", "Virement"];

// Les anciennes valeurs par défaut (tutoiement, paiement à la livraison). Une base qui les porte
// encore telles quelles n'a pas été réglée par le gérant : la mise en ligne les remplace
// (prisma/remplissage.ts). Une valeur modifiée par le gérant n'est jamais touchée.
export const ANCIEN_MESSAGE_ACCUEIL = "Commande quand tu veux, on te livre le soir à ton hôtel : chargeur oublié, couches, maillot, courses…";
export const ANCIENS_PAIEMENTS = ["Espèces", "Bit", "PayBox"];
