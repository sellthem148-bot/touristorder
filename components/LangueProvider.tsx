"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import { langueDuChemin, lienPour, type Langue } from "@/lib/langues";
import type { Dictionnaire } from "@/lib/i18n/fr";

type Traduction = {
  langue: Langue;
  t: Dictionnaire;
  /** L'adresse d'une page dans la langue du visiteur : lien("/panier") → « /he/panier ». */
  lien: (chemin: string) => string;
};

const Contexte = createContext<Traduction | null>(null);

/**
 * Donne aux composants du navigateur la langue du visiteur et ses textes (choisis par le serveur).
 * Si l'adresse affichée n'est plus dans la langue de la page (le visiteur vient de changer de langue,
 * ou revient en arrière vers une autre langue), la page est redemandée au serveur : l'en-tête, le pied
 * et les textes suivent alors l'adresse.
 */
export function LangueProvider({ langue, t, children }: { langue: Langue; t: Dictionnaire; children: React.ReactNode }) {
  const routeur = useRouter();
  const langueDeLAdresse = langueDuChemin(usePathname()).langue;
  const dejaDemande = useRef("");
  useEffect(() => {
    if (langueDeLAdresse === langue) {
      dejaDemande.current = "";
      return;
    }
    // Une seule demande par écart : jamais de boucle si le serveur répondait autre chose.
    const ecart = `${langueDeLAdresse}:${langue}`;
    if (dejaDemande.current === ecart) return;
    dejaDemande.current = ecart;
    routeur.refresh();
  }, [langueDeLAdresse, langue, routeur]);

  const valeur = useMemo<Traduction>(() => ({ langue, t, lien: (chemin: string) => lienPour(langue, chemin) }), [langue, t]);
  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useTraduction(): Traduction {
  const valeur = useContext(Contexte);
  if (!valeur) throw new Error("useTraduction doit être utilisé sous LangueProvider.");
  return valeur;
}
