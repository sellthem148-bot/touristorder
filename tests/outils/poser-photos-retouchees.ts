// Les photos de Wolt RETOUCHÉES par le gérant (24 novembre 2026 : « si je t'envoie un fichier zip, tu peux le
// décompresser ? j'ai mes nouvelles images dedans ») : les mêmes photos repère, dont il a effacé le « + » et les
// pastilles de Wolt. Chacune prend la place du fichier de `prive/reperes-wolt` qu'elle retouche — même nom, même
// taille : le site les montre aussitôt partout où il montrait l'ancienne (lib/vue-gerant.ts).
//
//   npx tsx tests/outils/poser-photos-retouchees.ts <dossier décompressé>            → dit ce qui serait posé
//   npx tsx tests/outils/poser-photos-retouchees.ts <dossier décompressé> --poser    → pose, et note le lot
//
// Une image est reconnue à son NOM DE FICHIER : le nom de l'article, tel que l'export des photos le lui a donné
// (« Lait Tnuva 3 % 1 L.jpg »), ou le nom du fichier repère. Elle n'est posée que si c'est bien LA MÊME photo
// retouchée : même taille, et tout ce qu'elle montre était déjà dans la photo en service (il efface le « + », une
// pastille, une étiquette de poids posée par Wolt, parfois tout le fond — il n'ajoute rien). Une AUTRE photo du
// même article n'est pas une retouche : elle se pose comme photo de l'article (« Photos rapides »), pas ici.
// Il renvoie aussi des rayons ENTIERS, tels que l'export les lui a donnés (« 02 - Crèmerie & œufs ») : on y trouve
// ce qui n'est pas à poser, rangé à part sous « Laissées » — la photo du site elle-même (les œufs : une photo
// libre de `public/produits/frais`, pas une photo de Wolt), une photo qu'il n'a pas touchée, et une photo déjà
// retouchée davantage dans un lot précédent (la photo en service a effacé plus que celle reçue : on garde la mieux
// retouchée). Seul un vrai refus — nom inconnu, autre photo, autre taille — fait échouer l'outil.
// Dans un rayon entier il y a aussi les photos LIBRES du site (fruits et légumes : `public/produits/frais`,
// 600 × 600), et il en DÉTOURE certaines (le fond retiré, l'article sur blanc). Celle-là prend la place du fichier
// du site qu'elle retouche — et seulement de celui-là : même taille, et tout ce qu'elle montre était déjà dans CETTE
// photo du site. C'est la seule écriture hors du dossier privé, et une photo de Wolt ne peut pas y arriver : elle
// ne ressemble pas à la photo du site. La licence de ces photos permet de les modifier, à condition de le dire :
// la photo est alors marquée `detouree` dans `lib/credits-photos.ts`, et la page /credits l'indique.
// Les images reçues sont des données : on n'en lit que les points, rien n'en est exécuté.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DOSSIER_DES_REPERES, PHOTOS_REPERE } from "../../lib/reperes-wolt";
import { PHOTOS_FRAIS } from "../../prisma/photos-frais";

/** Les repères déjà retouchés : fichier → le lot qui l'a apporté. Pour savoir où l'on en est. */
const REGISTRE = "prive/reperes-retouches.json";
const POIDS_MAX = 40_000; // comme tests/reperes-wolt.test.ts
const POIDS_MAX_DU_SITE = 120_000; // tests/photos.test.ts refuse une photo du site de 130 Ko
/**
 * Ce que la retouche montre doit se retrouver, presque point pour point, dans la photo en service… Presque : le
 * bord d'un article détouré est adouci, et une pastille de Wolt posée SUR l'article est repeinte (la boîte du
 * cheesecake : 89 %). Une autre image en est très loin (3 à 13 % pour un autre article, 60 à 75 % pour la même
 * photo avant retouche).
 */
const PART_DEJA_LA = 0.8;
/**
 * … et il doit rester une part de la photo en service : l'article lui-même. Une petite part suffit : sur une photo
 * à fond gris (les salades du traiteur, tout le pain de la boulangerie), il DÉTOURE l'article et tout le fond
 * disparaît — il en reste un tiers pour un pain, un cinquième pour trois bagels ou une baguette.
 */
const PART_GARDEE = 0.1;
/**
 * … ou bien l'image est restée telle quelle presque partout. C'est le cas d'un article BLANC sur fond blanc (un
 * adaptateur, un câble, un chargeur Apple) : on n'y « voit » presque que le « + » de Wolt, et une fois celui-ci
 * effacé il ne reste que 9 à 26 % de ce que la photo montrait — alors que rien d'autre n'a bougé.
 */
const PART_INTACTE = 0.6;
/** Tout y était et tout y est resté : la même image, réenregistrée (l'ail et l'oignon, déjà sur fond blanc) — rien à poser. */
const MEME_IMAGE = 0.995;

/** Le nom de fichier que l'export des photos donne à un article (les signes interdits dans un nom de fichier retirés). */
export function nomDeFichier(nom: string): string {
  return nom.replace(/[/\\]/g, "-").replace(/:/g, " -").replace(/["*?<>|]/g, "").replace(/\s+/g, " ").trim().replace(/\.+$/, "");
}

const fichiersDe = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiersDe(path.join(dossier, e.name)) : [path.join(dossier, e.name)]));

