// Limiteur en mémoire, par processus. Sur Vercel chaque instance a le sien :
// ça freine un robot ou un double-clic, ce n'est pas une barrière absolue.
const compteurs = new Map<string, { n: number; fin: number }>();

export function autoriser(cle: string, max: number, fenetreMs: number, maintenant = Date.now()): boolean {
  if (compteurs.size > 10_000) {
    for (const [k, v] of compteurs) if (v.fin <= maintenant) compteurs.delete(k);
    if (compteurs.size > 10_000) compteurs.clear();
  }
  const c = compteurs.get(cle);
  if (!c || c.fin <= maintenant) {
    compteurs.set(cle, { n: 1, fin: maintenant + fenetreMs });
    return true;
  }
  if (c.n >= max) return false;
  c.n += 1;
  return true;
}

export function reinitialiserLimites() {
  compteurs.clear();
  echecs.clear();
}

// Compteur d'échecs (connexion) : seuls les essais ratés comptent, une bonne
// connexion ne consomme rien. Bloqué dès `max` échecs dans la fenêtre.
const echecs = new Map<string, { n: number; fin: number }>();

export function bloque(cle: string, max: number, maintenant = Date.now()): boolean {
  const c = echecs.get(cle);
  return !!c && c.fin > maintenant && c.n >= max;
}

export function noterEchec(cle: string, fenetreMs: number, maintenant = Date.now()) {
  if (echecs.size > 10_000) echecs.clear();
  const c = echecs.get(cle);
  if (!c || c.fin <= maintenant) echecs.set(cle, { n: 1, fin: maintenant + fenetreMs });
  else c.n += 1;
}
