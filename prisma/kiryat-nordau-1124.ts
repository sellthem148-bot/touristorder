// La zone « Netanya – Kiryat Nordau » (40 ₪).
//
// Le gérant, le 24 novembre 2026, après la zone « Ir Yamim / Poleg » reconnue par la position (« tout au sud d'Uzi
// Hitman ») — on lui avait dit que Kiryat Nordau, le quartier d'à côté, restait à 30 ₪ : « mets kiryat nordau à 40
// aussi ». Kiryat Nordau n'est ni Ir Yamim ni Poleg : c'est une zone à son nom, au même prix. Le client qui y loge
// lit le nom de SON quartier, et le gérant peut un jour lui donner un autre prix sans toucher à l'autre zone.
//
// Ce que Google donne ce jour-là (clé du site, lecture seule ; 403 adresses numérotées sur les 49 rues qu'il
// connaît autour du quartier, puis les rues de son coin nord-ouest) :
// - le quartier va du boulevard Golda Meir, au sud (n° 20 et 26 : 32,2764), à la rue Shalom Aleichem, au nord
//   (32,2878) ; du boulevard Ben Gurion, à l'ouest (Ya'akov Schiffer 1 : 34,8478), à la rue Max Nordau, à l'est
//   (n° 44 : 34,8558 au sud ; n° 1 : 34,8584 au nord) ;
// - à l'EST, la zone industrielle (HaMelacha, parallèle à Max Nordau, 300 mètres plus loin : n° 4 : 34,8576 au sud ;
//   n° 34 : 34,8605 au nord ; puis Giborei Israel, HaBonim, HaOmanut) : elle n'est PAS dans la zone — il n'a
//   demandé que le quartier. La limite passe entre les deux rues, d'où un bord est en escalier ;
// - au NORD-OUEST, un autre quartier, Givat HaIrusim (rues aux noms de fleurs : Rotem, Havatzelet HaHof, Irus
//   HaArgaman, Hartzit), au nord d'Uzi Hitman : il reste à 30 ₪. Rotem longe Zalman Shneur à cent mètres ; Google
//   ne connaît pas ses numéros et range presque toute la rue au même point (32,28481 ; 34,84928), qui doit donc
//   rester dehors. Hartzit (n° 60 : 34,8524) rejoint Avraham Shlonsky (n° 30 : 34,8524), qui est à Kiryat Nordau ;
// - au NORD, de l'autre côté de Shalom Aleichem : Agamim (Shmurat Nahal Arugot 44 : 32,2881) et Kiryat HaSharon ;
// - au SUD-OUEST, les limites d'Ir Yamim / Poleg (prisma/limites-ir-yamim-1124.ts) : les deux zones se touchent,
//   et se recouvrent d'un cheveu pour qu'aucune adresse ne tombe entre les deux. Là où elles se recouvrent, c'est
//   la première de la liste (Ir Yamim / Poleg) qui nomme l'adresse — au même prix.
//
// Posée UNE SEULE FOIS (ajouterKiryatNordau, prisma/remplissage.ts) ; ensuite la zone est au gérant, dans « Villes » :
// son prix, ses rues, ses limites.

export const CLE_KIRYAT_NORDAU = "zone-kiryat-nordau-1124";

/** Avant le tiret la ville, après lui le quartier (lib/zones.ts). */
export const QUARTIER_KIRYAT_NORDAU = "Netanya – Kiryat Nordau";

/** Le prix de la livraison au tarif de base, en agorot : « à 40 aussi ». */
export const LIVRAISON_A_KIRYAT_NORDAU = 4000;

/**
 * Un rectangle par ligne, du sud au nord. Le bord est suit la rue Max Nordau (la zone industrielle est derrière),
 * le bord ouest le boulevard Ben Gurion puis, au nord d'Uzi Hitman, la limite de Givat HaIrusim.
 */
export const LIMITES_DE_KIRYAT_NORDAU = [
  "nord 32.2801, sud 32.2760, ouest 34.8474, est 34.8566",
  "nord 32.2833, sud 32.2800, ouest 34.8474, est 34.8578",
  "nord 32.2846, sud 32.2832, ouest 34.8484, est 34.8586",
  "nord 32.2865, sud 32.2845, ouest 34.8516, est 34.8592",
  "nord 32.2882, sud 32.2864, ouest 34.8526, est 34.8592",
].join("\n");

