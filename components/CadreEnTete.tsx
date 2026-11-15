"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Le cadre de l'en-tête du site. Il « respire » (règles `header.entete` de app/globals.css) : en haut de
 * page il prend ses aises — le nom du site à côté du logo, la recherche sur toute la largeur sur téléphone,
 * plus de hauteur sur ordinateur ; dès qu'on fait défiler, il se resserre en une rangée et prend une ombre.
 *
 * Il est FIXE, avec sa place réservée dans la page (`entete-place`, de la hauteur de l'en-tête au large) :
 * sa hauteur peut donc changer sans jamais décaler la page sous le doigt. L'état est aussi posé sur
 * `<html>` (`data-defile`) : ce qui reste collé sous l'en-tête se cale sur `--entete-haut`, sa hauteur du moment.
 */
export function CadreEnTete({ children }: { children: ReactNode }) {
  const cadre = useRef<HTMLElement>(null);
  const [defile, setDefile] = useState(false);

  useEffect(() => {
    // Deux seuils : resserré au-delà de 24 px, de nouveau au large tout en haut — pas d'hésitation entre les deux.
    const lire = () => setDefile((d) => (d ? window.scrollY > 6 : window.scrollY > 24));
    lire();
    window.addEventListener("scroll", lire, { passive: true });
    return () => window.removeEventListener("scroll", lire);
  }, []);

  useEffect(() => {
    const racine = document.documentElement;
    racine.dataset.defile = defile ? "oui" : "non";
    return () => {
      delete racine.dataset.defile;
    };
  }, [defile]);

  useEffect(() => {
    // Sur téléphone, la recherche resserrée va du logo aux boutons de droite : leur largeur change avec le
    // compteur du panier, on la donne à la feuille de style (`--icones`).
    const el = cadre.current;
    const boutons = el?.querySelector("[data-entete-boutons]");
    if (!el || !boutons || typeof ResizeObserver === "undefined") return;
    const mesurer = () => el.style.setProperty("--icones", `${Math.ceil(boutons.getBoundingClientRect().width)}px`);
    mesurer();
    const observateur = new ResizeObserver(mesurer);
    observateur.observe(boutons);
    return () => observateur.disconnect();
  }, []);

  useEffect(() => {
    // Le logo s'est levé (son animation d'ouverture est finie) : elle ne rejouera pas après un chargement de page.
    const id = window.setTimeout(() => document.documentElement.setAttribute("data-logo-leve", ""), 1800);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <>
      <header ref={cadre} data-defile={defile ? "oui" : "non"} className="entete fixed inset-x-0 top-0 z-20 border-b border-slate-200 bg-[white] nuit:border-white/10 nuit:bg-encre">
        {children}
      </header>
      {/* La place de l'en-tête dans la page (il est fixe, donc hors de la page). */}
      <div aria-hidden="true" className="entete-place" />
    </>
  );
}
