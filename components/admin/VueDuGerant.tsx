import Link from "next/link";
import { Eye, ImagePlus, Images } from "lucide-react";
import { vueDuGerant } from "@/lib/vue-gerant";
import { changerLaVueDuSite } from "@/app/admin/(protege)/actions";

/**
 * Le bandeau « Vue du gérant », sous l'en-tête de la boutique — rendu pour le gérant connecté seulement, rien
 * pour un client. Il dit ce qui est différent de ce que voient les clients (les photos de Wolt sur les articles
 * sans photo), et permet de voir le site comme eux. En français, de gauche à droite, quelle que soit la langue
 * de la page : c'est son espace.
 */
export async function BandeauDuGerant() {
  const vue = await vueDuGerant();
  if (!vue.gerant) return null;
  const bouton = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-white/30 px-2.5 py-1 font-semibold transition-colors hover:bg-white/10";
  return (
    <aside data-vue-gerant={vue.photosDeWolt ? "wolt" : "client"} dir="ltr" lang="fr" aria-label="Vue du gérant" className="bg-encre text-white print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-2 text-xs sm:text-[13px]">
        <p className="min-w-0 flex-1 basis-64 leading-snug">
          <strong className="font-semibold">Vue du gérant.</strong>{" "}
          {vue.photosDeWolt
            ? "Là où un article n'a pas encore sa photo, tu vois celle de Wolt. Tes clients voient l'icône du rayon, jamais ces photos."
            : "Tu vois le site comme tes clients : sans les photos de Wolt."}
        </p>
        <Link href="/admin/produits/photos" className={bouton}>
          <ImagePlus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> Mettre des photos
        </Link>
        <form action={changerLaVueDuSite}>
          <input type="hidden" name="vue" value={vue.photosDeWolt ? "client" : "wolt"} />
          <button type="submit" className={bouton}>
            {vue.photosDeWolt ? <Eye className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" /> : <Images className="h-3.5 w-3.5" strokeWidth={2} aria-hidden="true" />}
            {vue.photosDeWolt ? "Voir comme un client" : "Afficher les photos de Wolt"}
          </button>
        </form>
      </div>
    </aside>
  );
}
