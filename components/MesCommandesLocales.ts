// Les liens de suivi des commandes passées depuis ce navigateur (pas de compte client).
const CLE = "mes-commandes-v1";
const MAX = 20;

export function lireMesJetons(): string[] {
  try {
    const data = JSON.parse(window.localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(data) ? data.filter((j): j is string => typeof j === "string").slice(0, MAX) : [];
  } catch {
    return [];
  }
}

export function memoriserJeton(jeton: string) {
  try {
    const liste = [jeton, ...lireMesJetons().filter((j) => j !== jeton)].slice(0, MAX);
    window.localStorage.setItem(CLE, JSON.stringify(liste));
  } catch {
    // Navigation privée : la commande reste joignable par son lien.
  }
}
