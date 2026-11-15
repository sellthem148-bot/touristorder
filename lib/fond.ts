/**
 * Le fond de la boutique (côté client seulement — l'espace gérant garde son gris).
 *
 * - « nuit » : sombre, la couleur encre du logo, comme sur Wolt (demande du gérant, 16 novembre 2026 :
 *   « Wolt a mis un fond noir pour faire ressortir les produits »). Les tuiles blanches ressortent ; tout
 *   ce qui est écrit directement sur le fond passe en clair avec la variante `nuit:` (app/globals.css).
 * - « ivoire » : clair et chaud.
 *
 * Un seul interrupteur : changer cette valeur suffit à passer de l'un à l'autre (la variante `nuit:` ne
 * s'applique que sous `data-fond="nuit"`, posé par app/(boutique)/layout.tsx).
 */
export const FOND_DE_LA_BOUTIQUE: "nuit" | "ivoire" = "nuit";

export const FOND_SOMBRE = FOND_DE_LA_BOUTIQUE === "nuit";
