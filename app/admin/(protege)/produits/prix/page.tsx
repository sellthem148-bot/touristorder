import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { prixPourChamp } from "@/lib/argent";
import { lireGroupes } from "@/lib/options";
import { Messages } from "@/components/admin/Messages";
import { PRIX_NON_VERIFIE, prixNonVerifie } from "@/lib/prix-indicatif";
import { enregistrerPrixRapides } from "../../actions";

export const metadata = { title: "Prix rapides" };

export default async function PrixRapides({ searchParams }: PageProps<"/admin/produits/prix">) {
  await exigerAdmin();
  const params = await searchParams;
  const vue = typeof params.vue === "string" ? params.vue : "";
  const categories = await prisma.categorie.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: { id: true, nom: true, emoji: true, _count: { select: { produits: true } } },
  });
  const aCompleter = await prisma.produit.count({ where: { prix: 0 } });
  const deLaListe = await prisma.produit.count({ where: { prix: 0, prixIndicatif: { not: null } } });
  // En vente au prix de la liste du gérant, sans que le prix de Wolt ait été vérifié.
  const aVerifier = await prisma.produit.count({ where: PRIX_NON_VERIFIE });
  const vueAVerifier = vue === "a-verifier";
  // Par défaut : les articles sans prix s'il en reste, sinon la première catégorie.
  const categorieId = vueAVerifier
    ? ""
    : typeof params.categorie === "string" && categories.some((c) => c.id === params.categorie)
      ? params.categorie
      : vue === "a-completer" || aCompleter > 0
        ? ""
        : (categories[0]?.id ?? "");
  const where: Prisma.ProduitWhereInput = vueAVerifier ? PRIX_NON_VERIFIE : categorieId ? { categorieId } : { prix: 0 };
  const produits = await prisma.produit.findMany({
    where,
    orderBy: [{ categorie: { ordre: "asc" } }, { ordre: "asc" }, { nom: "asc" }],
    take: 300,
    select: { id: true, nom: true, prix: true, prixAchat: true, prixIndicatif: true, actif: true, options: true, categorie: { select: { nom: true, emoji: true } } },
  });
  const retour = vueAVerifier ? "/admin/produits/prix?vue=a-verifier" : categorieId ? `/admin/produits/prix?categorie=${categorieId}` : "/admin/produits/prix?vue=a-completer";
  const total = vueAVerifier ? aVerifier : aCompleter;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Prix rapides</h1>
        <p className="text-sm text-slate-600">
          Tape les prix d&apos;une catégorie d&apos;un coup. Un article sans prix reste masqué ; coche « En ligne » pour le montrer aux clients.
        </p>
        {aVerifier > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            {aVerifier > 1 ? `${aVerifier} articles sont en vente` : "1 article est en vente"} au prix de ta liste, sans que le prix de Wolt ait été vérifié (onglet « Prix à vérifier »). Quand tu vois le vrai prix sur Wolt, corrige « Prix » et note-le dans « Achat » : l&apos;article quitte cette liste.
          </p>
        )}
        {deLaListe > 0 && (
          <p className="mt-1 text-sm text-slate-600">
            {deLaListe > 1 ? `${deLaListe} articles de tes listes restent masqués, sans prix` : "1 article de tes listes reste masqué, sans prix"} (l&apos;alcool et la liste Dynamica en font partie) : le prix de ta liste est rappelé sous le nom, comme repère. Si tu décides de vendre un article, tape le prix de Wolt et il passe en ligne.
          </p>
        )}
      </div>
      <Messages params={params} />

      <nav aria-label="Catégories" className="rail">
        <Link
          href="/admin/produits/prix?vue=a-completer"
          aria-current={!categorieId && !vueAVerifier ? "page" : undefined}
          className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${!categorieId && !vueAVerifier ? "bg-slate-900 text-white" : "bg-white shadow-carte"}`}
        >
          À compléter <span className="rounded-full bg-soleil px-1.5 text-xs text-slate-900">{aCompleter}</span>
        </Link>
        {aVerifier > 0 && (
          <Link
            href="/admin/produits/prix?vue=a-verifier"
            aria-current={vueAVerifier ? "page" : undefined}
            className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${vueAVerifier ? "bg-slate-900 text-white" : "bg-white shadow-carte"}`}
          >
            Prix à vérifier <span className="rounded-full bg-soleil px-1.5 text-xs text-slate-900">{aVerifier}</span>
          </Link>
        )}
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/admin/produits/prix?categorie=${c.id}`}
            aria-current={c.id === categorieId ? "page" : undefined}
            className={`flex shrink-0 snap-start items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold ${c.id === categorieId ? "bg-slate-900 text-white" : "bg-white shadow-carte"}`}
          >
            <span aria-hidden="true">{c.emoji}</span> {c.nom} <span className="text-xs opacity-60">{c._count.produits}</span>
          </Link>
        ))}
      </nav>

      {produits.length === 0 ? (
        <p className="carte p-8 text-center text-slate-600">
          {vueAVerifier ? "Tous les prix ont été vérifiés." : categorieId ? "Aucun article dans cette catégorie." : "Tous les articles ont un prix 🎉"}
        </p>
      ) : (
        <form action={enregistrerPrixRapides} className="space-y-3">
          <input type="hidden" name="retour" value={retour} />
          {!categorieId && total > produits.length && (
            <p className="text-sm text-slate-600">
              Les {produits.length} premiers articles sont affichés, sur {total}. Pour avancer rayon par rayon, choisis un rayon ci-dessus : les articles de ta liste sont à la fin.
            </p>
          )}
          <ul className="carte divide-y divide-slate-100">
            {produits.map((p) => {
              const options = lireGroupes(p.options);
              return (
                <li key={p.id} className="space-y-2 p-3 sm:flex sm:items-center sm:gap-3 sm:space-y-0">
                  <input type="hidden" name="ids" value={p.id} />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/produits/${p.id}`} className="font-semibold hover:underline">{p.nom}</Link>
                    <p className="text-xs text-slate-500">
                      {!categorieId && <>{p.categorie.emoji} {p.categorie.nom} · </>}
                      {options.length > 0 ? options.map((g) => g.nom).join(", ") : "Sans option"}
                      {p.prix === 0 && <span className="ml-1 font-bold text-amber-700">· prix à définir</span>}
                    </p>
                    {p.prix === 0 && p.prixIndicatif != null && (
                      <p className="text-xs text-slate-600">
                        Ta liste : <span className="font-bold tabular-nums">{prixPourChamp(p.prixIndicatif)} ₪</span> — à vérifier sur Wolt.
                      </p>
                    )}
                    {prixNonVerifie(p) && (
                      <p className="text-xs font-semibold text-amber-700">
                        En vente au prix de ta liste, pas vérifié sur Wolt : note le prix Wolt dans « Achat ».
                      </p>
                    )}
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="w-24">
                      <label htmlFor={`prix-${p.id}`} className="block text-[11px] font-semibold text-slate-500">Prix ₪</label>
                      <input id={`prix-${p.id}`} name={`prix_${p.id}`} defaultValue={p.prix ? prixPourChamp(p.prix) : ""} inputMode="decimal" placeholder="—" className="champ px-2.5 py-2" />
                    </div>
                    <div className="w-24">
                      <label htmlFor={`achat-${p.id}`} className="block text-[11px] font-semibold text-slate-500">Achat ₪</label>
                      <input id={`achat-${p.id}`} name={`achat_${p.id}`} defaultValue={prixPourChamp(p.prixAchat)} inputMode="decimal" placeholder="—" className="champ px-2.5 py-2" />
                    </div>
                    <label className="flex flex-col items-center gap-1 pb-1.5 text-[11px] font-semibold text-slate-500">
                      En ligne
                      <input type="checkbox" name={`actif_${p.id}`} defaultChecked={p.actif || p.prix === 0} className="h-6 w-6 accent-marque" />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="sticky bottom-3 z-10">
            <button type="submit" className="bouton w-full py-4 text-base shadow-flottant">
              Enregistrer les {produits.length} article{produits.length > 1 ? "s" : ""}
            </button>
          </div>
          <p className="text-xs text-slate-500">
            Prix vide = article masqué (même si « En ligne » est coché). Le prix d&apos;achat reste visible par toi seul et sert à calculer ta marge.
          </p>
        </form>
      )}
    </div>
  );
}
