"use client";

/** Ouvre l'impression du navigateur (« Enregistrer en PDF » y est proposé). */
export function BoutonImprimer({ libelle = "Imprimer ou enregistrer en PDF" }: { libelle?: string }) {
  return (
    <button type="button" className="bouton" onClick={() => window.print()}>
      {libelle}
    </button>
  );
}
