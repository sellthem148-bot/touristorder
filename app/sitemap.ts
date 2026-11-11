import type { MetadataRoute } from "next";
import { categoriesVisibles } from "@/lib/catalogue";
import { ADRESSE_DU_SITE } from "@/lib/marque";

// Le plan du site donné aux moteurs de recherche : l'accueil, les rayons, les pages d'information.
// Lu à la demande : un rayon ajouté ou masqué par le gérant y apparaît sans remise en ligne.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const page = (chemin: string, priorite: number, frequence: "daily" | "weekly" | "monthly"): MetadataRoute.Sitemap[number] => ({
    url: `${ADRESSE_DU_SITE}${chemin}`,
    changeFrequency: frequence,
    priority: priorite,
  });
  // Une base injoignable ne doit pas casser le plan du site : les pages fixes restent données.
  const rayons = await categoriesVisibles().catch(() => []);
  return [
    page("/", 1, "daily"),
    ...rayons.map((c) => page(`/categorie/${c.slug}`, 0.8, "daily")),
    page("/contact", 0.5, "monthly"),
    page("/conditions", 0.3, "monthly"),
    page("/confidentialite", 0.3, "monthly"),
    page("/mentions-legales", 0.3, "monthly"),
  ];
}
