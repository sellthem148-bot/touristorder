// La référence d'une commande : ce que le client voit et cite à la place de « n°1 » — par exemple « BC-58001 ».
// Elle a l'air d'un numéro quelconque, mais le gérant sait la lire :
//   BC      les initiales du client (prénom et nom) ;
//   58      deux chiffres qui ne comptent pas (ils changent d'une commande à l'autre) ;
//   001     le vrai numéro de la commande, écrit à l'endroit : commande n°1.
// Donc « BC-58001 » = commande n°1, « ML-31010 » = commande n°10, « TO-68011 » = commande n°11.
// (Le numéro était d'abord écrit à l'envers ; le gérant l'a voulu à l'endroit, le 12 novembre 2026.)
// Pur : sert au site, aux e-mails, aux messages et à l'espace gérant (qui affiche toujours les deux).

/** Les initiales d'un client, en lettres latines : « Benjamin Cohen » → « BC », « Benjamin » → « BE » ; « TO » sinon (nom en hébreu, en russe…). */
export function initialesDe(nom: string): string {
  const mots = nom.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  if (mots.length === 0) return "TO";
  if (mots.length === 1) return mots[0].slice(0, 2);
  return `${mots[0][0]}${mots[mots.length - 1][0]}`;
}

/** Les deux chiffres « qui ne comptent pas » : toujours les mêmes pour une commande donnée, entre 10 et 99. */
const brouillage = (numero: number) => 10 + ((numero * 37 + 11) % 90);

/** « BC-58001 » pour la commande n°1 de Benjamin Cohen. */
export function referenceDeCommande(numero: number, nomClient: string): string {
  return `${initialesDe(nomClient)}-${brouillage(numero)}${String(numero).padStart(3, "0")}`;
}

/**
 * Le vrai numéro d'une commande d'après ce que le gérant tape : une référence (« BC-58001 », « 58001 »)
 * ou le numéro lui-même (« 1 », « n°1 »). null si ce n'est ni l'un ni l'autre.
 */
export function numeroDepuisReference(texte: string): number | null {
  const chiffres = (texte.match(/\d+/g) ?? []).join("");
  if (!chiffres) return null;
  // Une référence : deux chiffres qui ne comptent pas, puis le numéro (au moins trois chiffres).
  if (chiffres.length >= 5) {
    const numero = Number(chiffres.slice(2));
    if (numero > 0 && brouillage(numero) === Number(chiffres.slice(0, 2)) && String(numero).length <= chiffres.length - 2) return numero;
  }
  const direct = Number(chiffres);
  return Number.isSafeInteger(direct) && direct > 0 && chiffres.length < 5 ? direct : null;
}
