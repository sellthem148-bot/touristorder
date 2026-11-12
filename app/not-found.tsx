import Link from "next/link";
import type { Metadata } from "next";
import { traduction } from "@/lib/traduction";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await traduction();
  return { title: t.introuvable.metaTitre };
}

export default async function Introuvable() {
  const { t, lien } = await traduction();
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="surtitre">{t.introuvable.surtitre}</p>
      <h1 className="text-2xl font-bold">{t.introuvable.titre}</h1>
      <p className="text-slate-600">{t.introuvable.texte}</p>
      <Link href={lien("/")} className="bouton px-6 py-3">{t.introuvable.retour}</Link>
    </main>
  );
}
