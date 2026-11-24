"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { LoaderCircle, MapPin } from "lucide-react";
import {
  LOGO_GOOGLE,
  LONGUEUR_MINIMALE_D_UNE_SAISIE,
  MENTION_GOOGLE,
  adressesGoogleDisponibles,
  chargerLesAdresses,
  lireLAdresseChoisie,
  proposerDesAdresses,
  surRefusDeGoogle,
  type Proposition,
} from "@/lib/google-adresses";
import type { Langue } from "@/lib/langues";
import type { LieuReconnu } from "@/lib/zones";

// Le temps laissé entre deux lettres avant d'interroger Google : chaque demande compte dans le quota du gérant.
const PAUSE = 300;

/** Ce que le champ rend quand le client choisit une proposition. `lieu` vide : Google n'a pas donné le détail. */
export type AdresseDuChamp = { ligne: string; adresse: string; lieu: LieuReconnu | null };

type Props = {
  /** Tout ce que le champ portait avant (id, nom, valeur, saisie, erreur…) : il reste le même champ. */
  champ: InputHTMLAttributes<HTMLInputElement>;
  langue: Langue;
  /** La clé Google du gérant, reçue du serveur par la page du panier. Vide : aucune proposition, rien de Google. */
  cleGoogle: string;
  /** Le nom de la liste des propositions, pour les lecteurs d'écran. */
  libelle: string;
  surChoix: (adresse: AdresseDuChamp) => void;
};

/**
 * Le champ « Rue et numéro » du panier. Sans la clé Google du gérant, c'est le champ d'avant, à l'identique.
 * Avec elle, Google propose des adresses pendant que le client tape : il en choisit une, ou continue d'écrire
 * — rien n'est obligatoire, et si Google ne répond pas le champ reste un champ ordinaire.
 */
export function ChampAdresse(props: Props) {
  return props.cleGoogle ? <AvecPropositions {...props} /> : <input {...props.champ} />;
}

type Bibliotheque = Awaited<ReturnType<typeof chargerLesAdresses>>;