/** Une rue du quartier : ses écritures (celle de Google en lettres latines et en hébreu, puis les plus courantes) et où Google la place. */
export type RueDeKiryatNordau = { noms: string[]; lat: number; lng: number };

/**
 * Les rues que Google situe dans le quartier, pour une adresse tapée À LA MAIN (sans proposition choisie, pas de
 * position) et pour le signalement « Zone à vérifier ». Le nom sans son titre (« Abu Khatsera » pour « Ha-Rav Abu
 * Khatsera ») : il se retrouve dans le nom entier. N'y sont pas : les rues qui bordent le quartier (Shalom
 * Aleichem, le boulevard Golda Meir, le boulevard Ben Gurion) et celles dont le nom est un mot trop courant
 * (Peretz, Mane, Michal, Ruppin) — la position suffit pour elles.
 */
export const RUES_DE_KIRYAT_NORDAU: RueDeKiryatNordau[] = [
  { noms: ["Zalman Shneur", "זלמן שניאור"], lat: 32.28351, lng: 34.84885 },
  { noms: ["Keren HaYesod", "קרן היסוד", "קרן יסוד"], lat: 32.2828, lng: 34.84942 },
  { noms: ["Kfar Tavor", "כפר תבור"], lat: 32.28319, lng: 34.85005 },
  { noms: ["Shai Agnon", "Agnon", "ש\"י עגנון", "עגנון"], lat: 32.28173, lng: 34.85041 },
  { noms: ["Zalman Aran", "זלמן ארן"], lat: 32.28195, lng: 34.85013 },
  { noms: ["Ya'akov Schiffer", "Yaakov Shiffer", "יעקב שיפר"], lat: 32.28179, lng: 34.84773 },
  { noms: ["Adolf Stand", "אדולף שטנד"], lat: 32.28213, lng: 34.84828 },
  { noms: ["Yitshak Epstein", "Yitzhak Epstein", "יצחק אפשטיין"], lat: 32.28087, lng: 34.85022 },
  { noms: ["Janus Korczak", "Janusz Korczak", "Korczak", "יאנוש קורצ'אק", "קורצ'אק"], lat: 32.28024, lng: 34.85119 },
  { noms: ["Natan ha-Meshorer", "Natan HaMeshorer", "נתן המשורר", "נתן משורר"], lat: 32.28007, lng: 34.84917 },
  { noms: ["Adam ha-Cohen", "Adam HaCohen", "אד\"ם הכהן", "אד\"ם כהן"], lat: 32.27982, lng: 34.85019 },
  { noms: ["Theodor Weissellberger", "Weissellberger", "Weisselberger", "תיאודור וייסלברגר", "וייסלברגר"], lat: 32.28332, lng: 34.85246 },
  // Google n'a pas d'écriture latine pour celle-ci.
  { noms: ["Dov Shilansky", "דב שילנסקי"], lat: 32.28218, lng: 34.85259 },
  { noms: ["Yitskhak Katsenelson", "Yitzhak Katznelson", "יצחק קצנלסון"], lat: 32.28489, lng: 34.85255 },
  { noms: ["Avraham Shlonsky", "Shlonsky", "אברהם שלונסקי", "שלונסקי"], lat: 32.28612, lng: 34.85247 },
  // De sa première liste (« Sderot Pinchas Lavon ») : Google la situait hors d'Ir Yamim / Poleg — elle est ici.
  { noms: ["Pinhas Lavon", "Pinchas Lavon", "פנחס לבון"], lat: 32.28266, lng: 34.85385 },
  { noms: ["Mendele Mokher Sfarim", "Mendele", "מנדלי מוכר ספרים", "מנדלי"], lat: 32.2844, lng: 34.85568 },
  { noms: ["Refa'el Anakuwa", "Rafael Ankawa", "רפאל אנקווה"], lat: 32.28569, lng: 34.8561 },
  { noms: ["Abu Khatsera", "Abu Hatzeira", "אבו חצירא", "אבוחצירא"], lat: 32.2862, lng: 34.85602 },
  { noms: ["Natan Komoi", "נתן קומוי"], lat: 32.28616, lng: 34.85709 },
  // Google range le nom avant le prénom.
  { noms: ["Nordau Max", "Max Nordau", "נורדאו מקס", "מקס נורדאו"], lat: 32.28304, lng: 34.85704 },
  { noms: ["Israel Bar Yehuda", "Bar Yehuda", "ישראל בר יהודה", "בר יהודה"], lat: 32.28217, lng: 34.8552 },
  { noms: ["Bechor Shitrit", "בכור שטרית"], lat: 32.28189, lng: 34.8536 },
  { noms: ["Levi Shoshan", "לוי שושן"], lat: 32.28045, lng: 34.85528 },
  { noms: ["Pinkhas Rotenberg", "Pinchas Rotenberg", "Rotenberg", "פנחס רוטנברג", "רוטנברג"], lat: 32.27996, lng: 34.85402 },
  { noms: ["Yitshak HaLevi Miberdichev", "Miberdichev", "Berdichev", "מברדיצ'ב", "ברדיצ'ב"], lat: 32.27933, lng: 34.85394 },
  { noms: ["Arye Levin", "Arie Levin", "Aryeh Levin", "אריה לוין"], lat: 32.27954, lng: 34.85516 },
];

