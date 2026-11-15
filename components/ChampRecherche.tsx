"use client";

import { useEffect, useRef, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LoaderCircle, Search } from "lucide-react";
import { adresseDesResultats, motsDeRecherche } from "@/lib/recherche";

// Le temps laissé entre deux lettres avant de chercher : assez court pour que les résultats suivent la frappe,
// assez long pour ne pas interroger le site à chaque touche d'un mot tapé d'une traite.
const PAUSE = 250;

/**
 * La recherche de l'en-tête, « vivante » (demande du gérant, 15 novembre 2026 : « comme sur Wolt ») : les
 * articles s'affichent pendant qu'on tape, sans valider. Dès deux lettres, la page des résultats s'ouvre ;
 * chaque lettre de plus la met à jour, le champ garde le curseur.
 *
 * - `adresse` : la page de recherche à l'adresse de la langue du visiteur (`lien("/recherche")`).
 * - La première frappe AJOUTE les résultats à l'historique (« retour » ramène à la page d'où l'on vient),
 *   les suivantes les REMPLACENT : dix lettres ne font pas dix pages à remonter.
 * - Sans JavaScript, c'est un formulaire ordinaire : on tape, on valide, la page des résultats s'ouvre.
 * - Le champ n'est pas « contrôlé » : ce qui est tapé avant que la page soit active n'est pas perdu.
 */
