import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { prixPourChamp } from "@/lib/argent";
import { FormulaireProduit } from "../FormulaireProduit";
import { donneesDuFormulaire } from "../donnees";
import { dupliquerProduit, supprimerProduit } from "../../actions";
import { lireGroupes, optionsEnTexte } from "@/lib/options";
import { Messages } from "@/components/admin/Messages";
import { PhotoWolt } from "@/components/admin/PhotoWolt";
import { RepereWolt } from "@/components/admin/RepereWolt";
import { repereWolt } from "@/lib/repere-wolt";

export const metadata = { title: "Modifier un produit" };

export default async function ModifierProduit({ params, searchParams }: PageProps<"/admin/produits/[id]">) {
  await exigerAdmin();
  const { id } = await params;
  const messages = await searchParams;
  const [p, { categories, boutiques }] = await Promise.all([
    prisma.produit.findUnique({ where: { id } }),
    donneesDuFormulaire(),
  ]);
  if (!p) notFound();
  const repere = repereWolt(p.nom, p.nomWolt);

  return (
    <div className="space-y-4">
      <Link href="/admin/produits" className="text-sm font-semibold text-marque hover:underline">← Produits</Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">{p.nom}</h1>
        <form action={dupliquerProduit}>
          <input type="hidden" name="id" value={p.id} />
          <button type="submit" className="bouton-secondaire py-2 text-sm">Dupliquer</button>
        </form>
      </div>
      <Messages params={messages} />
      {/* Ce que Wolt montre pour cet article : pour le reconnaître, et le retrouver sur Wolt. */}
      {(repere.photo || repere.hebreu) && (
        <section aria-label="Sur Wolt" className="carte flex flex-wrap items-center gap-4 p-4">
          {repere.photo && <PhotoWolt photo={repere.photo} nom={p.nom} taille="grande" />}
          {/* Sur téléphone, le texte passe sous la photo (`min-w-48`) au lieu de se serrer à côté. */}
          <div className="min-w-48 flex-1 space-y-1">
            <p className="surtitre">Sur Wolt</p>
            <RepereWolt nom={p.nom} hebreu={repere.hebreu} exact={repere.exact} images={repere.images} />
            <p className="text-xs text-slate-500">
              {repere.photo
                ? "Cette photo ne sert qu'à toi, pour reconnaître l'article : le client ne la voit pas."
                : "Pas encore de photo de Wolt pour cet article : elle vient de tes captures du rayon."}
            </p>
          </div>
        </section>
      )}
      <FormulaireProduit
        categories={categories}
        boutiques={boutiques}
        produit={{
          id: p.id,
          nom: p.nom,
          description: p.description,
          prix: p.prix ? prixPourChamp(p.prix) : "",
          prixAchat: prixPourChamp(p.prixAchat),
          prixBarre: prixPourChamp(p.prixBarre),
          badge: p.badge,
          options: optionsEnTexte(lireGroupes(p.options)),
          epuise: p.epuise,
          categorieId: p.categorieId,
          boutique: p.boutique,
          lienWolt: p.lienWolt,
          nomWolt: p.nomWolt,
          ordre: String(p.ordre),
          actif: p.actif,
          photoUrl: p.photoUrl,
        }}
      />
      <form action={supprimerProduit} className="pt-4">
        <input type="hidden" name="id" value={p.id} />
        <button type="submit" className="bouton-danger text-sm">Supprimer ce produit</button>
        <p className="mt-1 text-xs text-slate-500">
          Les commandes déjà passées le gardent dans leur historique. Pour le retirer seulement du catalogue, décoche « En ligne ».
        </p>
      </form>
    </div>
  );
}
