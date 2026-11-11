import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { Sigle } from "@/components/Sigle";
import { NOM_DU_SITE } from "@/lib/marque";
import { SIGLE } from "@/lib/sigle";

// La carte d'aperçu quand le lien du site est partagé (WhatsApp, Messages, réseaux sociaux).
export const alt = `${NOM_DU_SITE} — tes courses livrées à ton logement, le soir même`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// La police du site (Geist, licence OFL jointe) : sans elle la carte sort en maigre.
const police = (fichier: string) => readFile(join(process.cwd(), "assets", "polices", fichier));

export default async function Apercu() {
  const [gras, moyen] = await Promise.all([police("Geist-Bold.ttf"), police("Geist-Medium.ttf")]);
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
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          <Sigle taille={92} clair />
          <div style={{ display: "flex", fontSize: 54, fontWeight: 700, letterSpacing: -1.6 }}>{NOM_DU_SITE}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div style={{ display: "flex", fontSize: 80, fontWeight: 700, lineHeight: 1.06, letterSpacing: -3, maxWidth: 1000 }}>
            Tes courses livrées à ton logement, le soir même.
          </div>
          <div style={{ display: "flex", fontSize: 32, fontWeight: 500, color: "#a1a1aa" }}>Israël · Service en français · Paiement à la livraison</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: gras, weight: 700, style: "normal" },
        { name: "Geist", data: moyen, weight: 500, style: "normal" },
      ],
    },
  );
}
