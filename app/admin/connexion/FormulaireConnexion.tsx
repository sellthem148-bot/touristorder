"use client";

import { useActionState } from "react";
import { seConnecter } from "../session-actions";

export function FormulaireConnexion() {
  const [etat, envoyer, enCours] = useActionState(seConnecter, {});
  return (
    <form action={envoyer} className="space-y-3">
      <div>
        <label htmlFor="motDePasse" className="etiquette">Mot de passe</label>
        <input id="motDePasse" name="motDePasse" type="password" autoComplete="current-password" required className="champ" />
      </div>
      {etat.erreur && <p role="alert" className="text-sm text-red-700">{etat.erreur}</p>}
      <button type="submit" className="bouton w-full" disabled={enCours}>
        {enCours ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
