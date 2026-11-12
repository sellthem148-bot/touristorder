import type { Metadata, Viewport } from "next";
import { Geist, Heebo } from "next/font/google";
import "./globals.css";
import { ADRESSE_DU_SITE, NOM_DU_SITE } from "@/lib/marque";
import { LOCALE, remplir, sens } from "@/lib/langues";
import { langueActuelle, traduction } from "@/lib/traduction";

// Police variable : toutes les graisses, sans les énumérer. Elle couvre le latin et le cyrillique (russe).
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
// L'hébreu, que Geist ne dessine pas : téléchargé seulement par les pages qui en affichent.
const hebreu = Heebo({ subsets: ["hebrew"], variable: "--font-hebreu", display: "swap", preload: false });

// Le commit en service, lisible dans le code source de chaque page (<meta name="version">) : le seul
// moyen de vérifier de l'extérieur qu'une mise en ligne a bien eu lieu. Rien de secret (dépôt, commit).
const VERSION = (process.env.VERCEL_GIT_COMMIT_SHA ?? "").slice(0, 7);

export async function generateMetadata(): Promise<Metadata> {
  const { langue, ts } = await traduction();
  const titre = remplir(ts.meta.titre, { site: NOM_DU_SITE });
  return {
    metadataBase: new URL(ADRESSE_DU_SITE),
    title: { default: titre, template: `%s · ${NOM_DU_SITE}` },
    description: ts.meta.description,
    applicationName: NOM_DU_SITE,
    openGraph: {
      type: "website",
      siteName: NOM_DU_SITE,
      locale: LOCALE[langue].replace("-", "_"),
      title: titre,
      description: ts.meta.description,
    },
    twitter: { card: "summary_large_image" },
    ...(VERSION ? { other: { version: VERSION } } : {}),
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // La langue du visiteur donne celle de la page et son sens d'écriture (l'hébreu : de droite à gauche).
  const langue = await langueActuelle();
  return (
    <html lang={langue} dir={sens(langue)} className={`${geist.variable} ${hebreu.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
