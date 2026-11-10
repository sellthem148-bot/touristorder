import type { NextConfig } from "next";

// Photos produits : Supabase Storage (bucket public) en production.
const supabase = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

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
