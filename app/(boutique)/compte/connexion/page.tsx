import Link from "next/link";
import { redirect } from "next/navigation";
import { clientConnecte } from "@/lib/client";
import { FormulaireLien } from "./FormulaireLien";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace client", robots: { index: false } };

export default async function ConnexionClient({ searchParams }: PageProps<"/compte/connexion">) {
  if (await clientConnecte()) redirect("/compte");
  const lienInvalide = (await searchParams).erreur === "lien";

  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="carte space-y-4 p-6">
        <p className="text-4xl" aria-hidden="true">👋</p>
        <h1 className="text-2xl font-extrabold">Mon espace client</h1>
        <p className="text-slate-600">
          Pas de mot de passe : entre l&apos;adresse e-mail utilisée pour commander, on t&apos;envoie un lien pour entrer.
        </p>
        {lienInvalide && (
          <p role="alert" className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">
            Ce lien n&apos;est plus valable. Demande-en un nouveau ci-dessous.
          </p>
        )}
        <FormulaireLien />
      </div>
      <p className="text-center text-sm text-slate-600">
        Ton espace est créé automatiquement à ta première commande.{" "}
        <Link href="/commandes" className="font-bold text-marque hover:underline">Voir les commandes passées sur cet appareil</Link>
      </p>
    </div>
  );
}
