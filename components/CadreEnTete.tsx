"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Le cadre de l'en-tête du site : collé en haut de l'écran, il prend une ombre légère dès qu'on fait
 * défiler la page (règle `header[data-defile]` de app/globals.css) — on sent que la page passe dessous.
 */
export function CadreEnTete({ children }: { children: ReactNode }) {
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    const lire = () => setDefile(window.scrollY > 4);
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    return () => window.removeEventListener("scroll", lire);
  }, []);

  return (
    <header data-defile={defile ? "oui" : "non"} className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      {children}
    </header>
  );
}
