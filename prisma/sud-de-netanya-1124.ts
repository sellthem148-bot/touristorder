// Les deux derniers secteurs du sud de Netanya passés à 40 ₪ : Givat HaIrusim et la zone industrielle.
//
// Le gérant, le 24 novembre 2026. Après Ir Yamim / Poleg (« tout au sud d'Uzi Hitman ») et Kiryat Nordau (« à 40
// aussi »), on lui avait dit ce qui restait à 30 ₪ parce qu'il ne l'avait pas demandé : la zone industrielle, juste à
// l'est de Max Nordau, et Givat HaIrusim, le petit quartier coincé entre Ir Yamim et Kiryat Nordau. Sa réponse, en
// reprenant les deux lignes : « 40 sh » pour l'une comme pour l'autre. Comme Kiryat Nordau, chacun devient une ZONE
// À SON NOM, au même prix : le client lit le nom de l'endroit où il loge, et le gérant règle chaque prix à part.
//
// Avec elles, TOUT le sud de Netanya est à 40 ₪ : ce qui est au sud de la ligne Dwight Eisenhower – Shalom Aleichem –
// pont HaShalom (latitude 32,288). Au nord de cette ligne, rien ne change : Agamim, Kiryat HaSharon, le parc
// d'activités et le stade restent à 30 ₪.
//
// Ce que Google donne ce jour-là (clé du site, lecture seule : les rues qu'il connaît dans chaque secteur, puis des
// adresses numérotées sur chacune) :
// - GIVAT HAIRUSIM (« גבעת האירוסים », que Google connaît comme quartier : 32,2859 ; 34,8478 — et la synagogue
//   « Givat HaIrusim » est rue Hartzit) : les rues aux noms de fleurs, entre le boulevard Ben Gurion et Kiryat Nordau
//   — Rotem, Havatzelet HaHof, Irus HaArgaman, Hartzit — et Dwight Eisenhower, qui le borde au nord. Il commence où
//   finit Ir Yamim (32,2832) et finit rue Shalom Aleichem (32,2878) ; juste au-dessus, c'est Agamim (Sderot HaAgamim
//   20 : 32,28805 ; Shmurat Nahal Arugot 60 : 32,28809). Un seul rectangle, ouvert vers la mer, qui déborde sur
//   Kiryat Nordau : Kiryat Nordau est avant lui dans la liste et garde ses adresses, au même prix.
// - LA ZONE INDUSTRIELLE (Google : « אזור התעשייה פולג », « אזור תעשייה פנחס ספיר קרית נורדאו », et la gare « נתניה
//   קריית ספיר ») : elle est de l'autre côté de la route 2, qui passe entre la rue Max Nordau et la rue HaMelacha —
//   c'est donc la route qui sépare les deux zones, et le bord ouest de celle-ci reprend en escalier le bord est de
//   Kiryat Nordau. HaMelacha, Giborei Israel, HaBonim, HaOmanut, HaYetzira, Yad Harutzim, Gad Manela, HaTrufa…
//   Ouverte vers le sud (IKEA, l'échangeur de Poleg) et vers l'est (Kfar Netter et Even Yehuda sont d'autres
//   villes : les limites d'un quartier ne valent que dans la sienne). Au nord, elle s'arrête juste après le pont
//   HaShalom et la rue Harry Truman : HaMahshev et le début de HaGavish et de HaTzoran y sont (jusqu'à 32,2884) ;
//   la suite (HaTzoran 6 : 32,2894 ; HaMada, HaMehkar, le stade) est à la hauteur de Kiryat HaSharon : 30 ₪.
//
// Posées UNE SEULE FOIS (ajouterGivatHaIrusim, ajouterLaZoneIndustrielle, prisma/remplissage.ts) ; ensuite chaque
// zone est au gérant, dans « Villes » : son prix, ses rues, ses limites.

export const CLE_GIVAT_HAIRUSIM = "zone-givat-hairusim-1124";
export const CLE_ZONE_INDUSTRIELLE = "zone-industrielle-poleg-1124";

/** Avant le tiret la ville, après lui le quartier (lib/zones.ts). */
export const QUARTIER_GIVAT_HAIRUSIM = "Netanya – Givat HaIrusim";
export const ZONE_INDUSTRIELLE = "Netanya – Zone industrielle Poleg";

