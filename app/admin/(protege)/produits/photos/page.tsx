import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { repereWolt } from "@/lib/repere-wolt";
import { LignePhoto } from "./LignePhoto";

export const metadata = { title: "Photos rapides" };

const VUES = {
  "sans-photo": { libelle: "Sans photo", where: { photoUrl: "" } },
  "avec-photo": { libelle: "Avec photo", where: { photoUrl: { not: "" } } },
} as const;
type Vue = keyof typeof VUES;

/**
 * Photos rapides : tous les articles sans photo sur un écran, un bouton par article.
 * Sur téléphone, le bouton ouvre l'appareil photo ou la galerie ; la photo part aussitôt.
 */
export default async function PagePhotos({ searchParams }: PageProps<"/admin/produits/photos">) {
  await exigerAdmin();
  const params = await searchParams;
  const vue: Vue = params.vue === "avec-photo" ? "avec-photo" : "sans-photo";
  // Seulement les articles que le client voit : en ligne, avec un prix, dans un rayon actif.
  const enLigne = { actif: true, prix: { gt: 0 }, categorie: { active: true } };

  const [produits, sans, avec] = await Promise.all([
    prisma.produit.findMany({
      where: { ...enLigne, ...VUES[vue].where },
      orderBy: [{ categorie: { ordre: "asc" } }, { ordre: "asc" }, { nom: "asc" }],
      select: { id: true, nom: true, description: true, prix: true, photoUrl: true, nomWolt: true, categorie: { select: { nom: true } } },
    }),
    prisma.produit.count({ where: { ...enLigne, photoUrl: "" } }),
    prisma.produit.count({ where: { ...enLigne, photoUrl: { not: "" } } }),
  ]);
  const nombre = { "sans-photo": sans, "avec-photo": avec };

  // Regroupés par rayon, dans l'ordre du site.
  const parRayon = new Map<string, typeof produits>();
  for (const p of produits) parRayon.set(p.categorie.nom, [...(parRayon.get(p.categorie.nom) ?? []), p]);

  return (
    <div className="max-w-3xl space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold">Photos rapides</h1>
        <p className="text-sm text-slate-600">
          Les articles en ligne, rayon par rayon. Appuie sur « Ajouter », prends la photo ou choisis-la : elle est allégée et enregistrée aussitôt.
          Une photo nette, de face, sur fond clair. « Chercher une image » lance une recherche avec le nom exact de l&apos;article sur Wolt.
        </p>
      </div>
      <nav aria-label="Filtrer les articles" className="flex gap-2">
        {(Object.keys(VUES) as Vue[]).map((v) => (
          <Link
            key={v}
            href={v === "sans-photo" ? "/admin/produits/photos" : `/admin/produits/photos?vue=${v}`}
            aria-current={v === vue ? "page" : undefined}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${v === vue ? "bg-marque text-white" : "border border-slate-200 bg-white hover:border-marque"}`}
          >
            {VUES[v].libelle} ({nombre[v]})
          </Link>
        ))}
      </nav>

      {produits.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">
          {vue === "sans-photo" ? "Tous les articles en ligne ont une photo." : "Aucun article n'a encore de photo."}
        </p>
      ) : (
        [...parRayon].map(([rayon, articles]) => (
          <section key={rayon} className="space-y-2" aria-label={rayon}>
            <h2 className="font-bold">{rayon} <span className="text-sm font-normal text-slate-500">({articles.length})</span></h2>
            <ul className="carte divide-y divide-slate-100">
              {articles.map((p) => (
                <LignePhoto key={p.id} id={p.id} nom={p.nom} nomWolt={repereWolt(p.nom, p.nomWolt).hebreu} photoWolt={repereWolt(p.nom, p.nomWolt).photo} detail={[p.description, formatPrix(p.prix)].filter(Boolean).join(" · ")} photoUrl={p.photoUrl} />
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
