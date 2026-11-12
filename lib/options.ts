// Les variantes d'un produit (taille, modèle, couleur…) : une seule définition
// pour l'admin (saisie), le panier (choix) et le serveur (prix facturé).
import { z } from "zod";
import { lirePrix, prixPourChamp } from "./argent";

// `affiche` : le nom dans la langue du client (lib/i18n/catalogue), posé par le serveur pour l'affichage seulement.
// Ce qui est choisi, envoyé et vérifié reste `nom` / `libelle`, tels que le gérant les a saisis.
export type Choix = { libelle: string; supplement: number; affiche?: string };
export type GroupeOptions = { nom: string; choix: Choix[]; affiche?: string };

/** Ce que le client a choisi : { "Taille": "4 ans" }. */
export type Selection = Record<string, string>;

export const GROUPES_MAX = 4;
export const CHOIX_MAX = 20;

const groupesSchema = z
  .array(
    z.object({
      nom: z.string().min(1).max(40),
      choix: z
        .array(z.object({ libelle: z.string().min(1).max(40), supplement: z.number().int().min(0).max(1_000_000) }))
        .min(1)
        .max(CHOIX_MAX),
    }),
  )
  .max(GROUPES_MAX);

/** Lit la colonne JSON d'un produit. Une valeur abîmée vaut « pas d'options ». */
export function lireGroupes(json: unknown): GroupeOptions[] {
  const r = groupesSchema.safeParse(json);
  return r.success ? r.data : [];
}

/**
 * Saisie de l'admin, un groupe par ligne :
 *   Taille : 2 ans | 4 ans | 6 ans | 8 ans +10
 *   Couleur : Bleu | Rose
 * « +10 » (ou « +10,50 ») à la fin d'un choix = supplément en ₪.
 */
export function lireOptionsSaisies(texte: string): { ok: true; groupes: GroupeOptions[] } | { ok: false; erreur: string } {
  const lignes = texte.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lignes.length > GROUPES_MAX) return { ok: false, erreur: `${GROUPES_MAX} groupes d'options au maximum.` };
  const groupes: GroupeOptions[] = [];
  for (const ligne of lignes) {
    const deuxPoints = ligne.indexOf(":");
    if (deuxPoints < 1) return { ok: false, erreur: `« ${ligne.slice(0, 40)} » : écris « Nom : choix 1 | choix 2 ».` };
    const nom = ligne.slice(0, deuxPoints).trim();
    if (nom.length > 40) return { ok: false, erreur: `Nom d'option trop long : « ${nom.slice(0, 40)}… ».` };
    if (groupes.some((g) => g.nom.toLowerCase() === nom.toLowerCase())) return { ok: false, erreur: `L'option « ${nom} » est en double.` };
    const choix: Choix[] = [];
    for (const brut of ligne.slice(deuxPoints + 1).split("|").map((c) => c.trim()).filter(Boolean)) {
      const m = brut.match(/^(.*?)\s*\+\s*(\d+(?:[.,]\d{1,2})?)\s*(?:₪)?$/);
      const libelle = (m ? m[1] : brut).trim();
      const supplement = m ? lirePrix(m[2]) : 0;
      if (!libelle || libelle.length > 40) return { ok: false, erreur: `Choix invalide dans « ${nom} » : « ${brut.slice(0, 40)} ».` };
      if (supplement == null) return { ok: false, erreur: `Supplément illisible dans « ${brut} ».` };
      if (choix.some((c) => c.libelle.toLowerCase() === libelle.toLowerCase())) return { ok: false, erreur: `« ${libelle} » est en double dans « ${nom} ».` };
      choix.push({ libelle, supplement });
    }
    if (choix.length === 0) return { ok: false, erreur: `L'option « ${nom} » n'a aucun choix.` };
    if (choix.length > CHOIX_MAX) return { ok: false, erreur: `${CHOIX_MAX} choix au maximum par option.` };
    groupes.push({ nom, choix });
  }
  return { ok: true, groupes };
}

/** L'inverse, pour pré-remplir le champ de l'admin. */
export function optionsEnTexte(groupes: GroupeOptions[]): string {
  return groupes
    .map((g) => `${g.nom} : ${g.choix.map((c) => (c.supplement ? `${c.libelle} +${prixPourChamp(c.supplement)}` : c.libelle)).join(" | ")}`)
    .join("\n");
}

/**
 * Vérifie un choix du client : exactement une valeur existante par groupe.
 * Rend le supplément total et le libellé à garder sur la ligne de commande.
 */
export function resoudreSelection(
  groupes: GroupeOptions[],
  selection: Selection | undefined,
): { ok: true; supplement: number; libelle: string } | { ok: false } {
  const sel = selection ?? {};
  if (Object.keys(sel).some((cle) => !groupes.some((g) => g.nom === cle))) return { ok: false };
  let supplement = 0;
  const morceaux: string[] = [];
  for (const g of groupes) {
    const c = g.choix.find((x) => x.libelle === sel[g.nom]);
    if (!c) return { ok: false };
    supplement += c.supplement;
    morceaux.push(`${g.nom} : ${c.libelle}`);
  }
  return { ok: true, supplement, libelle: morceaux.join(" · ") };
}

/**
 * Le choix du client tel qu'on le lui montre (« Size: 4 · Colour: Blue »), dans sa langue quand le serveur
 * a posé les noms `affiche`. Vide si le choix n'est pas complet. La ligne de commande, elle, garde le
 * libellé du gérant (`resoudreSelection`).
 */
export function libelleAffiche(groupes: GroupeOptions[], selection: Selection | undefined, deuxPoints = " : "): string {
  const sel = selection ?? {};
  const morceaux: string[] = [];
  for (const g of groupes) {
    const c = g.choix.find((x) => x.libelle === sel[g.nom]);
    if (!c) return "";
    morceaux.push(`${g.affiche ?? g.nom}${deuxPoints}${c.affiche ?? c.libelle}`);
  }
  return morceaux.join(" · ");
}

/** Une clé stable pour une variante (deux choix identiques = la même ligne de panier). */
export function cleDeVariante(produitId: string, selection: Selection | undefined): string {
  const s = selection ?? {};
  const triee = Object.keys(s).sort().map((k) => [k, s[k]]);
  return triee.length ? `${produitId}|${JSON.stringify(triee)}` : produitId;
}
