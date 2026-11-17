import Link from "next/link";
import { Suspense } from "react";
import { PanierProvider } from "@/components/panier/PanierProvider";
import { LangueProvider } from "@/components/LangueProvider";
import { ChoixLangue } from "@/components/ChoixLangue";
import { EnTete, Logo } from "@/components/EnTete";
import { BarrePanier } from "@/components/LienPanier";
import { EntreePage } from "@/components/EntreePage";
import { BarreDeNavigation } from "@/components/BarreDeNavigation";
import { Apparition } from "@/components/Apparition";
import { BandeauDuGerant } from "@/components/admin/VueDuGerant";
import { FOND_DE_LA_BOUTIQUE, FOND_SOMBRE } from "@/lib/fond";
import { NOM_DU_SITE } from "@/lib/marque";
import { traduction } from "@/lib/traduction";

export default async function LayoutBoutique({ children }: LayoutProps<"/">) {
  // La langue du visiteur (son choix, sinon celle de son navigateur) et ses textes, donnés aussi aux composants du navigateur.
  const { langue, t, lien } = await traduction();
  const survol = "hover:text-encre hover:underline nuit:hover:text-white";
  return (
    <LangueProvider langue={langue} t={t}>
      <PanierProvider>
        {/* Le fond de la boutique (lib/fond.ts) : `contents` — ce cadre ne change rien à la mise en page. */}
        <div data-fond={FOND_DE_LA_BOUTIQUE} className="contents">
        <Suspense fallback={null}>
          <BarreDeNavigation />
        </Suspense>
        <EnTete t={t} langue={langue} />
        {/* Pour le gérant connecté seulement (rien pour un client) : ce qu'il voit de plus qu'eux sur son site. */}
        <BandeauDuGerant />
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 sm:pb-20 sm:pt-8">
          <EntreePage>{children}</EntreePage>
        </main>
        {/* `bg-[white]` et non `bg-white` : le pied s'assombrit lui-même sur le fond sombre (voir `nuit:`). */}
        <footer className="border-t border-slate-200 bg-[white] text-slate-600 nuit:border-white/10 nuit:bg-encre nuit:text-slate-400">
          <Apparition className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="space-y-3">
              <Logo clair={FOND_SOMBRE} />
              <p className="max-w-xs text-sm">{t.pied.slogan}</p>
              <ChoixLangue id="langue-pied" />
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-encre nuit:text-white">{t.pied.commentCaMarche}</h2>
              <p>{t.pied.etape1}</p>
              <p>{t.pied.etape2}</p>
              <p>{t.pied.etape3}</p>
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-encre nuit:text-white">{t.pied.votreCompte}</h2>
              <p><Link href={lien("/compte")} className={survol}>{t.pied.monEspace}</Link></p>
              <p><Link href={lien("/commandes")} className={survol}>{t.pied.mesCommandesAppareil}</Link></p>
              <p><Link href={lien("/panier")} className={survol}>{t.pied.monPanier}</Link></p>
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-encre nuit:text-white">{t.pied.informations}</h2>
              <p><Link href={lien("/contact")} className={survol}>{t.pied.contact}</Link></p>
              <p><Link href={lien("/conditions")} className={survol}>{t.pied.conditions}</Link></p>
              <p><Link href={lien("/confidentialite")} className={survol}>{t.pied.confidentialite}</Link></p>
              <p><Link href={lien("/mentions-legales")} className={survol}>{t.pied.mentions}</Link></p>
              <p><Link href={lien("/credits")} className={survol}>{t.pied.credits}</Link></p>
            </div>
          </Apparition>
          <div className="border-t border-slate-200 nuit:border-white/10">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 pb-24 text-xs text-slate-500 nuit:text-slate-400 sm:pb-4">
              <p>© {new Date().getFullYear()} {NOM_DU_SITE}</p>
              <Link href="/admin" className={survol}>{t.pied.espaceGerant}</Link>
            </div>
          </div>
        </footer>
        <BarrePanier />
        </div>
      </PanierProvider>
    </LangueProvider>
  );
}
