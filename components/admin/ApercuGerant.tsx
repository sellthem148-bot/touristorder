/* eslint-disable @next/next/no-img-element -- photos repère servies par /admin/repere (déjà réduites) */
import type { Repere } from "@/lib/vue-gerant";

// La photo de Wolt sur une carte ou une fiche de la boutique, là où l'article n'a pas encore sa photo.
// Ces deux morceaux ne sont rendus que si le serveur a donné `produit.repere` (lib/vue-gerant.ts) : au gérant
// connecté ; à tout le monde quand il a coché « Photos de Wolt pour tout le monde » (sa décision du 17 novembre
// 2026).
// L'étiquette « Wolt » que le gérant voyait sur chaque carte et chaque fiche n'existe plus (sa demande du
// 24 novembre 2026, une fois toutes les photos retouchées : « oui retire-moi l'étiquette Wolt » — prévenu qu'il
// ne distinguerait plus, sur le site, une photo de Wolt d'une photo libre). Il ne lui reste qu'un raccourci sur
// la fiche, « Changer la photo », en français et de gauche à droite : c'est son espace, même sur une page en
// hébreu. Le site ne nomme Wolt devant personne ; dans son espace (« Photos rapides », « Produits »), ces photos
// gardent leur marque « Wolt » : c'est là qu'il cherche l'article sur Wolt.

/** Dans la zone d'image d'une carte, à la place de l'icône du rayon. Recadrée sur l'article, comme dans « Photos rapides ». */
export function ApercuSurCarte({ repere, epuise = false }: { repere: Repere; epuise?: boolean }) {
  return (
    <div data-repere="carte" className={`relative aspect-[4/3] w-full overflow-hidden bg-white ${epuise ? "opacity-50 grayscale" : ""}`}>
      <img src={repere.photo} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover/tuile:scale-[1.05]" />
    </div>
  );
}

/** En tête de la fiche d'un article : la photo de Wolt entière ; pour le gérant, le chemin le plus court pour en poser une autre. */
export function ApercuSurFiche({ repere, id, nom }: { repere: Repere; id: string; nom: string }) {
  return (
    <div data-repere="fiche" className="en-fondu border-b border-slate-200 bg-white">
      <img src={repere.photo} alt={nom} className="mx-auto aspect-[384/211] max-h-64 w-full object-contain" />
      {repere.etiquette && (
        <p dir="ltr" lang="fr" data-etiquette-gerant className="flex justify-end bg-encre px-4 py-1.5 text-xs text-white">
          {/* Un lien ordinaire (pas `Link`) : la page s'ouvre sur la ligne de l'article, prête à recevoir l'image. */}
          <a href={`/admin/produits/photos#p-${id}`} className="font-semibold underline decoration-white/50 underline-offset-2 hover:decoration-white">
            Changer la photo
          </a>
        </p>
      )}
    </div>
  );
}
