import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { Messages } from "@/components/admin/Messages";
import { enregistrerCategorie, supprimerCategorie } from "../actions";

export const metadata = { title: "Catégories" };

function Champs({ c }: { c?: { nom: string; emoji: string; ordre: number; active: boolean } }) {
  return (
    <>
      <input name="emoji" defaultValue={c?.emoji ?? ""} placeholder="🛍️" aria-label="Emoji" className="champ w-16 px-2 py-2 text-center" />
      <input name="nom" defaultValue={c?.nom ?? ""} placeholder="Nom de la catégorie" aria-label="Nom" required className="champ min-w-40 flex-1 py-2" />
      <input name="ordre" defaultValue={c?.ordre ?? 0} inputMode="numeric" aria-label="Ordre" className="champ w-20 py-2" />
      <label className="flex items-center gap-1.5 text-sm">
        <input type="checkbox" name="active" defaultChecked={c?.active ?? true} /> Visible
      </label>
    </>
  );
}

export default async function PageCategories({ searchParams }: PageProps<"/admin/categories">) {
  await exigerAdmin();
  const params = await searchParams;
  const categories = await prisma.categorie.findMany({
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    include: { _count: { select: { produits: true } } },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Catégories</h1>
      <Messages params={params} />

      <section className="carte p-4">
        <h2 className="mb-3 font-bold">Nouvelle catégorie</h2>
        <form action={enregistrerCategorie} className="flex flex-wrap items-center gap-2">
          <Champs />
          <button type="submit" className="bouton py-2">Ajouter</button>
        </form>
      </section>

      <ul className="carte divide-y divide-slate-100">
        {categories.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2 p-3">
            <form action={enregistrerCategorie} className="flex flex-1 flex-wrap items-center gap-2">
              <input type="hidden" name="id" value={c.id} />
              <Champs c={c} />
              <button type="submit" className="bouton-secondaire py-2 text-sm">Enregistrer</button>
            </form>
            <Link href={`/admin/produits?categorie=${c.id}`} className="text-sm text-marque hover:underline">
              {c._count.produits} produit{c._count.produits > 1 ? "s" : ""}
            </Link>
            {c._count.produits === 0 && (
              <form action={supprimerCategorie}>
                <input type="hidden" name="id" value={c.id} />
                <button type="submit" className="text-sm text-red-700 hover:underline">Supprimer</button>
              </form>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-slate-500">
        Une catégorie masquée cache tous ses produits du catalogue. Ordre : les plus petits en premier.
      </p>
    </div>
  );
}
