import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { exigerAdmin } from "@/lib/admin";
import { DOSSIER_DES_REPERES, NOMBRE_DE_PHOTOS_REPERE, estPhotoRepere } from "@/lib/reperes-wolt";

export const dynamic = "force-dynamic";

/**
 * Une photo repère du gérant (la photo que Wolt montre pour un article, tirée de ses captures) :
 * /admin/repere/<fichier>. Réservée au gérant — une route n'est pas protégée par le layout :
 * exigerAdmin() d'abord. Seuls les fichiers de la liste sont lus (lib/reperes-wolt.ts).
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ fichier: string }> }) {
  const { fichier } = await params;
  // « /admin/repere/etat » : les photos sont-elles bien parties avec cette route ? Lisible de l'extérieur, pour
  // vérifier une mise en ligne sans le mot de passe du gérant — un NOMBRE, jamais un nom ni une photo. (Le gérant
  // ne voyait pas ses photos en production alors qu'elles s'affichaient partout ailleurs : 17 novembre 2026.)
  if (fichier === "etat") return Response.json(await etatDesPhotos(), { headers: { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  await exigerAdmin();
  if (!estPhotoRepere(fichier)) return new Response("Photo inconnue.", { status: 404 });
  try {
    const octets = await readFile(path.join(process.cwd(), DOSSIER_DES_REPERES, fichier));
    return new Response(new Uint8Array(octets), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=86400", "X-Robots-Tag": "noindex" },
    });
  } catch {
    return new Response("Photo introuvable.", { status: 404 });
  }
}

/** Combien de photos de la liste sont lisibles sur ce serveur (et, s'il manque le dossier, le code de l'erreur). */
async function etatDesPhotos(): Promise<{ attendues: number; presentes: number; erreur?: string }> {
  const attendues = NOMBRE_DE_PHOTOS_REPERE;
  try {
    const fichiers = await readdir(path.join(process.cwd(), DOSSIER_DES_REPERES));
    return { attendues, presentes: fichiers.filter(estPhotoRepere).length };
  } catch (e) {
    return { attendues, presentes: 0, erreur: e instanceof Error && "code" in e ? String(e.code) : "illisible" };
  }
}