/** Le prix de la livraison au tarif de base, en agorot : « 40 sh ». */
export const LIVRAISON_AU_SUD_DE_NETANYA = 4000;

/** D'Ir Yamim (32,2832) à la rue Shalom Aleichem, de la mer à Kiryat Nordau. */
export const LIMITES_DE_GIVAT_HAIRUSIM = "nord 32.2880, sud 32.2831, est 34.8527";

/**
 * Un rectangle par ligne, du sud au nord : d'abord ce qui est au sud de Kiryat Nordau, puis, à sa hauteur, ce qui
 * est à l'est de la route 2 — chaque bord ouest recouvre d'un cheveu le bord est du rectangle de Kiryat Nordau.
 */
export const LIMITES_DE_LA_ZONE_INDUSTRIELLE = [
  "nord 32.2761, ouest 34.8524",
  "nord 32.2801, sud 32.2760, ouest 34.8565",
  "nord 32.2833, sud 32.2800, ouest 34.8577",
  "nord 32.2846, sud 32.2832, ouest 34.8585",
  "nord 32.2889, sud 32.2845, ouest 34.8591",
].join("\n");

/** Une rue : ses écritures (celle de Google en lettres latines et en hébreu, puis les plus courantes) et où Google la place. */
export type RueDuSud = { noms: string[]; lat: number; lng: number };

/** Les rues de Givat HaIrusim (Shalom Aleichem, qui le borde et se poursuit à Kiryat Nordau, n'y est pas). */
export const RUES_DE_GIVAT_HAIRUSIM: RueDuSud[] = [
  { noms: ["Rotem", "רותם"], lat: 32.28521, lng: 34.84939 },
  { noms: ["Havatselet Hahof", "Havatzelet HaHof", "חבצלת החוף"], lat: 32.28544, lng: 34.84735 },
  { noms: ["Irus ha-Argaman", "Irus HaArgaman", "אירוס הארגמן"], lat: 32.28618, lng: 34.84641 },
  { noms: ["Khartsit", "Hartzit", "חרצית"], lat: 32.28677, lng: 34.85098 },
  { noms: ["Dwight Eisenhower", "Eisenhower", "דווייט אייזנהאואר", "אייזנהאואר"], lat: 32.28757, lng: 34.8452 },
];

/** Les rues de la zone industrielle, au sud du pont HaShalom (celles qui le traversent — HaGavish, HaTzoran — n'y sont pas). */
export const RUES_DE_LA_ZONE_INDUSTRIELLE: RueDuSud[] = [
  { noms: ["Ha-Melakha", "HaMelacha", "המלאכה"], lat: 32.2808, lng: 34.85937 },
  { noms: ["Giborei Israel", "גיבורי ישראל"], lat: 32.27918, lng: 34.86046 },
  { noms: ["Ha-Bonim", "HaBonim", "הבונים"], lat: 32.28022, lng: 34.8617 },
  { noms: ["Ha-Omanut", "HaOmanut", "האומנות"], lat: 32.27767, lng: 34.86121 },
  { noms: ["HaYetsira", "HaYetzira", "היצירה"], lat: 32.27581, lng: 34.8582 },
  { noms: ["Beni Ga'on", "Benny Gaon", "בני גאון"], lat: 32.27592, lng: 34.86231 },
  { noms: ["Yad Harutsim", "Yad Harutzim", "יד חרוצים"], lat: 32.28237, lng: 34.86478 },
  { noms: ["Arieh Regev", "אריה רגב"], lat: 32.28119, lng: 34.86301 },
  { noms: ["Ha-Trufa", "HaTrufa", "התרופה"], lat: 32.2828, lng: 34.86313 },
  { noms: ["Gad Manela", "גד מנלה"], lat: 32.28539, lng: 34.86083 },
  { noms: ["HaSi'im", "HaSiim", "השיאים"], lat: 32.28525, lng: 34.86485 },
  { noms: ["Harry Truman", "הארי טרומן"], lat: 32.28635, lng: 34.86478 },
];