/** Les points de l'image, trois nombres chacun (rouge, vert, bleu), sur fond blanc. */
const points = (octets: Buffer): Promise<Buffer> => sharp(octets).flatten({ background: "#ffffff" }).removeAlpha().raw().toBuffer();

/**
 * Deux images de même taille : `dejaLa` = la part de ce que montre la retouche (tout ce qui n'est pas blanc) qui
 * est identique dans la photo en service ; `gardee` = la part de la photo en service qui est restée ; `intacte` =
 * la part de l'image entière, blanc compris, qui n'a pas bougé. Une retouche efface (le « + », une pastille) :
 * dejaLa ≈ 1. Une autre photo, ou la photo d'un autre article : dejaLa bas.
 */
export function ressemblance(avant: Buffer, apres: Buffer): { dejaLa: number; gardee: number; intacte: number } {
  const plein = (b: Buffer, i: number) => Math.min(b[i], b[i + 1], b[i + 2]) < 232;
  let points = 0, memes = 0, montre = 0, montreDejaLa = 0, avait = 0, avaitGarde = 0;
  for (let i = 0; i + 2 < avant.length; i += 3) {
    const pareil = Math.max(Math.abs(avant[i] - apres[i]), Math.abs(avant[i + 1] - apres[i + 1]), Math.abs(avant[i + 2] - apres[i + 2])) < 30;
    points++;
    if (pareil) memes++;
    if (plein(apres, i)) { montre++; if (pareil) montreDejaLa++; }
    if (plein(avant, i)) { avait++; if (pareil) avaitGarde++; }
  }
  return { dejaLa: montre === 0 ? 0 : montreDejaLa / montre, gardee: avait === 0 ? 0 : avaitGarde / avait, intacte: points === 0 ? 0 : memes / points };
}

/**
 * Une retouche de la photo en service : ce qu'elle montre y était déjà, et il en reste l'article — une part de ce
 * que la photo montrait (un article détouré de son fond gris), ou l'image presque entière (un article blanc sur
 * blanc dont seul le « + » a disparu). Une image vide ne montre rien : `dejaLa` vaut 0.
 */
export function estUneRetouche(r: { dejaLa: number; gardee: number; intacte: number }): boolean {
  return r.dejaLa >= PART_DEJA_LA && (r.gardee >= PART_GARDEE || r.intacte >= PART_INTACTE);
}

