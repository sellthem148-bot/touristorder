"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Un bloc qui monte en fondu quand il arrive à l'écran (une rangée de l'accueil, un sous-rayon…).
 *
 * Le contenu n'est JAMAIS caché d'avance : la page arrive entière, lisible sans JavaScript et par les moteurs
 * de recherche. Une fois affichée, seul un bloc qui est ENCORE sous l'écran est mis en attente (`a-venir`),
 * puis animé (`arrive`) dès qu'il y entre. Un bloc déjà visible n'est pas touché, et rien n'est mis en
 * attente pour qui a demandé moins d'animations à son appareil.
 */
export function Apparition({ children, className = "" }: { children: ReactNode; className?: string }) {
  const bloc = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<"" | "attend" | "vu">("");

  useEffect(() => {
    const el = bloc.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Déjà à l'écran (même en partie) : on ne le fait pas disparaître sous les yeux du visiteur.
    if (el.getBoundingClientRect().top < window.innerHeight) return;
    setEtat("attend");
    const observateur = new IntersectionObserver(
      ([entree]) => {
        if (!entree.isIntersecting) return;
        setEtat("vu");
        observateur.disconnect();
      },
      // Un peu après le bord bas de l'écran : le mouvement se voit.
      { rootMargin: "0px 0px -6% 0px" },
    );
    observateur.observe(el);
    return () => observateur.disconnect();
  }, []);

  return (
    <div ref={bloc} className={`${className} ${etat === "attend" ? "a-venir" : etat === "vu" ? "arrive" : ""}`.trim()}>
      {children}
    </div>
  );
}
