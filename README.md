# Courses Express (nom provisoire)

Service de livraison pour les touristes en Israël : le client commande sur le site, le gérant passe la commande sur Wolt, réceptionne, reconditionne et livre. Paiement à la livraison (espèces ou Bit).

Le nom affiché se change en un seul endroit : la variable `NEXT_PUBLIC_NOM_DU_SITE` (ou `lib/marque.ts`).

## Ce que fait le site

**Côté client** (web app mobile, en français, sans compte)
- Catalogue par catégories (tuiles), rayons qui défilent, recherche, rubrique « Les plus demandés » (produits Populaire / Promo).
- **Fiche produit** au toucher : grande photo, description, **options obligatoires** (taille, modèle, couleur… avec supplément éventuel), quantité.
- Badges Populaire / Nouveau / Promo (avec prix barré) ; un produit **épuisé** reste visible mais ne se commande pas.
- Panier enregistré dans le navigateur ; à l'ouverture, prix et options sont remis à jour depuis la base et ce qui n'existe plus est retiré.
- Commande : nom, WhatsApp, ville, hôtel, jour, créneau, **livraison express** (supplément), **si un article manque** (me contacter / remplacer / retirer), **mode de paiement**, **pourboire**, note libre.
- Page de suivi (lien secret) en frise : étape en cours, articles indisponibles non facturés, bouton WhatsApp. Elle se met à jour toute seule.
- **Mes commandes** : le navigateur garde les liens de suivi de ses commandes (sans compte).

**Côté gérant** (`/admin`, protégé par mot de passe)
- **Commandes** : en cours, livrées, annulées. Rafraîchissement automatique toutes les 30 s.
- **Détail d'une commande** :
  - la liste de courses regroupée par boutique Wolt, avec le lien Wolt de chaque article et un bouton « Copier la liste » ;
  - l'ajustement d'une quantité ou le marquage « indisponible », qui recalcule le total ;
  - le bouton d'étape suivante ;
  - le bouton « Écrire au client sur WhatsApp », avec un message pré-rempli adapté à l'étape ;
  - la marge estimée et une note interne.
