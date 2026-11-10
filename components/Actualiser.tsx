"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Relit la page à intervalles réguliers (onglet visible seulement).
 * À ne mettre que sur une page SANS formulaire en cours de saisie :
 * une relecture remet les champs non enregistrés à zéro.
 */
export function Actualiser({ secondes }: { secondes: number }) {
  const router = useRouter();
  useEffect(() => {
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, secondes * 1000);
    return () => window.clearInterval(id);
  }, [router, secondes]);
  return null;
}
