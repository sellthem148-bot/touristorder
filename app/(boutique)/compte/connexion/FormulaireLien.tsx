"use client";

import { useActionState, useState } from "react";
import { demanderLien, type EtatConnexion } from "../actions";

export function FormulaireLien() {
  const [etat, envoyer, enCours] = useActionState<EtatConnexion, FormData>(demanderLien, {});
  const [email, setEmail] = useState("");

  if (etat.envoye) {
    return (
      <div role="status" className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        <p className="font-bold">Consultez votre boîte mail</p>
        <p className="text-sm">
          Si un espace client existe pour <strong>{email}</strong>, un lien vient de partir. Il est valable 30 minutes
          (pense aux courriers indésirables).
        </p>
      </div>
    );
  }

  return (
    <form action={envoyer} className="space-y-3" noValidate>
      <div>
        <label htmlFor="email-connexion" className="etiquette">Votre adresse e-mail</label>
        <input
          id="email-connexion"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="prenom@exemple.fr"
          className={`champ ${etat.erreur ? "champ-erreur" : ""}`}
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "email-connexion-erreur" : undefined}
        />
        {etat.erreur && <p id="email-connexion-erreur" role="alert" className="mt-1.5 text-sm font-medium text-red-700">{etat.erreur}</p>}
      </div>
      <button type="submit" className="bouton w-full" disabled={enCours}>
        {enCours ? "Envoi…" : "Recevoir mon lien"}
      </button>
    </form>
  );
}
