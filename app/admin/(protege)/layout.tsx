import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Logo } from "@/components/EnTete";
import { NavAdmin } from "@/components/admin/NavAdmin";
import { seDeconnecter } from "../session-actions";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  await exigerAdmin();
  const aTraiter = await prisma.commande.count({ where: { statut: "RECUE" } });

  return (
    <>
      <header className="bg-slate-900 text-white">
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo clair compactSurMobile />
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide text-slate-300">Gérant</span>
            <div className="ml-auto flex items-center gap-4 whitespace-nowrap text-sm text-slate-300">
              <Link href="/" className="hover:text-white hover:underline">Voir le site</Link>
              <form action={seDeconnecter}>
                <button type="submit" className="hover:text-white hover:underline">Déconnexion</button>
              </form>
            </div>
          </div>
          <NavAdmin
            liens={[
              { href: "/admin", libelle: "Commandes", pastille: aTraiter },
              { href: "/admin/produits", libelle: "Produits" },
              { href: "/admin/produits/prix", libelle: "Prix rapides" },
              { href: "/admin/tarifs", libelle: "Tarifs" },
              { href: "/admin/statistiques", libelle: "Statistiques" },
              { href: "/admin/categories", libelle: "Catégories" },
              { href: "/admin/reglages", libelle: "Réglages" },
            ]}
          />
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
