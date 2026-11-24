// Les zones de livraison, définies par les adresses (demande du gérant, 23 novembre 2026 : « les clients
// donnent leur adresse, pas forcément la zone où ils sont, et ils peuvent mentir »).
//
// Une zone est une ligne de la table Ville : une ville entière (« Tel Aviv ») ou un quartier vendu à son
// propre prix (« Netanya – Ir Yamim / Poleg » : avant le tiret la ville, après lui le ou les quartiers).
// Le client choisit sa zone dans une liste et tape sa rue ; rien ne l'empêche de choisir la moins chère.
// Ce fichier dit quelle zone une adresse DÉSIGNE, d'après ses mots : le nom d'une autre ville, celui d'un
// quartier, ou un repère que le gérant a saisi (une rue, un hôtel, une résidence). Le site ne corrige rien
// tout seul : il prévient le client au panier et signale la commande au gérant, qui change la zone.
// Pur : partagé par le panier (navigateur), le serveur et l'espace gérant.
import { simplifier } from "./recherche";

/** « Netanya – Ir Yamim / Poleg » : tiret, tiret demi-cadratin ou cadratin, entouré d'espaces. */
const TIRET_DE_QUARTIER = /\s+[–—-]\s+/;

// En dessous, un mot désignerait n'importe quelle adresse (« a », « de », un numéro).
const LONGUEUR_MINIMALE_D_UN_REPERE = 3;
export const REPERES_AU_PLUS = 300;
export const LONGUEUR_MAXIMALE_DES_REPERES = 6000;

/** La ville d'une zone : « Netanya » pour « Netanya – Ir Yamim / Poleg » (c'est elle que Waze connaît). */
export function communeDe(nom: string): string {
  return nom.split(TIRET_DE_QUARTIER)[0].trim();
}

/** Les VILLES livrées, sans doublon et dans l'ordre : un quartier vendu à son prix n'est pas une ville de plus
 *  (« 19 villes livrées », pas 20 — ce que disent l'accueil, la page de contact et le flyer). */
export function communesLivrees(zones: string[]): string[] {
  return [...new Set(zones.map(communeDe).filter(Boolean))];
}

/** Les quartiers que nomme une zone (« Ir Yamim », « Poleg ») ; aucun pour une ville entière. */
export function quartiersDe(nom: string): string[] {
  const [, ...suite] = nom.split(TIRET_DE_QUARTIER);
  return suite.join(" ").split(/[\/,;]/).map((q) => q.trim()).filter(Boolean);
}

const estUnRepere = (mot: string) => mot.replace(/ /g, "").length >= LONGUEUR_MINIMALE_D_UN_REPERE && !/^\d+$/.test(mot.replace(/ /g, ""));

// Les mots qui disent « c'est une voie » : ils ne distinguent aucune rue d'une autre, et Google ne les écrit
// pas comme le gérant (« Ehud Manor Street », « Ehud Manor St », « rue Ehud Manor », « רחוב אהוד מנור »).
const MOTS_DE_VOIE = new Set([
  "rue", "avenue", "av", "ave", "boulevard", "bd", "blvd", "allee", "impasse", "chemin",
  "street", "st", "str", "road", "rd",
  "sderot", "sderat", "sd", "rehov", "rechov", "derech", "derekh",
  "calle", "avenida", "bulevar",
  "улица", "ул", "бульвар", "проспект",
  "רחוב", "רח", "שדרות", "שד", "דרך",
]);

/**
 * Un nom de rue sans son mot de voie, au début ou à la fin : « rue Ehud Manor », « Ehud Manor St » et
 * « רחוב אהוד מנור » deviennent « ehud manor » / « אהוד מנור ». Le texte est déjà simplifié.
 */
export function sansMotDeVoie(simple: string): string {
  const mots = simple.split(" ").filter(Boolean);
  while (mots.length > 1 && MOTS_DE_VOIE.has(mots[0])) mots.shift();
  while (mots.length > 1 && MOTS_DE_VOIE.has(mots[mots.length - 1])) mots.pop();
  return mots.length === 1 && MOTS_DE_VOIE.has(mots[0]) ? "" : mots.join(" ");
}

