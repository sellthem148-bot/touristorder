import { SIGLE } from "@/lib/sigle";

/**
 * Le sigle, en SVG : tuile encre et T blanc (ou l'inverse sur fond sombre), O couleur soleil.
 * Sans classe CSS ni police : il sert aussi aux images générées (icônes, aperçu de lien).
 * `pleinCadre` : un carré sans arrondi, pour une icône que le téléphone arrondit lui-même.
 */
export function Sigle({ taille = 36, clair = false, pleinCadre = false }: { taille?: number; clair?: boolean; pleinCadre?: boolean }) {
  const fond = clair ? SIGLE.blanc : SIGLE.encre;
  const lettre = clair ? SIGLE.encre : SIGLE.blanc;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={taille}
      height={taille}
      viewBox={`0 0 ${SIGLE.cote} ${SIGLE.cote}`}
      aria-hidden="true"
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width={SIGLE.cote} height={SIGLE.cote} rx={pleinCadre ? 0 : SIGLE.rayon} fill={fond} />
      <path d={SIGLE.t} fill={lettre} />
      <circle cx={SIGLE.o.cx} cy={SIGLE.o.cy} r={SIGLE.o.r} fill={SIGLE.soleil} />
    </svg>
  );
}
