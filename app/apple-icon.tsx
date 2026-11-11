import { ImageResponse } from "next/og";
import { Sigle } from "@/components/Sigle";

// L'icône de l'écran d'accueil d'un téléphone (iOS arrondit lui-même les coins) : le sigle, plein cadre.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function IconeApple() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <Sigle taille={180} pleinCadre />
      </div>
    ),
    size,
  );
}
