@AGENTS.md

# CLAUDE.md

Tourist Order (touristorder.com) : site de livraison pour touristes en Israël (Next.js 16 App Router, Prisma 6, PostgreSQL / Supabase, Tailwind 4). Interface et code métier en français. Voir `README.md` pour le fonctionnement et le déploiement.

## Commandes

```bash
npm run dev          # serveur de développement
npm run typecheck    # tsc
npm run lint         # eslint
npm test             # vitest (tests/)
npx prisma db push   # applique prisma/schema.prisma en local (en production : fait par la mise en ligne, voir ci-dessous)
npm run seed         # catégories + réglages ; seed:demo ajoute des produits d'exemple (jamais en production)
```

## Règles

- Montants en **agorot** (Int). Calcul unique : `lib/calcul.ts`. Le serveur recalcule depuis la base (`lib/commandes.ts`).
- `exigerAdmin()` en tête de chaque page et action de `app/admin/(protege)`.
- Pages publiques : produits lus via `PRODUIT_PUBLIC` (`lib/catalogue.ts`) — jamais `prixAchat`, `boutique`, `lienWolt`.
- Apparence (côté client) : sobre — encre (`bg-encre`), blanc, traits fins, gris neutres (les classes `slate-*` sont remappées dans `@theme`), un seul accent (`marque`, pour les liens et le focus). **Aucun emoji côté client** : icônes au trait de `lucide-react` (`IconeRayon` pour un rayon, d'après son adresse). Un article est une ligne de menu (`CarteProduit`) : nom, format, prix — la photo seulement s'il y en a une, jamais d'image de remplacement. Arrondis et graisses se règlent dans `@theme` (`--radius-*`, `--font-weight-*`), pas classe par classe. Logo : le sigle (un T et un O plein couleur `soleil` dans une tuile encre) a UN tracé, `lib/sigle.ts`, rendu par `components/Sigle.tsx` (SVG sans classe ni police : il sert aussi aux images générées) ; le jaune `soleil` est réservé à ce O. L'icône de l'onglet et la carte d'aperçu de lien sont générées avec lui (`app/icon.tsx`, `app/apple-icon.tsx`, `app/opengraph-image.tsx`, police dans `assets/polices/`), et les fichiers de `public/logo/` portent le même tracé (`tests/logo.test.ts`) : changer le dessin = changer `lib/sigle.ts` ET refaire ces fichiers.
- Classes CSS maison = `@utility` dans `app/globals.css` (pas `@layer components` : sorti de sa couche par le chargeur Turbopack, il écrasait les utilitaires).
- Formulaire non contrôlé + `useActionState` : React le vide après l'action et un `<select>` perd sa valeur → reconstruire le formulaire (`key`) avec les valeurs renvoyées (voir `FormulaireProduit.tsx`), ou utiliser des champs contrôlés (`PageDuPanier.tsx`).
- Jours = jours israéliens (`lib/dates.ts`), stockés `AAAA-MM-JJ`.
- Options produit (variantes) : `lib/options.ts` seulement — saisie admin, clé de panier, validation et supplément côté serveur.
- Mobile : une case `sr-only` reste dans un parent `relative` (sinon, dans une rangée qui défile, elle élargit la page), et `fieldset { min-inline-size: 0 }`. Une grille à une colonne s'écrit `grid grid-cols-1` (colonne `minmax(0,1fr)`) : sans cela un texte `truncate` (nom d'article long) élargit la page. Vérifier la largeur avec `innerWidth <= screen.width` : une page trop large se dézoome et `scrollWidth === innerWidth` ne voit rien.
- Un produit à `prix = 0` est « à définir » : jamais visible ni commandable (`VISIBLE` dans `lib/catalogue.ts`, `creerCommande`), jamais en ligne (`produitSchema`, `basculerProduit`).
- Tarifs selon le moment : `lib/tarifs.ts` seulement (pur, partagé panier/serveur). Le moment = jour + début du créneau ; la commande copie `tarifNom`, `majorationPct`, et les frais (`tarif*`) pour les recalculs.
- Villes livrées : table `Ville` ; livraison = `fraisDeLivraison` (`lib/villes.ts`, pur, partagé) = tarif du moment + supplément de la ville (+ express). Le minimum = le plus élevé (général, ville). La commande copie `supplementVille`.
- Jours et créneaux proposés : `joursDeLivraison(reglages)` (`lib/creneaux.ts`, pur) — jours livrés ; le jour même seulement avant `heureLimite` et pour les créneaux qui commencent après maintenant + `delaiPreparation`.
- Connexion admin : seuls les échecs comptent (`bloque` / `noterEchec`, `lib/limite.ts`). Utilisé par le panier ET par `creerCommande`.
- La base du catalogue est `prisma/catalogue.ts` (articles « à compléter », sans prix : n'y mettre aucun prix). Les articles réels de Wolt Market, avec leur prix, sont dans `prisma/articles-wolt.ts` (prix normal de Wolt, jamais le prix promo ; nom français pour le client, `nomWolt` en hébreu pour le gérant). Chaque relevé de boutique est un LOT (`LOTS_WOLT` dans `prisma/remplissage.ts` : Wolt Market, Dynamica dans `prisma/articles-dynamica.ts`…), installé UNE SEULE FOIS (`installerLesArticlesWolt` : dès qu'un article du lot existe, reconnu à son `nomWolt`, ce lot n'est plus touché ; un nouveau lot s'ajoute sans toucher aux autres) — ensuite les prix se gèrent dans l'admin ; ne jamais écraser un prix posé par le gérant. `npm run seed:demo` est le jeu de test (base entière + 18 prix inventés, sans les articles Wolt) : les parcours navigateur en dépendent.
- `Produit.nomWolt` est réservé à l'admin, comme `prixAchat`, `boutique`, `lienWolt` : jamais dans `PRODUIT_PUBLIC`.
- Clé de session (gérant et clients) : `cleDeSession()` (`lib/cle-session.ts`) seulement — `SESSION_SECRET`, sinon une clé dérivée (HMAC) de `SUPABASE_JWT_SECRET` / `POSTGRES_PASSWORD` posés par l'intégration ; une `SESSION_SECRET` trop courte reste une erreur.
- Photos produit : allégées dans le navigateur avant l'envoi (`reduirePhoto`, `lib/reduire-photo.ts` : 1 600 px, JPEG), puis revérifiées par le serveur (`lib/image.ts` : type lu dans les octets, 4 Mo au plus). Vercel refuse toute requête de plus de 4,5 Mo : ne jamais remonter `TAILLE_MAX_IMAGE` au-delà.
- Pages d'erreur : `app/error.tsx` (propriété `retry` dans cette version de Next, pas `reset`) et `app/not-found.tsx` — jamais de détail technique au visiteur.
- Espace client : `exigerClient()` en tête de chaque page/action de `/compte`, et l'id du client connecté dans chaque `where` (propriété). Jetons `lib/session-client.ts` (usage « lien » ≠ « session » ≠ admin). Connexion : même réponse que le compte existe ou non.
- E-mails : gabarits purs dans `lib/courriels.ts` (tout texte externe via `echapper`), envoi `lib/courriel.ts` (Resend, ne lève jamais, `after()`), en dev écrits dans `.courriels/`. Ce qui part chez Resend : `corpsPourResend` (pur, testé) ; `EMAIL_REPONSE` (facultative) devient l'en-tête de réponse. Le bandeau porte le logo (`adresseDuLogo(site)` → une image de `public/logo`, facultative) ; le nom reste du texte. Montants : `lignesDeMontants` (`lib/montants.ts`).
- Un client connecté commande avec l'e-mail de son compte ; le profil d'un compte n'est mis à jour par une commande que si c'est ce client qui est connecté.
- Production (Vercel + Supabase créée depuis Vercel) : l'adresse de la base et les clés Supabase se lisent par `lib/adresses-base.ts` seulement (`DATABASE_URL`, sinon `POSTGRES_PRISMA_URL` posée par l'intégration ; jamais `process.env.DATABASE_URL` ailleurs). `npm run build` lance `prisma/preparer.ts` : pour un déploiement de production seulement (`VERCEL_ENV=production`), `db push` sans `--accept-data-loss`, RLS sur toutes les tables (`prisma/rls.sql`), catalogue de départ sur une base neuve seulement, dossier de photos. Un changement de schéma qui perd des données arrête donc la mise en ligne : le faire à la main, en connaissance de cause.
