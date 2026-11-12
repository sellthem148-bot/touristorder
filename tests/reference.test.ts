// La référence d'une commande : ce que le client lit à la place de « n°1 », et que le gérant sait relire.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initialesDe, numeroDepuisReference, referenceDeCommande } from "@/lib/reference";
import { DICTIONNAIRES, DICTIONNAIRES_SERVEUR } from "@/lib/i18n";
import { LANGUES } from "@/lib/langues";

/** Tous les textes d'un dictionnaire, à plat. */
function textes(x: unknown): string[] {
  if (typeof x === "string") return [x];
  if (Array.isArray(x)) return x.flatMap(textes);
  if (x && typeof x === "object") return Object.values(x).flatMap(textes);
  return [];
}

describe("référence d'une commande", () => {
  it("les initiales du prénom et du nom, en lettres latines", () => {
    expect(initialesDe("Benjamin Cohen")).toBe("BC");
    expect(initialesDe("  marie-claire   de la Tour ")).toBe("MT");
    expect(initialesDe("Élodie Ézra")).toBe("EE");
    // Un seul mot : ses deux premières lettres ; rien de lisible (hébreu, russe, vide) : « TO ».
    expect(initialesDe("Benjamin")).toBe("BE");
    expect(initialesDe("B")).toBe("B");
    for (const nom of ["בנימין כהן", "Анна Петрова", "", "  ", "123"]) expect(initialesDe(nom), nom).toBe("TO");
  });
  it("initiales, deux chiffres qui ne comptent pas, puis le numéro à l'endroit", () => {
    expect(referenceDeCommande(1, "Benjamin Cohen")).toBe("BC-58001");
    expect(referenceDeCommande(2, "Benjamin Cohen")).toBe("BC-95002");
    expect(referenceDeCommande(10, "Marc Levy")).toBe("ML-31010");
    expect(referenceDeCommande(11, "אבי")).toBe("TO-68011");
    expect(referenceDeCommande(1234, "Sarah Cohen")).toMatch(/^SC-\d{2}1234$/);
    // Rien qui ressemble à « commande n°1 » : toujours cinq chiffres au moins.
    for (let n = 1; n <= 999; n++) expect(referenceDeCommande(n, "A B")).toMatch(/^AB-[1-9]\d{4}$/);
  });
  it("le gérant retrouve le numéro : les deux premiers chiffres de côté, le reste est le numéro", () => {
    const vues = new Set<string>();
    for (let n = 1; n <= 20000; n++) {
      const reference = referenceDeCommande(n, "Benjamin Cohen");
      expect(numeroDepuisReference(reference)).toBe(n);
      vues.add(reference);
      // À la main : « 58001 » → « 001 » → 1.
      expect(Number(reference.slice(5))).toBe(n);
    }
    // Jamais deux commandes sous la même référence.
    expect(vues.size).toBe(20000);
  });
  it("la recherche du gérant accepte la référence, ses chiffres seuls, ou le numéro", () => {
    for (const saisie of ["BC-58001", "bc-58001", " BC 58001 ", "58001", "xx-58001"]) expect(numeroDepuisReference(saisie), saisie).toBe(1);
    for (const [saisie, numero] of [["1", 1], ["n°12", 12], ["042", 42], ["1234", 1234]] as const) expect(numeroDepuisReference(saisie), saisie).toBe(numero);
    // Un nom, rien, ou des chiffres qui ne sont pas une référence : ce n'est pas un numéro.
    for (const saisie of ["Cohen", "", "BC-", "99001", "58100", "0"]) expect(numeroDepuisReference(saisie), saisie).toBeNull();
  });
});

describe("le client ne lit jamais le numéro d'ordre", () => {
  it.each(LANGUES)("%s : aucun texte du site, d'un e-mail ou d'un message ne demande le numéro", (langue) => {
    for (const texte of [...textes(DICTIONNAIRES[langue]), ...textes(DICTIONNAIRES_SERVEUR[langue])]) {
      expect(texte).not.toContain("{numero}");
      expect(texte).not.toMatch(/(n°|#|№|n\.º|מס')\s?\{reference\}/);
    }
  });
  it("les pages du client et ses e-mails passent par la référence", () => {
    const lire = (...chemin: string[]) => readFileSync(join(process.cwd(), ...chemin), "utf8");
    for (const page of [
      ["app", "(boutique)", "suivi", "[jeton]", "page.tsx"],
      ["app", "(boutique)", "compte", "page.tsx"],
      ["app", "(boutique)", "actions.ts"],
      ["lib", "commande-courriels.ts"],
    ]) {
      expect(lire(...page), page.join("/")).toContain("referenceDeCommande(");
    }
    // Aucune page du client n'affiche « c.numero » : le numéro ne sert qu'à calculer la référence.
    for (const page of [["app", "(boutique)", "suivi", "[jeton]", "page.tsx"], ["app", "(boutique)", "compte", "page.tsx"], ["app", "(boutique)", "commandes", "MesCommandes.tsx"]]) {
      expect(lire(...page).replace(/referenceDeCommande\([^)]*\)/g, ""), page.join("/")).not.toMatch(/\{\s*(c|commande)\.numero\s*\}|numero: (c|commande)\.numero/);
    }
  });
});
