import type { Metadata } from "next";
import { Article, PageTexte, Paragraphe } from "@/components/PageTexte";
import { infosLegales } from "@/lib/reglages";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { NOM_DU_SITE } from "@/lib/marque";
import { heureLisible, remplir } from "@/lib/langues";
import { libelleDuMode } from "@/lib/i18n/rayons";
import { cadreDeLaPage } from "@/lib/pages-texte";
import { nomVille } from "@/lib/i18n/catalogue";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { j, adresses } = await cadreDeLaPage();
  return {
    title: j.conditions.titre,
    description: remplir(j.conditions.metaDescription, { site: NOM_DU_SITE }),
    alternates: adresses("/conditions"),
  };
}

export default async function Conditions() {
  const [i, { langue, t, j, accueil, retour, misAJour, avis }] = await Promise.all([infosLegales(), cadreDeLaPage()]);
  const c = j.conditions;
  const vendeur = i.nom || NOM_DU_SITE;
  const paiements = i.paiements.length > 0 ? i.paiements.map((m) => libelleDuMode(m, t)).join(", ") : c.paiementsParDefaut;
  const amplitude = amplitudeDesCreneaux(i.creneaux, langue);
  // La livraison : les villes, les horaires et l'heure limite du gérant, quand ils sont réglés.
  const livraison = [
    i.villes.length > 0 ? remplir(c.livraison.villes, { villes: i.villes.map((v) => nomVille(v, langue)).join(", ") }) : c.livraison.sansVilles,
    amplitude ? remplir(c.livraison.horaires, { amplitude }) : c.livraison.creneau,
    ...(i.heureLimite ? [remplir(c.livraison.limite, { heure: heureLisible(i.heureLimite, langue) })] : []),
  ].join(" ");
  return (
    <PageTexte titre={c.titre} accueil={accueil} retour={retour} misAJour={misAJour} avis={avis}>
      <Paragraphe langue={langue} texte={remplir(c.intro, { site: NOM_DU_SITE })} />

      <Article titre={c.service.titre}>
        <Paragraphe langue={langue} texte={remplir(c.service.p1, { vendeur })} />
      </Article>

      <Article titre={c.commande.titre}>
        <Paragraphe langue={langue} texte={c.commande.p1} />
        <Paragraphe langue={langue} texte={c.commande.p2} />
        <Paragraphe langue={langue} texte={c.commande.p3} />
      </Article>

      <Article titre={c.prix.titre}>
        <Paragraphe langue={langue} texte={c.prix.p1} />
        <Paragraphe langue={langue} texte={c.prix.p2} />
      </Article>

      <Article titre={c.paiement.titre}>
        <Paragraphe langue={langue} texte={remplir(c.paiement.p1, { paiements })} />
        <Paragraphe langue={langue} texte={c.paiement.p2} />
      </Article>

      <Article titre={c.livraison.titre}>
        <Paragraphe langue={langue} texte={livraison} />
        <Paragraphe langue={langue} texte={c.livraison.hotel} />
        <Paragraphe langue={langue} texte={c.livraison.p2} />
        <Paragraphe langue={langue} texte={c.livraison.p3} />
      </Article>

      <Article titre={c.indisponible.titre}>
        <Paragraphe langue={langue} texte={c.indisponible.p1} />
      </Article>

      <Article titre={c.annulation.titre}>
        <Paragraphe langue={langue} texte={c.annulation.p1} />
        <Paragraphe langue={langue} texte={c.annulation.p2} />
      </Article>

      <Article titre={c.reclamations.titre}>
        <Paragraphe langue={langue} texte={c.reclamations.p1} />
      </Article>

      <Article titre={c.produits.titre}>
        <Paragraphe langue={langue} texte={c.produits.p1} />
        <Paragraphe langue={langue} texte={c.produits.p2} />
      </Article>

      <Article titre={c.donnees.titre}>
        <Paragraphe langue={langue} texte={c.donnees.p1} />
      </Article>

      <Article titre={c.droit.titre}>
        <Paragraphe langue={langue} texte={c.droit.p1} />
        <Paragraphe langue={langue} texte={c.droit.p2} />
      </Article>
    </PageTexte>
  );
}