function AvecPropositions({ champ, langue, cleGoogle, libelle, surChoix }: Props) {
  // Google peut refuser la clé en cours de route (site non autorisé, facturation coupée) : on redevient un champ simple.
  const disponible = useSyncExternalStore(surRefusDeGoogle, adressesGoogleDisponibles, () => true);
  const idListe = useId();
  const boite = useRef<HTMLDivElement>(null);
  const bibliotheque = useRef<Bibliotheque | null>(null);
  // La « session » de Google : un jeton pour toutes les propositions d'une saisie, jusqu'à l'adresse choisie.
  const session = useRef<{ jeton: unknown }>({ jeton: null });
  const minuterie = useRef(0);
  // Le numéro de la dernière demande : une réponse arrivée après la suivante n'est jamais affichée.
  const demande = useRef(0);
  const [liste, setListe] = useState<Proposition[]>([]);
  const [ouverte, setOuverte] = useState(false);
  const [active, setActive] = useState(-1);
  const [lecture, setLecture] = useState(false);
  const montree = disponible && ouverte && liste.length > 0;

  const charger = async () => (bibliotheque.current ??= await chargerLesAdresses(cleGoogle, langue));
  const fermer = () => {
    setOuverte(false);
    setActive(-1);
  };

  useEffect(
    () => () => {
      window.clearTimeout(minuterie.current);
      demande.current++;
    },
    [],
  );

  // Un toucher ailleurs dans la page referme la liste.
  useEffect(() => {
    if (!ouverte) return;
    const dehors = (e: PointerEvent) => {
      if (boite.current?.contains(e.target as Node)) return;
      setOuverte(false);
      setActive(-1);
    };
    document.addEventListener("pointerdown", dehors);
    return () => document.removeEventListener("pointerdown", dehors);
  }, [ouverte]);

  // Sur téléphone, le champ est souvent tout en bas de l'écran, juste au-dessus du clavier : la liste, qui
  // s'ouvre dessous, serait cachée. On remonte la page de ce qu'il faut — sans glisser le champ sous l'en-tête.
  useEffect(() => {
    if (!montree) return;
    const panneau = boite.current?.querySelector<HTMLElement>("[data-propositions]");
    const saisie = boite.current?.querySelector("input");
    if (!panneau || !saisie) return;
    const vue = window.visualViewport;
    const bas = vue ? vue.offsetTop + vue.height : window.innerHeight;
    const depasse = panneau.getBoundingClientRect().bottom + 12 - bas;
    if (depasse <= 0) return;
    const sousLEnTete = document.querySelector("header.entete")?.getBoundingClientRect().bottom ?? 0;
    const possible = saisie.getBoundingClientRect().top - sousLEnTete - 12;
    if (possible <= 0) return;
    const doucement = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollBy({ top: Math.min(depasse, possible), behavior: doucement ? "smooth" : "auto" });
  }, [montree, liste.length]);

  const chercher = (texte: string) => {
    window.clearTimeout(minuterie.current);
    const numero = ++demande.current;
    const saisie = texte.trim();
    if (saisie.length < LONGUEUR_MINIMALE_D_UNE_SAISIE) {
      setListe([]);
      fermer();
      return;
    }
    minuterie.current = window.setTimeout(async () => {
      try {
        const propositions = await proposerDesAdresses(await charger(), saisie, langue, session.current);
        if (numero !== demande.current) return;
        setListe(propositions);
        setOuverte(propositions.length > 0);
        setActive(-1);
      } catch {
        // Google ne répond pas : le client continue d'écrire son adresse, comme sans propositions.
        if (numero !== demande.current) return;
        setListe([]);
        fermer();
      }
    }, PAUSE);
  };

  const choisir = async (proposition: Proposition) => {
    window.clearTimeout(minuterie.current);
    const numero = ++demande.current;
    setListe([]);
    fermer();
    setLecture(true);
    try {
      const adresse = await lireLAdresseChoisie(await charger(), proposition, langue);
      // Le client a repris la saisie pendant la lecture : c'est ce qu'il tape qui compte.
      if (numero === demande.current) surChoix(adresse);
    } catch {
      // Pas de détail : on garde ce que la proposition affichait, ville comprise — rien n'est « reconnu ».
      if (numero === demande.current) surChoix({ ligne: [proposition.principal, proposition.secondaire].filter(Boolean).join(", ").slice(0, 200), adresse: "", lieu: null });
    } finally {
      session.current.jeton = null;
      setLecture(false);
    }
  };

  const touches = (e: KeyboardEvent<HTMLInputElement>) => {
    champ.onKeyDown?.(e);
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (liste.length === 0) return;
      e.preventDefault();
      const bas = e.key === "ArrowDown";
      if (!ouverte) {
        setOuverte(true);
        setActive(bas ? 0 : liste.length - 1);
      } else {
        setActive((i) => (bas ? (i + 1) % liste.length : i <= 0 ? liste.length - 1 : i - 1));
      }
    } else if (e.key === "Enter" && ouverte && liste[active]) {
      // Entrée choisit la proposition en surbrillance ; sans surbrillance, elle garde son rôle d'avant.
      e.preventDefault();
      void choisir(liste[active]);
    } else if (e.key === "Escape" && ouverte) {
      e.preventDefault();
      fermer();
    }
  };

  // Google indisponible : le MÊME champ (le client y est peut-être en train d'écrire, il garde le curseur),
  // rendu à ce qu'il était — sa saisie automatique, ses propres gestes, aucune liste annoncée.
  const avecListe: InputHTMLAttributes<HTMLInputElement> = disponible
    ? {
        // Les adresses retenues par le navigateur recouvriraient celles de Google.
        autoComplete: "off",
        role: "combobox",
        "aria-autocomplete": "list",
        "aria-expanded": montree,
        "aria-controls": montree ? idListe : undefined,
        "aria-activedescendant": montree && active >= 0 ? `${idListe}-${active}` : undefined,
        "aria-busy": lecture || undefined,
        onChange: (e) => {
          champ.onChange?.(e);
          chercher(e.target.value);
        },
        onFocus: (e) => {
          champ.onFocus?.(e);
          // La bibliothèque de Google n'est demandée qu'ici : jamais à l'ouverture de la page.
          void charger().catch(() => undefined);
        },
        onBlur: (e) => {
          champ.onBlur?.(e);
          if (!boite.current?.contains(e.relatedTarget)) fermer();
        },
        onKeyDown: touches,
      }
    : {};

  return (
    <div ref={boite} className="relative">
      <input {...champ} {...avecListe} />
      {lecture && (
        <span className="pointer-events-none absolute inset-y-0 end-3 flex items-center">
          <LoaderCircle className="tourne h-4 w-4 text-slate-400" strokeWidth={2} aria-hidden="true" />
        </span>
      )}
      {montree && (
        <div data-propositions className="en-fondu absolute inset-x-0 top-full z-[15] mt-1.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
          <ul id={idListe} role="listbox" aria-label={libelle} className="divide-y divide-slate-100">
            {liste.map((p, i) => (
              <li
                key={p.id}
                id={`${idListe}-${i}`}
                role="option"
                aria-selected={i === active}
                // Le champ garde le curseur : la liste ne se referme pas avant que le toucher soit compté.
                onPointerDown={(e) => e.preventDefault()}
                onMouseDown={(e) => e.preventDefault()}
                // Un vrai mouvement du pointeur seulement : la page qui remonte sous une souris immobile ne
                // doit pas déplacer la surbrillance posée au clavier.
                onPointerMove={() => setActive(i)}
                onClick={() => void choisir(p)}
                className={`flex cursor-pointer items-center gap-2.5 px-3.5 py-2.5 text-start ${i === active ? "bg-slate-100" : ""}`}
              >
                <MapPin className="h-4 w-4 shrink-0 text-slate-400" strokeWidth={1.8} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <bdi className="block truncate text-sm font-semibold text-encre">{p.principal}</bdi>
                  {p.secondaire && <bdi className="block truncate text-xs text-slate-500">{p.secondaire}</bdi>}
                </span>
              </li>
            ))}
          </ul>
          {/* La mention que Google exige sous ses propositions ; elle ne se traduit pas et s'écrit de gauche à droite. */}
          <p data-mention-google className="flex justify-end border-t border-slate-100 bg-slate-50 px-3 py-1.5" dir="ltr" lang="en" translate="no">
            <MentionGoogle />
          </p>
        </div>
      )}
    </div>
  );
}

/** Le logo « Powered by Google », servi par Google ; s'il n'arrive pas, la mention est écrite. */
function MentionGoogle() {
  const [sansLogo, setSansLogo] = useState(false);
  if (sansLogo) return <span className="text-[11px] font-medium text-slate-500">{MENTION_GOOGLE}</span>;
  // eslint-disable-next-line @next/next/no-img-element -- le logo de Google, servi par Google : rien à optimiser
  return <img src={LOGO_GOOGLE} alt={MENTION_GOOGLE} className="h-[18px] w-auto" onError={() => setSansLogo(true)} />;
}
