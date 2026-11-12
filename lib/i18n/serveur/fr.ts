// Les textes que seul le serveur écrit, en français (la langue de référence) : référencement,
// messages d'erreur, e-mails, messages WhatsApp envoyés au client, pages légales.
// Les autres langues ont exactement la même forme (type DictionnaireServeur). Le site vouvoie le client.
// « {cle} » = une valeur remplie par le code. Dans `juridique`, deux marques de mise en forme :
// « [texte](/adresse) » = un lien, « **texte** » = du gras.

const fr = {
  meta: {
    // La carte d'aperçu quand le lien du site est partagé (WhatsApp, réseaux sociaux) : le titre sur trois lignes,
    // coupées à la main, puis une ligne de précisions. `alt` la décrit à qui ne voit pas l'image.
    apercu: {
      lignes: ["Vos courses livrées", "à votre logement,", "le soir même."],
      sousTitre: "Israël · Service en français · Livraison le soir",
      alt: "{site} — vos courses livrées à votre logement, le soir même",
    },
    titre: "{site} — vos courses livrées à votre logement en Israël",
    description:
      "Courses, produits pour bébé, hygiène, chargeurs et oublis de vacances : commandez en français, nous vous livrons le soir à votre logement ou à votre hôtel, à Netanya et dans les villes voisines.",
  },

  erreurs: {
    champs: "Vérifiez les champs en rouge.",
    refusee: "Commande refusée.",
    tropDeCommandes: "Trop de commandes en peu de temps. Réessayez dans quelques minutes.",
    panierIllisible: "Panier illisible : rechargez la page.",
    ferme: "Les commandes sont fermées pour le moment. Réessayez un peu plus tard.",
    villeNonLivree: "Nous ne livrons pas encore cette ville.",
    jourIndisponible: "Ce jour n'est plus disponible : choisissez-en un autre.",
    creneauComplet: "Ce créneau vient d'être complet : choisissez-en un autre.",
    creneauCompletChamp: "Ce créneau est complet : choisissez-en un autre.",
    creneauIndisponible: "Ce créneau n'est plus disponible : choisissez-en un autre.",
    expressNonPropose: "La livraison express n'est pas proposée sur ce créneau.",
    expressChamp: "Pas d'express sur ce créneau.",
    paiementRequis: "Choisissez un mode de paiement.",
    pourboirePerime: "Ce pourboire n'est plus proposé : rechargez la page.",
    pourboireChamp: "Choisissez un montant dans la liste.",
    panierPerime: "Certains articles de votre panier ne sont plus disponibles ou ont changé. Nous avons mis votre panier à jour : vérifiez-le.",
    minimum: "Le minimum de commande pour {ville} est de {prix} d'articles (hors frais).",

    nomRequis: "Votre nom est requis.",
    telephoneRequis: "Votre numéro de téléphone est requis.",
    telephoneLong: "Numéro trop long.",
    telephoneInvalide: "Numéro invalide.",
    telephoneIndicatif: "Numéro invalide : indiquez-le avec l'indicatif (ex. +33 6 12 34 56 78).",
    emailRequis: "Votre adresse e-mail est requise.",
    emailInvalide: "Adresse e-mail invalide.",
    emailLong: "Adresse e-mail trop longue.",
    villeRequise: "Choisissez une ville.",
    adresseRequise: "Indiquez la rue et le numéro, ou le nom de l'hôtel.",
    etageRequis: "Indiquez l'étage (0 pour le rez-de-chaussée).",
    appartementRequis: "Indiquez le numéro d'appartement.",
    logementRequis: "Choisissez : appartement, maison ou hôtel.",
    jourRequis: "Choisissez un jour.",
    creneauRequis: "Choisissez un créneau.",
    maxCaracteres: "{max} caractères maximum.",
    remplacementRequis: "Choisissez quoi faire si un article manque.",
    tropArticles: "Trop d'articles différents.",
    panierVide: "Votre panier est vide.",

    tropDeDemandes: "Trop de demandes. Réessayez dans un moment.",
    emailNonConfigure: "L'envoi d'e-mails n'est pas encore configuré sur ce site.",
  },

  // Les e-mails envoyés au client. {par} = « par Bit », espace devant compris, ou rien.
  courriel: {
    par: " par {mode}",
    // {reference} = « BC-58100 » (en gras dans l'e-mail).
    merciCommande: "Merci {prenom} ! Votre commande {reference} est bien enregistrée.",
    merciDemande: "Merci {prenom} ! Votre demande {reference} est bien enregistrée.",
    suiteCommande: "Elle est préparée dès réception de votre paiement, puis livrée à votre logement.",
    suiteDemande: "Nous recherchons l'article et vous confirmons son prix sur WhatsApp avant tout paiement.",
    paiementTitre: "Paiement",
    reglement: "Paiement à la commande : {montant}{par}. Nous vous envoyons les coordonnées de paiement sur WhatsApp et nous lançons vos achats dès réception.",
    recevoirCoordonnees: "Recevoir les coordonnées de paiement",
    livraisonTitre: "Livraison",
    suivreCommande: "Suivre ma commande",
    suivreDemande: "Suivre ma demande",
    votreCommande: "Votre commande",
    totalAPayer: "Total à payer",
    demandeHorsCatalogue: "Votre demande hors catalogue :",
    demandeAide: "Nous vous confirmons son prix sur WhatsApp avant de l'ajouter à votre commande.",
    votreNote: "Votre note :",
    siManque: "Si un article manque, nous vous prévenons sur WhatsApp et il vous est remboursé.",
    espaceTitre: "Votre espace client",
    espaceTexte: "Retrouvez vos commandes, recommandez en un geste et enregistrez votre adresse.",
    ouvrirEspace: "Ouvrir mon espace",
    // « Une question ? [Écrivez-nous sur WhatsApp]. »
    question: "Une question ?",
    ecrivezNous: "Écrivez-nous sur WhatsApp",
    raisonCommande: "Vous recevez cet e-mail parce qu'une commande a été passée sur {site} avec cette adresse.",
    monEspace: "Mon espace client",
    // {jour} = « demain », « vendredi 13 novembre » (en minuscules).
    sujetCommande: "Votre commande {reference} est enregistrée — livraison {jour}, {creneau}",
    sujetDemande: "Votre demande {reference} est enregistrée — livraison {jour}, {creneau}",
    apercuCommande: "Livraison {quand} · total {total}",
    apercuDemande: "Livraison {quand}",
    titreCommande: "Commande enregistrée",
    titreDemande: "Demande enregistrée",

    connexionSujet: "Votre lien de connexion à {site}",
    connexionTitre: "Votre espace client",
    connexionCorps: "Voici votre lien pour ouvrir votre espace client. Il est valable {minutes} minutes.",
    connexionIgnorer: "Si vous n'avez rien demandé, ignorez cet e-mail : personne n'entre sans ce lien.",
    connexionApercu: "Lien valable {minutes} minutes",
    connexionRaison: "Vous recevez cet e-mail parce qu'une connexion à {site} a été demandée avec cette adresse.",
    connexionTexte: "Votre lien pour ouvrir votre espace client (valable {minutes} minutes) :",
    connexionTexteIgnorer: "Si vous n'avez rien demandé, ignorez cet e-mail.",
  },

  // Les messages WhatsApp que le gérant envoie au client, écrits dans la langue du client.
  // {par} = « par Bit », espace devant compris, ou rien.
  messages: {
    par: " par {mode}",
    debut: "Bonjour {prenom}, c'est {site} !",
    montantARegler: "Montant à régler : {montant}{par}.",
    recueAPayer: "Nous avons bien reçu votre commande {reference}.",
    desReception: "Dès réception de votre paiement, nous lançons vos achats.",
    suivi: "Suivi : {lien}",
    recueSansPaiement: "Nous avons bien reçu votre commande {reference}. Nous nous en occupons.",
    recuePayee: "Nous avons bien reçu votre paiement pour la commande {reference}, merci. Nous nous en occupons.",
    preparation: "Votre commande {reference} est en préparation. Nous vous prévenons dès notre départ.",
    enRoute: "Votre commande {reference} est en route.",
    merci: "Merci pour votre commande {reference} ! N'hésitez pas si vous avez besoin d'autre chose pendant votre séjour.",
    annulee: "Votre commande {reference} a été annulée.",
    remboursement: "Nous vous remboursons {montant}.",
    question: "Écrivez-nous si vous avez la moindre question.",
    jArrive: "Je suis en route avec votre commande {reference}, j'arrive dans une dizaine de minutes.",
    // Ajouté aux messages « en route » et « j'arrive » quand le client loge à l'hôtel.
    hotel: "À l'hôtel, nous ne montons pas dans les chambres : je vous appelle à mon arrivée, merci de descendre à la réception.",
    // {mode} = « (Bit) », espace devant compris, ou rien.
    resteARegler: "Il reste {montant} à régler{mode}.",
  },

  juridique: {
    misAJour: "Dernière mise à jour : {date}",
    // Dans les autres langues : « Cette traduction est fournie pour votre confort ; en cas de différence, la version française fait foi. » Vide en français.
    traduction: "",

    conditions: {
      titre: "Conditions générales de vente",
      metaDescription: "Commande, prix, paiement, livraison, article indisponible, annulation : les conditions de vente de {site}.",
      intro: "Les présentes conditions s'appliquent à toute commande passée sur {site}. En validant une commande, vous les acceptez.",
      // Quand le gérant n'a pas renseigné de mode de paiement : remplace {paiements}.
      paiementsParDefaut: "les moyens indiqués au moment de la commande",
      service: {
        titre: "1. Le service",
        p1: "{vendeur} propose un service de courses et de livraison à domicile : nous achetons pour vous, auprès de commerces locaux, les articles que vous commandez, puis nous vous les livrons à l'adresse indiquée (logement, hôtel, location).",
      },
      commande: {
        titre: "2. La commande",
        p1: "Vous choisissez vos articles sur le site, puis indiquez vos coordonnées, votre adresse complète (rue, étage, numéro d'appartement ou de chambre), votre numéro de téléphone et le créneau de livraison souhaité. Un e-mail de confirmation vous est envoyé, avec un lien pour suivre votre commande.",
        p2: "Vous pouvez aussi demander un article qui n'est pas dans le catalogue. Nous le recherchons, puis nous vous confirmons son prix sur WhatsApp : il n'est ajouté à votre commande qu'avec votre accord.",
        p3: "Nous pouvons refuser ou annuler une commande, notamment en cas d'article introuvable, d'adresse hors zone ou d'informations incomplètes. Toute somme déjà versée est alors remboursée.",
      },
      prix: {
        titre: "3. Les prix",
        p1: "Les prix sont indiqués en shekels (₪). Le montant de votre commande comprend le prix des articles, les frais de service et les frais de livraison. Ces frais peuvent varier selon la ville, le jour et l'heure de livraison, ou si vous choisissez la livraison express : ils sont toujours affichés avant la validation de la commande. Le pourboire est facultatif.",
        p2: "Le prix d'un article peut évoluer d'un jour à l'autre ; le prix appliqué est celui affiché au moment de votre commande.",
      },
      paiement: {
        titre: "4. Le paiement",
        p1: "Le paiement se fait à la commande, avant la préparation, par {paiements}. Les coordonnées de paiement vous sont communiquées sur WhatsApp. Nous lançons vos achats dès réception de votre paiement.",
        p2: "Tant que le paiement n'est pas reçu, la commande n'est pas préparée. Si le paiement arrive trop tard pour le créneau choisi, nous vous proposons un autre créneau ou l'annulation de la commande.",
      },
      livraison: {
        titre: "5. La livraison",
        villes: "Nous livrons dans les villes suivantes : {villes}.",
        sansVilles: "Nous livrons dans les villes indiquées sur le site.",
        horaires: "Les livraisons ont lieu le soir ({amplitude}), dans le créneau que vous avez choisi.",
        creneau: "La livraison a lieu dans le créneau que vous avez choisi.",
        limite: "Une commande passée et réglée avant {heure} peut être livrée le soir même, selon les créneaux encore disponibles.",
        hotel: "À l'hôtel, nous ne montons pas dans les chambres : nous vous appelons à notre arrivée et la commande vous est remise à la réception ou dans le hall.",
        p2: "Merci d'être joignable sur WhatsApp et présent à l'adresse indiquée pendant le créneau. Si la livraison est impossible de votre fait (absence, adresse erronée, téléphone injoignable), une nouvelle livraison peut être facturée, et les produits frais ne peuvent pas être remboursés.",
        p3: "Les horaires sont donnés à titre indicatif : un retard lié à la circulation ou à un commerce ne donne pas lieu à indemnité, mais nous vous prévenons.",
      },
      indisponible: {
        titre: "6. Article indisponible",
        p1: "Si un article manque en magasin, nous suivons le choix que vous avez fait à la commande : vous contacter, le remplacer par un équivalent ou le retirer. Un article non livré n'est pas facturé ; s'il a déjà été payé, il vous est remboursé par le moyen de paiement utilisé.",
      },
      annulation: {
        titre: "7. Annulation",
        p1: "Vous pouvez annuler votre commande sans frais tant que nous n'avons pas commencé vos achats : écrivez-nous sur WhatsApp. La somme versée vous est alors remboursée. Une fois les achats effectués pour vous, la commande ne peut plus être annulée.",
        p2: "Les produits alimentaires, frais ou d'hygiène ne sont ni repris ni échangés, sauf erreur de notre part ou produit abîmé. Ces conditions ne vous privent d'aucun des droits que la loi vous accorde.",
      },
      reclamations: {
        titre: "8. Réclamations",
        p1: "Vérifiez votre commande à la livraison. En cas d'article manquant, erroné ou abîmé, contactez-nous dans les 24 heures, si possible avec une photo : nous remplaçons l'article ou nous vous le remboursons.",
      },
      produits: {
        titre: "9. Produits",
        p1: "Nous ne sommes pas le fabricant des produits livrés. Les descriptions et les photos sont données à titre indicatif ; l'emballage peut différer. Pour les produits vendus au poids, le poids livré peut varier légèrement. En cas d'allergie ou de régime particulier, vérifiez toujours l'étiquette du produit.",
        p2: "L'alcool n'est vendu qu'aux personnes majeures : une pièce d'identité peut être demandée à la livraison.",
      },
      donnees: {
        titre: "10. Données personnelles",
        p1: "Les informations que vous nous confiez servent à traiter et à livrer votre commande. Le détail est dans notre [politique de confidentialité](/confidentialite).",
      },
      droit: {
        titre: "11. Droit applicable et contact",
        p1: "Les présentes conditions sont soumises au droit israélien. En cas de difficulté, contactez-nous d'abord : nous cherchons toujours une solution amiable.",
        p2: "Pour toute question : [page de contact](/contact). L'identité du vendeur figure dans les [mentions légales](/mentions-legales).",
      },
    },

    confidentialite: {
      titre: "Politique de confidentialité",
      metaDescription: "Quelles informations {site} recueille, pourquoi, combien de temps, et comment les faire modifier ou supprimer.",
      intro: "{responsable} respecte votre vie privée. Cette page explique quelles informations nous recueillons quand vous utilisez {site}, ce que nous en faisons, et comment les faire modifier ou supprimer.",
      recueil: {
        titre: "Les informations que nous recueillons",
        points: [
          "**Pour une commande** : votre nom, votre numéro de téléphone (WhatsApp), votre adresse e-mail, votre adresse de livraison (rue ou hôtel, étage, numéro d'appartement ou de chambre, code d'entrée), le contenu de la commande et vos éventuelles notes.",
          "**Pour le paiement** : le mode choisi et la date du règlement. Nous ne recueillons ni numéro de carte ni identifiants bancaires sur ce site.",
          "**Pour votre espace client** : votre adresse e-mail, vos coordonnées enregistrées, la langue choisie et l'historique de vos commandes.",
          "**Données techniques** : l'adresse IP, utilisée brièvement pour protéger le site contre les abus.",
        ],
      },
      usage: {
        titre: "Ce que nous en faisons",
        points: [
          "Préparer, livrer et suivre votre commande.",
          "Vous contacter à son sujet, par WhatsApp, par téléphone ou par e-mail.",
          "Tenir notre comptabilité et respecter nos obligations légales.",
          "Vous permettre de retrouver vos commandes et de recommander plus vite.",
        ],
        p1: "Nous ne vendons pas vos informations et nous ne les utilisons pas pour de la publicité ciblée.",
      },
      partage: {
        titre: "Avec qui elles sont partagées",
        p1: "Uniquement avec les prestataires techniques nécessaires au service : l'hébergement du site et de sa base de données, l'envoi des e-mails de confirmation, et les messageries que nous utilisons pour vous écrire et pour être prévenus d'une nouvelle commande. Ces prestataires peuvent être situés hors d'Israël et de l'Union européenne. Les commerces où nous achetons vos articles ne reçoivent pas vos coordonnées.",
      },
      cookies: {
        titre: "Cookies et stockage dans votre navigateur",
        p1: "Le site n'utilise ni cookie publicitaire ni outil de suivi. Il utilise seulement ce qui est nécessaire à son fonctionnement : un cookie de connexion si vous ouvrez votre espace client, un cookie qui retient la langue choisie, et le stockage de votre navigateur pour garder votre panier et les liens de suivi de vos commandes.",
      },
      duree: {
        titre: "Combien de temps",
        p1: "Les commandes sont conservées le temps exigé par nos obligations comptables et légales. Votre espace client existe tant que vous le souhaitez : vous pouvez le supprimer à tout moment depuis [votre espace](/compte).",
      },
      droits: {
        titre: "Vos droits",
        p1: "Vous pouvez demander à consulter, corriger ou supprimer les informations qui vous concernent. Vos coordonnées se modifient directement dans votre espace client ; pour toute autre demande, [contactez-nous](/contact). Nous répondons dans les meilleurs délais.",
        // La même phrase quand le gérant a renseigné une adresse e-mail de contact.
        p1AvecEmail: "Vous pouvez demander à consulter, corriger ou supprimer les informations qui vous concernent. Vos coordonnées se modifient directement dans votre espace client ; pour toute autre demande, [contactez-nous](/contact) ([{email}](mailto:{email})). Nous répondons dans les meilleurs délais.",
      },
      securite: {
        titre: "Sécurité",
        p1: "Les échanges avec le site sont chiffrés. L'accès à votre espace client se fait par un lien personnel envoyé à votre adresse e-mail, sans mot de passe à retenir. L'accès aux commandes est réservé au gérant.",
      },
    },

    mentions: {
      titre: "Mentions légales",
      metaDescription: "Éditeur, contact et hébergement du site {site}.",
      editeur: "Éditeur du site",
      site: "Site",
      exploitant: "Exploitant",
      numero: "Numéro d'entreprise",
      adresse: "Adresse",
      email: "E-mail",
      contact: "Contact",
      pageContact: "Page de contact",
      hebergement: {
        titre: "Hébergement",
        p1: "Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, États-Unis (vercel.com). Les données sont enregistrées dans une base gérée par Supabase.",
      },
      propriete: {
        titre: "Propriété intellectuelle",
        p1: "Le site, son logo et ses textes appartiennent à leur éditeur. Les marques et les noms de produits cités appartiennent à leurs propriétaires respectifs : ils sont mentionnés uniquement pour désigner les articles que nous achetons pour vous.",
      },
      renvoi: {
        titre: "Conditions et données personnelles",
        p1: "Voir les [conditions générales de vente](/conditions) et la [politique de confidentialité](/confidentialite).",
      },
    },

    credits: {
      titre: "Crédits photos",
      metaDescription: "Les auteurs et les licences des photos d'illustration utilisées sur {site}.",
      intro: "Certaines photos de produits frais sont des photos d'illustration, sous licence libre, issues de Wikimedia Commons. Elles montrent le produit, pas forcément la variété ni l'emballage livrés. Merci à leurs auteurs.",
      auteurs: "Auteurs et licences",
      photoOrigine: "photo d'origine",
      modifications: {
        titre: "Modifications",
        p1: "Les photos ont été recadrées et allégées. Celles publiées sous une licence « partage dans les mêmes conditions » (CC BY-SA) restent disponibles, dans leur version recadrée, sous la même licence.",
      },
    },
  },
};

export default fr;
export type DictionnaireServeur = typeof fr;
