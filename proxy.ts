import { NextResponse, type NextRequest } from "next/server";
import { aiguiller, COOKIE_LANGUE, ENTETE_LANGUE } from "@/lib/langues";

/**
 * Une adresse par langue. Le français garde les adresses sans préfixe (« /panier ») ; « /he/panier » est
 * la même page en hébreu : la demande est réécrite vers « /panier », et l'en-tête `x-langue` dit au serveur
 * dans quelle langue la rendre (lib/traduction.ts). Toute la décision est dans `aiguiller` (lib/langues.ts, testé).
 */
export function proxy(requete: NextRequest) {
  const { pathname, search } = requete.nextUrl;
  const cookie = requete.cookies.get(COOKIE_LANGUE)?.value;
  const a = aiguiller({ chemin: pathname, recherche: search, methode: requete.method, cookie, entete: requete.headers.get("accept-language") });

  if (a.action === "rediriger") return NextResponse.redirect(new URL(a.vers, requete.url), a.permanent ? 308 : 307);

  // L'en-tête vient toujours d'ici : celui qu'un visiteur aurait envoyé lui-même est écarté.
  const entetes = new Headers(requete.headers);
  entetes.delete(ENTETE_LANGUE);
  if (a.action === "laisser") return NextResponse.next({ request: { headers: entetes } });

  entetes.set(ENTETE_LANGUE, a.langue);
  if (a.action === "suivre") return NextResponse.next({ request: { headers: entetes } });

  // Le cookie `langue` n'est JAMAIS posé ici : il ne garde que le choix du visiteur (le sélecteur de langue,
  // `changerLangue`). Le poser à chaque adresse à préfixe défaisait ce choix : en production, les liens de la
  // page encore affichée (« /ru/… ») sont préchargés en arrière-plan, juste après qu'il a choisi le français.
  const adresse = requete.nextUrl.clone();
  adresse.pathname = a.chemin;
  return NextResponse.rewrite(adresse, { request: { headers: entetes } });
}

export const config = {
  // Tout sauf les fichiers de Next, les images générées et les fichiers publics.
  matcher: ["/((?!_next/|apercu/|logo/|produits/|uploads/|icon|apple-icon|favicon.ico|robots.txt|sitemap.xml).*)"],
};
