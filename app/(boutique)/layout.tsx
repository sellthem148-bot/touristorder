import Link from "next/link";
import { PanierProvider } from "@/components/panier/PanierProvider";
import { EnTete, Logo } from "@/components/EnTete";
import { BarrePanier } from "@/components/LienPanier";
import { SLOGAN } from "@/lib/marque";

export default function LayoutBoutique({ children }: LayoutProps<"/">) {
  return (
    <PanierProvider>
      <EnTete />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:pb-16 sm:pt-6">
        {children}
      </main>
      <footer className="bg-slate-900 text-slate-300">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 pb-28 sm:grid-cols-3 sm:pb-10">
          <div className="space-y-3">
            <Logo clair />
            <p className="text-sm">{SLOGAN}</p>
          </div>
          <div className="space-y-2 text-sm">
            <h2 className="font-bold text-white">Comment ça marche</h2>
            <p>1. Tu choisis tes articles.</p>
            <p>2. On fait les achats pour toi.</p>
            <p>3. On te livre à ton hôtel ou ton logement.</p>
          </div>
          <div className="space-y-2 text-sm">
            <h2 className="font-bold text-white">Ton compte</h2>
            <p><Link href="/compte" className="hover:text-white hover:underline">Mon espace client</Link></p>
            <p><Link href="/commandes" className="hover:text-white hover:underline">Mes commandes sur cet appareil</Link></p>
            <p><Link href="/panier" className="hover:text-white hover:underline">Mon panier</Link></p>
            <p><Link href="/admin" className="text-slate-400 hover:text-white hover:underline">Espace gérant</Link></p>
          </div>
        </div>
      </footer>
      <BarrePanier />
    </PanierProvider>
  );
}
