// La clé Google Maps du site : c'est elle qui met en service l'adresse vérifiée par Google, au panier.
//
// C'est une clé « navigateur » : publique par nature — elle part dans la page de chaque visiteur du panier.
// Ce qui la protège, ce sont ses restrictions dans Google Cloud (les adresses du site, et deux API seulement :
// « Maps JavaScript API » et « Places API (New) »), pas le secret. Le gérant ne peut pas ouvrir les réglages
// de Vercel : elle vit donc ici, dans le code, et nulle part ailleurs (tests/adresse-google.test.ts).
// Vide : rien de Google n'est chargé, le champ d'adresse reste un champ ordinaire.
export const CLE_GOOGLE_MAPS_DU_SITE = "";

/**
 * La clé que la page du panier donne au navigateur — à lire côté SERVEUR seulement.
 * - `NEXT_PUBLIC_GOOGLE_MAPS_KEY`, si elle est posée, passe avant tout (un essai, le parcours avec le faux Google) ;
 * - sinon la clé du site, pour le site EN LIGNE seulement (`VERCEL_ENV=production`) : Google ne l'accepte que
 *   depuis touristorder.com — en local, dans un aperçu ou dans les tests, elle ne ferait que des refus ;
 * - sinon rien.
 */
export function cleGoogleMaps(env: Record<string, string | undefined> = process.env): string {
  const posee = (env.NEXT_PUBLIC_GOOGLE_MAPS_KEY ?? "").trim();
  if (posee) return posee;
  return env.VERCEL_ENV === "production" ? CLE_GOOGLE_MAPS_DU_SITE.trim() : "";
}
