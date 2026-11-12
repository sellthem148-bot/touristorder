import { NextResponse, type NextRequest } from "next/server";
import { aiguiller, COOKIE_LANGUE, DUREE_COOKIE_LANGUE_S, ENTETE_LANGUE } from "@/lib/langues";

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

  const adresse = requete.nextUrl.clone();
  adresse.pathname = a.chemin;
  const reponse = NextResponse.rewrite(adresse, { request: { headers: entetes } });
  // La langue de l'adresse devient celle du visiteur : un lien sans préfixe (un ancien e-mail) le ramène dans sa langue.
  if (cookie !== a.langue) {
    reponse.cookies.set(COOKIE_LANGUE, a.langue, { path: "/", maxAge: DUREE_COOKIE_LANGUE_S, sameSite: "lax", secure: process.env.NODE_ENV === "production" });
  }
  return reponse;
}

export const config = {
  // Tout sauf les fichiers de Next, les images générées et les fichiers publics.
  matcher: ["/((?!_next/|apercu/|logo/|produits/|uploads/|icon|apple-icon|favicon.ico|robots.txt|sitemap.xml).*)"],
};
