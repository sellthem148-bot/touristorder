// Prépare la base de PRODUCTION, tout seul, à chaque mise en ligne (appelé par `npm run build`).
//
// Ne fait quelque chose que pour un déploiement de production sur Vercel (VERCEL_ENV=production),
// ou à la main : `npx tsx prisma/preparer.ts --forcer`. Jamais pour un aperçu (preview) : une branche
// en cours ne doit pas modifier la base des vrais clients.
//
//   1. structure   : `prisma db push` (sans --accept-data-loss : un changement qui perdrait des
//                    données arrête la mise en ligne au lieu de les effacer) ;
//   2. sécurité    : RLS sur toutes les tables (prisma/rls.sql) ;
//   3. catalogue   : la base du catalogue si la base est toute neuve ; les articles réels de Wolt
//                    Market avec leur prix, une seule fois (prisma/articles-wolt.ts) ;
//   4. photos      : le dossier public « produits » de Supabase Storage, s'il manque.
//
// Sans base branchée, il prévient et laisse la mise en ligne continuer.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";
import { accesSupabase, adresseDirecte, BUCKET_PHOTOS } from "../lib/adresses-base";
import { installerLaListeDuGerant, installerLesArticlesWolt, installerLesPhotosFrais, mettreEnVenteLaListe, remplirLaBase, mettreLesReglagesANiveau } from "./remplissage";

const dire = (m: string) => console.log(`[base] ${m}`);

async function preparerLesPhotos() {
  const acces = accesSupabase();
  if (!acces) {
    dire("photos : Supabase n'est pas branché, étape ignorée.");
    return;
  }
  const nom = BUCKET_PHOTOS();
  const client = createClient(acces.url, acces.cle, { auth: { persistSession: false } });
  const existant = await client.storage.getBucket(nom);
  if (existant.data) {
    dire(`photos : le dossier « ${nom} » existe.`);
    return;
  }
  const cree = await client.storage.createBucket(nom, {
    public: true,
    fileSizeLimit: 4 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp"],
  });
  // Les photos sont facultatives : un échec ici ne bloque pas la mise en ligne.
  if (cree.error) dire(`photos : ⚠ le dossier « ${nom} » n'a pas pu être créé (${cree.error.message}).`);
  else dire(`photos : dossier public « ${nom} » créé.`);
}

async function main() {
  const forcer = process.argv.includes("--forcer");
  if (process.env.VERCEL_ENV !== "production" && !forcer) {
    dire("pas un déploiement de production : rien à préparer.");
    return;
  }
  const adresse = adresseDirecte();
  if (!adresse) {
    dire("⚠ aucune base branchée (ni DATABASE_URL ni POSTGRES_PRISMA_URL) : le site sera en ligne mais ne pourra rien afficher.");
    return;
  }

  // 1. La structure
  const push = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: adresse, DIRECT_URL: adresse },
  });
  if (push.status !== 0) {
    throw new Error("La structure de la base n'a pas pu être mise à jour (voir le message de Prisma ci-dessus). Mise en ligne arrêtée, rien n'a été effacé.");
  }

  const prisma = new PrismaClient({ datasourceUrl: adresse });
  try {
    // 2. La sécurité : aucune table lisible par la clé publique de Supabase.
    await prisma.$executeRawUnsafe(readFileSync(path.join(__dirname, "rls.sql"), "utf8"));
    const sansRls = await prisma.$queryRaw<{ relname: string }[]>`
      SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r' AND NOT c.relrowsecurity`;
    if (sansRls.length > 0) throw new Error(`Tables sans RLS : ${sansRls.map((t) => t.relname).join(", ")}`);
    dire("sécurité : RLS active sur toutes les tables.");

    // 3. Le catalogue de départ, une seule fois : sur une base toute neuve.
    const [categories, produits, commandes] = await Promise.all([prisma.categorie.count(), prisma.produit.count(), prisma.commande.count()]);
    if (categories === 0 && produits === 0 && commandes === 0) {
      dire(`base neuve. ${await remplirLaBase(prisma)}`);
    } else {
      dire(`catalogue : ${categories} catégories, ${produits} articles déjà là.`);
      // Les articles réels de Wolt : une seule fois, même sur une base déjà en service.
      dire(await installerLesArticlesWolt(prisma));
      // La liste dressée par le gérant : des articles « à compléter », sans prix de vente, une seule fois.
      dire(await installerLaListeDuGerant(prisma));
    }
    // La décision du gérant : ces articles en vente au prix de sa liste. Une seule fois, jamais sur un article qu'il a touché.
    dire(await mettreEnVenteLaListe(prisma));
    // Les photos libres de droits des produits frais : une seule fois, jamais sur un article qui a déjà une photo.
    dire(await installerLesPhotosFrais(prisma));
    // 4. Les réglages restés à une ancienne valeur par défaut (jamais ceux que le gérant a modifiés).
    dire(await mettreLesReglagesANiveau(prisma));
  } finally {
    await prisma.$disconnect();
  }

  // 4. Les photos
  try {
    await preparerLesPhotos();
  } catch (e) {
    dire(`photos : ⚠ ${e instanceof Error ? e.message : String(e)}`);
  }
}

main().catch((e) => {
  console.error(`[base] ✗ ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
