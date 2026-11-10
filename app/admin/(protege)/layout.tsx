import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { NOM_DU_SITE } from "@/lib/marque";
import { prisma } from "@/lib/prisma";
import { seDeconnecter } from "../session-actions";

export const dynamic = "force-dynamic";
export const metadata = { robots: { index: false } };

export default async function LayoutAdmin({ children }: LayoutProps<"/admin">) {
  await exigerAdmin();
  const aTraiter = await prisma.commande.count({ where: { statut: "RECUE" } });

  const liens = [
    { href: "/admin", libelle: "Commandes", pastille: aTraiter },
    { href: "/admin/produits", libelle: "Produits" },
    { href: "/admin/categories", libelle: "Catégories" },
    { href: "/admin/reglages", libelle: "Réglages" },
  ];

  return (
    <>
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <p className="font-extrabold text-marque">
            {NOM_DU_SITE} <span className="font-medium text-slate-500">· gérant</span>
          </p>
          <nav aria-label="Administration" className="order-last -mx-4 w-full overflow-x-auto px-4 sm:order-none sm:mx-0 sm:w-auto sm:px-0">
            <ul className="flex gap-1">
              {liens.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium hover:bg-slate-100">
                    {l.libelle}
                    {!!l.pastille && (
                      <span className="rounded-full bg-accent px-1.5 text-xs font-bold text-slate-900">{l.pastille}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <Link href="/" className="text-slate-600 hover:underline">Voir le site</Link>
            <form action={seDeconnecter}>
              <button type="submit" className="text-slate-600 hover:underline">Déconnexion</button>
            </form>
          </div>
        </div>
      </header>
      <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        {children}
      </main>
    </>
  );
}
