// « Photos rapides » : la ligne qui attend une image. Un Ctrl + V sur la page n'a pas de destinataire :
// c'est la dernière ligne touchée (« Chercher une image », « Coller », un clic dessus) qui reçoit l'image.
// Une seule ligne à la fois, connue de toutes : un petit magasin d'état, lu avec `useSyncExternalStore`.
let cible: string | null = null;
const abonnes = new Set<() => void>();

/** La ligne `id` attend une image (ou plus aucune, avec `null`). */
export function viser(id: string | null) {
  if (cible === id) return;
  cible = id;
  for (const prevenir of abonnes) prevenir();
}

export function abonner(prevenir: () => void) {
  abonnes.add(prevenir);
  return () => {
    abonnes.delete(prevenir);
  };
}

export const ligneVisee = () => cible;

// La dernière image enregistrée par collage : la recoller sur un AUTRE article est presque toujours un oubli
// (on est revenu sans avoir copié la nouvelle image) — la ligne le signale avant de l'accepter.
let derniere: { empreinte: string; id: string } | null = null;
export const derniereImageCollee = () => derniere;
export function noterImageCollee(empreinte: string, id: string) {
  derniere = { empreinte, id };
}
