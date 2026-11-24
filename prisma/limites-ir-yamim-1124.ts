// Les limites sur la carte de la zone « Netanya – Ir Yamim / Poleg » (40 ₪).
//
// Le gérant, le 24 novembre 2026, après avoir envoyé ses listes de rues (« je ne suis pas sûr d'avoir tout mis ») :
// « oui fais par la position, tout au sud d'Uzi Hitman ». Une liste de rues n'est jamais complète — un échantillon
// de 83 rues que Google connaît au sud de cette rue en montrait plus de trente absentes de ses listes (Yigal Bashan,
// Tirza Atar…). Une adresse choisie dans les propositions de Google porte sa position : c'est elle qui tranche.
//
// Ce que Google donne ce jour-là (clé du site, lecture seule) :
// - Uzi Hitman monte de 32,2803 (côté mer, n° 20 à 34) à 32,2824 (n° 1 à 6) ; les autres rues d'Ir Yamim sont plus
//   au sud. Juste au nord : Rotem (n° 1 : 32,2840) et Irus HaArgaman (n° 1 : 32,2847). La limite nord passe entre
//   les deux, à 32,2832 — 90 mètres au nord de la dernière adresse d'Uzi Hitman.
// - À cette latitude, à l'EST du boulevard Ben Gurion (n° 200 : longitude 34,8463 ; centre commercial d'Ir Yamim :
//   34,8468), on est à Kiryat Nordau (Keren HaYesod 34,8494, Sh. Y. Agnon 34,8504, Janusz Korczak 34,8512…), un
//   autre quartier. Une simple ligne « tout ce qui est au sud de 32,2832 » le couperait en deux — Keren HaYesod
//   (32,2828) à 40 ₪, Zalman Shneur (32,2835), la rue d'à côté, à 30 ₪. Le gérant donne lui-même le boulevard
//   Ben Gurion pour limite est d'Ir Yamim : le premier rectangle s'arrête donc à 34,8475.
// - Ramat Poleg, plus au sud, s'étend davantage vers l'est (rues aux noms de fleurs jusqu'à 34,8517, toutes au sud
//   de 32,2760) ; Kiryat Nordau commence au boulevard Golda Meir (32,2780 ; longitude 34,8531). Le second
//   rectangle couvre cette partie : au sud de 32,2772, à l'ouest de 34,8525.
// Ni Kiryat Nordau ni la zone industrielle de Poleg (à l'est, 34,859 et au-delà) n'y sont : on le lui a dit, et
// s'il les veut à 40 ₪ il le dit — une ligne à changer dans « Villes » → « Limites sur la carte ».
//
// « HaIrusim », de sa première liste : Google la connaît sous « האיריסים » (HaIrisim) et situe la RUE à Ramat Poleg
// (32,2715 ; 34,8416), mais une adresse numérotée (« האיריסים 4 ») ailleurs, au nord-est (32,2887 ; 34,8548). On ne
// la met donc pas dans les repères, qui passeraient avant la position : c'est la position de chaque adresse qui dit.
//
// Posées une seule fois (poserLesLimitesDIrYamim, prisma/remplissage.ts), seulement si la zone n'a pas déjà les
// siennes ; ensuite elles sont au gérant, dans « Villes ». Les repères (rues) restent : ils passent avant la
// position, et ce sont eux qui servent pour une adresse tapée à la main.
export const CLE_LIMITES_D_IR_YAMIM = "limites-ir-yamim-1124";

/** Un rectangle par ligne : Ir Yamim et l'ouest de Ramat Poleg, puis l'est de Ramat Poleg. */
export const LIMITES_D_IR_YAMIM = "nord 32.2832, est 34.8475\nnord 32.2772, est 34.8525";

/** Des positions relevées chez Google ce jour-là : [lieu, latitude, longitude]. Celles-ci sont dans la zone… */
export const DANS_LA_ZONE: [string, number, number][] = [
  ["Uzi Hitman 6 (le point le plus au nord d'Ir Yamim)", 32.28236, 34.84227],
  ["Uzi Hitman 20", 32.28028, 34.83787],
  ["Israel Poliakov", 32.2814, 34.84033],
  ["Ehud Manor", 32.2766, 34.8389],
  ["Shaike Ophir (côté mer)", 32.2709, 34.8354],
  ["Yigal Bashan — absente de ses listes", 32.27363, 34.83824],
  ["Tirza Atar — absente de ses listes", 32.27239, 34.83684],
  ["HaIrisim (la rue, sans numéro)", 32.27147, 34.84164],
  ["Centre commercial d'Ir Yamim", 32.27926, 34.84676],
  ["Boulevard Ben Gurion 200", 32.2822, 34.8463],
  ["Zalman Shazar", 32.276, 34.8456],
  ["Menachem Savidor", 32.2722, 34.8471],
  ["HaTziporen (est de Ramat Poleg)", 32.2717, 34.849],
  ["Ner HaLayla (est de Ramat Poleg, la plus au nord)", 32.2758, 34.8501],
  ["Yakinton (est de Ramat Poleg, la plus à l'est)", 32.2731, 34.8516],
  ["Chelmonit", 32.2738, 34.8517],
];

/** … et celles-là n'y sont pas. */
export const HORS_DE_LA_ZONE: [string, number, number][] = [
  ["Rotem 1 (juste au nord d'Uzi Hitman)", 32.28405, 34.84682],
  ["Irus HaArgaman 1", 32.28468, 34.84581],
  ["Centre commercial des iris", 32.28699, 34.84431],
  ["Boulevard Ben Gurion 150", 32.29216, 34.84245],
  ["Keren HaYesod (Kiryat Nordau)", 32.2828, 34.84942],
  ["Sh. Y. Agnon (Kiryat Nordau)", 32.28173, 34.85041],
  ["Janusz Korczak (Kiryat Nordau)", 32.28024, 34.85119],
  ["Zalman Shneur (Kiryat Nordau)", 32.28351, 34.84885],
  ["Boulevard Golda Meir", 32.27798, 34.85314],
  ["Arie Levin", 32.27954, 34.85516],
  ["Sderot Pinchas Lavon 60", 32.28167, 34.85337],
  ["Sderot Pinchas Lavon 1", 32.2874, 34.8558],
  ["HaIrisim 4 (là où Google met ce numéro)", 32.288652, 34.854766],
  ["Golda Meir 10", 32.277504, 34.851284],
  ["Zvi Moissescu", 32.2931, 34.8583],
  ["HaOmanut (zone industrielle de Poleg)", 32.27767, 34.86121],
  ["Herzl (centre de Netanya)", 32.3277, 34.8598],
  ["Nitsa (centre de Netanya)", 32.3388, 34.8524],
  ["HaKalanit (nord de Netanya)", 32.3506, 34.8602],
];
