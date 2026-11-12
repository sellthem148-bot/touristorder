import type { MetadataRoute } from "next";
import { ADRESSE_DU_SITE } from "@/lib/marque";
import { LANGUES, lienPour } from "@/lib/langues";

// Ce que les moteurs de recherche peuvent parcourir : le catalogue et les pages d'information, dans chaque langue.
// Jamais l'espace gérant, l'espace client, le panier ni les pages de suivi (liens personnels) — à aucune de leurs adresses.
const PRIVE = ["/compte", "/commandes", "/panier", "/suivi", "/recherche"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", ...LANGUES.flatMap((langue) => PRIVE.map((chemin) => lienPour(langue, chemin)))] }],
    sitemap: `${ADRESSE_DU_SITE}/sitemap.xml`,
    host: ADRESSE_DU_SITE,
  };
}
