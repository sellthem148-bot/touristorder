// Compare une traduction au français (la référence) : mêmes clés, mêmes « {valeurs} », mêmes liens.
// Pur : sert au test (tests/langues.test.ts) et à l'outil tests/outils/verifier-langue.ts.

const FORMES = ["one", "few", "many", "other"];

const valeurs = (texte: string) => [...new Set(texte.match(/\{\w+\}/g) ?? [])].sort();
const liens = (texte: string) => (texte.match(/\]\([^)]*\)/g) ?? []).sort();
const estObjet = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null && !Array.isArray(x);
const estFormes = (x: unknown): x is Record<string, string> =>
  estObjet(x) && Object.keys(x).length > 0 && Object.keys(x).every((k) => FORMES.includes(k)) && Object.values(x).every((v) => typeof v === "string");

/** Les écarts entre une traduction et la référence ; vide = tout va bien. */
export function comparer(reference: unknown, traduction: unknown, chemin = ""): string[] {
  if (typeof reference === "string") {
    if (typeof traduction !== "string") return [`${chemin} : un texte est attendu`];
    const problemes: string[] = [];
    if (reference.trim() !== "" && traduction.trim() === "") problemes.push(`${chemin} : traduction vide`);
    if (valeurs(reference).join() !== valeurs(traduction).join()) {
      problemes.push(`${chemin} : valeurs {…} différentes — attendu ${valeurs(reference).join(" ") || "aucune"}, trouvé ${valeurs(traduction).join(" ") || "aucune"}`);
    }
    if (liens(reference).join() !== liens(traduction).join()) problemes.push(`${chemin} : liens différents — attendu ${liens(reference).join(" ") || "aucun"}`);
    if ((reference.match(/\*\*/g) ?? []).length !== (traduction.match(/\*\*/g) ?? []).length) problemes.push(`${chemin} : marques de gras « ** » différentes`);
    return problemes;
  }
  if (estFormes(reference)) {
    if (!estFormes(traduction)) return [`${chemin} : des formes (one / few / many / other) sont attendues`];
    if (!traduction.other || !traduction.one) return [`${chemin} : les formes « one » et « other » sont obligatoires`];
    const permises = new Set(Object.values(reference).flatMap(valeurs));
    return Object.entries(traduction).flatMap(([forme, texte]) =>
      valeurs(texte).filter((v) => !permises.has(v)).map((v) => `${chemin}.${forme} : valeur inconnue ${v}`),
    );
  }
  if (Array.isArray(reference)) {
    if (!Array.isArray(traduction) || traduction.length !== reference.length) return [`${chemin} : une liste de ${reference.length} éléments est attendue`];
    return reference.flatMap((r, i) => comparer(r, traduction[i], `${chemin}[${i}]`));
  }
  if (estObjet(reference)) {
    if (!estObjet(traduction)) return [`${chemin} : un groupe de textes est attendu`];
    const manquantes = Object.keys(reference).filter((k) => !(k in traduction)).map((k) => `${chemin}.${k} : manquant`);
    const enTrop = Object.keys(traduction).filter((k) => !(k in reference)).map((k) => `${chemin}.${k} : en trop`);
    return [...manquantes, ...enTrop, ...Object.keys(reference).filter((k) => k in traduction).flatMap((k) => comparer(reference[k], traduction[k], chemin ? `${chemin}.${k}` : k))];
  }
  return [];
}
