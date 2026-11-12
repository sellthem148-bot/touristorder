// Ce qui aide le gérant à retrouver sur Wolt un article qu'il ne connaît pas : son nom en hébreu, à coller
// dans la recherche de Wolt, et une recherche d'images pour voir à quoi il ressemble.
// Réservé à l'espace gérant, côté serveur : lit le catalogue en hébreu (lourd), jamais envoyé au navigateur.
import { nomArticle } from "./i18n/catalogue";
import { rechercheDImage } from "./recherche-image";
import { photoRepere } from "./reperes-wolt";

export type RepereWolt = {
  /** Le nom en hébreu ; vide si on n'en connaît aucun. */
  hebreu: string;
  /** Vrai : le nom exact relevé sur Wolt (`Produit.nomWolt`). Faux : une traduction du nom français. */
  exact: boolean;
  /** L'adresse d'une recherche d'images sur cet article. */
  images: string;
  /** La photo que Wolt montre pour cet article (captures du gérant), réservée à l'espace gérant ; `null` si on ne l'a pas. */
  photo: string | null;
};

export function repereWolt(nom: string, nomWolt: string | null | undefined): RepereWolt {
  const releve = (nomWolt ?? "").trim();
  const photo = photoRepere(nom, releve);
  if (releve) return { hebreu: releve, exact: true, images: rechercheDImage(nom, releve), photo };
  // Pas de nom relevé sur Wolt : la traduction du nom français, si l'article est du catalogue de départ.
  const traduit = nomArticle(nom, "he");
  const hebreu = traduit !== nom ? traduit : "";
  return { hebreu, exact: false, images: rechercheDImage(nom, hebreu), photo };
}