/** Ce qui est posé dans « Rues et repères de cette zone » : l'autre écriture du quartier en hébreu, puis une rue par ligne. */
export function reperesDeKiryatNordau(): string {
  return ["קריית נורדאו", ...RUES_DE_KIRYAT_NORDAU.map((r) => r.noms.join(", "))].join("\n");
}

/** Des adresses relevées chez Google ce jour-là : [lieu, latitude, longitude]. Celles-ci sont dans le quartier… */
export const DANS_KIRYAT_NORDAU: [string, number, number][] = [
  ["Kiryat Nordau (le quartier, là où Google le place)", 32.28288, 34.85577],
  ["Ya'akov Schiffer 1 (le long du boulevard Ben Gurion)", 32.28177, 34.84781],
  ["Keren HaYesod 44 (le coin ouest)", 32.28202, 34.84785],
  ["Keren HaYesod 1", 32.28338, 34.85037],
  ["Adolf Stand 16", 32.28131, 34.84883],
  ["Zalman Shneur 16", 32.28319, 34.84876],
  ["Zalman Shneur 34", 32.28435, 34.85075],
  ["Zalman Shneur 44", 32.28435, 34.85139],
  ["Sh. Y. Agnon 1", 32.28067, 34.85206],
  ["Sh. Y. Agnon 34", 32.28333, 34.84909],
  ["Kfar Tavor 1", 32.28236, 34.85059],
  ["Mane 26", 32.28348, 34.85065],
  ["Theodor Weisselberger 1", 32.28426, 34.85176],
  ["Yitzhak Katznelson 34 (le coin nord-ouest)", 32.28473, 34.85194],
  ["Yitzhak Katznelson 4", 32.28601, 34.85407],
  ["Avraham Shlonsky 30 (au bout de Hartzit)", 32.28624, 34.85241],
  ["Avraham Shlonsky 20", 32.28649, 34.85277],
  ["Avraham Shlonsky 12", 32.28685, 34.85289],
  ["Avraham Shlonsky 1", 32.28676, 34.85437],
  ["Sderot Pinchas Lavon 1 (le nord)", 32.28739, 34.85583],
  ["Sderot Pinchas Lavon 34", 32.28123, 34.8527],
  ["Mendele Mokher Sfarim 1", 32.28387, 34.85694],
  ["Rafael Ankawa 1", 32.28527, 34.85742],
  ["Rafael Ankawa 20", 32.28604, 34.85524],
  ["Abu Hatzeira 1", 32.28685, 34.85596],
  ["Natan Komoi 4 (le nord-est)", 32.28655, 34.85802],
  ["Max Nordau 1 (la plus à l'est)", 32.28643, 34.85837],
  ["Max Nordau 20", 32.28288, 34.85686],
  ["Max Nordau 44", 32.28063, 34.85585],
  ["Y. L. Peretz 1", 32.2826, 34.85687],
  ["Israel Bar Yehuda 1", 32.28158, 34.85638],
  ["Bechor Shitrit 4", 32.281, 34.85603],
  ["Levi Shoshan 1", 32.28032, 34.85567],
  ["Ruppin 8", 32.28078, 34.85376],
  ["Pinchas Rotenberg 1", 32.27948, 34.855],
  ["Arie Levin 1 (le sud)", 32.27876, 34.85361],
  ["Arie Levin 4", 32.27929, 34.85491],
  ["Berdichev 34", 32.27903, 34.85469],
  ["Janusz Korczak 1", 32.28035, 34.85158],
  ["Yitzhak Epstein 1", 32.28107, 34.85054],
  // Pile sur la couture de deux rectangles : ils se recouvrent, pour qu'elle ne tombe pas entre les deux.
  ["Michal 44", 32.28, 34.85074],
  ["Adam HaCohen 16", 32.27967, 34.85004],
  ["Natan HaMeshorer 44 (le sud-ouest)", 32.27942, 34.8495],
  ["Sderot Golda Meir 20 (la limite sud)", 32.27653, 34.85253],
  ["Sderot Golda Meir 26", 32.27639, 34.85457],
  ["Shalom Aleichem 26 (la limite nord)", 32.2878, 34.85371],
  ["Shalom Aleichem 44", 32.2878, 34.85422],
];

