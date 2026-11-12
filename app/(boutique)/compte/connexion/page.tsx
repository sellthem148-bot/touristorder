import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { clientConnecte } from "@/lib/client";
import { traduction } from "@/lib/traduction";
import { FormulaireLien } from "./FormulaireLien";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await traduction();
  return { title: t.connexion.titre, robots: { index: false } };
}

export default async function ConnexionClient({ searchParams }: PageProps<"/compte/connexion">) {
  if (await clientConnecte()) redirect("/compte");
  const lienInvalide = (await searchParams).erreur === "lien";
  const { t } = await traduction();

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="carte space-y-4 p-6">
        <p className="surtitre">{t.connexion.surtitre}</p>
        <h1 className="text-2xl font-bold">{t.connexion.titre}</h1>
        <p className="text-slate-600">{t.connexion.intro}</p>
        {lienInvalide && (
          <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">{t.connexion.lienInvalide}</p>
        )}
        <FormulaireLien />
      </div>
      <p className="text-center text-sm text-slate-600">
        {t.connexion.creation}{" "}
        <Link href="/commandes" className="font-semibold text-encre underline decoration-slate-300 underline-offset-4 hover:decoration-encre">{t.connexion.voirCommandes}</Link>
      </p>
    </div>
  );
}
