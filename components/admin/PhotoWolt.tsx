/* eslint-disable @next/next/no-img-element -- photo repère servie par une route réservée au gérant */

type Props = {
  /** L'adresse de la photo (`repereWolt(...).photo`, `photoRepere(...)`) : une route réservée au gérant. */
  photo: string;
  /** Le nom de l'article en français, pour les lecteurs d'écran. */
  nom: string;
  /** `liste` : dans une longue liste (Produits) ; `ligne` : là où on cherche l'article ; `grande` : la photo entière (fiche). */
  taille?: "liste" | "ligne" | "grande";
};

const CADRES = {
  liste: "h-[60px] w-20",
  ligne: "h-[84px] w-28 sm:h-[108px] sm:w-36",
  grande: "aspect-[384/211] w-72 max-w-full",
};

/**
 * La photo que Wolt montre pour un article (tirée des captures du gérant), dans SON espace seulement : c'est
 * elle qui lui dit quel article chercher — il ne les connaît pas tous (15 novembre 2026 : « je veux toutes
 * les photos de Wolt, comme ça je sais ce que je cherche »). Dans une liste elle est recadrée sur l'article
 * (le milieu de la carte de Wolt), pour qu'il se reconnaisse d'un coup d'œil ; un toucher l'ouvre en entier.
 * L'étiquette « Wolt » rappelle que ce n'est pas la photo que voit le client. Jamais côté client.
 */
export function PhotoWolt({ photo, nom, taille = "ligne" }: Props) {
  return (
    <a
      href={photo}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Voir la photo Wolt de ${nom}`}
      data-photo-wolt={taille}
      className={`relative block shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white ${CADRES[taille]}`}
    >
      <img src={photo} alt="" loading="lazy" className={`h-full w-full ${taille === "grande" ? "object-contain" : "object-cover"}`} />
      <span className="absolute bottom-0 end-0 rounded-ss-md bg-encre/85 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">Wolt</span>
    </a>
  );
}