/** … celles-là sont autour : Givat HaIrusim, Agamim, Kiryat HaSharon, la zone industrielle. Elles restent à 30 ₪. */
export const AUTOUR_DE_KIRYAT_NORDAU: [string, number, number][] = [
  ["Rotem 1 (Givat HaIrusim)", 32.28405, 34.84682],
  ["Rotem, là où Google range presque tous ses numéros", 32.28481, 34.84928],
  ["Rotem 81", 32.28521, 34.84871],
  ["Havatzelet HaHof 1 (Givat HaIrusim)", 32.28398, 34.84562],
  ["Havatzelet HaHof 20", 32.28552, 34.84793],
  ["Havatzelet HaHof 26", 32.28572, 34.84808],
  ["Irus HaArgaman 1", 32.28468, 34.84581],
  ["Hartzit 1 (Givat HaIrusim)", 32.28651, 34.84892],
  ["Hartzit 44", 32.2864, 34.8513],
  ["Hartzit 50", 32.28667, 34.85107],
  ["Hartzit 70", 32.28679, 34.85197],
  ["Hartzit 60 (au bout de la rue, à 40 mètres de Shlonsky 30)", 32.28668, 34.85244],
  ["Shalom Aleichem 1 (le long de Givat HaIrusim)", 32.28755, 34.84902],
  ["Shalom Aleichem 20", 32.28777, 34.85184],
  ["Dwight Eisenhower 1", 32.28802, 34.84844],
  ["Shmurat Nahal Arugot 44 (Agamim, juste au nord)", 32.28809, 34.85165],
  ["Shmurat Nahal Bsor 20 (Agamim)", 32.28853, 34.85371],
  ["HaIrisim 4, là où Google met ce numéro", 32.28865, 34.85477],
  ["Isaac Newton (Kiryat HaSharon)", 32.28895, 34.85676],
  ["Zvi Moissescu", 32.29315, 34.85826],
  ["HaMelacha 4 (zone industrielle)", 32.27727, 34.85756],
  ["HaMelacha 8", 32.27801, 34.85812],
  ["HaMelacha 20", 32.28026, 34.85895],
  ["HaMelacha 26", 32.28209, 34.85923],
  ["HaMelacha 34", 32.28519, 34.86053],
  ["Sderot Giborei Israel 1 (zone industrielle)", 32.27456, 34.85914],
  ["Sderot Giborei Israel 44", 32.28454, 34.86201],
  ["HaOmanut 1", 32.2782, 34.85881],
  ["HaBonim 1", 32.28042, 34.86035],
  ["HaYetzira 4", 32.276, 34.85847],
  ["Gad Manela 1", 32.2855, 34.86124],
  ["Herzl (centre de Netanya)", 32.3277, 34.8598],
];