/**
 * Les repères saisis par le gérant, un par virgule ou par ligne, ramenés à des mots simples et sans doublon.
 * Le mot de voie qu'il a pu écrire (« rue », « St », « Sderot », « רחוב »…) est retiré : c'est le nom qui compte.
 */
export function lireReperes(texte: string): string[] {
  const mots = texte.split(/[,;\n]/).map((t) => sansMotDeVoie(simplifier(t))).filter(estUnRepere);
  return [...new Set(mots)].slice(0, REPERES_AU_PLUS);
}

// ---------------------------------------------------------------------------------------------------------
// Les limites d'un quartier sur la carte (demande du gérant, 24 novembre 2026 : « fais par la position, tout au
// sud d'Uzi Hitman »). Une liste de rues n'est jamais complète ; la position d'une adresse, elle, ne ment pas.
// ---------------------------------------------------------------------------------------------------------

/** Un rectangle sur la carte : ce qui est au sud de `nord`, au nord de `sud`, à l'ouest de `est`, à l'est de `ouest`. */
export type Rectangle = { nord?: number; sud?: number; est?: number; ouest?: number };
/** Une position : latitude et longitude, en degrés. */
export type Position = { lat: number; lng: number };

export const LONGUEUR_MAXIMALE_DES_LIMITES = 600;
export const RECTANGLES_AU_PLUS = 8;
// Israël, à grands traits : une position ou une borne hors de là est une faute de frappe, ou une invention.
const EN_ISRAEL = { latitude: [29, 34] as const, longitude: [34, 36.5] as const };
const entre = (x: number, [min, max]: readonly [number, number]) => x >= min && x <= max;

