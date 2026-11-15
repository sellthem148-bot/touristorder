// « Photos rapides » : poser sur un article l'image que le gérant vient de COPIER ailleurs (une recherche
// d'images dans un autre onglet) — bouton « Coller », Ctrl + V, ou l'image glissée sur la ligne.
// Rien ne part d'ici vers un autre site : on ne lit que ce que le navigateur a dans son presse-papiers.

/** Les types que le serveur accepte tels quels (lib/image.ts) ; les autres sont convertis en JPEG avant l'envoi. */
export const TYPES_ACCEPTES = /^image\/(jpeg|png|webp)$/;

/** En dessous, c'est une vignette de liste de résultats : illisible sur une tuile du site. */
export const COTE_REFUSE = 200;
/** En dessous, l'image passe mais sera un peu floue : on le dit. */
export const COTE_CONSEILLE = 400;

export type AvisDeTaille = { refus: boolean; message: string };

/** Pur : ce qu'on dit d'une image d'après son plus grand côté ; rien si elle est assez grande. */
export function avisDeTaille(largeur: number, hauteur: number): AvisDeTaille | null {
  const cote = Math.max(largeur, hauteur);
  if (!(cote > 0)) return { refus: true, message: "Cette image ne se lit pas : copie-en une autre." };
  if (cote < COTE_REFUSE) {
    return { refus: true, message: `Image trop petite (${cote} px) : c'est une vignette. Ouvre l'image en grand, puis copie-la.` };
  }
  if (cote < COTE_CONSEILLE) {
    return { refus: false, message: `Photo enregistrée, mais petite (${cote} px) : elle sera un peu floue. Ouvre l'image en grand avant de la copier.` };
  }
  return null;
}

/**
 * Pur : la première image écrite DANS un morceau de page copié (`<img src="data:image/…;base64,…">`).
 * Une image donnée par son adresse (`https://…`) n'est pas lue : on ne va rien chercher sur un autre site.
 */
export function imageDansLeHtml(html: string): string | null {
  const trouve = /<img\b[^>]*?\bsrc\s*=\s*(["'])(data:image\/[a-z0-9.+-]+;base64,[a-z0-9+/=\s]+)\1/i.exec(html);
  return trouve ? trouve[2].replace(/\s+/g, "") : null;
}

/** Pur : une image « data: » en fichier ; rien si elle est illisible. */
export function fichierDepuisDonnees(donnees: string, nom = "image-collee"): File | null {
  const lu = /^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=]+)$/i.exec(donnees);
  if (!lu) return null;
  try {
    const binaire = atob(lu[2]);
    const octets = new Uint8Array(binaire.length);
    for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
    return new File([octets], nom, { type: lu[1].toLowerCase() });
  } catch {
    return null;
  }
}

/** L'image d'un collage (Ctrl + V) ou d'un glisser-déposer : le fichier s'il y en a un, sinon l'image écrite dans le morceau de page. */
export function imageDuTransfert(transfert: DataTransfer | null): File | null {
  if (!transfert) return null;
  const fichier = Array.from(transfert.files).find((f) => f.type.startsWith("image/"));
  if (fichier) return fichier;
  const donnees = imageDansLeHtml(transfert.getData("text/html"));
  return donnees ? fichierDepuisDonnees(donnees) : null;
}

export type ImageCollee = { fichier: File } | { erreur: string };

const RIEN_A_COLLER = "Rien à coller : copie d'abord une image (appui long ou clic droit sur l'image, puis « Copier l'image »).";

/**
 * L'image du presse-papiers, pour le bouton « Coller ». Le navigateur demande l'accord du gérant (une fois,
 * ou à chaque fois selon le navigateur) ; sans accord, ou sans image copiée, on dit quoi faire.
 */
export async function imageDuPressePapiers(): Promise<ImageCollee> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.read) {
    return { erreur: "Ce navigateur ne sait pas coller ici : sur ordinateur, fais Ctrl + V ; sinon passe par « Ajouter »." };
  }
  let elements: ClipboardItems;
  try {
    elements = await navigator.clipboard.read();
  } catch (e) {
    // Refusé par le gérant ou par le navigateur ; un presse-papiers vide lève aussi sur certains navigateurs.
    const refuse = e instanceof DOMException && e.name === "NotAllowedError";
    return { erreur: refuse ? "Collage refusé : accepte quand le navigateur demande « Coller », puis réessaie." : RIEN_A_COLLER };
  }
  for (const element of elements) {
    const type = element.types.find((t) => t.startsWith("image/"));
    if (type) {
      const blob = await element.getType(type);
      return { fichier: new File([blob], "image-collee", { type: blob.type || type }) };
    }
  }
  for (const element of elements) {
    if (!element.types.includes("text/html")) continue;
    const donnees = imageDansLeHtml(await (await element.getType("text/html")).text());
    const fichier = donnees ? fichierDepuisDonnees(donnees) : null;
    if (fichier) return { fichier };
  }
  const texte = elements.some((e) => e.types.includes("text/plain") || e.types.includes("text/html"));
  return { erreur: texte ? "C'est un texte ou une adresse qui est copié, pas l'image : choisis « Copier l'image »." : RIEN_A_COLLER };
}

/** Les dimensions d'une image ; rien si le navigateur ne sait pas la lire. */
export async function dimensionsDe(fichier: Blob): Promise<{ largeur: number; hauteur: number } | null> {
  const adresse = URL.createObjectURL(fichier);
  try {
    const image = new Image();
    image.src = adresse;
    await image.decode();
    return { largeur: image.naturalWidth, hauteur: image.naturalHeight };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(adresse);
  }
}

/** Une empreinte de l'image (ses octets) : pour reconnaître la même image collée deux fois de suite. */
export async function empreinteDe(fichier: Blob): Promise<string> {
  try {
    const condense = await crypto.subtle.digest("SHA-256", await fichier.arrayBuffer());
    return Array.from(new Uint8Array(condense), (o) => o.toString(16).padStart(2, "0")).join("");
  } catch {
    return `${fichier.size}:${fichier.type}`;
  }
}
