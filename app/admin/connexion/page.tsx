import { redirect } from "next/navigation";
import { estAdmin } from "@/lib/admin";
import { NOM_DU_SITE } from "@/lib/marque";
import { FormulaireConnexion } from "./FormulaireConnexion";

export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion gérant", robots: { index: false } };

export default async function Connexion() {
  if (await estAdmin()) redirect("/admin");
  return (
    <main id="contenu" className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="carte w-full max-w-sm space-y-4 p-6">
        <div>
          <p className="text-sm font-semibold text-marque">{NOM_DU_SITE}</p>
          <h1 className="text-xl font-bold">Espace gérant</h1>
        </div>
        <FormulaireConnexion />
      </div>
    </main>
  );
}