/** Une position plausible (deux nombres, en Israël) — sinon rien. Ce que le navigateur envoie n'est pas fiable. */
export function positionValide(lat: unknown, lng: unknown): Position | null {
  if (typeof lat !== "number" || typeof lng !== "number" || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return entre(lat, EN_ISRAEL.latitude) && entre(lng, EN_ISRAEL.longitude) ? { lat, lng } : null;
}

/**
 * Les limites saisies pour un quartier : un rectangle par ligne, écrit en clair — « nord 32.2832, est 34.8475 »
 * (ce qui est au sud de la latitude 32,2832 ET à l'ouest de la longitude 34,8475). Une borne absente ne limite
 * rien ; une ligne sans borne lisible est ignorée ; plusieurs lignes = plusieurs rectangles (un quartier en « L »).
 */
export function lireLimites(texte: string): Rectangle[] {
  const rectangles: Rectangle[] = [];
  for (const ligne of texte.split(/[\n;]/)) {
    const r: Rectangle = {};
    for (const m of ligne.toLowerCase().matchAll(/(?<![a-zà-ÿ])(nord|sud|est|ouest)\s*[:=]?\s*(\d{1,2}(?:[.,]\d+)?)/g)) {
      const cote = m[1] as keyof Rectangle;
      const valeur = Number(m[2].replace(",", "."));
      if (entre(valeur, cote === "nord" || cote === "sud" ? EN_ISRAEL.latitude : EN_ISRAEL.longitude)) r[cote] = valeur;
    }
    if (Object.keys(r).length > 0) rectangles.push(r);
    if (rectangles.length === RECTANGLES_AU_PLUS) break;
  }
  return rectangles;
}

/** La position est-elle dans l'un des rectangles ? */
export function dansLesLimites(p: Position, limites: Rectangle[]): boolean {
  return limites.some((r) => (r.nord === undefined || p.lat < r.nord) && (r.sud === undefined || p.lat > r.sud) && (r.est === undefined || p.lng < r.est) && (r.ouest === undefined || p.lng > r.ouest));
}

export type ZoneReperee = {
  /** Le nom enregistré (celui que porte la commande). */
  nom: string;
  /** Une ville entière : son nom, dans chaque langue. Vide pour un quartier (sa ville n'est pas la sienne). */
  noms: string[];
  /** Ce qui la désigne à coup sûr : les repères du gérant et, pour un quartier, les noms de ses quartiers. */
  reperes: string[];
  /** Pour un quartier : ses limites sur la carte. Une adresse de sa ville dont la position y tombe est à lui. */
  limites?: Rectangle[];
};

/**
 * Ce qui désigne une zone dans une adresse.
 * `nomsTraduits` : le nom de la zone dans les autres langues (le client tape son adresse dans la sienne).
 * `limites` : pour un quartier seulement — une ville entière, c'est Google qui la nomme.
 */
export function zoneReperee(nom: string, reperes: string, nomsTraduits: string[] = [], limites = ""): ZoneReperee {
  const tous = [nom, ...nomsTraduits];
  const estUnQuartier = quartiersDe(nom).length > 0;
  const uniques = (mots: string[]) => [...new Set(mots.map(simplifier).filter(estUnRepere))];
  return {
    nom,
    noms: estUnQuartier ? [] : uniques(tous),
    reperes: [...new Set([...lireReperes(reperes), ...uniques(tous.flatMap(quartiersDe))])],
    ...(estUnQuartier && lireLimites(limites).length > 0 ? { limites: lireLimites(limites) } : {}),
  };
}

/**
 * La zone qu'une adresse désigne, quand ce n'est pas celle que le client a choisie — sinon `null`.
 * - un repère (rue, hôtel, quartier) d'une autre zone la désigne à coup sûr — mais un repère d'un QUARTIER ne
 *   vaut que dans sa ville : si le client a choisi cette ville (ou un autre de ses quartiers), ou si l'adresse
 *   la nomme. Les rues d'un quartier portent des noms que toutes les villes ont (« Menachem Begin »,
 *   « HaVradim ») : « Menachem Begin 132 », pour qui loge à Tel Aviv, n'est pas une rue de Netanya ;
 * - le nom d'une autre ville aussi, sauf si l'adresse nomme déjà sa propre ville : « rue de Haïfa, Netanya »
 *   est une rue de Netanya ;
 * - un repère de la zone choisie tranche : l'adresse y est ;
 * - la ville d'un quartier n'est jamais une autre zone que lui (« …, Netanya » pour qui loge à Ir Yamim).
 * Entre plusieurs zones citées : un repère passe avant un nom de ville, puis le plus long (le plus précis).
 */
export function zoneCitee(adresse: string, choisie: string, zones: ZoneReperee[]): string | null {
  const texte = simplifier(adresse);
  if (!texte) return null;
  const a = ` ${texte} `;
  const cite = (mot: string) => a.includes(` ${mot} `);
  const commune = communeDe(choisie);
  if (zones.find((z) => z.nom === choisie)?.reperes.some(cite)) return null;
  const nommeSaVille = zones.some((z) => (z.nom === choisie || z.nom === commune) && z.noms.some(cite));
  let trouvee: { nom: string; sure: boolean; longueur: number } | null = null;
  // La ville d'un quartier est-elle celle du client, ou nommée dans l'adresse ?
  const dansSaVille = (z: ZoneReperee) => {
    const ville = communeDe(z.nom);
    if (ville === z.nom || ville === commune) return true;
    const entiere = zones.find((x) => x.nom === ville);
    return entiere ? entiere.noms.some(cite) : cite(simplifier(ville));
  };
  for (const z of zones) {
    if (z.nom === choisie || z.nom === commune) continue;
    const citations: [string[], boolean][] = [[dansSaVille(z) ? z.reperes.filter(cite) : [], true], [nommeSaVille ? [] : z.noms.filter(cite), false]];
    for (const [mots, sure] of citations) {
      for (const mot of mots) {
        if (!trouvee || (sure && !trouvee.sure) || (sure === trouvee.sure && mot.length > trouvee.longueur)) {
          trouvee = { nom: z.nom, sure, longueur: mot.length };
        }
      }
    }
  }
  return trouvee?.nom ?? null;
}

// ---------------------------------------------------------------------------------------------------------
// L'adresse reconnue par un annuaire (Google, quand le gérant a posé sa clé) : le client la choisit dans des
// propositions, et l'annuaire dit dans quelle ville elle est, dans quel quartier, sur quelle rue. Ici, on en
// tire la zone — sans rien savoir de Google : des textes, dans une ou plusieurs langues.
// ---------------------------------------------------------------------------------------------------------

/** Ce qu'un annuaire dit d'un lieu. */
export type LieuReconnu = {
  /** Le nom de sa ville, dans une ou plusieurs langues (celle du client, l'hébreu). */
  villes: string[];
  /** Ce qui le situe dans la ville : quartier(s), rue(s), nom de l'hôtel ou de la résidence. */
  precisions: string[];
  /** Sa position sur la carte, quand l'annuaire la donne. */
  position?: Position | null;
};

export type ZoneDuLieu = {
  /** La zone où se trouve ce lieu ; rien si sa ville n'est pas livrée ou si rien ne permet de le dire. */
  zone: string | null;
  /** La ville donnée n'est dans aucune zone : son nom, tel que reçu. */
  villeNonLivree: string | null;
};

/** Un nom ramené à sa forme la plus simple ; en hébreu, « הרצלייה » et « הרצליה » sont la même ville. */
const nomSimple = (texte: string) => simplifier(texte).replace(/יי/g, "י").replace(/וו/g, "ו");

/**
 * Deux noms de la même ville ? 2 : oui — le même nom, aux signes près (« Giv'atayim » = « Givatayim »), ou tous
 * les mots du nôtre dans celui de l'annuaire, dans n'importe quel ordre (« Tel Aviv » dans « Tel Aviv-Yafo »,
 * « קדימה-צורן » et « צורן-קדימה »). 1 : peut-être — l'annuaire donne un nom plus court que le nôtre
 * (« Kadima » pour « Kadima-Tsoran ») : cela ne vaut que si une seule zone y répond (« Ramat » n'en désigne
 * aucune). Toujours des mots entiers : « Herzl » n'est pas « Herzliya ».
 */
function memeVille(notre: string, annuaire: string): 0 | 1 | 2 {
  if (!notre || !annuaire) return 0;
  if (notre === annuaire || notre.replace(/ /g, "") === annuaire.replace(/ /g, "")) return 2;
  const lesNotres = notre.split(" ");
  const lesSiens = annuaire.split(" ");
  if (notre.length >= 4 && lesNotres.every((m) => lesSiens.includes(m))) return 2;
  if (annuaire.length >= 4 && lesSiens.every((m) => lesNotres.includes(m))) return 1;
  return 0;
}

/**
 * La zone où se trouve un lieu reconnu.
 * - sa ville est celle d'une zone (son nom dans l'une des cinq langues) : cette zone, sauf si un QUARTIER de
 *   cette ville vendu à son prix le revendique — par le nom du quartier ou par un repère du gérant (la rue,
 *   la résidence, l'hôtel) retrouvé dans ce qui situe le lieu ; le repère le plus long l'emporte ; à défaut de
 *   repère, par sa POSITION, quand elle tombe dans les limites d'un quartier de cette ville ;
 * - sa ville n'est celle d'aucune zone : `villeNonLivree`. On ne regarde alors pas les repères : la rue
 *   Herzl d'une autre ville n'est pas celle du gérant ;
 * - aucune ville donnée : seul un repère peut désigner une zone.
 */
export function zonePourLieu(lieu: LieuReconnu, zones: ZoneReperee[]): ZoneDuLieu {
  const villes = lieu.villes.map(nomSimple).filter(Boolean);
  const precisions = lieu.precisions.map((p) => ` ${nomSimple(p)} `).filter((p) => p.trim());
  // Le repère le plus long d'une zone que citent les précisions (0 : aucun).
  const cite = (z: ZoneReperee) => Math.max(0, ...z.reperes.map(nomSimple).filter((r) => precisions.some((p) => p.includes(` ${r} `))).map((r) => r.length));
  const laPlusCitee = (candidates: ZoneReperee[]) => {
    let trouvee: { nom: string; longueur: number } | null = null;
    for (const z of candidates) {
      const longueur = cite(z);
      if (longueur > 0 && (!trouvee || longueur > trouvee.longueur)) trouvee = { nom: z.nom, longueur };
    }
    return trouvee?.nom ?? null;
  };

  if (villes.length === 0) return { zone: laPlusCitee(zones), villeNonLivree: null };

  // La commune que nomme l'annuaire : celle d'une zone « ville entière » (son nom dans chaque langue), ou
  // celle d'un quartier dont la ville n'a pas sa propre ligne.
  const ressemblance = (noms: string[]) => Math.max(0, ...noms.flatMap((n) => villes.map((v) => memeVille(nomSimple(n), v))));
  const entieres = zones.filter((z) => z.noms.length > 0).map((z) => ({ z, r: ressemblance(z.noms) }));
  const sures = entieres.filter((x) => x.r === 2);
  const possibles = entieres.filter((x) => x.r === 1);
  const entiere = (sures[0] ?? (possibles.length === 1 ? possibles[0] : undefined))?.z;
  const commune = entiere ? communeDe(entiere.nom) : zones.map((z) => communeDe(z.nom)).find((c) => ressemblance([c]) === 2);
  if (!commune) return { zone: null, villeNonLivree: lieu.villes.find((v) => v.trim())?.trim() ?? null };

  const deLaCommune = zones.filter((z) => communeDe(z.nom) === commune);
  // Les limites d'un quartier ne valent que dans SA ville : un rectangle ouvert vers le sud couvrirait Tel Aviv.
  const position = lieu.position ?? null;
  const parPosition = position ? deLaCommune.find((z) => z.limites && dansLesLimites(position, z.limites))?.nom ?? null : null;
  return { zone: laPlusCitee(deLaCommune) ?? parPosition ?? entiere?.nom ?? null, villeNonLivree: null };
}

/** Une commande, pour ce qui touche à sa zone. Les champs « Google » sont vides pour une adresse tapée à la main. */
export type AdresseDeCommande = { adresse: string; ville: string; villeGoogle?: string | null; reperesGoogle?: string | null; latitudeGoogle?: number | null; longitudeGoogle?: number | null };

/** Ce qui sépare plusieurs noms dans un champ enregistré (« Netanya | נתניה »). */
export const SEPARATEUR_DE_NOMS = " | ";
const nomsEnregistres = (texte: string | null | undefined) => (texte ?? "").split("|").map((x) => x.trim()).filter(Boolean);

/** Ce que l'annuaire avait reconnu pour cette commande, relu de ses champs ; rien pour une adresse tapée à la main. */
export function lieuDeLaCommande(c: AdresseDeCommande): LieuReconnu | null {
  const lieu = { villes: nomsEnregistres(c.villeGoogle), precisions: nomsEnregistres(c.reperesGoogle), position: positionValide(c.latitudeGoogle, c.longitudeGoogle) };
  return lieu.villes.length + lieu.precisions.length > 0 ? lieu : null;
}

export type ZoneASignaler = {
  /** L'adresse est dans une autre zone que celle choisie : son nom. */
  zone: string | null;
  /** L'annuaire situe l'adresse dans une ville qui n'est dans aucune zone : son nom. */
  horsZones: string | null;
};

/**
 * Ce qu'il faut signaler au gérant (« Zone à vérifier ») — ou rien.
 * Une adresse reconnue par l'annuaire : c'est lui qu'on croit (la zone qu'il désigne n'est pas celle choisie,
 * ou sa ville n'est pas livrée) ; s'il confirme la zone choisie, rien n'est signalé. Sinon, et pour toute
 * adresse tapée à la main, ce sont les mots de l'adresse qui parlent (`zoneCitee`).
 * Recalculé à chaque affichage : il suit les zones et les repères du gérant.
 */
export function zoneASignaler(c: AdresseDeCommande, zones: ZoneReperee[]): ZoneASignaler | null {
  const lieu = lieuDeLaCommande(c);
  if (lieu) {
    const r = zonePourLieu(lieu, zones);
    if (r.zone) return r.zone === c.ville ? null : { zone: r.zone, horsZones: null };
    if (r.villeNonLivree) return { zone: null, horsZones: r.villeNonLivree };
  }
  const citee = zoneCitee(c.adresse, c.ville, zones);
  return citee ? { zone: citee, horsZones: null } : null;
}
