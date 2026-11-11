import { ImageResponse } from "next/og";
import { NOM_DU_SITE } from "@/lib/marque";
import { monogramme } from "@/components/EnTete";

// La carte d'aperçu quand le lien du site est partagé (WhatsApp, Messages, réseaux sociaux).
export const alt = `${NOM_DU_SITE} — tes courses livrées à ton logement, le soir même`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Apercu() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0d1321",
          color: "#ffffff",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <div
            style={{
              width: 84,
              height: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#ffffff",
              color: "#0d1321",
              borderRadius: 18,
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: -1,
            }}
          >
            {monogramme(NOM_DU_SITE)}
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>{NOM_DU_SITE}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2.5, maxWidth: 980 }}>
            Tes courses livrées à ton logement, le soir même.
          </div>
          <div style={{ display: "flex", fontSize: 32, color: "#a1a1aa" }}>Israël · Service en français · Paiement à la livraison</div>
        </div>
      </div>
    ),
    size,
  );
}
