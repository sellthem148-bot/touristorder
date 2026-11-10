import "server-only";
import { randomUUID } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { TAILLE_MAX_IMAGE, typeDImage } from "./image";
import { accesSupabase, BUCKET_PHOTOS } from "./adresses-base";

export type ResultatEnvoi = { ok: true; url: string } | { ok: false; erreur: string };

function supabase() {
  const acces = accesSupabase();
  if (!acces) return null;
  return createClient(acces.url, acces.cle, { auth: { persistSession: false } });
}

const BUCKET = () => BUCKET_PHOTOS();

/** Enregistre la photo d'un produit et rend son adresse publique. */
export async function enregistrerPhoto(fichier: File): Promise<ResultatEnvoi> {
  if (fichier.size === 0) return { ok: false, erreur: "Fichier vide." };
  if (fichier.size > TAILLE_MAX_IMAGE) return { ok: false, erreur: "Photo trop lourde (5 Mo maximum)." };
  const octets = new Uint8Array(await fichier.arrayBuffer());
  const type = typeDImage(octets);
  if (!type) return { ok: false, erreur: "Format non accepté : JPEG, PNG ou WebP." };

  const nom = `${randomUUID()}.${type.extension}`;
  const client = supabase();

  if (client) {
    const { error } = await client.storage
      .from(BUCKET())
      .upload(`photos/${nom}`, octets, { contentType: type.mime, upsert: false });
    if (error) {
      console.error("Envoi photo Supabase :", error.message);
      return { ok: false, erreur: "La photo n'a pas pu être enregistrée." };
    }
    const { data } = client.storage.from(BUCKET()).getPublicUrl(`photos/${nom}`);
    return { ok: true, url: data.publicUrl };
  }

  // Sans Supabase : disque local, en développement seulement
  // (sur Vercel le disque est éphémère, la photo disparaîtrait).
  if (process.env.NODE_ENV === "production") {
    return { ok: false, erreur: "Stockage des photos non configuré (Supabase)." };
  }
  const dossier = path.join(process.cwd(), "public", "uploads");
  await mkdir(dossier, { recursive: true });
  await writeFile(path.join(dossier, nom), octets);
  return { ok: true, url: `/uploads/${nom}` };
}

/** Supprime une photo qu'on a nous-mêmes enregistrée. Au mieux : ne lève jamais. */
export async function supprimerPhoto(url: string): Promise<void> {
  try {
    if (url.startsWith("/uploads/")) {
      const nom = path.basename(url);
      if (/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(nom)) {
        await unlink(path.join(process.cwd(), "public", "uploads", nom));
      }
      return;
    }
    const client = supabase();
    const base = accesSupabase()?.url;
    if (!client || !base) return;
    const prefixe = `${base}/storage/v1/object/public/${BUCKET()}/photos/`;
    if (!url.startsWith(prefixe)) return;
    const nom = url.slice(prefixe.length);
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(nom)) return;
    await client.storage.from(BUCKET()).remove([`photos/${nom}`]);
  } catch (e) {
    console.error("Suppression photo :", e instanceof Error ? e.message : e);
  }
}
