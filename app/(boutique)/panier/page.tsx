import { reglagesPublics } from "@/lib/reglages";
import { joursDeLivraison } from "@/lib/creneaux";
import { PageDuPanier } from "./PageDuPanier";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon panier" };

export default async function Panier() {
  const reglages = await reglagesPublics();
  // Les jours livrés et leurs créneaux encore possibles, calculés à l'heure de la demande.
  const jours = joursDeLivraison(reglages.creneaux, reglages.joursLivres, reglages.delaiPreparation);
  return <PageDuPanier reglages={reglages} jours={jours} />;
}
