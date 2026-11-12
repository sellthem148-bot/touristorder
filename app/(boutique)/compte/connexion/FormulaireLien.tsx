"use client";

import { useActionState, useState } from "react";
import { useTraduction } from "@/components/LangueProvider";
import { remplir } from "@/lib/langues";
import { demanderLien, type EtatConnexion } from "../actions";

export function FormulaireLien() {
  const [etat, envoyer, enCours] = useActionState<EtatConnexion, FormData>(demanderLien, {});
  const [email, setEmail] = useState("");
  const { t } = useTraduction();
  // « … pour {email}, un lien vient de partir… » : l'adresse est affichée en gras, au milieu de la phrase.
  const [avant, apres = ""] = remplir(t.connexion.envoye, { minutes: 30 }).split("{email}");

  if (etat.envoye) {
    return (
      <div role="status" className="space-y-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        <p className="font-bold">{t.connexion.consultez}</p>
        <p className="text-sm">
          {avant}<strong><bdi dir="ltr">{email}</bdi></strong>{apres}
        </p>
      </div>
    );
  }

  return (
    <form action={envoyer} className="space-y-3" noValidate>
      <div>
        <label htmlFor="email-connexion" className="etiquette">{t.connexion.email}</label>
        <input
          id="email-connexion"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.panier.emailPlaceholder}
          dir="ltr"
          className={`champ rtl:text-right ${etat.erreur ? "champ-erreur" : ""}`}
          aria-invalid={etat.erreur ? true : undefined}
          aria-describedby={etat.erreur ? "email-connexion-erreur" : undefined}
        />
        {etat.erreur && <p id="email-connexion-erreur" role="alert" className="mt-1.5 text-sm font-medium text-red-700">{etat.erreur}</p>}
      </div>
      <button type="submit" className="bouton w-full" disabled={enCours}>
        {enCours ? t.connexion.envoi : t.connexion.recevoir}
      </button>
    </form>
  );
}
