"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

/**
 * Une rangée de liens qui défile (rayons, sous-rayons) : le lien de la page ouverte est amené dans l'écran,
 * sans faire défiler la page. `cle` : ce qui change quand la page ouverte change.
 */
export function RangeeDeLiens({ cle, className, children, ...reste }: { cle: string; className: string; children: ReactNode; "aria-label"?: string }) {
  const rangee = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = rangee.current;
    const lien = el?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!el || !lien || el.scrollWidth <= el.clientWidth) return;
    // `offsetLeft` se mesure depuis le bord gauche, en hébreu aussi : le calcul est le même dans les deux sens.
    el.scrollTo({ left: lien.offsetLeft - (el.clientWidth - lien.offsetWidth) / 2 });
  }, [cle]);
  return (
    <div ref={rangee} className={className} {...reste}>
      {children}
    </div>
  );
}

/**
 * Une rangée de tuiles qui défile de côté, comme sur Wolt ou Uber Eats. Au doigt sur téléphone ; à la souris,
 * deux flèches apparaissent au survol (elles n'existent pas pour un lecteur d'écran, qui parcourt la rangée telle quelle).
 */
export function RangeeQuiDefile({ children }: { children: ReactNode }) {
  const rangee = useRef<HTMLDivElement>(null);
  // Ce qu'il reste à faire défiler de chaque côté : une flèche ne s'affiche que s'il y a quelque chose à voir.
  const [reste, setReste] = useState({ avant: false, apres: false });
  useEffect(() => {
    const el = rangee.current;
    if (!el) return;
    const mesurer = () => {
      // En hébreu, `scrollLeft` part de zéro et devient négatif : on compte la distance parcourue.
      const parcouru = Math.abs(el.scrollLeft);
      setReste({ avant: parcouru > 4, apres: parcouru + el.clientWidth < el.scrollWidth - 4 });
    };
    mesurer();
    el.addEventListener("scroll", mesurer, { passive: true });
    window.addEventListener("resize", mesurer);
    return () => {
      el.removeEventListener("scroll", mesurer);
      window.removeEventListener("resize", mesurer);
    };
  }, []);
  const defiler = (sens: 1 | -1) => {
    const el = rangee.current;
    if (!el) return;
    // En hébreu, « suivant » est vers la gauche.
    const versLaFin = getComputedStyle(el).direction === "rtl" ? -1 : 1;
    el.scrollBy({ left: sens * versLaFin * el.clientWidth * 0.8, behavior: "smooth" });
  };
  const fleche = "absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-slate-200 bg-white text-encre opacity-0 shadow-(--shadow-flottant) transition hover:bg-slate-50 group-hover/rangee:opacity-100 lg:flex";
  return (
    <div className="group/rangee relative">
      <div ref={rangee} className="rail items-stretch gap-2.5">
        {children}
      </div>
      {reste.avant && (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => defiler(-1)} className={`${fleche} -start-4`}>
          <ChevronLeft className="h-5 w-5 rtl:rotate-180" strokeWidth={1.8} />
        </button>
      )}
      {reste.apres && (
        <button type="button" tabIndex={-1} aria-hidden="true" onClick={() => defiler(1)} className={`${fleche} -end-4`}>
          <ChevronRight className="h-5 w-5 rtl:rotate-180" strokeWidth={1.8} />
        </button>
      )}
    </div>
  );
}
