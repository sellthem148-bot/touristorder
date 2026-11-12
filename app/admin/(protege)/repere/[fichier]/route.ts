import { readFile } from "node:fs/promises";
import path from "node:path";
import { exigerAdmin } from "@/lib/admin";
import { DOSSIER_DES_REPERES, estPhotoRepere } from "@/lib/reperes-wolt";

export const dynamic = "force-dynamic";

/**
 * Une photo repère du gérant (la photo que Wolt montre pour un article, tirée de ses captures) :
 * /admin/repere/<fichier>. Réservée au gérant — une route n'est pas protégée par le layout :
 * exigerAdmin() d'abord. Seuls les fichiers de la liste sont lus (lib/reperes-wolt.ts).
 */
export async function GET(_requete: Request, { params }: { params: Promise<{ fichier: string }> }) {
  await exigerAdmin();
  const { fichier } = await params;
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
