import Link from "next/link";
import { exigerAdmin } from "@/lib/admin";
import { FormulaireProduit } from "../FormulaireProduit";
import { donneesDuFormulaire } from "../donnees";

export const metadata = { title: "Nouveau produit" };

export default async function NouveauProduit() {
  await exigerAdmin();
  const { categories, boutiques } = await donneesDuFormulaire();
  return (
    <div className="space-y-4">
      <Link href="/admin/produits" className="text-sm font-semibold text-marque hover:underline">← Produits</Link>
      <h1 className="text-2xl font-extrabold">Nouveau produit</h1>
      <FormulaireProduit categories={categories} boutiques={boutiques} />
    </div>
  );
}
