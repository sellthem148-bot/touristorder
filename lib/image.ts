// Ce qu'est une image : décidé par ses OCTETS, jamais par le type annoncé.

export const TAILLE_MAX_IMAGE = 5 * 1024 * 1024;

export type TypeImage = { mime: string; extension: string };

export function typeDImage(octets: Uint8Array): TypeImage | null {
  const a = (i: number) => octets[i];
  if (octets.length >= 3 && a(0) === 0xff && a(1) === 0xd8 && a(2) === 0xff) {
    return { mime: "image/jpeg", extension: "jpg" };
  }
  if (
    octets.length >= 8 &&
    a(0) === 0x89 && a(1) === 0x50 && a(2) === 0x4e && a(3) === 0x47 &&
    a(4) === 0x0d && a(5) === 0x0a && a(6) === 0x1a && a(7) === 0x0a
  ) {
    return { mime: "image/png", extension: "png" };
  }
  if (
    octets.length >= 12 &&
    a(0) === 0x52 && a(1) === 0x49 && a(2) === 0x46 && a(3) === 0x46 &&
    a(8) === 0x57 && a(9) === 0x45 && a(10) === 0x42 && a(11) === 0x50
  ) {
    return { mime: "image/webp", extension: "webp" };
  }
  return null;
}
