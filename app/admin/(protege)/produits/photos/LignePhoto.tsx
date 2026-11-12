/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

import { useRef, useState } from "react";
import { Camera, Check, ImageOff, Search } from "lucide-react";
import { reduirePhoto } from "@/lib/reduire-photo";
import { rechercheDImage } from "@/lib/recherche-image";
import { enregistrerPhotoRapide } from "../../actions";

type Props = { id: string; nom: string; nomWolt: string; detail: string; photoUrl: string };

/** Un article et son bouton photo : la photo choisie est allégée puis enregistrée aussitôt. */
export function LignePhoto({ id, nom, nomWolt, detail, photoUrl }: Props) {
  const champ = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState(photoUrl);
  const [etat, setEtat] = useState<{ enCours: boolean; message: string; erreur: boolean }>({ enCours: false, message: "", erreur: false });

  async function envoyer(fichier: File | undefined) {
    if (!fichier) return;
    setEtat({ enCours: true, message: "Envoi de la photo…", erreur: false });
    try {
      const form = new FormData();
      form.set("id", id);
      form.set("photo", await reduirePhoto(fichier));
      const resultat = await enregistrerPhotoRapide(form);
      if (resultat.url) {
        setPhoto(resultat.url);
        setEtat({ enCours: false, message: "Photo enregistrée.", erreur: false });
      } else {
        setEtat({ enCours: false, message: resultat.erreur ?? "La photo n'a pas pu être enregistrée.", erreur: true });
      }
    } catch {
      setEtat({ enCours: false, message: "Envoi impossible : vérifie ta connexion et réessaie.", erreur: true });
    }
    if (champ.current) champ.current.value = "";
  }

  return (
    <li className="flex items-center gap-3 p-3">
      {photo ? (
        <img src={photo} alt="" className="h-14 w-14 shrink-0 rounded-xl border border-slate-200 bg-white object-contain" />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400">
          <ImageOff className="h-5 w-5" strokeWidth={1.6} aria-hidden="true" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-snug">{nom}</p>
        <p className="truncate text-xs text-slate-500">{detail}</p>
        {nomWolt && <p dir="auto" lang="he" className="truncate text-xs text-slate-500">{nomWolt}</p>}
        <a
          href={rechercheDImage(nom, nomWolt)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Chercher une image de ${nom}`}
          className="mt-0.5 inline-flex items-center gap-1 text-xs font-semibold text-marque hover:underline"
        >
          <Search className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> Chercher une image
        </a>
        {etat.message && (
          <p role={etat.erreur ? "alert" : "status"} className={`mt-0.5 flex items-center gap-1 text-xs font-semibold ${etat.erreur ? "text-red-700" : "text-emerald-700"}`}>
            {!etat.erreur && !etat.enCours && <Check className="h-3.5 w-3.5" strokeWidth={2.2} aria-hidden="true" />}
            {etat.message}
          </p>
        )}
      </div>
      <input
        ref={champ}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-label={`Photo de ${nom}`}
        onChange={(e) => envoyer(e.target.files?.[0])}
      />
      <button type="button" className="bouton-secondaire shrink-0 px-3 py-2 text-sm" disabled={etat.enCours} onClick={() => champ.current?.click()}>
        <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
        {photo ? "Changer" : "Ajouter"}
      </button>
    </li>
  );
}
