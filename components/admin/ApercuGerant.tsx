/* eslint-disable @next/next/no-img-element -- photos repère servies par /admin/repere (déjà réduites) */
import type { Repere } from "@/lib/vue-gerant";

// La photo de Wolt sur une carte ou une fiche de la boutique, là où l'article n'a pas encore sa photo.
// Ces deux morceaux ne sont rendus que si le serveur a donné `produit.repere` (lib/vue-gerant.ts) : au gérant
// connecté, avec ses repères — l'étiquette « Wolt », « Mettre sa photo » — ; à tout le monde, sans rien d'autre
// que la photo, quand il a coché « Photos de Wolt pour tout le monde » (sa décision du 17 novembre 2026).
// Les repères du gérant sont en français, de gauche à droite : c'est son espace, même sur une page en hébreu.
// Le site ne nomme jamais Wolt devant un client : l'étiquette n'existe que pour le gérant.

/** Dans la zone d'image d'une carte, à la place de l'icône du rayon. Recadrée sur l'article, comme dans « Photos rapides ». */
export function ApercuSurCarte({ repere, epuise = false }: { repere: Repere; epuise?: boolean }) {
  return (
    <div data-repere="carte" className={`relative aspect-[4/3] w-full overflow-hidden bg-white ${epuise ? "opacity-50 grayscale" : ""}`}>
      <img src={repere.photo} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover/tuile:scale-[1.05]" />
      {/* En bas à gauche : le « + » est en haut à gauche, les étiquettes de l'article en bas à droite. */}
      {repere.etiquette && (
        <span dir="ltr" data-etiquette-gerant className="pointer-events-none absolute bottom-0 left-0 rounded-tr-md bg-encre/85 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-white">Wolt</span>
      )}
    </div>
  );
}

/** En tête de la fiche d'un article : la photo de Wolt entière ; pour le gérant, le chemin le plus court pour poser la vraie photo. */
export function ApercuSurFiche({ repere, id, nom }: { repere: Repere; id: string; nom: string }) {
  return (
    <div data-repere="fiche" className="en-fondu border-b border-slate-200 bg-white">
      <img src={repere.photo} alt={nom} className="mx-auto aspect-[384/211] max-h-64 w-full object-contain" />
      {repere.etiquette && (
        <p dir="ltr" lang="fr" data-etiquette-gerant className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 bg-encre px-4 py-2 text-xs text-white">
          <span>Photo de Wolt, en attendant la tienne.</span>
          {/* Un lien ordinaire (pas `Link`) : la page s'ouvre sur la ligne de l'article, prête à recevoir l'image. */}
          <a href={`/admin/produits/photos#p-${id}`} className="font-semibold underline decoration-white/50 underline-offset-2 hover:decoration-white">
            Mettre sa photo
          </a>
        </p>
      )}
    </div>
  );
}
