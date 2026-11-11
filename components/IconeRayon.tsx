import {
  Apple, Baby, Beef, Cookie, Croissant, CupSoda, Flame, Gift, Milk, Package, Pill, Plug, Shirt, ShoppingBasket, Snowflake, SprayCan, Sun,
  type LucideIcon,
} from "lucide-react";

// Une icône au trait par rayon (reconnu à son adresse) : jamais d'emoji côté client.
const PAR_RAYON: Record<string, LucideIcon> = {
  "courses-epicerie": ShoppingBasket,
  "cremerie-oeufs": Milk,
  "pain-patisserie": Croissant,
  "boissons": CupSoda,
  "fruits-legumes": Apple,
  "boucherie-poisson": Beef,
  "surgeles-glaces": Snowflake,
  "apero-snacks": Cookie,
  "bebe-enfants": Baby,
  "plage-soleil": Sun,
  "chargeurs-electronique": Plug,
  "vetements": Shirt,
  "pharmacie-hygiene": Pill,
  "maison-entretien": SprayCan,
  "shabbat-casher": Flame,
  "cadeaux-fleurs": Gift,
};

/** L'icône d'un rayon ; un colis pour un rayon créé par le gérant. */
export function IconeRayon({ slug, className = "h-5 w-5" }: { slug: string; className?: string }) {
  const Icone = PAR_RAYON[slug] ?? Package;
  return <Icone className={className} strokeWidth={1.6} aria-hidden="true" />;
}
