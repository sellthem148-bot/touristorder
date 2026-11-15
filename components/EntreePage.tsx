"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Le contenu de chaque page côté client arrive en fondu : à l'ouverture du site, puis à chaque changement
 * de page. L'en-tête, le pied et le panier ne bougent pas.
 *
 * Rien n'est remonté (un `template.tsx` aurait vidé un formulaire en cours et ne rejoue pas d'un rayon à
 * l'autre) : on relance seulement l'animation. Un fondu, jamais un déplacement — un bloc déplacé décrocherait
 * ce qui reste collé à l'écran pendant qu'on fait défiler (la rangée des sous-rayons).
 */
export function EntreePage({ children }: { children: ReactNode }) {
  const chemin = usePathname();
  const bloc = useRef<HTMLDivElement>(null);
  const premier = useRef(true);

  useEffect(() => {
    // À l'ouverture, la classe posée par le serveur a déjà fait le fondu.
    if (premier.current) {
      premier.current = false;
      return;
    }
    const el = bloc.current;
    if (!el) return;
    el.classList.remove("entree-page");
    void el.offsetWidth; // le navigateur prend acte du retrait : l'animation repart de zéro
    el.classList.add("entree-page");
  }, [chemin]);

  return <div ref={bloc} className="entree-page">{children}</div>;
}
