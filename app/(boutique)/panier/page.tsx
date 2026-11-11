import { reglagesPublics } from "@/lib/reglages";
import { heureLimitePassee } from "@/lib/creneaux";
import { joursOuverts } from "@/lib/livraisons";
import { clientConnecte } from "@/lib/client";
import { PageDuPanier } from "./PageDuPanier";

export const dynamic = "force-dynamic";
export const metadata = { title: "Mon panier", robots: { index: false } };

export default async function Panier({ searchParams }: PageProps<"/panier">) {
  // « Je ne trouve pas mon article » : /panier?demande=<ce qui est cherché> ouvre la demande libre.
  const brut = (await searchParams).demande;
  const texte = Array.isArray(brut) ? brut[0] : brut;
  const demande = typeof texte === "string" ? texte.slice(0, 200) : null;
  const reglages = await reglagesPublics();
  // Les jours livrés et leurs créneaux encore possibles, calculés à l'heure de la demande.
  const jours = await joursOuverts(reglages);
  const limitePassee = heureLimitePassee(reglages.heureLimite);
  const c = await clientConnecte();
  // Seulement ce que le formulaire affiche : jamais l'identifiant du compte.
  const client = c ? { email: c.email, nom: c.nom, telephone: c.telephone, ville: c.ville, adresse: c.adresse } : null;
  return <PageDuPanier reglages={reglages} jours={jours} limitePassee={limitePassee} client={client} demande={demande} />;
}
