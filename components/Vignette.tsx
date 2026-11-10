/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */

// Une couleur douce et stable par catégorie, pour les produits sans photo.
const PASTELS = ["bg-sky-100", "bg-amber-100", "bg-rose-100", "bg-emerald-100", "bg-violet-100", "bg-orange-100", "bg-teal-100"];

export function pastelDe(texte: string): string {
  let h = 0;
  for (const c of texte) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PASTELS[h % PASTELS.length];
}

type Props = { url: string; emoji: string; alt: string; className?: string; teinte?: string; grandEmoji?: boolean };

/** La photo d'un produit, ou l'emoji de sa catégorie sur un fond pastel. */
export function Vignette({ url, emoji, alt, className = "", teinte = "bg-slate-100", grandEmoji = false }: Props) {
  if (url) {
    return <img src={url} alt={alt} loading="lazy" className={`bg-white object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center ${teinte} ${grandEmoji ? "text-6xl" : "text-3xl"} ${className}`} aria-hidden="true">
      {emoji}
    </div>
  );
}
