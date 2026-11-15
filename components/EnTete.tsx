import Link from "next/link";
import { User } from "lucide-react";
import { NOM_DU_SITE } from "@/lib/marque";
import { lienPour, remplir, type Langue } from "@/lib/langues";
import type { Dictionnaire } from "@/lib/i18n/fr";
import { LienPanier } from "./LienPanier";
import { ChoixLangue } from "./ChoixLangue";
import { Sigle } from "./Sigle";
import { CadreEnTete } from "./CadreEnTete";
import { ChampRecherche } from "./ChampRecherche";

/**
 * Le logo : le sigle (un T et un O couleur soleil dans une tuile), et le nom.
 * `vivant` (l'en-tête de la boutique seulement) : à l'ouverture du site la tuile se pose, le T descend à sa
 * place et le O se lève ; le O bat pendant qu'une page se charge (classe `logo-vivant`, app/globals.css —
 * le SVG du sigle, lui, reste sans classe).
 */
export function Logo({ clair = false, sansNom = false, compactSurMobile = false, vivant = false }: { clair?: boolean; sansNom?: boolean; compactSurMobile?: boolean; vivant?: boolean }) {
  return (
    <span className={`flex items-center gap-2.5 ${vivant ? "logo-vivant" : ""}`}>
      <Sigle taille={36} clair={clair} />
      {!sansNom && (
        <span className={`nom-du-site text-[17px] font-bold tracking-tight ${clair ? "text-white" : "text-encre"} ${compactSurMobile ? "hidden sm:inline" : ""}`}>{NOM_DU_SITE}</span>
      )}
    </span>
  );
}

/** L'en-tête de la boutique, dans la langue du visiteur. Les marges sont « logiques » (début / fin) : en hébreu, tout se retourne. */
export function EnTete({ t, langue }: { t: Dictionnaire; langue: Langue }) {
  const lien = (chemin: string) => lienPour(langue, chemin);
  return (
    <CadreEnTete>
      {/* Une rangée : le logo, la recherche, les boutons. Sur téléphone la recherche est posée par la feuille
          de style (`entete-recherche`) : sous la rangée en haut de page, entre le logo et les boutons ensuite.
          Les résultats s'affichent pendant qu'on tape (`ChampRecherche`). */}
      <div className="entete-rang relative mx-auto flex max-w-6xl items-center gap-2.5 px-4 sm:gap-5">
        <Link href={lien("/")} className="shrink-0 transition duration-150 active:scale-95" aria-label={remplir(t.entete.accueilAria, { site: NOM_DU_SITE })}>
          <Logo vivant />
        </Link>
        <ChampRecherche adresse={lien("/recherche")} label={t.entete.rechercherLabel} placeholder={t.entete.rechercherPlaceholder} />
        <div data-entete-boutons className="ms-auto flex shrink-0 items-center gap-0.5 sm:gap-2">
          <ChoixLangue compact id="langue-entete" />
          <Link
            href={lien("/compte")}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl px-2 text-sm font-semibold text-slate-700 transition duration-150 hover:bg-slate-100 active:scale-90 sm:px-2.5"
            aria-label={t.entete.monEspace}
            title={t.entete.monEspace}
          >
            <User className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" />
            <span className="hidden md:inline">{t.entete.monCompte}</span>
          </Link>
          <LienPanier />
        </div>
      </div>
    </CadreEnTete>
  );
}
