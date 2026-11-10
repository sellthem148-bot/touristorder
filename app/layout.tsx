import type { Metadata, Viewport } from "next";
import "./globals.css";
import { NOM_DU_SITE, SLOGAN } from "@/lib/marque";

export const metadata: Metadata = {
  title: { default: `${NOM_DU_SITE} — livraison en Israël`, template: `%s · ${NOM_DU_SITE}` },
  description: SLOGAN,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1d4ed8",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
