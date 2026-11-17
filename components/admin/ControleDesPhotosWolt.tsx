"use client";

import { useEffect, useState } from "react";

type Etat = { reponse: string; affichees: number; enEchec: number; total: number };

/**
 * Une ligne de contrôle en tête de « Photos rapides » : les photos de Wolt arrivent-elles sur CET appareil ?
 * Le gérant a dit ne pas les voir (17 novembre 2026) alors que le serveur les a toutes et les sert à qui est
 * connecté : ce qui se passe dans son navigateur ne se voit que d'ici. La ligne redemande une photo au site et
 * dit ce qu'il répond (« 200 image/jpeg », un renvoi vers la connexion, une erreur), puis compte les photos de
 * la page qui se sont affichées et celles qui ont échoué. Discrète quand tout va bien, rouge sinon — une capture
 * d'écran suffit alors à trouver la panne.
 */
export function ControleDesPhotosWolt({ exemple }: { exemple: string | null }) {
  const [etat, setEtat] = useState<Etat | null>(null);

  useEffect(() => {
    if (!exemple) return;
    let fini = false;
    let reponse = "en attente";
    const compter = () => {
      if (fini) return;
      const images = Array.from(document.querySelectorAll<HTMLImageElement>("[data-photo-wolt] img"));
      setEtat({
        reponse,
        affichees: images.filter((i) => i.complete && i.naturalWidth > 0).length,
        enEchec: images.filter((i) => i.complete && i.naturalWidth === 0).length,
        total: images.length,
      });
    };
    // `redirect: "manual"` : un renvoi vers la page de connexion se voit comme tel, au lieu d'être suivi.
    fetch(exemple, { credentials: "same-origin", cache: "no-store", redirect: "manual" })
      .then((r) => {
        reponse = r.type === "opaqueredirect" ? "renvoi vers la connexion" : `${r.status} ${r.headers.get("content-type") ?? ""}`.trim();
      })
      .catch((e: unknown) => {
        reponse = `aucune réponse (${e instanceof Error ? e.name : "erreur"})`;
      })
      .finally(compter);
    const minuterie = window.setInterval(compter, 2000);
    return () => {
      fini = true;
      window.clearInterval(minuterie);
    };
  }, [exemple]);

  if (!exemple || !etat) return null;
  const probleme = etat.enEchec > 0 || (etat.reponse !== "en attente" && !etat.reponse.startsWith("200 image/"));
  return (
    <p
      role="status"
      data-controle-photos={probleme ? "probleme" : "ok"}
      className={`rounded-xl border px-3 py-2 text-xs ${probleme ? "border-red-300 bg-red-50 font-semibold text-red-800" : "border-slate-200 bg-white text-slate-500"}`}
    >
      Contrôle des photos de Wolt — réponse du site : « {etat.reponse} » · {etat.affichees} affichée(s), {etat.enEchec} en échec, sur {etat.total}.
      {probleme && " Les photos ne se chargent pas sur cet appareil : envoie une capture de cette ligne."}
    </p>
  );
}
