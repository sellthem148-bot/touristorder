/* eslint-disable @next/next/no-img-element -- photo repère servie par une route réservée au gérant */
"use client";

import { useState } from "react";
import { Copy, Search } from "lucide-react";

type Props = {
  /** Le nom de l'article en français, pour les lecteurs d'écran. */
  nom: string;
  hebreu: string;
  exact: boolean;
  images: string;
  /** La photo que Wolt montre pour l'article (captures du gérant) ; absente si on ne l'a pas. */
  photo?: string | null;
};

/**
 * Sous un article de la liste de courses : son nom en hébreu (à copier dans la recherche de Wolt) et
 * un lien pour le voir en images. « traduction » prévient que ce n'est pas le nom exact relevé sur Wolt.
 * Quand on l'a, la photo que Wolt montre pour l'article : un toucher l'ouvre en grand.
 */
export function RepereWolt({ nom, hebreu, exact, images, photo }: Props) {
  const [copie, setCopie] = useState<"" | "ok" | "echec">("");
  return (
    <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
      {photo && (
        <a href={photo} target="_blank" rel="noopener noreferrer" aria-label={`Voir la photo Wolt de ${nom}`} className="shrink-0">
          <img src={photo} alt="" width={96} height={53} loading="lazy" className="h-[53px] w-24 rounded-lg border border-slate-200 bg-white object-contain" />
        </a>
      )}
      {hebreu && (
        <>
          <span dir="rtl" lang="he" className="text-sm text-slate-800">{hebreu}</span>
          {!exact && <span>traduction</span>}
          <button
            type="button"
            aria-label={`Copier le nom en hébreu de ${nom}`}
            className="inline-flex items-center gap-1 font-semibold text-marque hover:underline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(hebreu);
                setCopie("ok");
              } catch {
                setCopie("echec");
              }
              window.setTimeout(() => setCopie(""), 2000);
            }}
          >
            <Copy className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />
            {copie === "ok" ? "Copié" : copie === "echec" ? "Copie impossible" : "Copier"}
          </button>
        </>
      )}
      <a
        href={images}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Voir ${nom} en images`}
        className="inline-flex items-center gap-1 font-semibold text-marque hover:underline"
      >
        <Search className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> Images
      </a>
    </span>
  );
}
