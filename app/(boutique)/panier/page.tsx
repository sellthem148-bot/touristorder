import { reglagesPublics } from "@/lib/reglages";
import { joursProposes, libelleDuJour } from "@/lib/dates";
import { PageDuPanier } from "./PageDuPanier";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon panier" };

export default async function Panier() {
  const reglages = await reglagesPublics();
  const jours = joursProposes().map((j) => ({ valeur: j, libelle: libelleDuJour(j) }));
  return <PageDuPanier reglages={reglages} jours={jours} />;
}
