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
// Les images reçues sont des données : on n'en lit que les points, rien n'en est exécuté.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DOSSIER_DES_REPERES, PHOTOS_REPERE } from "../../lib/reperes-wolt";

/** Les repères déjà retouchés : fichier → le lot qui l'a apporté. Pour savoir où l'on en est. */
const REGISTRE = "prive/reperes-retouches.json";
const POIDS_MAX = 40_000; // comme tests/reperes-wolt.test.ts
/** Ce que la retouche montre doit se retrouver, presque point pour point, dans la photo en service… */
const PART_DEJA_LA = 0.9;
/**
 * … et il doit rester une part de la photo en service : l'article lui-même. Une part seulement : sur une photo à
 * fond gris (les salades du traiteur), il DÉTOURE l'article et tout le fond disparaît — il en reste un bon tiers.
 */
const PART_GARDEE = 0.2;

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
 * est identique dans la photo en service ; `gardee` = la part de la photo en service qui est restée. Une retouche
 * efface (le « + », une pastille) : dejaLa ≈ 1. Une autre photo, ou la photo d'un autre article : dejaLa bas.
 */
export function ressemblance(avant: Buffer, apres: Buffer): { dejaLa: number; gardee: number } {
  const plein = (b: Buffer, i: number) => Math.min(b[i], b[i + 1], b[i + 2]) < 232;
  let montre = 0, montreDejaLa = 0, avait = 0, avaitGarde = 0;
  for (let i = 0; i + 2 < avant.length; i += 3) {
    const pareil = Math.max(Math.abs(avant[i] - apres[i]), Math.abs(avant[i + 1] - apres[i + 1]), Math.abs(avant[i + 2] - apres[i + 2])) < 30;
    if (plein(apres, i)) { montre++; if (pareil) montreDejaLa++; }
    if (plein(avant, i)) { avait++; if (pareil) avaitGarde++; }
  }
  return { dejaLa: montre === 0 ? 0 : montreDejaLa / montre, gardee: avait === 0 ? 0 : avaitGarde / avait };
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
  const posees: string[] = [];
  const refusees: string[] = [];

  for (const chemin of fichiersDe(dossier).sort()) {
    const nom = path.basename(chemin);
    if (!/\.(jpe?g|png|webp)$/i.test(nom)) continue; // un LISEZ-MOI, un fichier caché
    const fichier = parNom.get(nom.replace(/\.[a-z]+$/i, "").normalize("NFC").toLowerCase());
    if (!fichier) { refusees.push(`${nom} : aucun article de ce nom`); continue; }
    const cible = path.join(DOSSIER_DES_REPERES, fichier);
    try {
      const recu = readFileSync(chemin);
      const [avant, apres] = await Promise.all([sharp(readFileSync(cible)).metadata(), sharp(recu).metadata()]);
      if (avant.width !== apres.width || avant.height !== apres.height) {
        refusees.push(`${nom} : ${apres.width} × ${apres.height}, la photo en service fait ${avant.width} × ${avant.height} — ce n'est pas une retouche`);
        continue;
      }
      const r = ressemblance(await points(readFileSync(cible)), await points(recu));
      if (r.dejaLa < PART_DEJA_LA || r.gardee < PART_GARDEE) {
        refusees.push(`${nom} : ce n'est pas la photo en service retouchée (${Math.round(r.dejaLa * 100)} % de ce qu'elle montre y était, ${Math.round(r.gardee * 100)} % en est resté)`);
        continue;
      }
      // Un JPEG léger est posé tel quel ; sinon il est réécrit en JPEG.
      const jpeg = apres.format === "jpeg" && recu.length < POIDS_MAX ? recu : await sharp(recu).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
      if (jpeg.length >= POIDS_MAX) { refusees.push(`${nom} : trop lourde (${jpeg.length} octets)`); continue; }
      if (poser) { writeFileSync(cible, jpeg); registre[fichier] = lot; }
      posees.push(`${fichier}  ←  ${nom}  (${Math.round(r.gardee * 100)} % de la photo gardée)`);
    } catch (e) {
      refusees.push(`${nom} : illisible (${e instanceof Error ? e.message : "erreur"})`);
    }
  }

  if (poser) writeFileSync(REGISTRE, JSON.stringify(Object.fromEntries(Object.entries(registre).sort()), null, 1) + "\n");
  console.log(`${poser ? "Posées" : "À poser"} : ${posees.length}`);
  for (const l of posees) console.log("  " + l);
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
