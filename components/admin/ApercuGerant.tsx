/* eslint-disable @next/next/no-img-element -- photos repère servies par /admin/repere (privées, déjà réduites) */

// La vue du gérant sur son site (17 novembre 2026 : « grâce à ces images de Wolt je peux chercher les images
// qui correspondent à chaque produit — alors mets-moi les images »). Sur une carte ou une fiche de la boutique,
// là où l'article n'a pas encore sa photo, le gérant connecté voit celle de Wolt, avec l'étiquette « Wolt ».
// Ces deux morceaux ne sont rendus que si le serveur a donné `produit.repere` — ce qu'il ne fait que pour le
// gérant (lib/vue-gerant.ts) ; la photo elle-même n'est servie qu'à lui (`/admin/repere/…`).
// Textes en français, de gauche à droite : c'est son espace, même posé sur une page en hébreu.

/** Dans la zone d'image d'une carte, à la place de l'icône du rayon. Recadrée sur l'article, comme dans « Photos rapides ». */
export function ApercuSurCarte({ photo, epuise = false }: { photo: string; epuise?: boolean }) {
  return (
    <div data-repere-gerant="carte" className={`relative aspect-[4/3] w-full overflow-hidden bg-white ${epuise ? "opacity-50 grayscale" : ""}`}>
      <img src={photo} alt="" loading="lazy" className="h-full w-full object-cover" />
      {/* En bas à gauche : le « + » est en haut à gauche, les étiquettes de l'article en bas à droite. */}
      <span dir="ltr" className="pointer-events-none absolute bottom-0 left-0 rounded-tr-md bg-encre/85 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">Wolt</span>
    </div>
  );
}

/** En tête de la fiche d'un article : la photo de Wolt entière, et le chemin le plus court pour poser la vraie photo. */
export function ApercuSurFiche({ photo, id }: { photo: string; id: string }) {
  return (
    <div data-repere-gerant="fiche" dir="ltr" lang="fr" className="en-fondu border-b border-slate-200 bg-white">
      <img src={photo} alt="" className="mx-auto aspect-[384/211] max-h-64 w-full object-contain" />
      <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-encre px-4 py-2 text-xs text-white">
        <span>Photo de Wolt : toi seul la vois.</span>
        {/* Un lien ordinaire (pas `Link`) : la page s'ouvre sur la ligne de l'article, prête à recevoir l'image. */}
        <a href={`/admin/produits/photos#p-${id}`} className="font-semibold underline decoration-white/50 underline-offset-2 hover:decoration-white">
          Mettre sa photo
        </a>
      </p>
    </div>
  );
}
