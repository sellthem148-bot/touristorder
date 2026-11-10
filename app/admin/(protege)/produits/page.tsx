import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { Messages } from "@/components/admin/Messages";
import { Vignette } from "@/components/Vignette";
import { basculerProduit } from "../actions";

export const metadata = { title: "Produits" };

export default async function PageProduits({ searchParams }: PageProps<"/admin/produits">) {
  await exigerAdmin();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 80);
  const categorie = typeof params.categorie === "string" ? params.categorie : "";

  const where: Prisma.ProduitWhereInput = {
    ...(categorie ? { categorieId: categorie } : {}),
    ...(q
      ? { OR: [{ nom: { contains: q, mode: "insensitive" } }, { boutique: { contains: q, mode: "insensitive" } }] }
      : {}),
  };
  const [produits, categories] = await Promise.all([
    prisma.produit.findMany({
      where,
      orderBy: [{ categorie: { ordre: "asc" } }, { ordre: "asc" }, { nom: "asc" }],
      take: 300,
      include: { categorie: { select: { nom: true, emoji: true } } },
    }),
    prisma.categorie.findMany({ orderBy: [{ ordre: "asc" }, { nom: "asc" }], select: { id: true, nom: true } }),
  ]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Produits ({produits.length})</h1>
        <Link href="/admin/produits/nouveau" className="bouton">+ Nouveau produit</Link>
      </div>
      <Messages params={params} />

      {categories.length === 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Crée d&apos;abord une <Link href="/admin/categories" className="underline">catégorie</Link>.
        </p>
      )}

      <form className="flex flex-wrap gap-2" method="get">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        <input id="q" name="q" defaultValue={q} placeholder="Nom ou boutique…" className="champ max-w-xs py-2" />
        <label htmlFor="categorie" className="sr-only">Catégorie</label>
        <select id="categorie" name="categorie" defaultValue={categorie} className="champ max-w-xs py-2">
          <option value="">Toutes les catégories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
        <button type="submit" className="bouton-secondaire py-2">Filtrer</button>
      </form>

      {produits.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">Aucun produit.</p>
      ) : (
        <ul className="carte divide-y divide-slate-100">
          {produits.map((p) => {
            const marge = p.prixAchat != null ? p.prix - p.prixAchat : null;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                <Vignette url={p.photoUrl} emoji={p.categorie.emoji} alt="" className="h-14 w-14 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/produits/${p.id}`} className="font-semibold hover:underline">{p.nom}</Link>
                  <p className="text-xs text-slate-500">
                    {p.categorie.nom}
                    {p.boutique && <> · 🏪 {p.boutique}</>}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold">{formatPrix(p.prix)}</p>
                  {marge != null && (
                    <p className={marge >= 0 ? "text-emerald-700" : "text-red-700"}>
                      marge {formatPrix(marge)}
                    </p>
                  )}
                </div>
                <form action={basculerProduit}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className={`w-24 rounded-full px-3 py-1 text-xs font-semibold ${p.actif ? "bg-emerald-100 text-emerald-900" : "bg-slate-200 text-slate-700"}`}
                    aria-label={`${p.actif ? "Masquer" : "Afficher"} ${p.nom}`}
                  >
                    {p.actif ? "En ligne" : "Masqué"}
                  </button>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
