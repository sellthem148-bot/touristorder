"use client";

import { useEffect, useRef } from "react";
import { usePanier } from "@/components/panier/PanierProvider";
import { memoriserJeton } from "@/components/MesCommandesLocales";

/**
 * Garde le lien dans « Mes commandes » et, juste après la commande (`vider`),
 * vide le panier. Rouvrir une ancienne commande ne touche pas au panier en cours.
 */
export function ViderPanier({ jeton, vider: doitVider }: { jeton: string; vider: boolean }) {
  const { pret, vider } = usePanier();
  // Une seule fois : un article ajouté ensuite (autre onglet) n'est pas effacé.
  const fait = useRef(false);
  useEffect(() => {
    memoriserJeton(jeton);
  }, [jeton]);
  useEffect(() => {
    if (!doitVider || !pret || fait.current) return;
    fait.current = true;
    vider();
  }, [doitVider, pret, vider]);
  return null;
}
