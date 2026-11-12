"use client";

import { useActionState, useState } from "react";
import { useTraduction } from "@/components/LangueProvider";
import { enregistrerProfil, type EtatProfil } from "./actions";

type Props = {
  client: { nom: string; telephone: string; ville: string; adresse: string; etage: string; appartement: string; codeEntree: string };
  villes: { nom: string; affiche: string }[]; // `affiche` : le nom de la ville dans la langue du client
};

export function FormulaireProfil({ client, villes }: Props) {
  const { t } = useTraduction();
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
          <label htmlFor="profil-nom" className="etiquette">{t.compte.profilNom}</label>
          <input {...champ("nom")} autoComplete="name" />
          {erreur("nom")}
        </div>
        <div>
          <label htmlFor="profil-telephone" className="etiquette">{t.compte.profilTelephone}</label>
          <input {...champ("telephone")} dir="ltr" type="tel" autoComplete="tel" placeholder={t.panier.telephonePlaceholder} className={`${champ("telephone").className} rtl:text-right`} />
          {erreur("telephone")}
        </div>
      </div>
      <div>
        <label htmlFor="profil-ville" className="etiquette">{t.panier.ville}</label>
        <select {...champ("ville")}>
          <option value="">{t.panier.choisir}</option>
          {villes.map((x) => <option key={x.nom} value={x.nom}>{x.affiche}</option>)}
        </select>
        {erreur("ville")}
      </div>
      <div>
        <label htmlFor="profil-adresse" className="etiquette">{t.compte.profilAdresse}</label>
        <input {...champ("adresse")} autoComplete="address-line1" maxLength={200} placeholder={t.compte.profilAdressePlaceholder} />
        {erreur("adresse")}
      </div>
      <div className="grid grid-cols-2 items-end gap-4">
        <div>
          <label htmlFor="profil-etage" className="etiquette">{t.panier.etage}</label>
          <input {...champ("etage")} autoComplete="off" maxLength={20} placeholder={t.panier.etagePlaceholder} />
        </div>
        <div>
          <label htmlFor="profil-appartement" className="etiquette">{t.panier.appartement}</label>
          <input {...champ("appartement")} autoComplete="address-line2" maxLength={20} placeholder={t.panier.appartementPlaceholder} />
        </div>
      </div>
      {erreur("etage")}
      {erreur("appartement")}
      <div>
        <label htmlFor="profil-codeEntree" className="etiquette">{t.panier.codeEntree}</label>
        <input {...champ("codeEntree")} autoComplete="off" maxLength={40} placeholder={t.panier.codeEntreePlaceholder} />
        {erreur("codeEntree")}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="bouton" disabled={enCours}>{enCours ? t.compte.enregistrement : t.compte.enregistrer}</button>
        {etat.ok && !modifie && <span role="status" className="text-sm font-semibold text-emerald-700">{t.compte.enregistre}</span>}
        {etat.erreur && <span role="alert" className="text-sm font-semibold text-red-700">{etat.erreur}</span>}
      </div>
    </form>
  );
}
