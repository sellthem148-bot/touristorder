import type { CSSProperties } from "react";

/**
 * Le rang d'un élément dans une série qui arrive « en cascade » (classe `apparait` de app/globals.css) :
 * le premier part tout de suite, chaque suivant un instant après. Pur : sert au serveur comme au navigateur.
 */
export const rangDansLaCascade = (i: number) => ({ "--i": i }) as CSSProperties;