export function ChampRecherche({ adresse, label, placeholder }: { adresse: string; label: string; placeholder: string }) {
  const router = useRouter();
  const chemin = usePathname();
  const champ = useRef<HTMLInputElement>(null);
  const minuterie = useRef(0);
  const aRemonter = useRef(false);
  const premier = useRef(true);
  const [enAttente, lancer] = useTransition();

  /** Ouvre (ou met à jour) les résultats pour ce texte. `valide` : la touche Entrée, qui y va même pour une lettre. */
  const chercher = (texte: string, valide = false) => {
    window.clearTimeout(minuterie.current);
    minuterie.current = 0;
    // L'adresse du navigateur, pas celle du dernier rendu : c'est elle qui dit si les résultats sont déjà
    // dans l'historique (une recherche partie mais pas encore arrivée n'y est pas).
    const surLesResultats = window.location.pathname === adresse;
    // Une lettre seule ne fait pas quitter la page où l'on est ; sur les résultats, elle les efface.
    if (!surLesResultats && (valide ? texte.trim() === "" : motsDeRecherche(texte).length === 0)) return;
    const cible = adresseDesResultats(adresse, texte);
    if (cible === `${window.location.pathname}${window.location.search}`) return;
    aRemonter.current = true;
    // `scroll: false` : c'est nous qui remontons en haut des résultats, une fois arrivés — le champ garde le curseur.
    lancer(() => {
      if (surLesResultats) router.replace(cible, { scroll: false });
      else router.push(cible, { scroll: false });
    });
  };

  const programmer = (texte: string) => {
    window.clearTimeout(minuterie.current);
    minuterie.current = window.setTimeout(() => chercher(texte), PAUSE);
  };

  const auClavier = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;
    e.preventDefault(); // pas d'envoi du formulaire : la page ne se recharge pas
    chercher(e.currentTarget.value, true);
    e.currentTarget.blur(); // le clavier du téléphone se range : les résultats sont dessous
  };

  // Un envoi qui ne passerait pas par la touche Entrée (bouton « Rechercher » d'un clavier, lecteur d'écran).
  const aLEnvoi = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    chercher(champ.current?.value ?? "", true);
  };

  // En quittant le champ, une recherche encore en attente part tout de suite : rien de ce qui a été tapé
  // n'est perdu, et aucune minuterie ne ramène plus tard sur les résultats quelqu'un qui est parti ailleurs.
  const aLaSortie = () => {
    if (minuterie.current !== 0) chercher(champ.current?.value ?? "");
  };

  // Les nouveaux résultats se lisent depuis le haut.
  useEffect(() => {
    if (enAttente || !aRemonter.current) return;
    aRemonter.current = false;
    window.scrollTo({ top: 0 });
  }, [enAttente]);

  // Le champ suit l'adresse : en arrivant sur des résultats (page ouverte directement, lien) il montre ce qui
  // est cherché ; en quittant les résultats, il se vide. Jamais pendant qu'on y tape.
  useEffect(() => {
    const el = champ.current;
    if (!el) return;
    const tape = document.activeElement === el;
    const cherche = window.location.pathname === adresse ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
    if (premier.current) {
      premier.current = false;
      // À l'ouverture : ce qui a été tapé avant que la page soit active est cherché ; sinon le champ reprend
      // ce que l'adresse cherche, sans effacer ce que le navigateur y aurait remis.
      if (tape && el.value) minuterie.current = window.setTimeout(() => chercher(el.value), PAUSE);
      else if (!tape && cherche && !el.value) el.value = cherche;
      return;
    }
    if (!tape) el.value = cherche;
    // `chercher` ne lit que des références et l'adresse reçue : la relancer à chaque rendu n'apporterait rien.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chemin, adresse]);

  // « Retour » et « suivant » du navigateur : le champ reprend ce que l'adresse cherche, même s'il a le curseur
  // (on ne tape pas à ce moment-là), et une recherche en attente est abandonnée — elle ramènerait sur les résultats.
  useEffect(() => {
    const auRetour = () => {
      window.clearTimeout(minuterie.current);
      minuterie.current = 0;
      const el = champ.current;
      if (el) el.value = window.location.pathname === adresse ? new URLSearchParams(window.location.search).get("q") ?? "" : "";
    };
    window.addEventListener("popstate", auRetour);
    return () => window.removeEventListener("popstate", auRetour);
  }, [adresse]);

  // Sur téléphone, le clavier cache la moitié des résultats : il se range dès qu'on les fait défiler du doigt.
  useEffect(() => {
    const auGlissement = (e: TouchEvent) => {
      const el = champ.current;
      if (el && document.activeElement === el && !(e.target instanceof Node && el.form?.contains(e.target))) el.blur();
    };
    document.addEventListener("touchmove", auGlissement, { passive: true });
    return () => {
      document.removeEventListener("touchmove", auGlissement);
      window.clearTimeout(minuterie.current);
    };
  }, []);

  const icone = "pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 nuit:text-slate-400";
  return (
    <form action={adresse} method="get" role="search" onSubmit={aLEnvoi} className="entete-recherche min-w-0 sm:relative sm:max-w-md sm:flex-1">
      <label htmlFor="recherche" className="sr-only">{label}</label>
      {/* La loupe tourne pendant que les résultats arrivent. Le rond est dans un `span` : c'est lui qui est placé,
          l'animation ne touche que l'icône. */}
      <span className={icone} data-recherche-en-cours={enAttente ? "oui" : undefined}>
        {enAttente ? <LoaderCircle className="tourne h-4 w-4" strokeWidth={1.8} aria-hidden="true" /> : <Search className="h-4 w-4" strokeWidth={1.8} aria-hidden="true" />}
      </span>
      <input
        ref={champ}
        id="recherche"
        name="q"
        type="search"
        placeholder={placeholder}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        enterKeyHint="search"
        onInput={(e) => programmer(e.currentTarget.value)}
        onKeyDown={auClavier}
        onBlur={aLaSortie}
        className="w-full rounded-xl border border-transparent bg-slate-100 py-2.5 ps-9 pe-3 text-sm transition duration-200 placeholder:text-slate-500 focus:border-encre focus:bg-white focus:outline-none focus:ring-4 focus:ring-encre/10 nuit:bg-white/10 nuit:text-white nuit:placeholder:text-slate-400 nuit:focus:border-white/40 nuit:focus:bg-white/15 nuit:focus:ring-white/10"
      />
    </form>
  );
}
