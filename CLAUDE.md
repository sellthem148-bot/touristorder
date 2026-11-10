@AGENTS.md

# CLAUDE.md

Site de livraison pour touristes en Israël (Next.js 16 App Router, Prisma 6, PostgreSQL / Supabase, Tailwind 4). Interface et code métier en français. Voir `README.md` pour le fonctionnement et le déploiement.

## Commandes

```bash
npm run dev          # serveur de développement
npm run typecheck    # tsc
npm run lint         # eslint
npm test             # vitest (tests/)
npx prisma db push   # applique prisma/schema.prisma (puis prisma/rls.sql sur Supabase)
npm run seed         # catégories + réglages ; seed:demo ajoute des produits d'exemple (jamais en production)
```

## Règles

- Montants en **agorot** (Int). Calcul unique : `lib/calcul.ts`. Le serveur recalcule depuis la base (`lib/commandes.ts`).
- `exigerAdmin()` en tête de chaque page et action de `app/admin/(protege)`.
- Pages publiques : produits lus via `PRODUIT_PUBLIC` (`lib/catalogue.ts`) — jamais `prixAchat`, `boutique`, `lienWolt`.
- Classes CSS maison = `@utility` dans `app/globals.css` (pas `@layer components` : sorti de sa couche par le chargeur Turbopack, il écrasait les utilitaires).
- Formulaire non contrôlé + `useActionState` : React le vide après l'action et un `<select>` perd sa valeur → reconstruire le formulaire (`key`) avec les valeurs renvoyées (voir `FormulaireProduit.tsx`), ou utiliser des champs contrôlés (`PageDuPanier.tsx`).
- Jours = jours israéliens (`lib/dates.ts`), stockés `AAAA-MM-JJ`.
- Nouvelle table → relancer `prisma/rls.sql` sur Supabase.