async function principal() {
  const [dossier, ...options] = process.argv.slice(2);
  if (!dossier) throw new Error("Donne le dossier où l'archive du gérant a été décompressée.");
  const poser = options.includes("--poser");
  const lot = `${new Date().toISOString().slice(0, 10)} · ${path.basename(path.resolve(dossier))}`;
  const parNom = new Map<string, string>();
  for (const p of PHOTOS_REPERE) {
    parNom.set(nomDeFichier(p.nom).toLowerCase(), p.fichier);
    parNom.set(p.fichier.replace(/\.jpg$/, ""), p.fichier);
  }
  const registre: Record<string, string> = JSON.parse(readFileSync(REGISTRE, "utf8"));
  // Les photos du site lui-même (libres de droits), que l'export lui a données sous le nom de l'article.
  const duSite = new Map(Object.entries(PHOTOS_FRAIS).map(([nom, f]) => [nomDeFichier(nom).toLowerCase(), path.join("public/produits/frais", f)]));
  const posees: string[] = [];
  const poseesSurLeSite: string[] = [];
  const laissees: string[] = [];
  const refusees: string[] = [];

  for (const chemin of fichiersDe(dossier).sort()) {
    const nom = path.basename(chemin);
    if (!/\.(jpe?g|png|webp)$/i.test(nom)) continue; // un LISEZ-MOI, un fichier caché
    const cle = nom.replace(/\.[a-z]+$/i, "").normalize("NFC").toLowerCase();
    const recu = readFileSync(chemin);
    const photoDuSite = duSite.get(cle);
    if (photoDuSite) {
      const enLigne = readFileSync(photoDuSite);
      if (recu.equals(enLigne)) { laissees.push(`${nom} : c'est la photo du site (${photoDuSite}), pas une photo de Wolt`); continue; }
      try {
        // La photo du site, détourée ? Même taille, et rien qu'elle ne montrait déjà.
        const [avant, apres] = await Promise.all([sharp(enLigne).metadata(), sharp(recu).metadata()]);
        if (avant.width === apres.width && avant.height === apres.height) {
          const r = ressemblance(await points(enLigne), await points(recu));
          if (r.dejaLa >= MEME_IMAGE && r.gardee >= MEME_IMAGE) { laissees.push(`${nom} : la photo du site, réenregistrée sans retouche (${photoDuSite})`); continue; }
          if (estUneRetouche(r)) {
            const jpegDuSite = apres.format === "jpeg" && recu.length < POIDS_MAX_DU_SITE ? recu : await sharp(recu).flatten({ background: "#ffffff" }).jpeg({ quality: 86 }).toBuffer();
            if (jpegDuSite.length >= POIDS_MAX_DU_SITE) { refusees.push(`${nom} : photo du site trop lourde (${jpegDuSite.length} octets)`); continue; }
            if (poser) writeFileSync(photoDuSite, jpegDuSite);
            poseesSurLeSite.push(`${photoDuSite}  ←  ${nom}  (${Math.round(r.dejaLa * 100)} % déjà là, ${Math.round(r.gardee * 100)} % de la photo gardée)`);
            continue;
          }
          refusees.push(`${nom} : ce n'est pas la photo du site retouchée (${Math.round(r.dejaLa * 100)} % de ce qu'elle montre y était, ${Math.round(r.gardee * 100)} % en est resté)`);
          continue;
        }
      } catch (e) {
        refusees.push(`${nom} : illisible (${e instanceof Error ? e.message : "erreur"})`);
        continue;
      }
    }
    const fichier = parNom.get(cle);
    if (!fichier) { refusees.push(`${nom} : aucun article de ce nom`); continue; }
    const cible = path.join(DOSSIER_DES_REPERES, fichier);
    try {
      const enService = readFileSync(cible);
      if (recu.equals(enService)) { laissees.push(`${nom} : la même image que celle en service${registre[fichier] ? " (déjà retouchée)" : " (pas retouchée)"}`); continue; }
      const [avant, apres] = await Promise.all([sharp(enService).metadata(), sharp(recu).metadata()]);
      if (avant.width !== apres.width || avant.height !== apres.height) {
        refusees.push(`${nom} : ${apres.width} × ${apres.height}, la photo en service fait ${avant.width} × ${avant.height} — ce n'est pas une retouche`);
        continue;
      }
      const [pointsAvant, pointsApres] = await Promise.all([points(enService), points(recu)]);
      const r = ressemblance(pointsAvant, pointsApres);
      // Déjà retouchée dans un lot précédent, et davantage : c'est la photo en service qui est la retouche de celle-ci.
      const inverse = ressemblance(pointsApres, pointsAvant);
      if (registre[fichier] && r.dejaLa < PART_DEJA_LA && inverse.dejaLa >= PART_DEJA_LA && inverse.gardee >= PART_GARDEE) {
        laissees.push(`${nom} : déjà retouchée davantage (${registre[fichier]}), on garde celle en service`);
        continue;
      }
      if (r.dejaLa >= MEME_IMAGE && r.gardee >= MEME_IMAGE) { laissees.push(`${nom} : la même image que celle en service, réenregistrée sans retouche`); continue; }
      if (!estUneRetouche(r)) {
        refusees.push(`${nom} : ce n'est pas la photo en service retouchée (${Math.round(r.dejaLa * 100)} % de ce qu'elle montre y était, ${Math.round(r.gardee * 100)} % en est resté)`);
        continue;
      }
      // Un JPEG léger est posé tel quel ; sinon il est réécrit en JPEG.
      const jpeg = apres.format === "jpeg" && recu.length < POIDS_MAX ? recu : await sharp(recu).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
      if (jpeg.length >= POIDS_MAX) { refusees.push(`${nom} : trop lourde (${jpeg.length} octets)`); continue; }
      if (poser) { writeFileSync(cible, jpeg); registre[fichier] = lot; }
      posees.push(`${fichier}  ←  ${nom}  (${Math.round(r.dejaLa * 100)} % déjà là, ${Math.round(r.gardee * 100)} % de la photo gardée)`);
    } catch (e) {
      refusees.push(`${nom} : illisible (${e instanceof Error ? e.message : "erreur"})`);
    }
  }

  if (poser) writeFileSync(REGISTRE, JSON.stringify(Object.fromEntries(Object.entries(registre).sort()), null, 1) + "\n");
  console.log(`${poser ? "Posées" : "À poser"} : ${posees.length}`);
  for (const l of posees) console.log("  " + l);
  console.log(`${poser ? "Posées" : "À poser"} sur les photos du site (public/produits/frais) : ${poseesSurLeSite.length}`);
  for (const l of poseesSurLeSite) console.log("  " + l);
  console.log(`Laissées : ${laissees.length}`);
  for (const l of laissees) console.log("  " + l);
  console.log(`Refusées : ${refusees.length}`);
  for (const l of refusees) console.log("  " + l);
  const total = Object.keys(registre).length;
  console.log(`Retouchées en tout : ${total} sur ${PHOTOS_REPERE.length}${poser ? "" : " (rien n'a été écrit : ajouter --poser)"}`);
  if (statSync(DOSSIER_DES_REPERES).isDirectory() && refusees.length > 0) process.exitCode = 2;
}

// Lancé comme outil (et non lu par un test, qui n'en prend que `nomDeFichier`).
if (process.argv[1] && path.basename(process.argv[1]).startsWith("poser-photos-retouchees")) {
  principal().catch((e) => { console.error(e instanceof Error ? e.message : e); process.exitCode = 1; });
}
