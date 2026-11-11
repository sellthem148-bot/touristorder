import type { MetadataRoute } from "next";
import { ADRESSE_DU_SITE } from "@/lib/marque";

// Ce que les moteurs de recherche peuvent parcourir : le catalogue et les pages d'information.
// Jamais l'espace gérant, l'espace client, le panier ni les pages de suivi (liens personnels).
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/compte", "/commandes", "/panier", "/suivi", "/recherche"] }],
    sitemap: `${ADRESSE_DU_SITE}/sitemap.xml`,
    host: ADRESSE_DU_SITE,
  };
}
