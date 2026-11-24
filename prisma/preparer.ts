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
import { allegerLaCremerie, allegerLesBoissons, remettreEnVenteRedBullEtMonster, remettreEnVenteLesRayons, retirerLesIntrouvables, supprimerLesIntrouvables, supprimerLesAbsentsDeWolt, masquerCeQuiManque, remettreEnVenteCeQuiAUnePhoto, montrerLesPhotosDeWoltATous, retirerLaViandeFraiche, retirerLePoissonFraisEtSurgele, retirerLesSurgeles, renommerLesSurgeles, appliquerLaGrilleDesZones, corrigerLaGrilleDesZones, ajouterLesRuesDIrYamim, poserLesLimitesDIrYamim, appliquerLeReleveDePrix, remplacerLesArticles, installerLaListeDuGerant, installerLaListeDynamica, installerLesArticlesWolt, installerLesPhotosFrais, mettreEnVenteLaListe, remplirLaBase, mettreLesReglagesANiveau, retirerLaViande } from "./remplissage";

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
    // Le relevé de prix du 12 novembre (ses captures de Wolt, prix hors promotion) : une seule fois, jamais sur un prix qu'il a fixé lui-même.
    dire(await appliquerLeReleveDePrix(prisma));
    // Sept articles de sa liste que Wolt vend sous une autre forme : remplacés par ce que Wolt vend vraiment (sa décision).
    dire(await remplacerLesArticles(prisma));
    // Sa décision suivante : plus de viande ni de volaille (cacherout). Masquées, une seule fois.
    dire(await retirerLaViande(prisma));
    // Cinq articles de sa liste que Wolt ne vend pas : retirés de la vente (masqués), une seule fois.
    dire(await retirerLesIntrouvables(prisma));
    // Le rayon Crèmerie ramené à une courte sélection (sa décision : « il en faut quelques-uns, pas plus »). Une seule fois, rien de supprimé.
    dire(await allegerLaCremerie(prisma));
    // Le rayon Boissons de même, après l'ajout des boissons de ses captures (sa demande : « une sélection courte »).
    dire(await allegerLesBoissons(prisma));
    // Puis Red Bull et Monster remis en vente, à sa demande. Une seule fois.
    dire(await remettreEnVenteRedBullEtMonster(prisma));
    // Puis les deux rayons en entier, à sa demande (13 novembre, « remets tout ») : rangés en sous-rayons, ils se parcourent sans tout faire défiler. Une seule fois ; les introuvables sur Wolt restent retirés.
    dire(await remettreEnVenteLesRayons(prisma));
    // Et les cinq articles introuvables sur Wolt, supprimés pour de bon à sa demande (13 novembre, « enlève »). Une seule fois.
    dire(await supprimerLesIntrouvables(prisma));
    // Ce que Wolt ne vend pas, d'après la page entière d'un rayon : supprimé, à sa demande (15 novembre : « je ne peux pas faire des produits que Wolt n'a pas »). Une seule fois par rayon.
    dire(await supprimerLesAbsentsDeWolt(prisma));
    // Ce qu'il fait masquer « pour le moment » (15 novembre) : le poisson surgelé, les boissons que Wolt n'affiche plus, les articles jamais vus sur ses captures. Une seule fois par liste, rien de supprimé.
    dire(await masquerCeQuiManque(prisma));
    // « Mets-moi même les produits que tu as supprimés, si tu as les images » (16 novembre) : les 40 articles masqués qui ont leur photo de Wolt reviennent en vente (boissons, poisson surgelé, viande — choisis par lui). Une seule fois.
    dire(await remettreEnVenteCeQuiAUnePhoto(prisma));
    // « Active-moi les photos pour tout le monde » (17 novembre : le site n'a pas encore de client) : le réglage « Photos de Wolt pour tout le monde » est coché. Une seule fois ; il le décoche lui-même.
    dire(await montrerLesPhotosDeWoltATous(prisma));
    // « Enlève-moi tout ce qui est viande, poulet frais » (19 novembre) : les sept articles frais revenus en vente le 16 sont masqués — après la remise en vente ci-dessus. Une seule fois, rien de supprimé.
    dire(await retirerLaViandeFraiche(prisma));
    // « Enlève : Poisson surgelé - Poisson frais » (19 novembre) : les 22 articles de ces deux sous-rayons de « Boucherie & poisson » sont masqués — après la remise en vente du 16. Une seule fois, rien de supprimé.
    dire(await retirerLePoissonFraisEtSurgele(prisma));
    // « Supprime : Viande & volaille - Poisson - Glaces » (19 novembre) : onze articles de « Surgelés & glaces » masqués, le rayon garde ses pizzas et plats. Une seule fois, rien d'effacé.
    dire(await retirerLesSurgeles(prisma));
    // « Oui, renomme-le en Surgelés » (22 novembre) : le rayon « Surgelés & glaces », qui ne vend plus de glaces, change de nom — pas d'adresse. Une seule fois, s'il porte encore son nom de départ.
    dire(await renommerLesSurgeles(prisma));
    // Sa liste « Dynamica » : installée « à compléter », masquée — et elle le reste (prix et modèles invérifiables).
    dire(await installerLaListeDynamica(prisma));
    // Les photos libres de droits des produits frais : une seule fois, jamais sur un article qui a déjà une photo.
    dire(await installerLesPhotosFrais(prisma));
    // « Netanya 30 shekels, 40 vers Ir Yamim, 50 pour tout le Sharon, 100 Herzliya, 150 Tel Aviv » (23 novembre) : sa grille de livraison, et le quartier Ir Yamim / Poleg créé comme une zone à son prix. Une seule fois ; il règle ensuite ses zones dans « Villes ».
    dire(await appliquerLaGrilleDesZones(prisma));
    // Sa correction du soir même : « toute la ligne Ra'anana, Kfar Saba, Hadera, c'est 70 ; Césarée, 100 » (Hod Hasharon, sur la même ligne, suit). Une seule fois.
    dire(await corrigerLaGrilleDesZones(prisma));
    // Les rues d'Ir Yamim / Poleg envoyées par le gérant : c'est par elles que le site reconnaît ce quartier.
    dire(await ajouterLesRuesDIrYamim(prisma));
    // … et ses limites sur la carte : la position d'une adresse dit le quartier, même pour une rue hors de la liste.
    dire(await poserLesLimitesDIrYamim(prisma));
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
