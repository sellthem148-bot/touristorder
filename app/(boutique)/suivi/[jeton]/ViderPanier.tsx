"use client";

import { useEffect } from "react";
import { usePanier } from "@/components/panier/PanierProvider";

/** Vide le panier une fois la commande enregistrée. */
export function ViderPanier() {
  const { pret, nombre, vider } = usePanier();
  useEffect(() => {
    if (pret && nombre > 0) vider();
  }, [pret, nombre, vider]);
  return null;
}
