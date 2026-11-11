import { ImageResponse } from "next/og";
import { NOM_DU_SITE } from "@/lib/marque";
import { monogramme } from "@/components/EnTete";

// L'icône de l'écran d'accueil d'un téléphone (iOS arrondit lui-même les coins).
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconeApple() {
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
          fontSize: 84,
          fontWeight: 700,
          letterSpacing: -3,
        }}
      >
        {monogramme(NOM_DU_SITE)}
      </div>
    ),
    size,
  );
}
