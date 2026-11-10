import Link from "next/link";
import { PanierProvider } from "@/components/panier/PanierProvider";
import { EnTete } from "@/components/EnTete";
import { BarrePanier } from "@/components/LienPanier";
import { NOM_DU_SITE } from "@/lib/marque";

export default function LayoutBoutique({ children }: LayoutProps<"/">) {
  return (
    <PanierProvider>
      <EnTete />
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 pb-28 pt-4 sm:pb-12">
        {children}
      </main>
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 pb-24 text-sm text-slate-600 sm:flex-row sm:justify-between sm:pb-6">
          <p>
            © {new Date().getFullYear()} {NOM_DU_SITE} — livraison à ton hôtel ou ton logement en Israël.
          </p>
          <Link href="/admin" className="text-slate-500 hover:underline">
            Espace gérant
          </Link>
        </div>
      </footer>
      <BarrePanier />
    </PanierProvider>
  );
}