/** Les autres noms sous lesquels on connaît la zone industrielle (Google, la gare, les adresses des entreprises). */
const AUTRES_NOMS_DE_LA_ZONE_INDUSTRIELLE = ["אזור תעשייה פולג", "אזור התעשיה פולג", "אזור תעשיה פולג", "Kiryat Sapir", "קרית ספיר", "קריית ספיר", "Sapir industrial zone", "zone industrielle Sapir", "אזור התעשייה ספיר", "אזור תעשייה ספיר", "אזור תעשיה ספיר"];

const enReperes = (premiers: string[], rues: RueDuSud[]) => [...premiers, ...rues.map((r) => r.noms.join(", "))].join("\n");

/** Ce qui est posé dans « Rues et repères de cette zone » : une rue par ligne, ses écritures séparées par des virgules. */
export function reperesDeGivatHaIrusim(): string {
  return enReperes(["Givat HaIrisim, גבעת האירוסים"], RUES_DE_GIVAT_HAIRUSIM);
}
export function reperesDeLaZoneIndustrielle(): string {
  return enReperes([AUTRES_NOMS_DE_LA_ZONE_INDUSTRIELLE.join(", ")], RUES_DE_LA_ZONE_INDUSTRIELLE);
}

/** Des adresses relevées chez Google ce jour-là : [lieu, latitude, longitude]. Givat HaIrusim… */
export const DANS_GIVAT_HAIRUSIM: [string, number, number][] = [
  ["Givat HaIrusim (le quartier, là où Google le place)", 32.28592, 34.8478],
  ["Rotem 1", 32.28405, 34.84682],
  ["Rotem 3", 32.2841, 34.84714],
  ["Rotem, là où Google range presque tous ses numéros", 32.28481, 34.84928],
  ["Rotem 81", 32.28521, 34.84871],
  ["Havatzelet HaHof 1", 32.28398, 34.84562],
  ["Havatzelet HaHof 14", 32.2849, 34.84729],
  ["Havatzelet HaHof 20", 32.28552, 34.84793],
  ["Irus HaArgaman 1", 32.28468, 34.84581],
  ["Irus HaArgaman 20 (le long du boulevard Ben Gurion)", 32.28634, 34.84436],
  ["Irus HaArgaman 90", 32.28671, 34.84713],
  ["Hartzit 1", 32.28651, 34.84892],
  ["Hartzit 20", 32.28635, 34.85019],
  ["Hartzit 40", 32.28632, 34.85112],
  ["Hartzit 44", 32.2864, 34.8513],
  ["Hartzit 60 (le bout est, à 40 mètres de Shlonsky 30)", 32.28668, 34.85244],
  ["Hartzit 90", 32.28679, 34.85197],
  ["Synagogue Givat HaIrusim, rue Hartzit", 32.28607, 34.8506],
  ["Dwight Eisenhower 3", 32.28793, 34.84791],
  ["Dwight Eisenhower 60", 32.28771, 34.84682],
  ["Shalom Aleichem 1 (le long du quartier)", 32.28755, 34.84902],
  ["Shalom Aleichem 14", 32.28777, 34.85043],
  ["Shalom Aleichem 20", 32.28777, 34.85184],
  // Une rue de Kiryat Nordau à l'ouest de sa limite : ses n° 1 et 3 sont dans le rectangle d'Ir Yamim, ceux-ci ici.
  ["Aryeh Leib Yafe 6 (juste au nord de la limite d'Ir Yamim)", 32.28344, 34.84693],
  ["Aryeh Leib Yafe 10", 32.28371, 34.84724],
];

