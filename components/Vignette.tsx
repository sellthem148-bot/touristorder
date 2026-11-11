/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */

type Props = { url: string; emoji: string; alt: string; className?: string };

/**
 * Espace gérant seulement : la photo d'un produit, ou l'emoji de sa catégorie sur un fond gris.
 * Côté client, un article sans photo n'affiche pas d'image du tout (components/CarteProduit.tsx).
 */
export function Vignette({ url, emoji, alt, className = "" }: Props) {
  if (url) {
    return <img src={url} alt={alt} loading="lazy" className={`bg-white object-contain ${className}`} />;
  }
  return (
    <div className={`flex items-center justify-center bg-slate-100 text-3xl ${className}`} aria-hidden="true">
      {emoji}
    </div>
  );
}
