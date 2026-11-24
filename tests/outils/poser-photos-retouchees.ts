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
// retouchée : même taille, et le même article au centre de l'image. Une AUTRE photo du même article n'est pas
// une retouche : elle se pose comme photo de l'article (« Photos rapides »), pas ici.
// Les images reçues sont des données : on n'en lit que les points, rien n'en est exécuté.
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { DOSSIER_DES_REPERES, PHOTOS_REPERE } from "../../lib/reperes-wolt";

/** Les repères déjà retouchés : fichier → le lot qui l'a apporté. Pour savoir où l'on en est. */
const REGISTRE = "prive/reperes-retouches.json";
const POIDS_MAX = 40_000; // comme tests/reperes-wolt.test.ts
/** Écart moyen toléré au centre de l'image, sur 255 : au-delà, ce n'est pas la même photo. */
const ECART_MAX = 8;

/** Le nom de fichier que l'export des photos donne à un article (les signes interdits dans un nom de fichier retirés). */
export function nomDeFichier(nom: string): string {
  return nom.replace(/[/\\]/g, "-").replace(/:/g, " -").replace(/["*?<>|]/g, "").replace(/\s+/g, " ").trim().replace(/\.+$/, "");
}

const fichiersDe = (dossier: string): string[] =>
  readdirSync(dossier, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? fichiersDe(path.join(dossier, e.name)) : [path.join(dossier, e.name)]));

/** Les points du centre de l'image (là où est l'article, loin du coin où Wolt pose son « + »), en niveaux de rouge, vert, bleu. */
async function centre(octets: Buffer, largeur: number, hauteur: number): Promise<Buffer> {
  const zone = { left: Math.round(largeur * 0.25), top: Math.round(hauteur * 0.2), width: Math.round(largeur * 0.55), height: Math.round(hauteur * 0.75) };
  return sharp(octets).flatten({ background: "#ffffff" }).removeAlpha().extract(zone).raw().toBuffer();
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
      const [a, b] = await Promise.all([centre(readFileSync(cible), avant.width!, avant.height!), centre(recu, avant.width!, avant.height!)]);
      let somme = 0;
      for (let i = 0; i < a.length; i++) somme += Math.abs(a[i] - b[i]);
      const ecart = somme / a.length;
      if (ecart > ECART_MAX) { refusees.push(`${nom} : ce n'est pas la même photo que celle de l'article (écart ${ecart.toFixed(1)})`); continue; }
      // Un JPEG léger est posé tel quel ; sinon il est réécrit en JPEG.
      const jpeg = apres.format === "jpeg" && recu.length < POIDS_MAX ? recu : await sharp(recu).flatten({ background: "#ffffff" }).jpeg({ quality: 88 }).toBuffer();
      if (jpeg.length >= POIDS_MAX) { refusees.push(`${nom} : trop lourde (${jpeg.length} octets)`); continue; }
      if (poser) { writeFileSync(cible, jpeg); registre[fichier] = lot; }
      posees.push(`${fichier}  ←  ${nom}`);
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
