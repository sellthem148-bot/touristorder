import type { NextConfig } from "next";

// Photos produits : Supabase Storage (bucket public) en production.
// (NEXT_PUBLIC_SUPABASE_URL, ou SUPABASE_URL que l'intégration Supabase de Vercel pose.)
const adresseSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabase = adresseSupabase ? new URL(adresseSupabase).hostname : undefined;

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    // Une photo produit (5 Mo max) passe par une Server Action.
    serverActions: { bodySizeLimit: "6mb" },
  },
  images: {
    remotePatterns: supabase
      ? [{ protocol: "https", hostname: supabase, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
