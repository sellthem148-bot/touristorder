# Tourist Order (touristorder.com)

Service de livraison pour les touristes en Israël : le client commande sur le site, le gérant passe la commande sur Wolt, réceptionne, reconditionne et livre. Paiement à la livraison (espèces ou Bit).

Le nom affiché se change en un seul endroit : la variable `NEXT_PUBLIC_NOM_DU_SITE` (ou `lib/marque.ts`).

## Ce que fait le site

**Côté client** (web app mobile, en français, sans compte)
- Catalogue par catégories (tuiles), rayons qui défilent, recherche, rubrique « Les plus demandés » (produits Populaire / Promo).
- **Fiche produit** au toucher : grande photo, description, **options obligatoires** (taille, modèle, couleur… avec supplément éventuel), quantité.
- Badges Populaire / Nouveau / Promo (avec prix barré) ; un produit **épuisé** reste visible mais ne se commande pas.
- Panier enregistré dans le navigateur ; à l'ouverture, prix et options sont remis à jour depuis la base et ce qui n'existe plus est retiré.
- Commande : nom, WhatsApp, ville, hôtel, jour, créneau, **livraison express** (supplément), **si un article manque** (me contacter / remplacer / retirer), **mode de paiement**, **pourboire**, note libre.
- **Paiement à la commande** (Bit, PayBox, virement) : le client règle avant que le gérant commande sur Wolt. Les coordonnées de paiement ne sont jamais sur le site : le client les reçoit sur WhatsApp. Sa page de suivi dit où en est le paiement (en attente avec le montant, reçu, complément à régler, remboursement à venir).
- **« Je ne trouve pas mon article »** : une demande libre, dans le panier ou seule (recherche sans résultat → « Demander cet article »). Le gérant cherche l'article, l'ajoute à la commande avec son prix ; rien n'est à régler avant.
- **Pages d'information** : conditions générales de vente, confidentialité, mentions légales, contact (liens dans le pied de page ; les conditions sont rappelées au moment de commander). Le site **vouvoie** le client.
- Page de suivi (lien secret) en frise : étape en cours, articles indisponibles non facturés, bouton WhatsApp. Elle se met à jour toute seule.
- **E-mail de confirmation** à chaque commande (l'adresse e-mail est demandée à la commande) : livraison, articles, total, bouton « Suivre ma commande » et accès direct à l'espace client.
- **Espace client** (`/compte`), sans mot de passe : on y entre par un lien reçu par e-mail (celui de la confirmation, valable 7 jours, ou un lien demandé sur la page de connexion, valable 30 minutes). Tableau de bord (commandes, en cours, articles, total dépensé), commande en cours avec son avancement, articles préférés, historique d'achat détaillé avec **« Commander à nouveau »**, informations (nom, WhatsApp, ville, adresse) qui pré-remplissent la commande suivante, déconnexion, suppression de l'espace. L'espace est créé à la première commande.
- **Mes commandes** : le navigateur garde aussi les liens de suivi de ses commandes (sans se connecter).

**Côté gérant** (`/admin`, protégé par mot de passe)
- **Commandes** : en cours, livrées, annulées. Rafraîchissement automatique toutes les 30 s.
- **Détail d'une commande** :
  - la liste de courses regroupée par boutique Wolt, avec le lien Wolt de chaque article et un bouton « Copier la liste » ;
  - l'ajustement d'une quantité ou le marquage « indisponible », qui recalcule le total ;
  - le bouton d'étape suivante ;
  - le bouton « Écrire au client sur WhatsApp », avec un message pré-rempli adapté à l'étape ;
  - la marge estimée et une note interne.
- **Photos rapides** : les articles en ligne sans photo, rayon par rayon, un bouton par article. Sur téléphone il ouvre l'appareil photo ou la galerie ; la photo est allégée et enregistrée aussitôt. Chaque ligne rappelle le nom exact de l'article sur Wolt et propose « Chercher une image » (une recherche sur ce nom).
- **Prix rapides** : tous les articles d'une catégorie (ou « À compléter » : ceux sans prix) sur un écran, prix de vente, prix d'achat et « En ligne » pour chacun, un seul bouton pour tout enregistrer. Une valeur illisible n'enregistre rien et nomme l'article à corriger.
- **Tarifs** (selon le moment de la livraison) : des plages horaires (jours cochés + heures, minuit passé ou journée entière) avec leurs propres frais de service, livraison, express (0 = pas d'express) et une **majoration en % des articles** (ex. +10 % la nuit). La première plage active (par priorité) qui contient le moment s'applique, sinon le tarif de base des Réglages. Une grille de la semaine montre quel tarif s'applique à chaque heure. Le client voit le tarif changer en direct quand il choisit le jour et le créneau ; la commande garde le tarif appliqué.
- **Villes** : les villes livrées (19 au départ, autour de Netanya), chacune avec un **supplément de livraison** et, si besoin, un **minimum de commande**. Livraison payée par le client = livraison du moment (Tarifs) + supplément de la ville. Toute la liste se modifie d'un coup ; un tableau montre le prix de livraison de chaque ville pour chaque tarif (base, week-end, nuit…).
- **Clients** : chaque client (nom, e-mail, WhatsApp, ville), son nombre de commandes et le montant livré, les meilleurs d'abord ; recherche ; bouton WhatsApp.
- **Avis de nouvelle commande** : un e-mail au gérant (`EMAIL_GERANT`) à chaque commande, avec le lien vers la commande, et une **alerte Telegram** immédiate sur son téléphone (Réglages → « Alerte Telegram », en trois étapes numérotées : créer un robot avec @BotFather et coller son jeton, lui dire bonjour dans Telegram, appuyer sur « Relier ». L'état est écrit en clair — « Pas installée », « À terminer », « Active » — et « Envoyer un essai » le vérifie à tout moment).
- **Paiement** : chaque commande porte son étiquette (à payer, payée, reste à payer, à rembourser). Un bouton envoie au client, sur WhatsApp, le montant, le mode et les coordonnées de paiement (saisies une fois dans Réglages, privées) ; un autre note « Paiement reçu ». Un article ajouté après le paiement fait apparaître un complément, un article indisponible un remboursement. Filtre « À payer » dans les commandes.
- **Article hors catalogue** : dans le détail d'une commande, ajouter un article qui n'est pas au catalogue (nom, quantité, prix de vente, prix Wolt) ; le total est recalculé.
- **Reçu** : chaque commande a un reçu à imprimer ou à enregistrer en PDF (ce que le client a payé, sans prix d'achat ni boutique). Ce n'est pas une facture fiscale.
- **Comptabilité** (dans Statistiques) : deux fichiers à télécharger, par mois ou depuis le début — les **ventes** (une ligne par commande : montants, encaissé, reste dû, à rembourser, marge estimée) et les **achats Wolt** (une ligne par article réellement acheté, au prix d'achat). Ils s'ouvrent dans Excel.
- **Statistiques** : chiffre, marge estimée et panier moyen (jour, 7 jours, 30 jours), chiffre par jour, les plus vendus, pourboires, part d'express.
- **Produits** : filtres « À compléter (sans prix) / En ligne / Masqués / Épuisés ». Nom, description, photo, prix de vente (vide = à définir : jamais visible ni commandable), prix barré, badge, options (une par ligne : `Taille : 2 ans | 4 ans | 8 ans +10`), catégorie, ordre, en ligne / masqué, épuisé / en stock, bouton **Dupliquer**. Trois champs ne sont **visibles que par toi** : le prix d'achat sur Wolt, la boutique où le commander et le lien Wolt. Aucune page publique ne les lit (`PRODUIT_PUBLIC` dans `lib/catalogue.ts`).
- **Catégories** : créer, renommer, réordonner, masquer. Une catégorie qui contient des produits ne se supprime pas.
- **Ma journée** (la page de travail du gérant) : pour aujourd'hui ou demain, d'abord « Paiements à recevoir » (les commandes pas encore réglées, avec le bouton WhatsApp et « Paiement reçu ») — seules les commandes réglées entrent dans la liste Wolt ; puis (1) « À commander sur Wolt » : la liste de courses de toutes les commandes reçues, additionnée par boutique et par article (« 2 × Couches Huggies (Taille : 4) — n° 35, 36 »), à copier, et un bouton pour les marquer « commandées sur Wolt » ; (2) « Ma tournée » : les livraisons par créneau puis par ville, avec adresse, montant à encaisser et paiement, liens **Waze** et **WhatsApp « j'arrive »**, boutons « En route » et « Livrée » ; et le total à encaisser par mode de paiement.
- **Livraison le soir** : par défaut, cinq créneaux de 19h à minuit. **Heure limite** (Réglages, 17:00 par défaut) : une commande passée avant est livrée le soir même — le temps que Wolt livre les articles au gérant dans la journée ; après, le soir suivant (le client voit pourquoi). Réglages → « Commandes par créneau » (0 = pas de limite) : un créneau qui a ce nombre de commandes non annulées est affiché « complet », le serveur refuse d'y ajouter une commande, et l'accueil annonce le prochain créneau libre. Réglages → « Jours où tu livres » (les autres ne sont pas proposés) et « Délai de préparation » (60 min par défaut : pour le soir même, un créneau n'est proposé que s'il commence au moins ce délai après la commande, le temps de commander sur Wolt et de préparer). Le serveur refuse un créneau devenu trop proche. L'accueil affiche « Livré le soir, 19h – 00h » et la prochaine livraison.
- **Réglages** : tarif de base (frais de service, livraison, supplément express (0 = pas d'express), minimum de commande général), « Frais de service (livraison comprise) » en une seule ligne pour le client, pourboires proposés, modes de paiement, créneaux, ton WhatsApp, message d'accueil, ouverture et fermeture des commandes.

## Apparence

Côté client, le site est volontairement sobre : texte et boutons en encre, fond clair, traits fins, une seule couleur d'accent, police Geist. Pas d'emoji : des icônes au trait (`lucide-react`). Un article s'affiche comme une ligne de menu — nom, format, prix — avec sa photo seulement s'il en a une (les photos s'ajoutent dans l'espace gérant, fiche du produit). Les réglages communs (couleurs, arrondis, graisses, boutons, champs) sont dans `app/globals.css`.

### Photos des produits

Un article montre sa photo seulement s'il en a une. Deux sources :

- **Les photos du gérant** : espace gérant → « Photos rapides » (ou la fiche du produit). Elles sont enregistrées dans le stockage du site.
- **Des photos d'illustration libres de droits** pour les produits frais sans marque (fruits, légumes, œufs, viande et poisson à la coupe) : 41 photos de Wikimedia Commons, dans `public/produits/frais`, recadrées en carré de 600 px. La correspondance article → photo est dans `prisma/photos-frais.ts` ; les auteurs et les licences dans `lib/credits-photos.ts`, affichés sur la page `/credits` (lien « Crédits photos » en bas du site) — c'est l'attribution que ces licences demandent. Elles sont posées **une seule fois** à la mise en ligne, et seulement sur un article sans photo : une photo ajoutée, remplacée ou retirée par le gérant n'est jamais écrasée. Jamais de photo d'illustration pour un article de marque.

### Logo

Le sigle est un **T** et un **O plein, couleur soleil**, dans une tuile encre : les initiales de Tourist Order, le O en soleil. Le jaune (`#f2b632`) ne sert qu'à lui. Un seul tracé (`lib/sigle.ts`) dessine le logo du site (`components/Sigle.tsx`), l'icône de l'onglet, l'icône de téléphone et la carte d'aperçu de lien.

Les fichiers à réutiliser ailleurs (WhatsApp, Instagram, autocollants, cartes) sont dans `public/logo/`, donc aussi téléchargeables depuis le site (`https://www.touristorder.com/logo/<fichier>`) :

| Fichier | Usage |
|---|---|
| `tourist-order-logo.svg` / `.png` | Logo complet, sur fond clair |
| `tourist-order-logo-clair.svg` / `.png` | Logo complet, sur fond sombre |
| `tourist-order-logo-empile.svg` / `.png` | Sigle au-dessus du nom (affiche, autocollant) |
| `tourist-order-sigle.svg` / `.png` | Sigle seul (`-clair` : sur fond sombre) |
| `tourist-order-profil.svg` / `.png` | Photo de profil : fond plein, tient dans un rond |

Les `.svg` sont vectoriels (impression, toute taille) et le nom y est tracé en courbes : ils ne dépendent d'aucune police. `tests/logo.test.ts` vérifie que ces fichiers portent le même tracé que le site. La police de la carte d'aperçu est dans `assets/polices/` (Geist, licence OFL jointe).

## Lancer en local

Prérequis : Node 20.9 ou plus récent, et PostgreSQL.

```bash
cp .env.example .env        # puis renseigner ADMIN_PASSWORD et SESSION_SECRET
npm install
npx prisma db push          # crée les tables
npm run seed                # 12 catégories, réglages, 19 villes et 2 plages tarifaires d'exemple, et la base du catalogue
                            # (135 articles SANS prix, masqués) — sans danger en production : n'écrase rien
npm run seed:demo           # (local seulement) + des prix inventés sur 18 articles, pour tester
npm run dev                 # http://localhost:3000, admin sur /admin
```

En local, sans Supabase, les photos sont enregistrées dans `public/uploads/`.

Vérifications : `npm run typecheck`, `npm run lint`, `npm test`, et les parcours dans un vrai navigateur (`tests/navigateur/README.md`).

## Mettre en ligne (Vercel + Supabase)

Le site est fait pour que **rien ne soit à recopier à la main** : pas de mot de passe de base, pas de clé.

1. **GitHub** : le code est dans un dépôt GitHub (privé).
2. **Vercel** : *Add New → Project → Import* ce dépôt (Vercel installe son application GitHub au passage). Chaque `git push` sur la branche principale met le site en ligne.
3. **La base Supabase, créée depuis Vercel** : dans le projet Vercel, onglet **Storage → Create Database → Supabase**, plan gratuit, région Europe (Francfort : le site tourne aussi à Francfort, `vercel.json`, au plus près de la base et d'Israël), puis **Connect** au projet. Vercel pose alors tout seul les variables `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`… que le site lit (`lib/adresses-base.ts`).
4. **Redéployer**. À chaque mise en ligne de production, `npm run build` lance `prisma/preparer.ts`, qui :
   - crée ou met à jour les tables (`prisma db push`, sans `--accept-data-loss` : un changement qui effacerait des données arrête la mise en ligne) ;
   - active la « row level security » sur toutes les tables (`prisma/rls.sql`), sinon la clé publique de Supabase pourrait les lire ;
   - sur une base toute neuve seulement, installe la base du catalogue (articles sans prix, masqués), les catégories, les villes et les plages d'exemple ;
   - installe les **articles réels de Wolt avec leur prix**, lot par lot et chaque lot une seule fois : 177 articles de Wolt Market Netanya Center (`prisma/articles-wolt.ts`, relevé du 10 novembre 2026, avec quatre rayons en plus : Crèmerie & œufs, Pain & pâtisserie, Boucherie & poisson, Surgelés & glaces) 30 articles d'électronique de Dynamica Netanya (`prisma/articles-dynamica.ts`, 11 novembre 2026) et 73 articles de plus de Wolt Market, d'après les fiches produit envoyées par le gérant (`prisma/articles-wolt-fiches.ts`, 11 novembre 2026 : nom, prix normal et description tirés de la fiche ; les cinq fiches d'articles déjà installés enrichissent leur description, sans jamais remplacer un texte du gérant). Ensuite les prix se changent dans l'admin (« Prix rapides »). Pour ajouter une boutique ou un relevé : un nouveau fichier d'articles et une ligne dans `LOTS_WOLT` (`prisma/remplissage.ts`) ;
   - installe, une seule fois, la **liste de produits dressée par le gérant** (`prisma/articles-liste.ts`, 395 articles) : des articles « à compléter », sans prix de vente donc masqués, avec le prix indicatif de sa liste gardé à part (`Produit.prixIndicatif`) et rappelé dans « Prix rapides ». Ce prix n'est pas celui de Wolt. Le gérant a décidé de mettre ces articles en vente tout de suite au prix de sa liste : la mise en ligne le fait une seule fois, pour 360 d'entre eux (ni l'alcool ni la mélatonine), sans toucher à un article qu'il a déjà modifié. Ils restent repérés « prix non vérifié » dans son espace (« Prix rapides » → « Prix à vérifier », et la liste de courses de « Journée ») tant qu'il n'a pas noté le prix de Wolt dans « Achat » ;
   - applique, une seule fois chacune (`Reglages.operationsFaites`), les décisions du gérant sur le catalogue : la viande et la volaille retirées de la vente (masquées, `prisma/retrait-viande.ts` ; le rayon devient « Poisson ») ; sa liste « Dynamica Store » installée « à compléter », masquée (`prisma/articles-liste-dynamica.ts`) ;
   - crée le dossier public `produits` de Supabase Storage (photos).

   Un aperçu (preview) ne touche jamais à la base. Sans base branchée, la mise en ligne continue et le dit dans son journal (`[base] …`).
5. **Variables à poser dans Vercel** (Settings → Environment Variables) :
   - `ADMIN_PASSWORD` : le mot de passe gérant, long (8 caractères au moins) — **la seule obligatoire** ;
   - `SESSION_SECRET` (facultative) : la clé qui signe les sessions. Sans elle, le site en dérive une du secret que l'intégration Supabase pose déjà (`lib/cle-session.ts`) ; pour la choisir soi-même : `openssl rand -base64 48` ;
   - `NEXT_PUBLIC_NOM_DU_SITE` : `Tourist Order` (c'est aussi la valeur par défaut) ;
   - `NEXT_PUBLIC_SITE_URL` : `https://touristorder.com`, une fois le domaine branché (liens des e-mails et des messages) ;
   - `RESEND_API_KEY`, `EMAIL_EXPEDITEUR`, `EMAIL_GERANT` : les e-mails (voir ci-dessous).
6. **Le domaine** `touristorder.com` : l'ajouter au projet Vercel (Settings → Domains), puis, chez l'hébergeur du domaine (Hostinger), remplacer l'enregistrement **A** de `@` par `76.76.21.21` et mettre un **CNAME** `www` → `cname.vercel-dns.com`.
7. Dans l'admin : **Prix rapides** pour chiffrer les articles, **Tarifs** et **Villes** pour ajuster les montants d'exemple, **Réglages** pour le numéro WhatsApp, les frais et les créneaux.

**Autre façon** (base Supabase créée à la main, sur son propre compte) : poser `DATABASE_URL` (« Transaction pooler », port 6543) et `DIRECT_URL` (« Session pooler », port 5432), `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans Vercel. Ces noms passent avant ceux de l'intégration ; le reste est identique.

## État de la production (11 novembre 2026)

- **Site** : https://www.touristorder.com (`touristorder.com` redirige vers `www`), aussi sur https://touristorder.vercel.app. Domaine acheté chez Hostinger, DNS pointés sur Vercel.
- **Code** : dépôt GitHub `sellthem148-bot/touristorder`, branche `main`. **Chaque `git push` sur `main` met le site en ligne** (1 à 2 minutes) : c'est la seule façon de redéployer, le bouton « Redeploy » de Vercel demande au gérant un code par e-mail qu'il ne reçoit pas.
- **Vercel** : équipe « Sellthem148 » (offre Hobby), projet `touristorder`, fonctions à Francfort (`vercel.json`). Une variable d'environnement ajoutée ou changée n'est prise en compte qu'à la mise en ligne suivante.
- **Base** : Supabase créée depuis Vercel (Storage), branchée au projet ; les tables, la sécurité (RLS) et le catalogue ont été installés par `prisma/preparer.ts`.
- **Variables posées dans Vercel** : `ADMIN_PASSWORD`, `RESEND_API_KEY`, `EMAIL_EXPEDITEUR`, `EMAIL_GERANT` (plus celles de l'intégration Supabase). Pas de `SESSION_SECRET` : la clé est dérivée (`lib/cle-session.ts`).
- **E-mails** : domaine `touristorder.com` ajouté chez Resend (DKIM et SPF en place). Le domaine n'a pas de boîte de réception : une réponse d'un client à un e-mail du site se perd, sauf si `EMAIL_REPONSE` est posée.
- **Catalogue en ligne** : 205 articles visibles (175 de Wolt Market Netanya Center, 30 de Dynamica Netanya), bière et vin installés hors ligne, aucune photo pour l'instant.
- **À savoir** : le dépôt est public. Avant de le passer en privé, vérifier que Vercel (offre Hobby) déploie encore les envois dont l'auteur n'est pas le propriétaire du compte.

## Référencement

Le site donne aux moteurs de recherche un plan (`/sitemap.xml` : accueil, rayons, pages d'information) et ses règles (`/robots.txt` : jamais l'espace gérant, l'espace client, le panier ni les pages de suivi). Chaque page a son titre, sa description et son adresse canonique ; l'accueil porte des données structurées (nom, logo, recherche).

Pour que Google prenne le site en compte plus vite : ouvrir Google Search Console, ajouter la propriété « Domaine » `touristorder.com`, copier l'enregistrement TXT donné par Google dans la zone DNS du domaine (chez Hostinger), puis indiquer le plan du site `https://www.touristorder.com/sitemap.xml`.

## E-mails (Resend)

1. Crée un compte sur resend.com, ajoute et **vérifie ton nom de domaine** (enregistrements DNS donnés par Resend), crée une clé API.
2. Variables : `RESEND_API_KEY`, `EMAIL_EXPEDITEUR` (ex. `Tourist Order <commandes@touristorder.com>`, sur le domaine vérifié), `EMAIL_GERANT` (ton adresse, pour l'avis de nouvelle commande), `NEXT_PUBLIC_SITE_URL` (les liens des e-mails).
   `EMAIL_REPONSE` (facultative) : l'adresse à laquelle un client répond s'il fait « Répondre » ; elle est visible du client.
3. Sans `RESEND_API_KEY` en production, aucune confirmation ne part et l'espace client ne peut pas envoyer de lien (la page le dit). Sans domaine vérifié, Resend n'envoie qu'à l'adresse du compte Resend.

Chaque e-mail porte le logo à côté du nom, dans son bandeau : une petite image servie par le site (`/logo/tourist-order-sigle-clair.png`). Le nom reste du texte, pour les messageries qui bloquent les images.

En développement, sans clé, chaque e-mail est écrit dans `.courriels/` (un fichier `.html` à ouvrir dans un navigateur, et un `.txt`).

## Règles du code

- **Montants en agorot** (entiers : 12,90 ₪ = 1290). Jamais de nombre à virgule pour de l'argent. Le calcul d'une commande est unique (`lib/calcul.ts`) et le serveur recalcule toujours les prix depuis la base : le prix envoyé par le navigateur est ignoré.
- **Toute action ou page admin commence par `exigerAdmin()`.** Le layout ne protège pas les Server Actions, qui sont appelables directement.
- **Les pages publiques lisent les produits via `PRODUIT_PUBLIC`**, jamais un produit entier.
- **Une ligne de commande garde une copie du produit** (nom, prix, prix d'achat, boutique). Modifier ou supprimer un produit ne change pas les commandes passées.
- **Les classes maison** (`bouton`, `champ`, `carte`…) sont des `@utility` Tailwind, dans `app/globals.css`. Le chargeur Tailwind de Turbopack sortait les règles de `@layer components` de leur couche, et elles écrasaient alors `bg-…` ou `w-…`.
- Les jours sont des jours **israéliens** (`lib/dates.ts`).
- **Espace client** : tout ce que lit ou écrit une page ou action de `/compte` porte l'identifiant du client CONNECTÉ dans son `where` (`exigerClient()`), jamais un identifiant reçu du navigateur seul. Les jetons (`lib/session-client.ts`) ont un usage (« lien » ou « session ») : l'un ne vaut pas l'autre, ni une session admin. La page de connexion répond pareil qu'un compte existe ou non.
- **E-mails** : le texte est dans `lib/courriels.ts` (pur) et tout ce qui vient d'un client ou du catalogue passe par `echapper` ; l'envoi (`lib/courriel.ts`) ne lève jamais et part après la réponse (`after`) ; les journaux ne contiennent ni adresse ni contenu.
- Les lignes de montants (articles, supplément, frais, pourboire) ont une seule définition : `lignesDeMontants` (`lib/montants.ts`), pour le site et les e-mails.
- **Options d'un produit** : une seule définition (`lib/options.ts`) pour la saisie admin, le panier et le serveur, qui revérifie le choix et recalcule le supplément.
- **Mobile** : une case masquée (`sr-only`) doit rester dans un parent `relative` (la classe `pastille` l'est), et un `fieldset` doit pouvoir rétrécir (`min-inline-size: 0`, dans `globals.css`). Sans cela, une rangée qui défile élargissait toute la page sur téléphone.

## Pas encore fait (V2)

- Paiement par carte bancaire en ligne (il faut un compte chez un prestataire de paiement israélien : PayPlus, Grow, Tranzila, CardCom…).
- Facture fiscale : le reçu du site n'en est pas une ; elle se fait dans un logiciel de facturation agréé.
- Plusieurs langues (anglais, hébreu).
- Fiche produit détaillée et variantes (tailles).
