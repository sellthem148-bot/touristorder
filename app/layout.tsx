import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { NOM_DU_SITE, SLOGAN } from "@/lib/marque";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: `${NOM_DU_SITE} — livraison en Israël`, template: `%s · ${NOM_DU_SITE}` },
  description: SLOGAN,
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1557ff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${jakarta.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
