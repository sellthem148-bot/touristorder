/* eslint-disable @next/next/no-img-element -- photos venant du stockage (Supabase ou /uploads en local) */
"use client";

/**
 * Une photo d'article. Si elle n'a pas fini de charger quand la page devient active, elle reste
 * transparente puis arrive en fondu (`img.photo[data-chargee]`, app/globals.css) au lieu de surgir d'un coup.
 *
 * L'état est posé dans le navigateur seulement, sur l'élément lui-même (`data-chargee`) : sans JavaScript,
 * pour un moteur de recherche et à l'impression, la photo s'affiche comme n'importe quelle image.
 * - « deja » : chargée avant que la page soit active — rien ne bouge ;
 * - « attente » puis « oui » : elle charge, puis arrive en fondu ;
 * - « non » : elle n'a pas pu être chargée.
 */
export function Photo({ src, alt = "", className = "", paresseuse = true }: { src: string; alt?: string; className?: string; paresseuse?: boolean }) {
  return (
    <img
      src={src}
      alt={alt}
      loading={paresseuse ? "lazy" : undefined}
      className={`photo ${className}`}
      ref={(el) => {
        if (el && !el.dataset.chargee) el.dataset.chargee = el.complete ? "deja" : "attente";
      }}
      onLoad={(e) => {
        if (e.currentTarget.dataset.chargee === "attente") e.currentTarget.dataset.chargee = "oui";
      }}
      onError={(e) => {
        e.currentTarget.dataset.chargee = "non";
      }}
    />
  );
}
