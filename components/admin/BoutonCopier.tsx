"use client";

import { useState } from "react";

export function BoutonCopier({ texte, libelle = "Copier la liste" }: { texte: string; libelle?: string }) {
  const [copie, setCopie] = useState<"" | "ok" | "echec">("");
  return (
    <button
      type="button"
      className="bouton-secondaire px-3 py-1.5 text-sm"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texte);
          setCopie("ok");
        } catch {
          setCopie("echec");
        }
        window.setTimeout(() => setCopie(""), 2000);
      }}
    >
      {copie === "ok" ? "Copié ✓" : copie === "echec" ? "Copie impossible" : libelle}
    </button>
  );
}
