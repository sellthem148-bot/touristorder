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
}
