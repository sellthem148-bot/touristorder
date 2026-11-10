import Link from "next/link";

export const metadata = { title: "Page introuvable" };

export default function Introuvable() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="text-5xl" aria-hidden="true">🧭</p>
      <h1 className="text-2xl font-extrabold">Page introuvable</h1>
      <p className="text-slate-600">Cette page n&apos;existe pas, ou l&apos;article n&apos;est plus proposé.</p>
      <Link href="/" className="bouton px-6 py-3">Retour à l&apos;accueil</Link>
    </main>
  );
}
