// Allège une photo DANS LE NAVIGATEUR avant l'envoi : une photo de téléphone pèse 3 à 10 Mo, or
// Vercel refuse toute requête de plus de 4,5 Mo (et une vignette de catalogue n'a pas besoin de plus
// de 1 600 px). Le serveur revérifie de toute façon le type et le poids (lib/image.ts, lib/stockage.ts).

/** Le plus grand côté d'une photo de produit, en pixels. */
export const COTE_MAX_PHOTO = 1600;
const QUALITE_JPEG = 0.82;
/** En dessous, et si elle n'est pas trop grande, on n'y touche pas. */
const POIDS_SANS_RETOUCHE = 400 * 1024;

/** Pur : les dimensions après réduction (proportions gardées, jamais d'agrandissement). */
export function dimensionsReduites(largeur: number, hauteur: number, coteMax = COTE_MAX_PHOTO): { largeur: number; hauteur: number } {
  if (!(largeur > 0) || !(hauteur > 0)) return { largeur: 0, hauteur: 0 };
  const facteur = Math.min(1, coteMax / Math.max(largeur, hauteur));
  return { largeur: Math.max(1, Math.round(largeur * facteur)), hauteur: Math.max(1, Math.round(hauteur * facteur)) };
}

/** Pur : « 3,8 Mo », « 240 Ko ». */
export function poidsLisible(octets: number): string {
  if (octets >= 1024 * 1024) return `${(octets / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
  return `${Math.max(1, Math.round(octets / 1024))} Ko`;
}

/**
 * La photo allégée (JPEG, 1 600 px au plus), ou la photo d'origine si elle est déjà légère,
 * si le navigateur ne sait pas la lire, ou si le résultat serait plus lourd. Ne lève jamais.
 */
export async function reduirePhoto(fichier: File): Promise<File> {
  try {
    if (!fichier.type.startsWith("image/")) return fichier;
    const adresse = URL.createObjectURL(fichier);
    try {
      const image = new Image();
      image.src = adresse;
      await image.decode();
      const { largeur, hauteur } = dimensionsReduites(image.naturalWidth, image.naturalHeight);
      if (largeur === 0) return fichier;
      const dejaPetite = largeur === image.naturalWidth && fichier.size <= POIDS_SANS_RETOUCHE;
      if (dejaPetite) return fichier;

      const toile = document.createElement("canvas");
      toile.width = largeur;
      toile.height = hauteur;
      const contexte = toile.getContext("2d");
      if (!contexte) return fichier;
      // Fond blanc : un PNG transparent ne devient pas noir en JPEG.
      contexte.fillStyle = "#ffffff";
      contexte.fillRect(0, 0, largeur, hauteur);
      contexte.drawImage(image, 0, 0, largeur, hauteur);
      const blob = await new Promise<Blob | null>((fini) => toile.toBlob(fini, "image/jpeg", QUALITE_JPEG));
      if (!blob || blob.type !== "image/jpeg" || blob.size >= fichier.size) return fichier;
      const nom = fichier.name.replace(/\.[^.]*$/, "") || "photo";
      return new File([blob], `${nom}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
    } finally {
      URL.revokeObjectURL(adresse);
    }
  } catch {
    return fichier;
  }
}
