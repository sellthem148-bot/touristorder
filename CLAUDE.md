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
- La base du catalogue est `prisma/catalogue.ts` ; `npm run seed` n'ajoute que les articles absents (par nom) — n'y mettre aucun prix.
- Espace client : `exigerClient()` en tête de chaque page/action de `/compte`, et l'id du client connecté dans chaque `where` (propriété). Jetons `lib/session-client.ts` (usage « lien » ≠ « session » ≠ admin). Connexion : même réponse que le compte existe ou non.
- E-mails : gabarits purs dans `lib/courriels.ts` (tout texte externe via `echapper`), envoi `lib/courriel.ts` (Resend, ne lève jamais, `after()`), en dev écrits dans `.courriels/`. Montants : `lignesDeMontants` (`lib/montants.ts`).
- Un client connecté commande avec l'e-mail de son compte ; le profil d'un compte n'est mis à jour par une commande que si c'est ce client qui est connecté.
- Production (Vercel + Supabase créée depuis Vercel) : l'adresse de la base et les clés Supabase se lisent par `lib/adresses-base.ts` seulement (`DATABASE_URL`, sinon `POSTGRES_PRISMA_URL` posée par l'intégration ; jamais `process.env.DATABASE_URL` ailleurs). `npm run build` lance `prisma/preparer.ts` : pour un déploiement de production seulement (`VERCEL_ENV=production`), `db push` sans `--accept-data-loss`, RLS sur toutes les tables (`prisma/rls.sql`), catalogue de départ sur une base neuve seulement, dossier de photos. Un changement de schéma qui perd des données arrête donc la mise en ligne : le faire à la main, en connaissance de cause.
