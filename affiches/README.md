# Affiches et flyers

Ce dossier garde les documents à imprimer de Tourist Order, pour que n'importe quelle conversation les retrouve. Rien d'ici n'est publié avec le site (ce n'est pas dans `public/`).

## Le flyer (le document de référence)

`flyer/` — le flyer A5 du gérant : **c'est le design qu'il a choisi.** Deux pages : la première en français, la seconde en anglais. Il porte le logo de l'agence partenaire, Elite Home Group, en haut à droite (« En partenariat avec »).

```bash
node affiches/flyer/generer.mjs   # réécrit tous les fichiers de affiches/flyer/
```

| Fichier | Usage |
|---|---|
| `generer.mjs` | **La source.** Changer un texte : le tableau `LANGUES`. Refuse d'écrire un flyer dont un bloc déborde |
| `flyer-tourist-order.pdf` | A5, 2 pages, polices incluses : celui à donner à l'imprimeur |
| `flyer-tourist-order-fr.pdf` / `-en.pdf` | Une langue par fichier |
| `flyer-tourist-order-fr.png` / `-en.png` | Aperçus (à envoyer sur WhatsApp, à montrer) |
| `texte.txt` | Le texte du flyer tel qu'il s'imprime : c'est lui que `tests/affiche.test.ts` compare au site |

Fait le 22 novembre 2026 dans une autre conversation, reçu ici en PDF le 24, et rangé ici avec sa source le même jour : n'importe quelle conversation peut désormais le modifier.

Ce que le flyer annonce, et d'où cela vient sur le site :

- livraison le soir, 19 h – 00 h ; commande avant 17 h livrée le soir même (créneaux et heure limite des Réglages) ;
- **aucun prix** : le gérant a fait retirer les frais de livraison le 24 novembre 2026 (« ils n'ont pas besoin de le voir sur le flyer »), sur le flyer comme sur l'accueil du site — le client les lit au panier, avant de régler ;
- paiement à la commande par Bit, PayBox ou virement ;
- « plus de 650 articles » (678 en vente le 24 novembre 2026) ;
- 19 villes livrées (un quartier vendu à son prix n'est pas une ville de plus) ;
- le numéro WhatsApp du gérant ; réponses en français, en anglais et en hébreu ;
- le QR code (`elements/qr-flyer.svg`) mène à `https://www.touristorder.com/?via=flyer` : le site s'ouvre dans la langue du téléphone. Le site ne fait rien de `via=flyer` pour l'instant ; il pourra servir à compter les visites venues du flyer.

**Si l'un de ces points change sur le site, le flyer est à refaire** : changer `LANGUES`, relancer le générateur, relire le QR code dans l'aperçu (`tests/affiche.test.ts` signale les points qui se lisent dans le code).

## L'affiche A4 (autre format)

`generer.mjs` → `sortie/affiche-elite-home-group.pdf` et `.png` : une affiche A4 d'une page, français et anglais ensemble, faite ici le 23 novembre avant de recevoir le flyer. Même marque, même logo partenaire, autre mise en page. À garder pour un mur ou une vitrine ; pour distribuer, c'est le flyer.

```bash
node affiches/generer.mjs   # réécrit affiches/sortie/
```

## Éléments

`elements/` : le logo d'Elite Home Group (détouré en noir et en blanc d'après le fichier envoyé par le gérant, 402 × 247 px — il appartient à l'agence : jamais dans `public/`, jamais sur le site) le QR code de l'affiche A4 (`qr-touristorder.svg`) et celui du flyer (`qr-flyer.svg`).
