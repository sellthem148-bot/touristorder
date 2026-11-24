/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

import { useEffect, useEffectEvent, useRef, useState, useSyncExternalStore, type DragEvent } from "react";
import { Camera, Check, ClipboardPaste, ImageOff, Search } from "lucide-react";
import { avisDeTaille, dimensionsDe, empreinteDe, imageDuPressePapiers, imageDuTransfert } from "@/lib/coller-image";
import { PhotoWolt } from "@/components/admin/PhotoWolt";
import { reduirePhoto } from "@/lib/reduire-photo";
import { rechercheDImage } from "@/lib/recherche-image";
import { enregistrerPhotoRapide } from "../../actions";
import { abonner, derniereImageCollee, ligneVisee, noterImageCollee, viser } from "./cible";

/** `photoWolt` : la photo que Wolt montre pour l'article (captures du gérant), pour savoir quoi chercher. */
type Props = { id: string; nom: string; nomWolt: string; detail: string; photoUrl: string; photoWolt?: string | null };

/**
 * Un article et ses boutons photo : la photo choisie est allégée puis enregistrée aussitôt.
 *
 * Le plus rapide (demande du gérant, 15 novembre 2026 : « il y a encore trop de produits sans images ») :
 * « Chercher une image » ouvre la recherche dans un autre onglet ; il y copie l'image, revient, et la COLLE —
 * bouton « Coller », Ctrl + V, ou l'image glissée sur la ligne. La ligne touchée en dernier est celle qui
 * reçoit le collage (`cible.ts`) : elle est entourée, pour qu'on voie où l'image va tomber.
 *
 * La photo de Wolt passe en premier, en grand (`PhotoWolt`) : c'est elle qui dit quel article chercher. La
 * photo du site, celle que voit le client, s'affiche près des boutons une fois posée.
 */
