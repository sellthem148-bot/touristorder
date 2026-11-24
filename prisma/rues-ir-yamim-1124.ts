// Les rues d'Ir Yamim et de Ramat Poleg, pour la zone « Netanya – Ir Yamim / Poleg » (40 ₪).
//
// Le gérant a envoyé deux listes le 24 novembre 2026 (« je crois qu'il y a ça, je ne suis pas sûr d'avoir tout mis ») :
// d'abord Ramat Poleg (les rues aux noms de fleurs et de personnalités), puis Ir Yamim (les rues aux noms d'artistes),
// avec ses limites : « Uzi Hitman au nord, Sderot Ben Gurion à l'est, Zalman Shazar au sud ».
// Google ne nomme jamais le quartier d'une adresse de Netanya : c'est par la RUE que le site reconnaît la zone.
// Chaque rue a donc été cherchée chez Google ce jour-là (clé du site, lecture seule) : on garde ici son nom tel
// que le gérant l'a écrit ET tel que Google l'écrit (lettres latines et hébreu — ce ne sont pas toujours les
// siennes : « Mordekhai Gur », « Tsiporen », « יקינטון », « שולמית », « עופרה חזה », « אופיר שייקה »), et on ne garde
// que les rues que Google situe dans ces deux quartiers : latitude 32,269 à 32,282, longitude 34,835 à 34,852
// (le centre de Netanya est à 32,33).
//
// Ce n'est qu'un point de départ : la liste vit ensuite dans « Villes » → « Rues et repères de cette zone », où le
// gérant ajoute et retire ce qu'il veut. Elle est posée une seule fois (ajouterLesRuesDIrYamim, prisma/remplissage.ts),
// sans rien retirer de ce qu'il a déjà écrit.

export const CLE_RUES_D_IR_YAMIM = "rues-ir-yamim-1124";

/** Une rue : ses écritures (celles du gérant, celles de Google). La première sert à la nommer. */
export type RueDuQuartier = { noms: string[]; latitude: number };

export const RUES_D_IR_YAMIM: RueDuQuartier[] = [
  // Ir Yamim — les rues aux noms d'artistes (sa seconde liste)
  { noms: ["Ehud Manor", "אהוד מנור"], latitude: 32.2766 },
  { noms: ["Uzi Hitman", "עוזי חיטמן"], latitude: 32.282 },
  { noms: ["Natan Yonatan", "נתן יונתן"], latitude: 32.2782 },
  { noms: ["Arik Lavie", "Arik Lavi", "אריק לביא"], latitude: 32.2804 },
  { noms: ["Yossi Banai", "Yosi Banai", "יוסי בנאי"], latitude: 32.2756 },
  // Google l'écrit « עופרה חזה » ; avec « עפרה חזה », il ne trouve rien à Netanya.
  { noms: ["Ofra Haza", "עופרה חזה", "עפרה חזה"], latitude: 32.2794 },
  { noms: ["Israel Poliakov", "Yisra'el Poliakov", "ישראל פוליאקוב"], latitude: 32.2814 },
  { noms: ["Mishpachat Malevsky", "Mishpakhat Malevski", "משפחת מלבסקי"], latitude: 32.2775 },
  // Google range le nom avant le prénom (« אופיר שייקה ») et n'a pas d'écriture latine.
  { noms: ["Shaike Ophir", "שייקה אופיר", "אופיר שייקה"], latitude: 32.2709 },
  { noms: ["Shosh Atari", "שוש עטרי"], latitude: 32.2727 },
  { noms: ["Dudu Dotan", "דודו דותן"], latitude: 32.2764 },
  { noms: ["Benny Berman", "Beni Berman", "בני ברמן"], latitude: 32.2797 },
  { noms: ["Shoshana Damari", "שושנה דמארי"], latitude: 32.2771 },
  // Ramat Poleg — les rues aux noms de personnalités (sa première liste)
  { noms: ["Zalman Shazar", "זלמן שז\"ר"], latitude: 32.276 },
  { noms: ["Menachem Begin", "מנחם בגין"], latitude: 32.2741 },
  { noms: ["Mordechai Gur", "Mordekhai Gur", "Motta Gur", "מרדכי גור"], latitude: 32.2735 },
  { noms: ["Menachem Savidor", "מנחם סבידור"], latitude: 32.2722 },
  { noms: ["Haim Laskov", "חיים לסקוב"], latitude: 32.2723 },
  { noms: ["Moshe Sneh", "משה סנה"], latitude: 32.2718 },
  { noms: ["Israel Galili", "ישראל גלילי"], latitude: 32.2701 },
  { noms: ["Ma'apilei Egoz", "Ma'apiley Egoz", "מעפילי אגוז"], latitude: 32.2743 },
  // « Shulamit Katznelson » : Google l'appelle « Shulamit » (« שולמית ») tout court.
  { noms: ["Shulamit", "שולמית"], latitude: 32.2703 },
  // Ramat Poleg — les rues aux noms de fleurs
  { noms: ["Amnon VeTamar", "אמנון ותמר"], latitude: 32.2756 },
  { noms: ["HaDaliyot", "HaDalyot", "הדליות"], latitude: 32.2718 },
  { noms: ["HaHadas", "ההדס"], latitude: 32.2705 },
  { noms: ["HaHarduf", "ההרדוף"], latitude: 32.272 },
  { noms: ["HaVradim", "Ha-Vradim", "הוורדים", "הורדים"], latitude: 32.2712 },
  { noms: ["HaHatzavim", "HaHatsavim", "החצבים"], latitude: 32.2696 },
  { noms: ["Yasmin", "HaYasmin", "היסמין"], latitude: 32.271 },
  { noms: ["HaLilach", "הלילך"], latitude: 32.2717 },
  { noms: ["HaMarganiyot", "Ha-Marganiyot", "המרגניות"], latitude: 32.2703 },
  { noms: ["HaNurit", "הנורית"], latitude: 32.2701 },
  { noms: ["HaTziporen", "Tsiporen", "הציפורן", "ציפורן"], latitude: 32.2717 },
  { noms: ["HaPragim", "הפרגים"], latitude: 32.2743 },
  { noms: ["HaDuda'im", "הדודאים"], latitude: 32.2748 },
  { noms: ["HaSachlav", "Sachlav", "הסחלב", "סחלב"], latitude: 32.2718 },
  { noms: ["HaLotem", "הלוטם"], latitude: 32.2751 },
  { noms: ["Turmus", "Turmos", "תורמוס"], latitude: 32.2715 },
  { noms: ["Olesh Matzui", "Olesh Matsuy", "עולש מצוי"], latitude: 32.2727 },
  { noms: ["Ner HaLayla", "Ner HaLaila", "נר הלילה"], latitude: 32.2758 },
  { noms: ["Admonit", "אדמונית"], latitude: 32.2727 },
  { noms: ["Yakinton", "יקינתון", "יקינטון"], latitude: 32.2731 },
  { noms: ["Sigalit", "סיגלית"], latitude: 32.2735 },
  { noms: ["Savyon", "סביון"], latitude: 32.2722 },
  { noms: ["Tziv'oni", "Tsiv'oni", "צבעוני"], latitude: 32.2744 },
  { noms: ["Chelmonit", "Helmonit", "חלמונית"], latitude: 32.2738 },
  { noms: ["Zehavit", "זהבית"], latitude: 32.2722 },
];

