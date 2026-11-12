# Parcours dans un vrai navigateur (Playwright)

Ils pilotent le site comme un client et comme le gérant, sur téléphone, et
vérifient les montants de bout en bout. Ils MODIFIENT les données : à lancer
sur une base locale fraîche, jamais sur la production.

```bash
# base locale neuve + prix d'exemple
psql "$DATABASE_URL" -c 'TRUNCATE "LigneCommande","Commande","Client","Produit","Categorie","PlageTarifaire","Ville","Reglages" CASCADE;'
npm run seed:demo           # le jeu de test : la base du catalogue + 18 prix inventés, SANS les articles réels de Wolt
psql "$DATABASE_URL" -c "UPDATE \"Reglages\" SET whatsapp='+972 50 123 4567';"
npm run dev -- -p 3100

# dans un autre terminal (Playwright installé : npm i -D playwright && npx playwright install chromium)
mkdir -p /tmp/captures
node tests/navigateur/parcours-client-et-admin.mjs /tmp/captures
node tests/navigateur/parcours-prix-et-tarifs.mjs /tmp/captures
node tests/navigateur/parcours-villes.mjs /tmp/captures
node tests/navigateur/parcours-soir.mjs /tmp/captures
node tests/navigateur/parcours-journee.mjs /tmp/captures   # après les trois premiers : ses commandes s'ajoutent aux statistiques du jour
node tests/navigateur/parcours-espace-client.mjs /tmp/captures   # depuis la racine du projet : lit les e-mails dans .courriels/ (EMAIL_GERANT="gerant@exemple.test" dans .env)
node tests/navigateur/parcours-paiement.mjs /tmp/captures   # demande hors catalogue, paiement, complément, remboursement, reçu, exports, pages d'information
node tests/navigateur/parcours-telegram.mjs /tmp/captures   # l'alerte Telegram contre un faux Telegram local : relancer le site avec TELEGRAM_API=http://127.0.0.1:3199 npm run dev -- -p 3100
node tests/navigateur/parcours-langues.mjs /tmp/captures   # les cinq langues, chacune à son adresse (/he/…) : ce que lit un moteur de recherche, les redirections selon le navigateur, la carte d'aperçu, chaque page, une commande en hébreu refusée sans étage ni téléphone, e-mail et message WhatsApp dans la langue du client, langue de l'espace client (lit .courriels/, comme le parcours de l'espace client)
node tests/navigateur/largeur.mjs /tmp/captures     # aucune page plus large qu'un téléphone de 320 px
node tests/navigateur/repere-wolt.mjs /tmp/captures   # le repère Wolt du gérant : nom en hébreu à copier et lien « Images » dans Ma journée, la commande et Prix rapides
node tests/navigateur/menu-gerant.mjs               # le menu du gérant : aucun lien hors de l'écran, de l'ordinateur au petit téléphone (ne modifie rien)
```

Variables : `BASE_URL` (défaut http://localhost:3100), `ADMIN_PASSWORD` (défaut admin123).
Les parcours qui choisissent « Demain » (client et admin, prix et tarifs) ne se lancent ni un jeudi ni un vendredi : il choisit
« Demain » comme jour de semaine ordinaire et un « Vendredi » plus loin pour le week-end.