export function LignePhoto({ id, nom, nomWolt, detail, photoUrl, photoWolt }: Props) {
  const champ = useRef<HTMLInputElement>(null);
  // Une image identique à la précédente, déjà signalée sur cette ligne : la recoller, c'est la confirmer.
  const signalee = useRef<string | null>(null);
  const [photo, setPhoto] = useState(photoUrl);
  const [survol, setSurvol] = useState(false);
  const [etat, setEtat] = useState<{ enCours: boolean; message: string; erreur: boolean }>({ enCours: false, message: "", erreur: false });
  const visee = useSyncExternalStore(abonner, () => ligneVisee() === id, () => false);
  const refuser = (message: string) => setEtat({ enCours: false, message, erreur: true });

  /** `collee` : une image venue d'ailleurs (collée ou glissée) — on vérifie qu'elle est assez grande, et que ce n'est pas celle de l'article d'avant. */
  async function envoyer(fichier: File | undefined, collee = false) {
    if (!fichier) return;
    setEtat({ enCours: true, message: "Envoi de la photo…", erreur: false });
    try {
      let remarque = "";
      let empreinte = "";
      if (collee) {
        const dimensions = await dimensionsDe(fichier);
        const avis = avisDeTaille(dimensions?.largeur ?? 0, dimensions?.hauteur ?? 0);
        if (avis?.refus) return refuser(avis.message);
        remarque = avis?.message ?? "";
        empreinte = await empreinteDe(fichier);
        const derniere = derniereImageCollee();
        if (derniere && derniere.empreinte === empreinte && derniere.id !== id && signalee.current !== empreinte) {
          signalee.current = empreinte;
          return refuser("C'est la même image que pour l'article précédent : copie la nouvelle image, puis recolle. (Si c'est voulu, recolle-la telle quelle.)");
        }
      }
      const form = new FormData();
      form.set("id", id);
      form.set("photo", await reduirePhoto(fichier));
      const resultat = await enregistrerPhotoRapide(form);
      if (resultat.url) {
        setPhoto(resultat.url);
        if (collee) {
          noterImageCollee(empreinte, id);
          signalee.current = null;
          viser(null);
        }
        setEtat({ enCours: false, message: remarque || "Photo enregistrée.", erreur: false });
      } else {
        refuser(resultat.erreur ?? "La photo n'a pas pu être enregistrée.");
      }
    } catch {
      refuser("Envoi impossible : vérifie ta connexion et réessaie.");
    } finally {
      if (champ.current) champ.current.value = "";
    }
  }

  /** Le bouton « Coller » : l'image que le gérant vient de copier dans un autre onglet. */
  async function coller() {
    viser(id);
    setEtat({ enCours: true, message: "Lecture de l'image copiée…", erreur: false });
    const lu = await imageDuPressePapiers();
    if ("erreur" in lu) return refuser(lu.erreur);
    await envoyer(lu.fichier, true);
  }

  // Ctrl + V n'importe où sur la page : l'image va à la ligne visée (une seule écoute à la fois).
  const auCollage = useEffectEvent((e: ClipboardEvent) => {
    const fichier = imageDuTransfert(e.clipboardData);
    if (!fichier) return refuser("Rien à coller : copie d'abord une image (clic droit sur l'image, puis « Copier l'image »).");
    e.preventDefault();
    void envoyer(fichier, true);
  });
  useEffect(() => {
    if (!visee) return;
    const ecoute = (e: ClipboardEvent) => auCollage(e);
    document.addEventListener("paste", ecoute);
    return () => document.removeEventListener("paste", ecoute);
  }, [visee]);

  // Arrivé depuis une fiche du site (« Changer la photo », vue du gérant) : l'adresse désigne cette ligne
  // (`#p-<id>`) — elle est visée d'office, prête à recevoir l'image.
  useEffect(() => {
    if (window.location.hash === `#p-${id}`) viser(id);
  }, [id]);

  // Une image glissée depuis une autre fenêtre.
  const auSurvol = (e: DragEvent<HTMLLIElement>) => {
    if (!e.dataTransfer.types.some((t) => t === "Files" || t === "text/html")) return;
    e.preventDefault();
    setSurvol(true);
  };
  const auDepot = (e: DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    setSurvol(false);
    const fichier = imageDuTransfert(e.dataTransfer);
    if (fichier) void envoyer(fichier, true);
    else refuser("Ce qui a été déposé n'est pas une image : copie l'image, puis « Coller ».");
  };

  return (
    <li
      id={`p-${id}`}
      data-visee={visee ? "oui" : undefined}
      onClick={() => viser(id)}
      onDragOver={auSurvol}
      onDragLeave={() => setSurvol(false)}
      onDrop={auDepot}
      className={`flex scroll-mt-28 flex-wrap items-center gap-3 p-3 transition-colors first:rounded-t-3xl last:rounded-b-3xl sm:flex-nowrap ${visee || survol ? "bg-marque/5 ring-2 ring-inset ring-marque" : ""}`}
    >
      {/* D'abord ce que Wolt montre : c'est ce qui dit au gérant quel article chercher. */}
      {photoWolt ? (
        <PhotoWolt photo={photoWolt} nom={nom} />
      ) : (
        <span className="flex h-[84px] w-28 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 px-2 text-center text-[11px] leading-tight text-slate-500 sm:h-[108px] sm:w-36">
          Pas de photo de Wolt
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
        {etat.message ? (
          <p role={etat.erreur ? "alert" : "status"} className={`mt-0.5 flex items-start gap-1 text-xs font-semibold ${etat.erreur ? "text-red-700" : "text-emerald-700"}`}>
            {!etat.erreur && !etat.enCours && <Check className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={2.2} aria-hidden="true" />}
            {etat.message}
          </p>
        ) : (
          visee && <p className="mt-0.5 text-xs font-semibold text-marque">Copie l&apos;image choisie, reviens ici, puis « Coller ».</p>
        )}
      </div>
      {/* Sur téléphone, les boutons passent sous l'article, sur toute la largeur ; à côté sur ordinateur. */}
      <div className="relative flex w-full items-center gap-2 sm:w-auto sm:flex-col sm:items-stretch">
        {/* La photo que voit le client, une fois posée. */}
        {photo ? (
          <img src={photo} alt={`Photo de ${nom} sur le site`} title="Sur le site" data-photo-site className="h-11 w-11 shrink-0 rounded-xl border border-slate-200 bg-white object-contain sm:h-14 sm:w-14 sm:self-center" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 text-slate-400 sm:hidden" title="Pas encore de photo sur le site">
            <ImageOff className="h-4 w-4" strokeWidth={1.6} aria-hidden="true" />
          </span>
        )}
        <input
          ref={champ}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          tabIndex={-1}
          aria-label={`Photo de ${nom}`}
          onChange={(e) => envoyer(e.target.files?.[0])}
        />
        <button type="button" className={`${visee ? "bouton" : "bouton-secondaire"} flex-1 px-3 py-2 text-sm sm:flex-none`} disabled={etat.enCours} onClick={coller} aria-label={`Coller l'image copiée sur ${nom}`}>
          <ClipboardPaste className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          Coller
        </button>
        <button type="button" className="bouton-secondaire flex-1 px-3 py-2 text-sm sm:flex-none" disabled={etat.enCours} onClick={() => champ.current?.click()} aria-label={`${photo ? "Changer" : "Ajouter"} la photo de ${nom}`}>
          <Camera className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />
          {photo ? "Changer" : "Ajouter"}
        </button>
      </div>
    </li>
  );
}
