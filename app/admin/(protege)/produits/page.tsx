import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { Messages } from "@/components/admin/Messages";
import { Vignette } from "@/components/Vignette";
import { basculerEpuise, basculerProduit } from "../actions";
import { PastilleBadge } from "@/components/Prix";
import { estBadge } from "@/lib/choix-commande";
import { lireGroupes } from "@/lib/options";

export const metadata = { title: "Produits" };

export default async function PageProduits({ searchParams }: PageProps<"/admin/produits">) {
  await exigerAdmin();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 80);
  const categorie = typeof params.categorie === "string" ? params.categorie : "";
  const ETATS = {
    tous: { libelle: "Tous", where: {} },
    "a-completer": { libelle: "À compléter (sans prix)", where: { prix: 0 } },
    "en-ligne": { libelle: "En ligne", where: { actif: true, prix: { gt: 0 } } },
    masques: { libelle: "Masqués", where: { actif: false, prix: { gt: 0 } } },
    epuises: { libelle: "Épuisés", where: { epuise: true } },
  } satisfies Record<string, { libelle: string; where: Prisma.ProduitWhereInput }>;
  type Etat = keyof typeof ETATS;
  const etat: Etat = typeof params.etat === "string" && params.etat in ETATS ? (params.etat as Etat) : "tous";
  const comptes = Object.fromEntries(
    await Promise.all((Object.keys(ETATS) as Etat[]).map(async (e) => [e, await prisma.produit.count({ where: ETATS[e].where })] as const)),
  ) as Record<Etat, number>;
  const lienEtat = (e: Etat) => {
    const u = new URLSearchParams();
    if (e !== "tous") u.set("etat", e);
    if (categorie) u.set("categorie", categorie);
    if (q) u.set("q", q);
    const s = u.toString();
    return s ? `/admin/produits?${s}` : "/admin/produits";
  };

  const where: Prisma.ProduitWhereInput = {
    ...ETATS[etat].where,
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
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/produits/prix" className="bouton-secondaire py-2.5">Saisie rapide des prix</Link>
          <Link href="/admin/produits/nouveau" className="bouton py-2.5">+ Nouveau produit</Link>
        </div>
      </div>
      <Messages params={params} />

      <nav aria-label="Filtrer par état" className="rail">
        {(Object.keys(ETATS) as Etat[]).map((e) => (
          <Link
            key={e}
            href={lienEtat(e)}
            aria-current={e === etat ? "page" : undefined}
            className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${e === etat ? "bg-slate-900 text-white" : "bg-white shadow-carte"}`}
          >
            {ETATS[e].libelle}
            <span className={`rounded-full px-1.5 text-xs ${e === "a-completer" && comptes[e] > 0 ? "bg-soleil text-slate-900" : "opacity-60"}`}>{comptes[e]}</span>
          </Link>
        ))}
      </nav>

      {categories.length === 0 && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Crée d&apos;abord une <Link href="/admin/categories" className="underline">catégorie</Link>.
        </p>
      )}

      <form className="flex flex-wrap gap-2" method="get">
        <label htmlFor="q" className="sr-only">Rechercher</label>
        {etat !== "tous" && <input type="hidden" name="etat" value={etat} />}
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
            const marge = p.prixAchat != null && p.prix > 0 ? p.prix - p.prixAchat : null;
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-3">
                <Vignette url={p.photoUrl} emoji={p.categorie.emoji} alt="" className="h-14 w-14 shrink-0 rounded-xl" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/produits/${p.id}`} className="font-semibold hover:underline">{p.nom}</Link>
                    {estBadge(p.badge) && <PastilleBadge badge={p.badge} />}
                  </p>
                  <p className="text-xs text-slate-500">
                    {p.categorie.nom}
                    {p.boutique && <> · 🏪 {p.boutique}</>}
                    {lireGroupes(p.options).length > 0 && <> · {lireGroupes(p.options).map((g) => g.nom).join(", ")}</>}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className={`font-semibold ${p.prix === 0 ? "text-amber-700" : ""}`}>{p.prix === 0 ? "Prix à définir" : formatPrix(p.prix)}</p>
                  {marge != null && (
                    <p className={marge >= 0 ? "text-emerald-700" : "text-red-700"}>
                      marge {formatPrix(marge)}
                    </p>
                  )}
                </div>
                <form action={basculerEpuise}>
                  <input type="hidden" name="id" value={p.id} />
                  <button
                    type="submit"
                    className={`w-24 rounded-full px-3 py-1 text-xs font-semibold ${p.epuise ? "bg-slate-900 text-white" : "border border-slate-200 bg-white text-slate-600"}`}
                    aria-label={`${p.epuise ? "Remettre en stock" : "Marquer épuisé"} ${p.nom}`}
                  >
                    {p.epuise ? "Épuisé" : "En stock"}
                  </button>
                </form>
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
