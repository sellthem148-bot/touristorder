import type { Metadata } from "next";
import { traduction } from "@/lib/traduction";
import { MesCommandes } from "./MesCommandes";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await traduction();
  return { title: t.commandes.titre, robots: { index: false } };
}

export default async function PageMesCommandes() {
  const { t } = await traduction();
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold sm:text-3xl">{t.commandes.titre}</h1>
      <MesCommandes />
    </div>
  );
}
