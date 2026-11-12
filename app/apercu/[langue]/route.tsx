import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { Sigle } from "@/components/Sigle";
import { NOM_DU_SITE } from "@/lib/marque";
import { SIGLE } from "@/lib/sigle";
import { estLangue, LANGUES, sens } from "@/lib/langues";
import { dictionnaireServeur } from "@/lib/i18n";

// La carte d'aperçu quand un lien du site est partagé (WhatsApp, Messages, réseaux sociaux), une par
// langue : /apercu/fr, /apercu/he… (app/layout.tsx donne à chaque page celle de sa langue).
// Dessinées une fois, à la mise en ligne.
export const dynamic = "force-static";
export const dynamicParams = false;

export function generateStaticParams() {
  return LANGUES.map((langue) => ({ langue }));
}

const TAILLE_APERCU = { width: 1200, height: 630 };

// Les polices du site, licences OFL jointes : Geist (latin, cyrillique) et Heebo (hébreu). Sans elles la carte sort en maigre.
const police = (fichier: string) => readFile(join(process.cwd(), "assets", "polices", fichier));

/**
 * L'outil qui dessine la carte écrit toujours de gauche à droite : une ligne d'hébreu lui est donc
 * donnée dans l'ordre où elle se VOIT (retournée), et alignée à droite. Ces lignes ne mêlent ni
 * chiffres ni lettres latines (lib/i18n/serveur/he.ts, `meta.apercu`).
 */
const telleQuOnLaVoit = (ligne: string, droiteAGauche: boolean) => (droiteAGauche ? [...ligne].reverse().join("") : ligne);

export async function GET(_requete: Request, { params }: { params: Promise<{ langue: string }> }) {
  const { langue } = await params;
  if (!estLangue(langue)) return new Response(null, { status: 404 });
  const { apercu } = dictionnaireServeur(langue).meta;
  const droiteAGauche = sens(langue) === "rtl";
  const [gras, moyen, hebreuGras, hebreuMoyen] = await Promise.all([police("Geist-Bold.ttf"), police("Geist-Medium.ttf"), police("Heebo-Bold.ttf"), police("Heebo-Medium.ttf")]);
  const texte = droiteAGauche ? "Heebo" : "Geist";
  const cote = droiteAGauche ? "flex-end" : "flex-start";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: SIGLE.encre,
          color: SIGLE.blanc,
          padding: 72,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 26, flexDirection: droiteAGauche ? "row-reverse" : "row" }}>
          <Sigle taille={92} clair />
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, letterSpacing: -1.6 }}>{NOM_DU_SITE}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26, alignItems: cote, fontFamily: texte }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: cote, fontSize: 80, fontWeight: 700, lineHeight: 1.06, letterSpacing: droiteAGauche ? 0 : -3 }}>
            {apercu.lignes.map((ligne) => (
              <div key={ligne} style={{ display: "flex" }}>{telleQuOnLaVoit(ligne, droiteAGauche)}</div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: "#a1a1aa" }}>{telleQuOnLaVoit(apercu.sousTitre, droiteAGauche)}</div>
        </div>
      </div>
    ),
    {
      ...TAILLE_APERCU,
      fonts: [
        { name: "Geist", data: gras, weight: 700, style: "normal" },
        { name: "Geist", data: moyen, weight: 500, style: "normal" },
        { name: "Heebo", data: hebreuGras, weight: 700, style: "normal" },
        { name: "Heebo", data: hebreuMoyen, weight: 500, style: "normal" },
      ],
    },
  );
}
