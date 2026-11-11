import { ImageResponse } from "next/og";
import { NOM_DU_SITE } from "@/lib/marque";
import { monogramme } from "@/components/EnTete";

// L'icône de l'onglet : le monogramme du logo.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icone() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0d1321",
          color: "#ffffff",
          borderRadius: 14,
          fontSize: 30,
          fontWeight: 700,
          letterSpacing: -1,
        }}
      >
        {monogramme(NOM_DU_SITE)}
      </div>
    ),
    size,
  );
}