- **Prix rapides** : tous les articles d'une catégorie (ou « À compléter » : ceux sans prix) sur un écran, prix de vente, prix d'achat et « En ligne » pour chacun, un seul bouton pour tout enregistrer. Une valeur illisible n'enregistre rien et nomme l'article à corriger.
- **Tarifs** (selon le moment de la livraison) : des plages horaires (jours cochés + heures, minuit passé ou journée entière) avec leurs propres frais de service, livraison, express (0 = pas d'express) et une **majoration en % des articles** (ex. +10 % la nuit). La première plage active (par priorité) qui contient le moment s'applique, sinon le tarif de base des Réglages. Une grille de la semaine montre quel tarif s'applique à chaque heure. Le client voit le tarif changer en direct quand il choisit le jour et le créneau ; la commande garde le tarif appliqué.
- **Statistiques** : chiffre, marge estimée et panier moyen (jour, 7 jours, 30 jours), chiffre par jour, les plus vendus, pourboires, part d'express.
- **Produits** : filtres « À compléter (sans prix) / En ligne / Masqués / Épuisés ». Nom, description, photo, prix de vente (vide = à définir : jamais visible ni commandable), prix barré, badge, options (une par ligne : `Taille : 2 ans | 4 ans | 8 ans +10`), catégorie, ordre, en ligne / masqué, épuisé / en stock, bouton **Dupliquer**. Trois champs ne sont **visibles que par toi** : le prix d'achat sur Wolt, la boutique où le commander et le lien Wolt. Aucune page publique ne les lit (`PRODUIT_PUBLIC` dans `lib/catalogue.ts`).
- **Catégories** : créer, renommer, réordonner, masquer. Une catégorie qui contient des produits ne se supprime pas.
- **Réglages** : tarif de base (frais de service, livraison, supplément express (0 = pas d'express), minimum de commande), « Frais de service (livraison comprise) » en une seule ligne pour le client, pourboires proposés, modes de paiement, villes, créneaux, ton WhatsApp, message d'accueil, ouverture et fermeture des commandes.

## Lancer en local

Prérequis : Node 20.9 ou plus récent, et PostgreSQL.

```bash
cp .env.example .env        # puis renseigner ADMIN_PASSWORD et SESSION_SECRET
npm install
npx prisma db push          # crée les tables
npm run seed                # 12 catégories, réglages, 2 plages tarifaires d'exemple et la base du catalogue
                            # (135 articles SANS prix, masqués) — sans danger en production : n'écrase rien
npm run seed:demo           # (local seulement) + des prix inventés sur 18 articles, pour tester
npm run dev                 # http://localhost:3000, admin sur /admin
```

En local, sans Supabase, les photos sont enregistrées dans `public/uploads/`.

Vérifications : `npm run typecheck`, `npm run lint`, `npm test`, et les parcours dans un vrai navigateur (`tests/navigateur/README.md`).

## Mettre en ligne (Supabase + Vercel)

1. **Supabase** : créer un projet (région Europe, Francfort par exemple).
   - Récupérer dans Project Settings → Database → Connection string :
     - `DATABASE_URL` = « Transaction pooler » (port **6543**), en ajoutant `?pgbouncer=true` à la fin ;
     - `DIRECT_URL` = « Session pooler » (port **5432**).
   - Récupérer dans Project Settings → API : `NEXT_PUBLIC_SUPABASE_URL` et la clé **service_role** (`SUPABASE_SERVICE_ROLE_KEY`, secrète, jamais dans le navigateur).
   - Dans Storage, créer un bucket **public** nommé `produits`.
2. **Créer les tables**, depuis ton ordinateur, avec le `.env` qui pointe sur Supabase :
   ```bash
   npx prisma db push
   npm run seed
   ```
   Puis, dans l'admin : **Prix rapides** pour chiffrer les articles, **Tarifs** pour ajuster les plages d'exemple (week-end, soirée & nuit).
   Ensuite, dans le SQL editor de Supabase, lancer le contenu de `prisma/rls.sql`. Il active la « row level security » sur toutes les tables, sinon la clé publique de Supabase pourrait les lire. À refaire après chaque `db push` qui crée une table.
3. **Vercel** : importer le dépôt GitHub et renseigner les variables d'environnement :
   - `DATABASE_URL` et `DIRECT_URL` ;
   - `ADMIN_PASSWORD` : ton mot de passe gérant, long ;
   - `SESSION_SECRET` : obtenu avec `openssl rand -base64 48` ;
   - `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_BUCKET=produits` ;
   - `NEXT_PUBLIC_NOM_DU_SITE` : le nom choisi ;
   - `NEXT_PUBLIC_SITE_URL` (facultatif) : l'adresse publique, utilisée dans les liens de suivi envoyés sur WhatsApp.

   Puis déployer.
4. Dans `/admin/reglages` : renseigner ton numéro WhatsApp, les frais, les villes et les créneaux.

## Règles du code

- **Montants en agorot** (entiers : 12,90 ₪ = 1290). Jamais de nombre à virgule pour de l'argent. Le calcul d'une commande est unique (`lib/calcul.ts`) et le serveur recalcule toujours les prix depuis la base : le prix envoyé par le navigateur est ignoré.
- **Toute action ou page admin commence par `exigerAdmin()`.** Le layout ne protège pas les Server Actions, qui sont appelables directement.
- **Les pages publiques lisent les produits via `PRODUIT_PUBLIC`**, jamais un produit entier.
- **Une ligne de commande garde une copie du produit** (nom, prix, prix d'achat, boutique). Modifier ou supprimer un produit ne change pas les commandes passées.
- **Les classes maison** (`bouton`, `champ`, `carte`…) sont des `@utility` Tailwind, dans `app/globals.css`. Le chargeur Tailwind de Turbopack sortait les règles de `@layer components` de leur couche, et elles écrasaient alors `bg-…` ou `w-…`.
- Les jours sont des jours **israéliens** (`lib/dates.ts`).
- **Options d'un produit** : une seule définition (`lib/options.ts`) pour la saisie admin, le panier et le serveur, qui revérifie le choix et recalcule le supplément.
- **Mobile** : une case masquée (`sr-only`) doit rester dans un parent `relative` (la classe `pastille` l'est), et un `fieldset` doit pouvoir rétrécir (`min-inline-size: 0`, dans `globals.css`). Sans cela, une rangée qui défile élargissait toute la page sur téléphone.

## Pas encore fait (V2)

- Paiement en ligne (Stripe, PayPlus ou Tranzila).
- Notification automatique du gérant à chaque nouvelle commande (e-mail ou Telegram). Pour l'instant, la liste se rafraîchit toutes les 30 s et le client est invité à écrire sur WhatsApp.
- Plusieurs langues (anglais, hébreu).
- Fiche produit détaillée et variantes (tailles).
