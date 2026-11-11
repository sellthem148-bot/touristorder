import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { NOM_DU_SITE, SLOGAN } from "@/lib/marque";

// Police variable : toutes les graisses, sans les énumérer.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

// L'adresse publique du site : pour les liens absolus des aperçus (image de partage).
const ADRESSE = process.env.NEXT_PUBLIC_SITE_URL || "https://www.touristorder.com";

export const metadata: Metadata = {
  metadataBase: new URL(ADRESSE),
  title: { default: `${NOM_DU_SITE} — livraison en Israël`, template: `%s · ${NOM_DU_SITE}` },
  description: SLOGAN,
  applicationName: NOM_DU_SITE,
  openGraph: {
    type: "website",
    siteName: NOM_DU_SITE,
    locale: "fr_FR",
    title: `${NOM_DU_SITE} — livraison en Israël`,
    description: SLOGAN,
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
