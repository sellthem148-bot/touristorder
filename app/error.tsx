"use client";

import { useEffect } from "react";

// Une panne (base injoignable, erreur inattendue) : une page à nous, jamais l'écran d'erreur brut.
export default function Erreur({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="surtitre">Erreur</p>
      <h1 className="text-2xl font-bold">Petit souci de notre côté</h1>
      <p className="text-slate-600">Le site ne répond pas comme il devrait. Réessayez dans un instant : votre panier est gardé sur votre téléphone.</p>
      <button type="button" onClick={() => retry()} className="bouton px-6 py-3">Réessayer</button>
    </main>
  );
}
