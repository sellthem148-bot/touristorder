"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Une fine barre en haut de l'écran pendant qu'une page se charge : le site répond tout de suite au toucher
 * d'un lien, même quand la page met un instant à arriver. Elle part au toucher d'un lien du site (ou à
 * l'envoi de la recherche), avance de moins en moins vite, puis va au bout et s'efface quand la page est là.
 *
 * Purement décorative (`aria-hidden`, ne reçoit aucun toucher) : si une page n'arrive jamais, elle se retire
 * d'elle-même. À placer dans un `<Suspense>` (elle lit les paramètres de l'adresse).
 */
export function BarreDeNavigation() {
  const chemin = usePathname();
  const parametres = useSearchParams().toString();
  // L'adresse affichée. La barre note celle d'où elle est partie : dès qu'elle a changé, la page est arrivée.
  const adresse = `${chemin}?${parametres}`;
  const adresseActuelle = useRef(adresse);
  const [course, setCourse] = useState<{ depuis: string; lancee: boolean } | null>(null);
  const arrivee = course !== null && course.depuis !== adresse;
  const etat = course === null ? "repos" : arrivee ? "fin" : course.lancee ? "charge" : "depart";

  useEffect(() => {
    adresseActuelle.current = adresse;
  }, [adresse]);

  useEffect(() => {
    const partir = () => setCourse({ depuis: adresseActuelle.current, lancee: false });
    const auClic = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(a instanceof HTMLAnchorElement) || (a.target && a.target !== "_self") || a.hasAttribute("download")) return;
      const cible = new URL(a.href, window.location.href);
      if (cible.origin !== window.location.origin) return; // WhatsApp, e-mail, paiement : on quitte le site
      if (cible.pathname === window.location.pathname && cible.search === window.location.search) return; // la même page, ou une ancre
      partir();
    };
    const aLEnvoi = (e: SubmitEvent) => {
      // La recherche de l'en-tête (formulaire « get ») ; les autres formulaires ne changent pas de page ainsi.
      if (e.target instanceof HTMLFormElement && e.target.getAttribute("method")?.toLowerCase() === "get") partir();
    };
    // En phase de capture : avant que le lien ne prenne lui-même le toucher en charge.
    document.addEventListener("click", auClic, true);
    document.addEventListener("submit", aLEnvoi, true);
    return () => {
      document.removeEventListener("click", auClic, true);
      document.removeEventListener("submit", aLEnvoi, true);
    };
  }, []);

  // Posée à zéro, puis lancée deux images plus tard : le navigateur a vu le point de départ.
  useEffect(() => {
    if (etat !== "depart") return;
    let suivante = 0;
    const premiere = requestAnimationFrame(() => {
      suivante = requestAnimationFrame(() => setCourse((c) => c && { ...c, lancee: true }));
    });
    return () => {
      cancelAnimationFrame(premiere);
      cancelAnimationFrame(suivante);
    };
  }, [etat]);

  // Elle se retire : une demi-seconde après l'arrivée de la page, ou d'elle-même si la page n'arrive
  // jamais (réseau coupé, lien sans suite).
  useEffect(() => {
    if (!course) return;
    const id = window.setTimeout(() => setCourse(null), arrivee ? 500 : 12000);
    return () => window.clearTimeout(id);
  }, [course, arrivee]);

  if (etat === "repos") return null;
  const allure =
    etat === "depart"
      ? "w-0"
      : etat === "charge"
        ? "w-[88%] transition-[width] duration-[7s] ease-[cubic-bezier(0.05,0.85,0.1,1)]"
        : "w-full opacity-0 transition-[width,opacity] duration-300 [transition-delay:0s,150ms]";
  // `start-0` : elle part du côté où la lecture commence (à droite en hébreu).
  return <div aria-hidden="true" data-barre-navigation={etat} className={`pointer-events-none fixed start-0 top-0 z-50 h-[3px] rounded-e-full bg-marque ${allure}`} />;
}
