# Tourist Order (touristorder.com)

Service de livraison pour les touristes en Israël : le client commande et règle sur le site (Bit, PayBox ou virement), le gérant fait les achats sur Wolt dans la journée, reconditionne et livre le soir, à l'appartement, à la maison ou à l'hôtel.

**Où en est le site** : voir « État de la production » plus bas (mis à jour le 24 novembre 2026). **Les décisions du gérant et les règles à respecter**, dans le détail : `CLAUDE.md`.

Le nom affiché se change en un seul endroit : la variable `NEXT_PUBLIC_NOM_DU_SITE` (ou `lib/marque.ts`).

## Ce que fait le site

**Côté client** (web app mobile, en cinq langues — français, anglais, russe, hébreu, espagnol —, sans compte)
- Présentation à la manière du site de Wolt (fond clair, bannière avec le nom de la boutique et bande d'informations sur l'accueil, colonne des rayons sur ordinateur, cartes d'articles blanches avec une zone d'image, le « + » dans le coin et le prix en bleu) — avec le nom, le logo et les textes de Tourist Order. Un article sans photo montre l'icône de son rayon à la place.
- Catalogue « comme sur Wolt » : des rayons, et dans chaque grand rayon des **sous-rayons** (Eaux, Colas, Jus… dans Boissons) — un aperçu de chacun — **une seule rangée de six articles au plus, à faire défiler de côté**, pour que la page respire — avec « Tout voir », une rangée de sous-rayons qui reste en haut de l'écran sur téléphone, une colonne des rayons sur ordinateur. Les articles sont des tuiles (deux par ligne sur téléphone), rangés tout seuls dans leur sous-rayon d'après leur nom. Sur l'accueil : les rayons, puis une rangée à faire défiler par rayon et « Les plus demandés » (produits Populaire / Promo). Recherche « vivante » dans tout le catalogue : les articles s'affichent pendant qu'on tape, sans valider, et la recherche ne tient compte ni des accents ni des tirets (« coca zero », « oeufs », « cafe »).
- **Fiche produit** au toucher : grande photo, description, **options obligatoires** (taille, modèle, couleur… avec supplément éventuel), quantité.
- Badges Populaire / Nouveau / Promo (avec prix barré) ; un produit **épuisé** reste visible mais ne se commande pas.
- Panier enregistré dans le navigateur ; à l'ouverture, prix et options sont remis à jour depuis la base et ce qui n'existe plus est retiré.
- Commande : nom, **numéro de téléphone (WhatsApp)**, e-mail, ville, **où le client loge (appartement, maison ou hôtel)** et la rue (ou le nom de l'hôtel) — tous obligatoires : la commande n'est pas enregistrée (donc pas payée) tant qu'il en manque un, et le client est amené sur le champ à compléter. L'étage et le numéro d'appartement ne sont demandés (et exigés) que pour un appartement ; une maison n'en a pas. **À l'hôtel, on ne monte pas dans les chambres** : le client en est prévenu dès qu'il choisit « Hôtel » (numéro de chambre facultatif), on l'appelle à l'arrivée et il descend à la réception. Code d'entrée facultatif. **Le prix de la livraison dépend de la zone** que le client choisit dans la liste (une ville, ou un quartier vendu à son prix) ; s'il tape une adresse qui désigne une autre zone — le nom d'une autre ville, d'un quartier, ou une rue que le gérant a notée —, le panier le lui dit et lui propose de la choisir, sans jamais le bloquer. Puis jour, créneau, **livraison express** (supplément), **si un article manque** (me contacter / remplacer / retirer), **mode de paiement**, **pourboire**, note libre.
- **Paiement à la commande** (Bit, PayBox, virement) : le client règle avant que le gérant commande sur Wolt. Les coordonnées de paiement ne sont jamais sur le site : le client les reçoit sur WhatsApp. Sa page de suivi dit où en est le paiement (en attente avec le montant, reçu, complément à régler, remboursement à venir). Seule exception : si le gérant a collé son **lien de paiement Bit** dans Réglages, le client qui a choisi Bit voit un bouton « Payer avec Bit » sur son suivi tant qu'il reste à régler, avec le montant et la référence à indiquer.
- **Référence de commande** : le client ne lit jamais « commande n°1 » mais une référence, par exemple **BC-58001** — ses initiales, deux chiffres qui ne comptent pas, puis le numéro de la commande (001 → n°1). Elle est sur son suivi, dans son espace, ses e-mails, son reçu et tous les messages WhatsApp. Le gérant voit le numéro et la référence, et retrouve une commande par l'un ou l'autre (champ « Retrouver une commande »).
- **« Je ne trouve pas mon article »** : une demande libre, dans le panier ou seule (recherche sans résultat → « Demander cet article »). Le gérant cherche l'article, l'ajoute à la commande avec son prix ; rien n'est à régler avant.
- **Pages d'information** : conditions générales de vente, confidentialité, mentions légales, contact (liens dans le pied de page ; les conditions sont rappelées au moment de commander). Le site **vouvoie** le client.
- Page de suivi (lien secret) en frise : étape en cours, articles indisponibles non facturés, bouton WhatsApp. Elle se met à jour toute seule.
- **E-mail de confirmation** à chaque commande (l'adresse e-mail est demandée à la commande) : livraison, articles, total, bouton « Suivre ma commande » et accès direct à l'espace client.
- **Espace client** (`/compte`), sans mot de passe : on y entre par un lien reçu par e-mail (celui de la confirmation, valable 7 jours, ou un lien demandé sur la page de connexion, valable 30 minutes). Tableau de bord (commandes, en cours, articles, total dépensé), commande en cours avec son avancement, articles préférés, historique d'achat détaillé avec **« Commander à nouveau »**, informations (nom, WhatsApp, ville, adresse) qui pré-remplissent la commande suivante, déconnexion, suppression de l'espace. L'espace est créé à la première commande.
- **Mes commandes** : le navigateur garde aussi les liens de suivi de ses commandes (sans se connecter).
- **Un site qui bouge, sans en faire trop** : les blocs arrivent en fondu, l'article s'envole vers le panier au « + », les quantités et les montants répondent, l'en-tête se resserre quand on fait défiler, une fine barre en haut de l'écran pendant qu'une page se charge. Tout est coupé pour qui a demandé moins d'animations à son appareil, et rien n'est caché sans JavaScript.

**Côté gérant** (`/admin`, protégé par mot de passe)
- **Commandes** : en cours, livrées, annulées. Rafraîchissement automatique toutes les 30 s.
- **Détail d'une commande** :
  - la liste de courses regroupée par boutique Wolt, avec le lien Wolt de chaque article et un bouton « Copier la liste » ;
  - l'ajustement d'une quantité ou le marquage « indisponible », qui recalcule le total ;
  - le bouton d'étape suivante ;
  - le bouton « Écrire au client sur WhatsApp », avec un message pré-rempli adapté à l'étape ;
  - la marge estimée et une note interne ;
  - **« Zone à vérifier »** quand l'adresse tapée désigne une autre zone que celle choisie (les deux prix sont affichés) : un bouton passe la commande à la bonne zone, la livraison et le total sont recalculés, et une commande déjà payée montre un complément. « Changer la zone de livraison » est toujours disponible. Le même signalement est dans la liste des commandes et dans l'alerte Telegram.
- **La photo de Wolt** de chaque article (tirée de tes captures, pour reconnaître un article que tu ne connais pas) s'affiche partout dans ton espace : dans la liste « Produits », sur la fiche d'un article, dans « Photos rapides », « Prix rapides », « Ma journée » et la commande. Elle porte l'étiquette « Wolt » : le client ne la voit jamais. Un toucher l'ouvre en entier.
- **Les photos de Wolt sur ton site** : un article qui n'a pas encore sa photo montre celle de Wolt à la place de l'icône du rayon. Qui la voit se règle dans « Réglages » → **« Photos de Wolt pour tout le monde »** : cochée (ta décision du 17 novembre, le site n'ayant pas encore de client), tout visiteur la voit, sans avoir à se connecter ; décochée, toi seul la vois, connecté à ton espace. Ces photos sont celles de Wolt et des marques : décoche la case avant d'ouvrir le site aux clients, ou remplace-les d'ici là par les tiennes. Connecté à ton espace, tu as en plus un bandeau sombre « Vue du gérant », une étiquette « Wolt » sur chaque photo à remplacer, et sur la fiche de l'article « Mettre sa photo », qui ouvre « Photos rapides » sur sa ligne. « Voir comme un client » montre le site tel que les visiteurs le voient.
- **Photos rapides** : les articles en ligne sans photo, rayon par rayon. Le plus rapide : « Chercher une image » (une recherche sur le nom exact de l'article sur Wolt, dans un autre onglet), tu copies l'image choisie (appui long ou clic droit → « Copier l'image »), tu reviens et tu appuies sur **« Coller »** — sur ordinateur, Ctrl + V ou l'image glissée sur la ligne marchent aussi. Une image trop petite est refusée, la même image deux fois de suite est signalée. « Ajouter » ouvre l'appareil photo ou la galerie. Dans tous les cas la photo est allégée et enregistrée aussitôt.
- **Prix rapides** : tous les articles d'une catégorie (ou « À compléter » : ceux sans prix) sur un écran, prix de vente, prix d'achat et « En ligne » pour chacun, un seul bouton pour tout enregistrer. Une valeur illisible n'enregistre rien et nomme l'article à corriger.
- **Tarifs** (selon le moment de la livraison) : des plages horaires (jours cochés + heures, minuit passé ou journée entière) avec leurs propres frais de service, livraison, express (0 = pas d'express) et une **majoration en % des articles** (ex. +10 % la nuit). La première plage active (par priorité) qui contient le moment s'applique, sinon le tarif de base des Réglages. Une grille de la semaine montre quel tarif s'applique à chaque heure. Le client voit le tarif changer en direct quand il choisit le jour et le créneau ; la commande garde le tarif appliqué.
- **Villes** (les zones de livraison) : 23 zones au départ — 19 villes, et quatre secteurs du sud de Netanya vendus à leur propre prix, nommés « Ville – Quartier » (« Netanya – Ir Yamim / Poleg », « Netanya – Kiryat Nordau », « Netanya – Givat HaIrusim », « Netanya – Zone industrielle Poleg »). Chacune a son **supplément de livraison** et, si besoin, un **minimum de commande** ; livraison payée par le client = livraison du moment (Tarifs) + supplément de la zone. Sous chaque zone, **« Rues et repères de cette zone »** : les rues, hôtels et résidences que tu y connais (séparés par des virgules ou des retours à la ligne) — c'est ce qui permet au site de reconnaître qu'une adresse appartient à cette zone. Toute la liste se modifie d'un coup ; un tableau montre le prix de livraison de chaque zone pour chaque tarif (base, week-end, nuit…). Voir « Zones de livraison » plus bas.
- **Clients** : chaque client (nom, e-mail, WhatsApp, ville), son nombre de commandes et le montant livré, les meilleurs d'abord ; recherche ; bouton WhatsApp.
- **Avis de nouvelle commande** : un e-mail au gérant (`EMAIL_GERANT`) à chaque commande, avec le lien vers la commande, et une **alerte Telegram** immédiate sur son téléphone (Réglages → « Alerte Telegram », en trois étapes numérotées : créer un robot avec @BotFather et coller son jeton, lui dire bonjour dans Telegram, appuyer sur « Relier ». L'état est écrit en clair — « Pas installée », « À terminer », « Active » — et « Envoyer un essai » le vérifie à tout moment).
- **Paiement** : chaque commande porte son étiquette (à payer, payée, reste à payer, à rembourser). Un bouton envoie au client, sur WhatsApp, le montant, le mode et les coordonnées de paiement (saisies une fois dans Réglages, privées ; le lien Bit s'y ajoute pour un paiement par Bit) ; un autre note « Paiement reçu ». Un article ajouté après le paiement fait apparaître un complément, un article indisponible un remboursement. Filtre « À payer » dans les commandes.
- **Article hors catalogue** : dans le détail d'une commande, ajouter un article qui n'est pas au catalogue (nom, quantité, prix de vente, prix Wolt) ; le total est recalculé.
- **Reçu** : chaque commande a un reçu à imprimer ou à enregistrer en PDF (ce que le client a payé, sans prix d'achat ni boutique). Ce n'est pas une facture fiscale.
- **Comptabilité** (dans Statistiques) : deux fichiers à télécharger, par mois ou depuis le début — les **ventes** (une ligne par commande : montants, encaissé, reste dû, à rembourser, marge estimée) et les **achats Wolt** (une ligne par article réellement acheté, au prix d'achat). Ils s'ouvrent dans Excel.
- **Statistiques** : chiffre, marge estimée et panier moyen (jour, 7 jours, 30 jours), chiffre par jour, les plus vendus, pourboires, part d'express.
- **Produits** : filtres « À compléter (sans prix) / En ligne / Masqués / Épuisés ». Nom, description, photo, prix de vente (vide = à définir : jamais visible ni commandable), prix barré, badge, options (une par ligne : `Taille : 2 ans | 4 ans | 8 ans +10`), catégorie, ordre, en ligne / masqué, épuisé / en stock, bouton **Dupliquer**. Trois champs ne sont **visibles que par toi** : le prix d'achat sur Wolt, la boutique où le commander et le lien Wolt. Aucune page publique ne les lit (`PRODUIT_PUBLIC` dans `lib/catalogue.ts`).
- **Catégories** : créer, renommer, réordonner, masquer. Une catégorie qui contient des produits ne se supprime pas.
- **Ma journée** (la page de travail du gérant) : pour aujourd'hui ou demain, d'abord « Paiements à recevoir » (les commandes pas encore réglées, avec le bouton WhatsApp et « Paiement reçu ») — seules les commandes réglées entrent dans la liste Wolt ; puis (1) « À commander sur Wolt » : la liste de courses de toutes les commandes reçues, additionnée par boutique et par article (« 2 × Couches Huggies (Taille : 4) — n° 35, 36 »), à copier, et un bouton pour les marquer « commandées sur Wolt » ; (2) « Ma tournée » : les livraisons par créneau puis par ville, avec adresse, montant à encaisser et paiement, liens **Waze** et **WhatsApp « j'arrive »**, boutons « En route » et « Livrée » ; et le total à encaisser par mode de paiement.
- **Livraison le soir** : par défaut, cinq créneaux de 19h à minuit. **Heure limite** (Réglages, 17:00 par défaut) : une commande passée avant est livrée le soir même — le temps que Wolt livre les articles au gérant dans la journée ; après, le soir suivant (le client voit pourquoi). Réglages → « Commandes par créneau » (0 = pas de limite) : un créneau qui a ce nombre de commandes non annulées est affiché « complet », le serveur refuse d'y ajouter une commande, et l'accueil annonce le prochain créneau libre. Réglages → « Jours où tu livres » (les autres ne sont pas proposés) et « Délai de préparation » (60 min par défaut : pour le soir même, un créneau n'est proposé que s'il commence au moins ce délai après la commande, le temps de commander sur Wolt et de préparer). Le serveur refuse un créneau devenu trop proche. L'accueil affiche « Livré le soir, 19h – 00h » et la prochaine livraison.
- **Réglages** : tarif de base (frais de service, livraison, supplément express (0 = pas d'express), minimum de commande général), « Frais de service (livraison comprise) » en une seule ligne pour le client, pourboires proposés, modes de paiement, créneaux, ton WhatsApp, message d'accueil, ouverture et fermeture des commandes.

## Langues

Le site côté client existe en **français, anglais, russe, hébreu (de droite à gauche) et espagnol**. L'espace gérant reste en français.

- **Une adresse par langue** : le français garde les adresses de toujours (`/`, `/panier`…) ; chaque autre langue a les siennes (`/he`, `/he/panier`, `/en/categorie/boissons`…). C'est l'adresse qui donne la langue de la page.
- **Quelle langue pour un visiteur ?** Sur une adresse sans langue, il est envoyé vers celle qu'il a choisie (le globe de l'en-tête, le pied de page, ou « Langue » dans son espace client), sinon celle de son téléphone, sinon le français. Son choix est gardé un an dans un cookie et dans son espace client ; se connecter sur un autre appareil y ramène sa langue. Les liens qu'il reçoit (e-mail de confirmation, message WhatsApp préparé dans l'admin) mènent à sa langue. Ton espace gérant n'a pas de langue : toujours `/admin`, toujours en français.
- **Ce qui est traduit** : toutes les pages (catalogue, panier, suivi, espace client, pages légales — avec la mention « la version française fait foi »), les messages d'erreur, l'e-mail de confirmation et le lien de connexion, et **les messages WhatsApp que tu envoies au client** depuis l'admin (écrits dans la langue de sa commande ; la fiche de la commande te dit laquelle). Tes e-mails et ton alerte Telegram restent en français.
- **Le catalogue aussi** : le nom et la description de tous les articles de départ (les relevés de Wolt, Dynamica, ta liste), les options (« Taille », « 2 ans »…), les rayons, les villes livrées, les noms des tarifs, « Virement », le message d'accueil. La recherche comprend la langue du client (« молоко » trouve le lait). Dans ton espace, sur tes commandes et ta liste de courses, tout reste en français.
- **Ce qui ne l'est pas** : ce que tu écris ou modifies toi-même dans l'admin — un nouvel article, un nom ou une description que tu changes, une nouvelle ville, un nouveau tarif, tes créneaux. Ils s'affichent tels quels, en français, dans toutes les langues (le formulaire d'un article te le rappelle).
- **Tu réponds en français, en anglais ou en hébreu** : ces trois sites annoncent un service dans la langue du client, et la page de contact le dit dans les cinq langues. Le site ne promet jamais de répondre en russe ni en espagnol (les messages WhatsApp que l'admin te prépare, eux, sont déjà écrits dans la langue du client).
- Les textes sont dans `lib/i18n/` (un fichier par langue ; `fr.ts` est la référence) ; le catalogue traduit dans `lib/i18n/catalogue/` (du texte français de `prisma/*.ts` à sa traduction). Vérifier une traduction : `npx tsx tests/outils/verifier-langue.ts he`. Le parcours `tests/navigateur/parcours-langues.mjs` vérifie les cinq langues dans un vrai navigateur.

## Zones de livraison

Les clients donnent une adresse, pas une zone, et peuvent se tromper — ou choisir exprès la moins chère. Les zones sont donc **définies par les adresses** (23 novembre 2026).

- **Une zone** est une ligne de « Villes » : une ville entière, ou un quartier vendu à son propre prix, nommé « Ville – Quartier ».
- **Ce qui relie une adresse à une zone, ce sont des mots** : le nom d'une ville (dans les cinq langues), le nom d'un quartier, et les **repères** que tu saisis sous chaque zone (rues, hôtels, résidences). C'est toi qui connais tes rues : le site n'en invente aucune.
- **Le site ne corrige rien tout seul et ne bloque jamais une commande** (une rue peut porter le nom d'une ville). Il fait trois choses : au panier, un avis sous l'adresse et un bouton « Choisir {ville} » ; dans ton espace, la commande signalée **« Zone à vérifier »** (commande, liste des commandes, alerte Telegram) tant qu'elle n'est ni livrée ni annulée ; et un bouton pour passer la commande à la bonne zone, qui recalcule la livraison et le total. Les conditions générales de vente disent au client que les frais suivent l'adresse réelle.
- Waze reçoit la ville, pas le nom de la zone.

**Ta grille** (prix de la livraison au tarif de base ; une plage tarifaire s'y ajoute comme avant ; les frais de service — 15 ₪ au départ — sont en plus) :

| Livraison | Zones |
|---|---|
| 30 ₪ | Netanya |
| 40 ₪ | Le sud de Netanya : Netanya – Ir Yamim / Poleg, Netanya – Kiryat Nordau, Netanya – Givat HaIrusim, Netanya – Zone industrielle Poleg |
| 50 ₪ | Even Yehuda, Kfar Yona, Kadima-Tsoran, Pardesia, Beit Yitzhak, Tsur Moshe, Udim |
| 70 ₪ | Ra'anana, Kfar Saba, Hod Hasharon, Hadera |
| 100 ₪ | Césarée, Herzliya, Ramat HaSharon |
| 150 ₪ | Tel Aviv, Ramat Gan, Givatayim, Petah Tikva |

Elle a été posée une seule fois à la mise en ligne (`prisma/zones-1123.ts`) ; depuis, les prix se changent dans « Villes » et ne sont plus touchés par le code. Les villages à 50 ₪ viennent de ta règle « tout le Sharon, plus ou moins, 50 » : à corriger dans « Villes » si l'un d'eux doit coûter autre chose. L'accueil, la page de contact et le flyer comptent des **villes** (19), pas des zones (23).

**Tout le sud de Netanya est à 40 ₪** (24 novembre 2026, en trois fois : « tout au sud d'Uzi Hitman », puis « mets Kiryat Nordau à 40 aussi », puis « 40 sh » pour Givat HaIrusim et pour la zone industrielle). Quatre zones à leur nom, au même prix : le client lit le nom de l'endroit où il loge, et tu peux donner un jour un autre prix à l'une sans toucher aux autres. **Ir Yamim / Poleg** : côté mer, au sud d'Uzi Hitman, et tout Ramat Poleg. **Kiryat Nordau** : du boulevard Golda Meir à la rue Shalom Aleichem, entre le boulevard Ben Gurion et la route 2. **Givat HaIrusim** : les rues aux noms de fleurs entre les deux (Rotem, Havatzelet HaHof, Irus HaArgaman, Hartzit), jusqu'à Dwight Eisenhower. **Zone industrielle Poleg** (Kiryat Sapir) : de l'autre côté de la route 2 — HaMelacha, Giborei Israel, HaBonim, Yad Harutzim, IKEA, la gare. La ligne, d'ouest en est : Dwight Eisenhower – Shalom Aleichem – le pont HaShalom ; tout ce qui est à Netanya au sud de cette ligne est à 40 ₪. **Au nord, rien ne change (30 ₪)** : Agamim, Kiryat HaSharon, le parc d'activités autour de HaMada et le stade. Chaque zone a ses « Limites sur la carte », calées sur des centaines d'adresses mesurées chez Google, et ses rues dans ses repères (`prisma/limites-ir-yamim-1124.ts`, `prisma/kiryat-nordau-1124.ts`, `prisma/sud-de-netanya-1124.ts`).

**L'adresse vérifiée par Google** (en service depuis le 24 novembre 2026, avec ta clé) : au panier, Google propose des adresses pendant que le client tape ; il en choisit une, et le site trouve seul la ville et le quartier — donc la zone et son prix (« Adresse reconnue. Zone de livraison : … »). Rien n'est obligatoire : il peut toujours écrire son adresse à la main, et si Google ne répond pas le champ reste un champ ordinaire. Ta commande affiche « Adresse reconnue par Google », Waze la reçoit, et « Zone à vérifier » te prévient si le client a rechoisi une autre zone que celle de Google, ou si Google situe l'adresse dans une ville que tu ne livres pas. **Le quartier est reconnu de deux façons.** Par la **position** de l'adresse choisie chez Google : « Villes » → « Limites sur la carte » décrit le quartier en rectangles (« nord 32.2832, est 34.8475 » = au sud de cette latitude et à l'ouest de cette longitude), et toute adresse de la ville qui tombe dedans est dans la zone, même si sa rue n'est notée nulle part. Et par tes **repères de rues** (47 rues d'Ir Yamim et de Ramat Poleg, 27 de Kiryat Nordau, 5 de Givat HaIrusim et 12 de la zone industrielle y sont depuis le 24 novembre), qui passent avant la position et servent seuls pour une adresse tapée à la main : Google donne la rue et la ville, jamais le quartier (pour une rue d'Ir Yamim, il répond « Netanya »). C'est donc par ses rues, notées dans « Villes », que le site reconnaît ton quartier à 40 ₪ ; sans elles, une adresse d'Ir Yamim reste à 30 ₪. Écris-les comme Google les écrit (tu les lis sur une commande, sous « Adresse reconnue par Google »), en lettres latines ou en hébreu ; « rue », « St », « Sderot » ne comptent pas. Ta clé Google est dans le code (`lib/google-maps.ts`, et nulle part ailleurs) : la vider coupe tout ; « Villes » te dit si c'est actif. Vérifié avec le vrai Google le 24 novembre, dans les cinq langues : tes 19 villes donnent leur zone, une adresse hors de tes zones (Jérusalem) donne un avis, et le champ reste un champ ordinaire si Google refuse la clé. Les propositions sont en service sur le vrai site depuis ce jour-là.

Code : `lib/zones.ts` (pur : `communeDe`, `quartiersDe`, `zoneCitee`, `communesLivrees`, et pour Google `zonePourLieu`, `zoneASignaler`, `lireLimites`), `lib/zones-lecture.ts` (les zones et leurs mots, côté serveur), `changerLaZone` (`app/admin/(protege)/actions.ts`) ; pour Google : `lib/google-maps.ts` (la clé du site, lue par le serveur), `lib/google-adresses.ts` (le navigateur parle à Google), `lib/lieu-google.ts` (pur), `components/panier/ChampAdresse.tsx`. Tests : `tests/zones.test.ts`, `tests/adresse-google.test.ts`, `tests/kiryat-nordau.test.ts`, `tests/sud-de-netanya.test.ts`, `tests/navigateur/parcours-zones.mjs`, `tests/navigateur/parcours-adresse-google.mjs` (avec un faux Google : rien ne part chez Google).

## Apparence

Côté client, le site reprend la **présentation** d'une boutique sur Wolt — jamais sa marque : le nom, le logo et les textes restent ceux de Tourist Order.

- **Fond clair**, texte et boutons en encre, police Geist. Pas d'emoji : des icônes au trait (`lucide-react`). Un fond sombre (« nuit ») ou ivoire reste à un interrupteur (`lib/fond.ts`) ; tout texte posé sur le fond porte donc sa variante `nuit:` (`tests/navigateur/contrastes.mjs` vérifie que rien n'est illisible).
- **Accueil** : une bannière (mosaïque de photos libres de droits, le sigle, le nom, le titre), une bande d'informations (horaires, prochaine livraison, frais, paiement, villes livrées), puis les rayons et une rangée d'articles par rayon.
- **Carte d'article** : blanche, une zone d'image en haut, le « + » encre dans le coin haut gauche (dans toutes les langues, hébreu compris), puis le prix en bleu, le nom, le format. Une promotion a son étiquette jaune et l'ancien prix barré.
- **Un peu de couleur** : une teinte douce par rayon (la pastille de son icône, le bandeau en tête de sa page) et le jaune du logo sur quelques repères. Jamais un texte, un titre ni un bouton.
- **De l'air** : une seule rangée par sous-rayon, six articles par rangée sur l'accueil ; sur ordinateur une rangée tombe juste (jamais une carte coupée au bord) et une flèche mène à la suite.
- **Du mouvement** : voir « Ce que fait le site ». Tout est dans `app/globals.css` ; `tests/navigateur/mouvement.mjs` le vérifie.

Les réglages communs (couleurs, arrondis, graisses, boutons, champs) sont dans `app/globals.css`.

### Photos des produits

Ce que montre la carte d'un article, dans l'ordre :

1. **Sa photo**, s'il en a une. Deux sources : **les tiennes** (espace gérant → « Photos rapides » : « Coller » une image copiée, ou « Ajouter » depuis l'appareil photo ; enregistrées dans le stockage du site) et **des photos d'illustration libres de droits** pour les produits frais sans marque (fruits, légumes, œufs) : des photos de Wikimedia Commons dans `public/produits/frais`, la correspondance article → photo dans `prisma/photos-frais.ts`, les auteurs et les licences dans `lib/credits-photos.ts`, affichés sur `/credits` — c'est l'attribution que ces licences demandent. Elles sont posées une seule fois, seulement sur un article sans photo, et jamais pour un article de marque.
2. Sinon, **la photo de Wolt** tirée de tes captures — tant que « Photos de Wolt pour tout le monde » est cochée dans Réglages (ta décision du 17 novembre ; décochée, toi seul la vois, connecté à ton espace). Ces photos sont celles de Wolt et des marques : elles restent hors des fichiers publics du site (`prive/reperes-wolt`), ne sont jamais enregistrées comme photo d'un article, et les moteurs de recherche n'y vont pas.
3. Sinon, **l'icône du rayon** sur sa couleur.

Où on en est le 24 novembre : sur 678 articles en vente, **42 ont leur propre photo** (38 fruits et légumes, 4 en crèmerie) et **636 montrent celle de Wolt**. Chaque image que tu colles dans « Photos rapides » prend la place de celle de Wolt, pour toi comme pour tes clients.

### Logo

Le sigle est un **T** et un **O plein, couleur soleil**, dans une tuile encre : les initiales de Tourist Order, le O en soleil. Le jaune (`#f2b632`) est celui du logo : sur le site il reste rare (quelques repères, le compteur du panier, la barre de chargement). Un seul tracé (`lib/sigle.ts`) dessine le logo du site (`components/Sigle.tsx`), l'icône de l'onglet, l'icône de téléphone et la carte d'aperçu de lien.

Les fichiers à réutiliser ailleurs (WhatsApp, Instagram, autocollants, cartes) sont dans `public/logo/`, donc aussi téléchargeables depuis le site (`https://www.touristorder.com/logo/<fichier>`) :

| Fichier | Usage |
|---|---|
| `tourist-order-logo.svg` / `.png` | Logo complet, sur fond clair |
| `tourist-order-logo-clair.svg` / `.png` | Logo complet, sur fond sombre |
| `tourist-order-logo-empile.svg` / `.png` | Sigle au-dessus du nom (affiche, autocollant) |
| `tourist-order-sigle.svg` / `.png` | Sigle seul (`-clair` : sur fond sombre) |
| `tourist-order-profil.svg` / `.png` | Photo de profil : fond plein, tient dans un rond |

Les `.svg` sont vectoriels (impression, toute taille) et le nom y est tracé en courbes : ils ne dépendent d'aucune police. `tests/logo.test.ts` vérifie que ces fichiers portent le même tracé que le site. La police de la carte d'aperçu est dans `assets/polices/` (Geist, licence OFL jointe).

## Flyer et affiche

Les documents à imprimer sont dans `affiches/` (jamais publiés avec le site) ; `affiches/README.md` les décrit.

- **Le flyer** (`affiches/flyer/`) : A5, deux pages — français puis anglais —, avec le logo de l'agence partenaire **Elite Home Group**. C'est le document de référence : `flyer-tourist-order.pdf` pour l'imprimeur, une page par langue (`-fr`, `-en`) en PDF et en image. Sa source est là aussi (`node affiches/flyer/generer.mjs` le réécrit). Son QR code ouvre le site dans la langue du téléphone.
- **L'affiche A4** (`affiches/sortie/`) : une page, français et anglais ensemble, même logo partenaire ; `node affiches/generer.mjs` la refait.

Le flyer annonce ce que le site annonce (19 h – 00 h, commande avant 17 h, Bit / PayBox / virement, plus de 650 articles, 19 villes, le numéro WhatsApp, réponses en français, anglais et hébreu) : **si l'un de ces réglages change, le flyer est à refaire**. Il ne porte aucun prix : depuis le 24 novembre, à ta demande, les frais de livraison ne s'annoncent plus ni sur le flyer ni sur l'accueil du site — le client les lit au panier, avant de régler. `tests/affiche.test.ts` le signale pour ce qui se lit dans le code.

## Lancer en local

Prérequis : Node 20.9 ou plus récent, et PostgreSQL.

```bash
cp .env.example .env        # puis renseigner ADMIN_PASSWORD et SESSION_SECRET
npm install
npx prisma db push          # crée les tables
npm run seed                # 12 catégories, réglages, 23 zones de livraison et 2 plages tarifaires d'exemple, et la base du catalogue
                            # (135 articles SANS prix, masqués) — sans danger en production : n'écrase rien
npm run seed:demo           # (local seulement) + des prix inventés sur 18 articles, pour tester
npm run dev                 # http://localhost:3000, admin sur /admin
```

En local, sans Supabase, les photos sont enregistrées dans `public/uploads/`.

Vérifications : `npm run typecheck`, `npm run lint`, `npm test` (41 fichiers de tests), et 24 parcours dans un vrai navigateur (`tests/navigateur/README.md`) — ceux qui ne modifient rien (`mouvement`, `contrastes`, `recherche-vivante`, `parcours-rayons`) se lancent aussi sur le vrai site.

## Mettre en ligne (Vercel + Supabase)

Le site est fait pour que **rien ne soit à recopier à la main** : pas de mot de passe de base, pas de clé.

1. **GitHub** : le code est dans un dépôt GitHub (privé).
2. **Vercel** : *Add New → Project → Import* ce dépôt (Vercel installe son application GitHub au passage). Chaque `git push` sur la branche principale met le site en ligne.
3. **La base Supabase, créée depuis Vercel** : dans le projet Vercel, onglet **Storage → Create Database → Supabase**, plan gratuit, région Europe (Francfort : le site tourne aussi à Francfort, `vercel.json`, au plus près de la base et d'Israël), puis **Connect** au projet. Vercel pose alors tout seul les variables `POSTGRES_PRISMA_URL`, `POSTGRES_URL_NON_POOLING`, `SUPABASE_URL`, `SUPABASE_SECRET_KEY`… que le site lit (`lib/adresses-base.ts`).
4. **Redéployer**. À chaque mise en ligne de production, `npm run build` lance `prisma/preparer.ts`, qui :
   - crée ou met à jour les tables (`prisma db push`, sans `--accept-data-loss` : un changement qui effacerait des données arrête la mise en ligne) ;
   - active la « row level security » sur toutes les tables (`prisma/rls.sql`), sinon la clé publique de Supabase pourrait les lire ;
   - sur une base toute neuve seulement, installe la base du catalogue (articles sans prix, masqués), les catégories, les zones de livraison et les plages d'exemple ;
   - installe les **articles réels de Wolt avec leur prix**, lot par lot et chaque lot une seule fois (`LOTS_WOLT`, `prisma/remplissage.ts`) : Wolt Market Netanya Center (`prisma/articles-wolt.ts`, 10 novembre), Dynamica (`articles-dynamica.ts`), les fiches produit du 11 novembre (`articles-wolt-fiches.ts`), puis ce que montraient tes captures du 12 novembre (`releve-wolt-1112.ts`, `articles-wolt-captures.ts`, `articles-wolt-captures-boissons.ts`) et deux articles de Dynamica (13 novembre). Toujours le prix normal de Wolt, jamais le prix en promotion. Ensuite les prix se changent dans l'admin (« Prix rapides ») : le code ne remplace jamais un prix que tu as posé. Pour ajouter un relevé : un fichier d'articles et une ligne dans `LOTS_WOLT` ;
   - installe, une seule fois, **ta liste de produits** (`prisma/articles-liste.ts`, 395 articles) avec son prix indicatif gardé à part ; tu as décidé d'en mettre 360 en vente au prix de ta liste (ni l'alcool ni la mélatonine) — ils restent repérés « prix non vérifié » tant que tu n'as pas noté le prix de Wolt. Ta liste « Dynamica Store » est installée masquée (`articles-liste-dynamica.ts`) et le reste ;
   - applique, **une seule fois chacune** (leur clé est notée dans `Reglages.operationsFaites`), tes décisions sur le catalogue et les prix. Ce que tu changes ensuite dans l'admin n'est jamais refait. Dans l'ordre :
     - les relevés de prix d'après tes captures (12 et 15 novembre) ;
     - les rayons Crèmerie et Boissons raccourcis le 12 novembre puis remis en entier le 13 ;
     - ce que Wolt ne vend pas, **supprimé** (les 5 introuvables de ta liste, 16 boissons absentes de la page entière du rayon) ;
     - le 15 novembre, les 339 articles sans photo de Wolt **masqués** « pour le moment » ; le 16, les 40 articles masqués qui avaient leur photo remis en vente ;
     - le 17, « Photos de Wolt pour tout le monde » cochée ;
     - le 19, la viande et le poulet frais, le poisson frais et surgelé, puis la viande, le poisson et les glaces des surgelés **masqués** (40 articles, gardés dans ta base avec nom, prix et photo) ; le 22, le rayon renommé « Surgelés » (son adresse ne change pas) ;
     - les photos libres de droits des produits frais ;
     - le 23, **ta grille des zones de livraison** et sa correction du soir (`prisma/zones-1123.ts`) ;
   - crée le dossier public `produits` de Supabase Storage (photos).

   Un aperçu (preview) ne touche jamais à la base. Sans base branchée, la mise en ligne continue et le dit dans son journal (`[base] …`).
5. **Variables à poser dans Vercel** (Settings → Environment Variables) :
   - `ADMIN_PASSWORD` : le mot de passe gérant, long (8 caractères au moins) — **la seule obligatoire** ;
   - `SESSION_SECRET` (facultative) : la clé qui signe les sessions. Sans elle, le site en dérive une du secret que l'intégration Supabase pose déjà (`lib/cle-session.ts`) ; pour la choisir soi-même : `openssl rand -base64 48` ;
   - `NEXT_PUBLIC_NOM_DU_SITE` : `Tourist Order` (c'est aussi la valeur par défaut) ;
   - `NEXT_PUBLIC_SITE_URL` : `https://touristorder.com`, une fois le domaine branché (liens des e-mails et des messages) ;
   - `RESEND_API_KEY`, `EMAIL_EXPEDITEUR`, `EMAIL_GERANT` : les e-mails (voir ci-dessous) ;
   - `NEXT_PUBLIC_GOOGLE_MAPS_KEY` (facultative) : une clé Google Maps qui passe avant celle du code (`lib/google-maps.ts`), pour un essai. La clé du site, elle, est dans le code : le gérant n'a pas accès aux réglages de Vercel.
6. **Le domaine** `touristorder.com` : l'ajouter au projet Vercel (Settings → Domains), puis, chez l'hébergeur du domaine (Hostinger), remplacer l'enregistrement **A** de `@` par `76.76.21.21` et mettre un **CNAME** `www` → `cname.vercel-dns.com`.
7. Dans l'admin : **Prix rapides** pour chiffrer les articles, **Tarifs** et **Villes** pour ajuster les montants d'exemple, **Réglages** pour le numéro WhatsApp, les frais et les créneaux.

**Autre façon** (base Supabase créée à la main, sur son propre compte) : poser `DATABASE_URL` (« Transaction pooler », port 6543) et `DIRECT_URL` (« Session pooler », port 5432), `NEXT_PUBLIC_SUPABASE_URL` et `SUPABASE_SERVICE_ROLE_KEY` dans Vercel. Ces noms passent avant ceux de l'intégration ; le reste est identique.

## État de la production (24 novembre 2026)

- **Site** : https://www.touristorder.com (`touristorder.com` redirige vers `www`), aussi sur https://touristorder.vercel.app. Domaine acheté chez Hostinger, DNS pointés sur Vercel.
- **Code** : dépôt GitHub `sellthem148-bot/touristorder`, branche `main`. **Chaque `git push` sur `main` met le site en ligne** (1 à 2 minutes) : c'est la seule façon de redéployer, le bouton « Redeploy » de Vercel demande au gérant un code par e-mail qu'il ne reçoit pas. Chaque page porte `<meta name="version">` = le commit en service : à relire après chaque envoi (une mise en ligne qui échoue laisse l'ancienne version sans rien montrer). Plusieurs conversations envoient sur ce même `main` : toujours récupérer la dernière version avant de travailler.
- **Vercel** : équipe « Sellthem148 » (offre Hobby), projet `touristorder`, fonctions à Francfort (`vercel.json`). Une variable d'environnement ajoutée ou changée n'est prise en compte qu'à la mise en ligne suivante.
- **Base** : Supabase créée depuis Vercel (Storage), branchée au projet ; les tables, la sécurité (RLS) et le catalogue sont installés par `prisma/preparer.ts`.
- **Variables posées dans Vercel** : `ADMIN_PASSWORD`, `RESEND_API_KEY`, `EMAIL_EXPEDITEUR`, `EMAIL_GERANT` (plus celles de l'intégration Supabase). Pas de `SESSION_SECRET` : la clé est dérivée (`lib/cle-session.ts`).
- **E-mails** : domaine `touristorder.com` ajouté chez Resend (DKIM et SPF en place). Le domaine n'a pas de boîte de réception : une réponse d'un client à un e-mail du site se perd, sauf si `EMAIL_REPONSE` est posée.
- **Catalogue en ligne** : **678 articles en vente**, dans dix rayons —

  | Rayon | Articles |
  |---|---|
  | Crèmerie & œufs | 235 |
  | Boissons | 157 |
  | Chargeurs & électronique | 80 |
  | Pain & pâtisserie | 75 |
  | Fruits & légumes | 40 |
  | Courses & épicerie | 27 |
  | Boucherie & poisson (fumé, salé, charcuterie sous vide, sauces) | 24 |
  | Apéro & snacks | 22 |
  | Maison & entretien | 15 |
  | Surgelés (pizzas et plats) | 3 |

  Trois rayons sont vides et ne sont plus proposés (Bébé & enfants, Pharmacie & hygiène, Shabbat & casher). Restent **masqués** dans la base : les articles sans photo de Wolt (en attente de tes captures de leur rayon), les 40 articles retirés le 19 novembre, l'alcool (« à réfléchir ») et la liste Dynamica Store.
- **Photos** : 42 articles ont leur propre photo, 636 montrent celle de Wolt (« Photos de Wolt pour tout le monde » est cochée). `/admin/repere/etat` dit, sans connexion et sans rien montrer, combien de photos le serveur sait lire et l'état de ce réglage.
- **Livraison** : le soir, cinq créneaux de 19 h à minuit, commande avant 17 h livrée le soir même ; 23 zones (19 villes), de 30 ₪ à 150 ₪ — voir « Zones de livraison ».
- **Clients** : le site n'était pas encore ouvert aux clients le 17 novembre ; le flyer part maintenant chez l'agence partenaire (Elite Home Group).
- **À savoir** : le dépôt est public. Avant de le passer en privé, vérifier que Vercel (offre Hobby) déploie encore les envois dont l'auteur n'est pas le propriétaire du compte.

## Référencement

Le site donne aux moteurs de recherche un plan (`/sitemap.xml` : accueil, rayons, pages d'information, **chacun dans les cinq langues**) et ses règles (`/robots.txt` : jamais l'espace gérant, l'espace client, le panier ni les pages de suivi, à aucune de leurs adresses). Chaque page a son titre, sa description, son adresse de référence dans sa langue et la liste de ses équivalents dans les autres (« hreflang ») ; l'accueil porte des données structurées (nom, logo, recherche). Un moteur de recherche, qui ne demande aucune langue, lit le français aux adresses sans préfixe et chaque autre langue à la sienne.

Quand un lien est partagé (WhatsApp, Facebook…), l'aperçu — titre, description, image — est dans la langue de l'adresse partagée (`/apercu/he`, `/apercu/ru`…).

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

## Pas encore fait

**Ce qui attend le gérant**

- **Vérifier les restrictions de la clé Google** (Google Cloud → API et services → Identifiants → la clé). Les deux adresses du site y sont (`https://www.touristorder.com/*`, ajoutée le 24 novembre, et `https://touristorder.com/*`) : les propositions d'adresse marchent sur le vrai site, vérifié le jour même en français, en anglais et en hébreu. Reste à contrôler dans le même écran que la clé est restreinte à « Places API (New) » et « Maps JavaScript API » seulement — cela ne se voit pas de l'extérieur. C'est une clé de navigateur, visible de tous dans la page et dans ce dépôt : ce sont ses restrictions qui la protègent, et un plafond de quota dans Google Cloud est une bonne précaution. Pour contrôler, avant une mise en ligne ou après un changement chez Google : `tests/navigateur/adresse-google-reelle.mjs`. Ne pas brancher à la place le service public de recherche d'adresses d'OpenStreetMap (Nominatim) : sa charte l'interdit pour ce genre de site.
- **Dire si d'autres quartiers de Netanya doivent changer de prix.** Tout le sud de la ville (au sud de la ligne Dwight Eisenhower – Shalom Aleichem – pont HaShalom) est à 40 ₪ depuis le 24 novembre ; le reste de Netanya est à 30 ₪. Deux rues de sa première liste sont au nord de cette ligne, donc à 30 ₪ : HaKalanit (tout au nord de la ville) et Zvi Moissescu (Kiryat HaSharon).
- **Ses propres photos** : 636 articles montrent encore celle de Wolt. Avant d'ouvrir le site aux clients, les remplacer (« Photos rapides » → « Coller ») ou décocher « Photos de Wolt pour tout le monde ».
- **Les captures de Wolt des rayons restants** (épicerie, apéro, entretien, pharmacie, bébé…) : un article masqué que la capture montre reçoit sa photo et revient en vente.
- **Les « prix non vérifiés »** : les articles de sa liste vendus au prix de la liste tant qu'il n'a pas noté le prix de Wolt (« Prix rapides » → « Prix à vérifier »).
- Ses décisions en attente : l'alcool, la liste Dynamica Store, les 40 articles retirés le 19 novembre (gardés masqués).

**Ce que le site ne fait pas**

- Paiement par carte bancaire en ligne (il faut un compte chez un prestataire de paiement israélien : PayPlus, Grow, Tranzila, CardCom…).
- Facture fiscale : le reçu du site n'en est pas une ; elle se fait dans un logiciel de facturation agréé.
- Traduction automatique de ce que le gérant écrit lui-même dans l'admin (nouvel article, nouvelle ville).
- Compter les visites venues du flyer (son QR code porte `?via=flyer`, que le site ne lit pas encore).