/** … la zone industrielle… */
export const DANS_LA_ZONE_INDUSTRIELLE: [string, number, number][] = [
  ["Zone industrielle de Poleg, rue HaBonim (là où Google la place)", 32.28053, 34.86147],
  ["Zone industrielle Pinhas Sapir – Kiryat Nordau (là où Google la place)", 32.2792, 34.86243],
  ["Gare de Netanya – Kiryat Sapir", 32.27883, 34.86517],
  ["IKEA", 32.27386, 34.86104],
  ["Échangeur de Poleg", 32.27377, 34.85445],
  ["HaMelacha 1 (le sud)", 32.27689, 34.85838],
  ["HaMelacha 4 (la plus proche de Kiryat Nordau)", 32.27727, 34.85756],
  ["HaMelacha 10", 32.27842, 34.85792],
  ["HaMelacha 20", 32.28026, 34.85895],
  ["HaMelacha 28", 32.28296, 34.85939],
  ["HaMelacha 40", 32.28518, 34.86057],
  ["Sderot Giborei Israel 3 (le sud)", 32.27456, 34.85914],
  ["Sderot Giborei Israel 6", 32.27622, 34.85915],
  ["Sderot Giborei Israel 20", 32.27948, 34.86024],
  ["Sderot Giborei Israel 90", 32.28543, 34.86234],
  ["HaYetzira 1", 32.27548, 34.85846],
  ["HaYetzira 6", 32.27594, 34.85877],
  ["Mefi 1", 32.27515, 34.85979],
  ["Beni Gaon 1", 32.27545, 34.86245],
  ["Beni Gaon 90", 32.27616, 34.86303],
  ["HaOmanut 1", 32.2782, 34.85881],
  ["HaOmanut 20", 32.27759, 34.86255],
  ["HaBonim 1", 32.28042, 34.86035],
  ["HaBonim 90", 32.27995, 34.8638],
  ["Yad Harutzim 1", 32.27741, 34.86319],
  ["Yad Harutzim 28", 32.28183, 34.8646],
  ["Yad Harutzim 90 (le nord)", 32.28546, 34.86564],
  ["Arieh Regev 1", 32.28012, 34.86266],
  ["HaTrufa 10", 32.28332, 34.86163],
  ["HaTrufa 60", 32.28259, 34.86477],
  ["Gad Manela 1", 32.2855, 34.86124],
  ["Gad Manela 60", 32.28508, 34.86157],
  ["Harry Truman (la rue)", 32.28635, 34.86478],
  ["HaSi'im (la rue)", 32.28525, 34.86485],
  // Juste au nord du pont HaShalom : encore dans la zone.
  ["HaMahshev 1", 32.2882, 34.86405],
  ["HaMahshev 3", 32.28784, 34.86512],
  ["HaGavish 1", 32.2873, 34.86332],
  ["HaGavish 6", 32.28843, 34.86187],
  ["HaTzoran 1", 32.28795, 34.86602],
];

/** … et ce qui est au nord de la ligne Eisenhower – Shalom Aleichem – pont HaShalom : toujours Netanya, à 30 ₪. */
export const AU_NORD_DE_LA_LIGNE: [string, number, number][] = [
  ["Sderot HaAgamim 20 (Agamim, au carrefour d'Eisenhower)", 32.28805, 34.84851],
  ["Sderot HaAgamim 14", 32.28866, 34.84931],
  ["Shmurat Nahal Arugot 60 (Agamim)", 32.28809, 34.85165],
  ["Shmurat Nahal Snir 90 (Agamim)", 32.28833, 34.84987],
  ["Shmurat Nahal Bsor 60 (Agamim)", 32.28835, 34.8531],
  ["Shmurat Nahal Bsor 20 (Agamim)", 32.28853, 34.85371],
  ["HaIrisim 4, là où Google met ce numéro", 32.28865, 34.85477],
  ["Isaac Newton (Kiryat HaSharon)", 32.28895, 34.85676],
  ["Karl Popper 90 (Kiryat HaSharon)", 32.28965, 34.85584],
  ["Zvi Moissescu (Kiryat HaSharon)", 32.29315, 34.85826],
  ["HaTzoran 6 (parc d'activités, au nord du pont)", 32.28938, 34.86608],
  ["HaGavish 10", 32.29015, 34.86383],
  ["HaMada (la rue)", 32.29042, 34.86485],
  ["HaMehkar 1", 32.29168, 34.8624],
  ["HaItztadion 1 (le stade)", 32.29436, 34.86334],
  ["Sderot Tom Lantos 60", 32.29749, 34.86876],
  ["Sderot Ben Tsvi 90", 32.29536, 34.85265],
  ["Boulevard Ben Gurion 150", 32.29216, 34.84245],
  ["Herzl (centre de Netanya)", 32.3277, 34.8598],
  ["Nitsa (centre de Netanya)", 32.3388, 34.8524],
];
