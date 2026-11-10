import { reglagesPublics } from "@/lib/reglages";
import { heureLimitePassee, joursDeLivraison } from "@/lib/creneaux";
import { clientConnecte } from "@/lib/client";
import { PageDuPanier } from "./PageDuPanier";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon panier" };

export default async function Panier() {
  const reglages = await reglagesPublics();
  // Les jours livrés et leurs créneaux encore possibles, calculés à l'heure de la demande.
  const jours = joursDeLivraison(reglages);
  const limitePassee = heureLimitePassee(reglages.heureLimite);
  const c = await clientConnecte();
  // Seulement ce que le formulaire affiche : jamais l'identifiant du compte.
  const client = c ? { email: c.email, nom: c.nom, telephone: c.telephone, ville: c.ville, adresse: c.adresse } : null;
  return <PageDuPanier reglages={reglages} jours={jours} limitePassee={limitePassee} client={client} />;
}