/**
 * De ses listes, ce qui n'a PAS été posé : Google situe ces rues hors des deux quartiers — au nord d'Uzi Hitman,
 * que le gérant donne lui-même pour limite nord —, ou ne les connaît pas. On le lui a dit, avec l'endroit ; s'il
 * confirme qu'il y livre à 40 ₪, il les ajoute dans « Villes » (ou on les ajoute par une opération de plus).
 * « Sderot Ben Gurion », sa limite est, traverse toute la ville : ce n'est pas un repère.
 */
export const RUES_A_CONFIRMER: { nom: string; pourquoi: string }[] = [
  { nom: "HaKalanit", pourquoi: "Google la situe à l'autre bout de Netanya, tout au nord (latitude 32,351)" },
  { nom: "Zvi Moissescu", pourquoi: "à plus d'un kilomètre au nord-est d'Uzi Hitman (latitude 32,293, longitude 34,858)" },
  { nom: "Rotem", pourquoi: "à 250 mètres au nord d'Uzi Hitman, et plus à l'est (latitude 32,284, longitude 34,847)" },
  { nom: "Sderot Pinchas Lavon", pourquoi: "un boulevard au nord-est du quartier (du n° 40, latitude 32,2825, au n° 1, latitude 32,287 ; longitude 34,854 à 34,856) : c'est Kiryat Nordau, à 40 ₪ aussi depuis que ce quartier a sa zone (prisma/kiryat-nordau-1124.ts)" },
  { nom: "HaIrusim", pourquoi: "Google l'écrit « האיריסים » (HaIrisim) et situe la rue à Ramat Poleg, mais ses numéros ailleurs, au nord-est : laissée à la position de chaque adresse (prisma/limites-ir-yamim-1124.ts)" },
];

/** Uzi Hitman, la limite nord que donne le gérant, est à 32,282 : aucune rue de la liste n'est plus au nord. */
export const LATITUDE_NORD_DU_QUARTIER = 32.283;

/**
 * Les repères d'une zone avec des rues en plus : à la suite de ce que le gérant a déjà écrit, une rue par ligne,
 * seulement les écritures absentes — rien n'est retiré ni réécrit. `place` : la longueur que le champ accepte
 * (une rue entière, ou rien).
 */
export function reperesAvec(dejaEcrit: string, rues: RueDuQuartier[], lire: (texte: string) => string[], place: number): { texte: string; rues: number } {
  const deja = new Set(lire(dejaEcrit));
  let texte = dejaEcrit.trim();
  let ajoutees = 0;
  for (const rue of rues) {
    const nouvelles = rue.noms.filter((nom) => lire(nom).some((r) => !deja.has(r)));
    if (nouvelles.length === 0) continue;
    const suite = texte ? `${texte}\n${nouvelles.join(", ")}` : nouvelles.join(", ");
    if (suite.length > place) break;
    texte = suite;
    ajoutees++;
    for (const nom of nouvelles) for (const r of lire(nom)) deja.add(r);
  }
  return { texte, rues: ajoutees };
}

/** Le texte à poser dans « Rues et repères de cette zone » : une rue par ligne, ses écritures séparées par des virgules. */
export function texteDesRues(rues: RueDuQuartier[] = RUES_D_IR_YAMIM): string {
  return rues.map((r) => r.noms.join(", ")).join("\n");
}
