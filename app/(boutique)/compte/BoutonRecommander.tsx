"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePanier } from "@/components/panier/PanierProvider";
import { articlesPourRecommander } from "./actions";

/** « Commander à nouveau » : remet dans le panier les articles encore disponibles d'une commande passée. */
export function BoutonRecommander({ commandeId }: { commandeId: string }) {
  const panier = usePanier();
  const router = useRouter();
  const [etat, setEtat] = useState<{ enCours: boolean; message: string }>({ enCours: false, message: "" });

  async function recommander() {
    setEtat({ enCours: true, message: "" });
    try {
      const { articles, manquants } = await articlesPourRecommander(commandeId);
      if (articles.length === 0) {
        setEtat({ enCours: false, message: "Ces articles ne sont plus disponibles." });
        return;
      }
      for (const { quantite, ...article } of articles) panier.ajouter(article, quantite);
      if (manquants > 0) {
        setEtat({ enCours: false, message: `${articles.length} article${articles.length > 1 ? "s" : ""} ajouté${articles.length > 1 ? "s" : ""} ; ${manquants} n'${manquants > 1 ? "étaient" : "était"} plus disponible${manquants > 1 ? "s" : ""}.` });
      }
      router.push("/panier");
    } catch {
      setEtat({ enCours: false, message: "Impossible pour le moment. Vérifiez votre connexion et réessayez." });
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={recommander} disabled={etat.enCours} className="bouton py-2 text-sm">
        {etat.enCours ? "Ajout…" : "Commander à nouveau"}
      </button>
      {etat.message && <span role="status" className="text-xs text-amber-800">{etat.message}</span>}
    </span>
  );
}
