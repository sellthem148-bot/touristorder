"use client";

import { createContext, useContext } from "react";
import type { Langue } from "@/lib/langues";
import type { Dictionnaire } from "@/lib/i18n/fr";

type Traduction = { langue: Langue; t: Dictionnaire };

const Contexte = createContext<Traduction | null>(null);

/** Donne aux composants du navigateur la langue du visiteur et ses textes (choisis par le serveur). */
export function LangueProvider({ langue, t, children }: Traduction & { children: React.ReactNode }) {
  return <Contexte.Provider value={{ langue, t }}>{children}</Contexte.Provider>;
}

export function useTraduction(): Traduction {
  const valeur = useContext(Contexte);
  if (!valeur) throw new Error("useTraduction doit être utilisé sous LangueProvider.");
  return valeur;
}
