import { MesCommandes } from "./MesCommandes";

export const metadata = { title: "Mes commandes", robots: { index: false } };

export default function PageMesCommandes() {
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <h1 className="text-2xl font-extrabold sm:text-3xl">Mes commandes</h1>
      <MesCommandes />
    </div>
  );
}
