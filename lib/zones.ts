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

/** Les repères saisis par le gérant, un par virgule ou par ligne, ramenés à des mots simples et sans doublon. */
export function lireReperes(texte: string): string[] {
  const mots = texte.split(/[,;\n]/).map(simplifier).filter(estUnRepere);
  return [...new Set(mots)].slice(0, REPERES_AU_PLUS);
}

export type ZoneReperee = {
  /** Le nom enregistré (celui que porte la commande). */
  nom: string;
  /** Une ville entière : son nom, dans chaque langue. Vide pour un quartier (sa ville n'est pas la sienne). */
  noms: string[];
  /** Ce qui la désigne à coup sûr : les repères du gérant et, pour un quartier, les noms de ses quartiers. */
  reperes: string[];
};

/**
 * Ce qui désigne une zone dans une adresse.
 * `nomsTraduits` : le nom de la zone dans les autres langues (le client tape son adresse dans la sienne).
 */
export function zoneReperee(nom: string, reperes: string, nomsTraduits: string[] = []): ZoneReperee {
  const tous = [nom, ...nomsTraduits];
  const estUnQuartier = quartiersDe(nom).length > 0;
  const uniques = (mots: string[]) => [...new Set(mots.map(simplifier).filter(estUnRepere))];
  return {
    nom,
    noms: estUnQuartier ? [] : uniques(tous),
    reperes: [...new Set([...lireReperes(reperes), ...uniques(tous.flatMap(quartiersDe))])],
  };
}

/**
 * La zone qu'une adresse désigne, quand ce n'est pas celle que le client a choisie — sinon `null`.
 * - un repère (rue, hôtel, quartier) d'une autre zone la désigne à coup sûr ;
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
  for (const z of zones) {
    if (z.nom === choisie || z.nom === commune) continue;
    const citations: [string[], boolean][] = [[z.reperes.filter(cite), true], [nommeSaVille ? [] : z.noms.filter(cite), false]];
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
