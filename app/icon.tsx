import { ImageResponse } from "next/og";
import { Sigle } from "@/components/Sigle";

// L'icône de l'onglet : le sigle.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default function Icone() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex" }}>
        <Sigle taille={64} />
      </div>
    ),
    size,
  );
}
