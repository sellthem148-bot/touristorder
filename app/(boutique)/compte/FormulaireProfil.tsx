"use client";

import { useActionState, useState } from "react";
import { enregistrerProfil, type EtatProfil } from "./actions";

type Props = {
  client: { nom: string; telephone: string; ville: string; adresse: string };
  villes: string[];
};

export function FormulaireProfil({ client, villes }: Props) {
  const [etat, envoyer, enCours] = useActionState<EtatProfil, FormData>(enregistrerProfil, {});
  // Champs contrôlés : React vide un formulaire non contrôlé après l'action.
  const [v, setV] = useState(client);
  const [modifie, setModifie] = useState(false);
  const champ = (nom: keyof typeof v) => ({
    id: `profil-${nom}`,
    name: nom,
    value: v[nom],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setV((x) => ({ ...x, [nom]: e.target.value }));
      setModifie(true);
    },
    "aria-invalid": etat.champs?.[nom] ? true : undefined,
    className: `champ ${etat.champs?.[nom] ? "champ-erreur" : ""}`,
  });
  const erreur = (nom: string) => (etat.champs?.[nom] ? <p className="mt-1.5 text-sm font-medium text-red-700">{etat.champs[nom]}</p> : null);

  return (
    <form
      action={(f) => {
        setModifie(false);
        envoyer(f);
      }}
      className="grid gap-4"
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="profil-nom" className="etiquette">Nom</label>
          <input {...champ("nom")} autoComplete="name" />
          {erreur("nom")}
        </div>
        <div>
          <label htmlFor="profil-telephone" className="etiquette">Numéro WhatsApp</label>
          <input {...champ("telephone")} type="tel" autoComplete="tel" />
          {erreur("telephone")}
        </div>
      </div>
      <div>
        <label htmlFor="profil-ville" className="etiquette">Ville</label>
        <select {...champ("ville")}>
          <option value="">Choisir…</option>
          {villes.map((x) => <option key={x} value={x}>{x}</option>)}
        </select>
        {erreur("ville")}
      </div>
      <div>
        <label htmlFor="profil-adresse" className="etiquette">Adresse ou logement habituel</label>
        <textarea {...champ("adresse")} rows={2} autoComplete="street-address" placeholder="Résidence, appartement, étage…" />
        {erreur("adresse")}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="bouton" disabled={enCours}>{enCours ? "Enregistrement…" : "Enregistrer"}</button>
        {etat.ok && !modifie && <span role="status" className="text-sm font-semibold text-emerald-700">Enregistré : votre prochaine commande sera pré-remplie.</span>}
        {etat.erreur && <span role="alert" className="text-sm font-semibold text-red-700">{etat.erreur}</span>}
      </div>
    </form>
  );
}
