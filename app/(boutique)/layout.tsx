import Link from "next/link";
import { PanierProvider } from "@/components/panier/PanierProvider";
import { EnTete, Logo } from "@/components/EnTete";
import { BarrePanier } from "@/components/LienPanier";
import { NOM_DU_SITE, SLOGAN } from "@/lib/marque";

export default function LayoutBoutique({ children }: LayoutProps<"/">) {
  return (
    <PanierProvider>
      <EnTete />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 sm:pb-20 sm:pt-8">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white text-slate-600">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Logo />
            <p className="max-w-xs text-sm">{SLOGAN}</p>
          </div>
          <div className="space-y-2 text-sm">
            <h2 className="font-semibold text-encre">Comment ça marche</h2>
            <p>1. Vous choisissez vos articles.</p>
            <p>2. Vous réglez à la commande.</p>
            <p>3. Nous vous livrons le soir, à votre logement.</p>
          </div>
          <div className="space-y-2 text-sm">
            <h2 className="font-semibold text-encre">Votre compte</h2>
            <p><Link href="/compte" className="hover:text-encre hover:underline">Mon espace client</Link></p>
            <p><Link href="/commandes" className="hover:text-encre hover:underline">Mes commandes sur cet appareil</Link></p>
            <p><Link href="/panier" className="hover:text-encre hover:underline">Mon panier</Link></p>
          </div>
          <div className="space-y-2 text-sm">
            <h2 className="font-semibold text-encre">Informations</h2>
            <p><Link href="/contact" className="hover:text-encre hover:underline">Contact</Link></p>
            <p><Link href="/conditions" className="hover:text-encre hover:underline">Conditions générales de vente</Link></p>
            <p><Link href="/confidentialite" className="hover:text-encre hover:underline">Confidentialité</Link></p>
            <p><Link href="/mentions-legales" className="hover:text-encre hover:underline">Mentions légales</Link></p>
            <p><Link href="/credits" className="hover:text-encre hover:underline">Crédits photos</Link></p>
          </div>
        </div>
        <div className="border-t border-slate-200">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-4 pb-24 text-xs text-slate-500 sm:pb-4">
            <p>© {new Date().getFullYear()} {NOM_DU_SITE}</p>
            <Link href="/admin" className="hover:text-encre hover:underline">Espace gérant</Link>
          </div>
        </div>
      </footer>
      <BarrePanier />
    </PanierProvider>
  );
}
