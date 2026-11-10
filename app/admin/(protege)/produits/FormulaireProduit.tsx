"use client";

import { useActionState, useState } from "react";
import { enregistrerProduit, type EtatProduit } from "../actions";
import { Vignette } from "@/components/Vignette";
import { BADGES } from "@/lib/choix-commande";
import { poidsLisible, reduirePhoto } from "@/lib/reduire-photo";

type Produit = {
  id: string;
  nom: string;
  description: string;
  prix: string;
  prixAchat: string;
  prixBarre: string;
  badge: string;
  options: string;
  categorieId: string;
  boutique: string;
  lienWolt: string;
  ordre: string;
  actif: boolean;
  epuise: boolean;
  photoUrl: string;
};

type Props = {
  produit?: Produit;
  categories: { id: string; nom: string; emoji: string }[];
  boutiques: string[];
};

export function FormulaireProduit({ produit, categories, boutiques }: Props) {
  const [etat, envoyer, enCours] = useActionState<EtatProduit, FormData>(enregistrerProduit, {});
  // L'aperçu appartient à un essai : après un refus, le champ photo est vide.
  const [apercuSaisi, setApercu] = useState<{ essai: number; url: string } | null>(null);
  const apercu = apercuSaisi && apercuSaisi.essai === (etat.essai ?? 0) ? apercuSaisi.url : null;
  // La photo est allégée dans le navigateur avant l'envoi (lib/reduire-photo.ts) : on attend la fin pour enregistrer.
  const [photo, setPhoto] = useState<{ essai: number; enPreparation: boolean; note: string } | null>(null);
  const photoDeLEssai = photo && photo.essai === (etat.essai ?? 0) ? photo : null;

  async function choisirPhoto(champ: HTMLInputElement) {
    const essai = etat.essai ?? 0;
    const origine = champ.files?.[0];
    if (!origine) {
      setApercu(null);
      setPhoto(null);
      return;
    }
    setPhoto({ essai, enPreparation: true, note: "Préparation de la photo…" });
    const allegee = await reduirePhoto(origine);
    if (allegee !== origine) {
      try {
        // Remplace le fichier du champ : c'est lui que le formulaire envoie.
        const transfert = new DataTransfer();
        transfert.items.add(allegee);
        champ.files = transfert.files;
      } catch {
        // Navigateur ancien : la photo d'origine part telle quelle, le serveur la vérifie.
      }
    }
    const envoyee = champ.files?.[0] ?? origine;
    setApercu({ essai, url: URL.createObjectURL(envoyee) });
    setPhoto({
      essai,
      enPreparation: false,
      note: envoyee.size < origine.size ? `Photo allégée : ${poidsLisible(origine.size)} → ${poidsLisible(envoyee.size)}.` : "",
    });
  }

  // Après une erreur, on réaffiche ce qui avait été saisi.
  const v = (cle: keyof Produit) => etat.valeurs?.[cle] ?? String(produit?.[cle] ?? "");
  const actif = etat.valeurs ? etat.valeurs.actif === "on" : (produit?.actif ?? true);
  const epuise = etat.valeurs ? etat.valeurs.epuise === "on" : (produit?.epuise ?? false);
  const erreur = (cle: string) =>
    etat.champs?.[cle] ? <p id={`${cle}-erreur`} className="mt-1 text-sm text-red-700">{etat.champs[cle]}</p> : null;
  const attrs = (cle: string) => ({
    id: cle,
    name: cle,
    "aria-invalid": etat.champs?.[cle] ? true : undefined,
    "aria-describedby": etat.champs?.[cle] ? `${cle}-erreur` : undefined,
    className: `champ ${etat.champs?.[cle] ? "champ-erreur" : ""}`,
  });
  const emoji = categories.find((c) => c.id === v("categorieId"))?.emoji ?? "🛍️";

  return (
    // Après un refus, React vide un formulaire « non contrôlé » et une liste
    // déroulante ne retrouve pas sa valeur : on le reconstruit (key) avec ce qui avait été saisi.
    <form key={etat.essai ?? 0} action={envoyer} className="grid grid-cols-[minmax(0,1fr)] gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
      {produit && <input type="hidden" name="id" value={produit.id} />}

      <div className="carte space-y-4 p-4 sm:p-5">
        <div>
          <label htmlFor="nom" className="etiquette">Nom du produit</label>
          <input {...attrs("nom")} defaultValue={v("nom")} required placeholder="Chargeur iPhone USB-C 20W" />
          {erreur("nom")}
        </div>
        <div>
          <label htmlFor="description" className="etiquette">Description (visible par le client)</label>
          <textarea {...attrs("description")} defaultValue={v("description")} rows={3} placeholder="Marque, taille, contenance…" />
          {erreur("description")}
        </div>
        <div>
          <label htmlFor="categorieId" className="etiquette">Catégorie</label>
          <select {...attrs("categorieId")} defaultValue={v("categorieId")} required>
            <option value="">Choisir…</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.emoji} {c.nom}</option>)}
          </select>
          {erreur("categorieId")}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="prix" className="etiquette">Prix de vente (₪)</label>
            <input {...attrs("prix")} defaultValue={v("prix")} inputMode="decimal" placeholder="Vide = à définir" />
            {erreur("prix")}
          </div>
          <div>
            <label htmlFor="prixBarre" className="etiquette">Ancien prix barré (₪)</label>
            <input {...attrs("prixBarre")} defaultValue={v("prixBarre")} inputMode="decimal" placeholder="Facultatif" />
            {erreur("prixBarre")}
          </div>
          <div>
            <label htmlFor="ordre" className="etiquette">Ordre d&apos;affichage</label>
            <input {...attrs("ordre")} defaultValue={v("ordre") || "0"} inputMode="numeric" />
            {erreur("ordre")}
          </div>
        </div>
        <div>
          <label htmlFor="badge" className="etiquette">Badge</label>
          <select {...attrs("badge")} defaultValue={v("badge")}>
            <option value="">Aucun</option>
            {Object.entries(BADGES).map(([cle, b]) => <option key={cle} value={cle}>{b.libelle}</option>)}
          </select>
          <p className="mt-1 text-xs text-slate-500">« Populaire » et « Promo » apparaissent dans « Les plus demandés » en haut de l&apos;accueil.</p>
          {erreur("badge")}
        </div>
        <div>
          <label htmlFor="options" className="etiquette">Options au choix du client (facultatif)</label>
          <textarea
            {...attrs("options")}
            defaultValue={v("options")}
            rows={3}
            className={`champ font-mono text-sm ${etat.champs?.options ? "champ-erreur" : ""}`}
            placeholder={"Taille : 2 ans | 4 ans | 6 ans | 8 ans\nCouleur : Bleu | Rose | Vert +5"}
          />
          {erreur("options")}
          <p className="mt-1 text-xs text-slate-500">
            Une option par ligne : <code>Nom : choix 1 | choix 2</code>. « +5 » après un choix = 5 ₪ de plus. Le client doit choisir une valeur par option.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-2">
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" name="actif" defaultChecked={actif} className="h-5 w-5 accent-marque" />
            En ligne (visible dans le catalogue)
          </label>
          <label className="flex items-center gap-2 font-medium">
            <input type="checkbox" name="epuise" defaultChecked={epuise} className="h-5 w-5 accent-marque" />
            Épuisé (visible mais pas commandable)
          </label>
        </div>
      </div>

      <div className="space-y-5">
        <div className="carte space-y-3 p-4">
          <p className="etiquette">Photo</p>
          <Vignette url={apercu ?? produit?.photoUrl ?? ""} emoji={emoji} alt="" className="aspect-square w-full rounded-xl border border-slate-200" />
          <label htmlFor="photo" className="sr-only">Choisir une photo</label>
          <input
            id="photo"
            name="photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block w-full text-sm"
            onChange={(e) => void choisirPhoto(e.currentTarget)}
          />
          {erreur("photo")}
          <p className="text-xs text-slate-500" aria-live="polite">
            {photoDeLEssai?.note || "JPEG, PNG ou WebP. La photo est allégée toute seule avant l'envoi."}
          </p>
          {produit?.photoUrl && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="retirerPhoto" /> Retirer la photo actuelle
            </label>
          )}
        </div>

        <div className="carte space-y-3 border-amber-200 bg-amber-50/50 p-4">
          <p className="text-sm font-bold text-amber-900">🔒 Visible par toi seul</p>
          <div>
            <label htmlFor="prixAchat" className="etiquette">Prix d&apos;achat sur Wolt (₪)</label>
            <input {...attrs("prixAchat")} defaultValue={v("prixAchat")} inputMode="decimal" placeholder="39,90" />
            {erreur("prixAchat")}
          </div>
          <div>
            <label htmlFor="boutique" className="etiquette">Boutique où le commander</label>
            <input {...attrs("boutique")} defaultValue={v("boutique")} list="boutiques" placeholder="Wolt Market Dizengoff" />
            <datalist id="boutiques">
              {boutiques.map((b) => <option key={b} value={b} />)}
            </datalist>
            {erreur("boutique")}
          </div>
          <div>
            <label htmlFor="lienWolt" className="etiquette">Lien Wolt du produit</label>
            <input {...attrs("lienWolt")} defaultValue={v("lienWolt")} type="url" placeholder="https://wolt.com/…" />
            {erreur("lienWolt")}
          </div>
        </div>

        {etat.erreur && <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{etat.erreur}</p>}
        {etat.erreur && apercuSaisi && !apercu && (
          <p className="text-xs text-slate-600">Resélectionne la photo avant d&apos;enregistrer à nouveau.</p>
        )}
        <button type="submit" className="bouton w-full py-3" disabled={enCours || !!photoDeLEssai?.enPreparation}>
          {enCours ? "Enregistrement…" : photoDeLEssai?.enPreparation ? "Préparation de la photo…" : produit ? "Enregistrer" : "Ajouter le produit"}
        </button>
      </div>
    </form>
  );
}
