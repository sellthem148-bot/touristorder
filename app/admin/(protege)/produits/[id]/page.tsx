import Link from "next/link";
import { notFound } from "next/navigation";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { prixPourChamp } from "@/lib/argent";
import { FormulaireProduit } from "../FormulaireProduit";
import { donneesDuFormulaire } from "../donnees";
import { supprimerProduit } from "../../actions";

export const metadata = { title: "Modifier un produit" };

export default async function ModifierProduit({ params }: PageProps<"/admin/produits/[id]">) {
  await exigerAdmin();
  const { id } = await params;
  const [p, { categories, boutiques }] = await Promise.all([
    prisma.produit.findUnique({ where: { id } }),
    donneesDuFormulaire(),
  ]);
  if (!p) notFound();

  return (
    <div className="space-y-4">
      <Link href="/admin/produits" className="text-sm font-semibold text-marque hover:underline">← Produits</Link>
      <h1 className="text-2xl font-extrabold">{p.nom}</h1>
      <FormulaireProduit
        categories={categories}
        boutiques={boutiques}
        produit={{
          id: p.id,
          nom: p.nom,
          description: p.description,
          prix: prixPourChamp(p.prix),
          prixAchat: prixPourChamp(p.prixAchat),
          categorieId: p.categorieId,
          boutique: p.boutique,
          lienWolt: p.lienWolt,
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
