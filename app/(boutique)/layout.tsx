import Link from "next/link";
import { PanierProvider } from "@/components/panier/PanierProvider";
import { LangueProvider } from "@/components/LangueProvider";
import { ChoixLangue } from "@/components/ChoixLangue";
import { EnTete, Logo } from "@/components/EnTete";
import { BarrePanier } from "@/components/LienPanier";
import { NOM_DU_SITE } from "@/lib/marque";
import { traduction } from "@/lib/traduction";

export default async function LayoutBoutique({ children }: LayoutProps<"/">) {
  // La langue du visiteur (son choix, sinon celle de son navigateur) et ses textes, donnés aussi aux composants du navigateur.
  const { langue, t, lien } = await traduction();
  const survol = "hover:text-encre hover:underline";
  return (
    <LangueProvider langue={langue} t={t}>
      <PanierProvider>
        <EnTete t={t} langue={langue} />
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 sm:pb-20 sm:pt-8">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white text-slate-600">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
            <div className="space-y-3">
              <Logo />
              <p className="max-w-xs text-sm">{t.pied.slogan}</p>
              <ChoixLangue id="langue-pied" />
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-encre">{t.pied.commentCaMarche}</h2>
              <p>{t.pied.etape1}</p>
              <p>{t.pied.etape2}</p>
              <p>{t.pied.etape3}</p>
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-encre">{t.pied.votreCompte}</h2>
              <p><Link href={lien("/compte")} className={survol}>{t.pied.monEspace}</Link></p>
              <p><Link href={lien("/commandes")} className={survol}>{t.pied.mesCommandesAppareil}</Link></p>
              <p><Link href={lien("/panier")} className={survol}>{t.pied.monPanier}</Link></p>
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="font-semibold text-encre">{t.pied.informations}</h2>
              <p><Link href={lien("/contact")} className={survol}>{t.pied.contact}</Link></p>
              <p><Link href={lien("/conditions")} className={survol}>{t.pied.conditions}</Link></p>
              <p><Link href={lien("/confidentialite")} className={survol}>{t.pied.confidentialite}</Link></p>
              <p><Link href={lien("/mentions-legales")} className={survol}>{t.pied.mentions}</Link></p>
              <p><Link href={lien("/credits")} className={survol}>{t.pied.credits}</Link></p>
            </div>
          </div>
          <div className="border-t border-slate-200">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 pb-24 text-xs text-slate-500 sm:pb-4">
              <p>© {new Date().getFullYear()} {NOM_DU_SITE}</p>
              <Link href="/admin" className={survol}>{t.pied.espaceGerant}</Link>
            </div>
          </div>
        </footer>
        <BarrePanier />
      </PanierProvider>
    </LangueProvider>
  );
}
