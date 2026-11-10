/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */

type Props = { url: string; emoji: string; alt: string; className?: string };

/** La photo d'un produit, ou l'emoji de sa catégorie s'il n'en a pas. */
export function Vignette({ url, emoji, alt, className = "" }: Props) {
  if (url) {
    return <img src={url} alt={alt} loading="lazy" className={`bg-white object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-slate-100 text-4xl ${className}`} aria-hidden="true">
      {emoji}
    </div>
  );
}
