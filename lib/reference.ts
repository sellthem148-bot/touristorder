// La référence d'une commande : ce que le client voit et cite à la place de « n°1 » — par exemple « BC-58100 ».
// Elle a l'air d'un numéro quelconque, mais le gérant sait la lire :
//   BC      les initiales du client (prénom et nom) ;
//   58      deux chiffres qui ne comptent pas (ils changent d'une commande à l'autre) ;
//   100     le vrai numéro de la commande, écrit À L'ENVERS : 100 → 001 → commande n°1.
// Donc « BC-58100 » = commande n°1, « ML-31010 » = commande n°10, « TO-68110 » = commande n°11.
// Pur : sert au site, aux e-mails, aux messages et à l'espace gérant (qui affiche toujours les deux).

/** Les initiales d'un client, en lettres latines : « Benjamin Cohen » → « BC », « Benjamin » → « BE » ; « TO » sinon (nom en hébreu, en russe…). */
export function initialesDe(nom: string): string {
  const mots = nom.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  if (mots.length === 0) return "TO";
  if (mots.length === 1) return mots[0].slice(0, 2);
  return `${mots[0][0]}${mots[mots.length - 1][0]}`;
}

/** Les deux chiffres « qui ne comptent pas » : toujours les mêmes pour une commande donnée, entre 10 et 99. */
const brouillage = (numero: number) => 10 + ((numero * 37 + 11) % 90);

/** « BC-58100 » pour la commande n°1 de Benjamin Cohen. */
export function referenceDeCommande(numero: number, nomClient: string): string {
  const aLEnvers = [...String(numero).padStart(3, "0")].reverse().join("");
  return `${initialesDe(nomClient)}-${brouillage(numero)}${aLEnvers}`;
}

/**
 * Le vrai numéro d'une commande d'après ce que le gérant tape : une référence (« BC-58100 », « 58100 »)
 * ou le numéro lui-même (« 1 », « n°1 »). null si ce n'est ni l'un ni l'autre.
 */
export function numeroDepuisReference(texte: string): number | null {
  const chiffres = (texte.match(/\d+/g) ?? []).join("");
  if (!chiffres) return null;
  // Une référence : deux chiffres, puis le numéro à l'envers (au moins trois chiffres).
  if (chiffres.length >= 5) {
    const numero = Number([...chiffres.slice(2)].reverse().join(""));
    if (numero > 0 && brouillage(numero) === Number(chiffres.slice(0, 2)) && String(numero).length <= chiffres.length - 2) return numero;
  }
  const direct = Number(chiffres);
  return Number.isSafeInteger(direct) && direct > 0 && chiffres.length < 5 ? direct : null;
}
