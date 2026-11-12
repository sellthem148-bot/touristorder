"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePanier } from "@/components/panier/PanierProvider";
import { useTraduction } from "@/components/LangueProvider";
import { compter, remplir } from "@/lib/langues";
import { articlesPourRecommander } from "./actions";

/** « Commander à nouveau » : remet dans le panier les articles encore disponibles d'une commande passée. */
export function BoutonRecommander({ commandeId }: { commandeId: string }) {
  const panier = usePanier();
  const router = useRouter();
  const { langue, t } = useTraduction();
  const [etat, setEtat] = useState<{ enCours: boolean; message: string }>({ enCours: false, message: "" });

  async function recommander() {
    setEtat({ enCours: true, message: "" });
    try {
      const { articles, manquants } = await articlesPourRecommander(commandeId);
      if (articles.length === 0) {
        setEtat({ enCours: false, message: t.compte.recommanderIndisponibles });
        return;
      }
      for (const { quantite, ...article } of articles) panier.ajouter(article, quantite);
      if (manquants > 0) {
        setEtat({ enCours: false, message: remplir(t.compte.recommanderPartiel, {
            ajoutes: compter(langue, articles.length, t.compte.recommanderAjoutes),
            manquants: compter(langue, manquants, t.compte.recommanderManquants),
          }) });
      }
      router.push("/panier");
    } catch {
      setEtat({ enCours: false, message: t.compte.recommanderErreur });
    }
  }

  return (
    <span className="inline-flex flex-col gap-1">
      <button type="button" onClick={recommander} disabled={etat.enCours} className="bouton py-2 text-sm">
        {etat.enCours ? t.compte.recommanderAjout : t.compte.recommander}
      </button>
      {etat.message && <span role="status" className="text-xs text-amber-800">{etat.message}</span>}
    </span>
  );
}
