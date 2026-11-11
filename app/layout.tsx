import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { ADRESSE_DU_SITE, DESCRIPTION_DU_SITE, NOM_DU_SITE } from "@/lib/marque";

// Police variable : toutes les graisses, sans les énumérer.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });

const TITRE = `${NOM_DU_SITE} — vos courses livrées à votre logement en Israël`;

export const metadata: Metadata = {
  metadataBase: new URL(ADRESSE_DU_SITE),
  title: { default: TITRE, template: `%s · ${NOM_DU_SITE}` },
  description: DESCRIPTION_DU_SITE,
  applicationName: NOM_DU_SITE,
  openGraph: {
    type: "website",
    siteName: NOM_DU_SITE,
    locale: "fr_FR",
    title: TITRE,
    description: DESCRIPTION_DU_SITE,
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
