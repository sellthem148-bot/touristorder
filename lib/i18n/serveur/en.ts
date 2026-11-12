// Les textes que seul le serveur écrit, en anglais : référencement, messages d'erreur, e-mails,
// messages WhatsApp envoyés au client, pages légales. Même forme que serveur/fr.ts (la référence).
// « {cle} » = une valeur remplie par le code. Dans `juridique` : « [texte](/adresse) » = un lien, « **texte** » = du gras.
import type { DictionnaireServeur } from "./fr";

const en: DictionnaireServeur = {
  meta: {
    titre: "{site} — groceries delivered to your door in Israel",
    description:
      "Groceries, baby products, toiletries, chargers and the holiday essentials you forgot: order online and we deliver in the evening to your rental or hotel, in Netanya and nearby cities.",
  },

  erreurs: {
    champs: "Please check the fields in red.",
    refusee: "Order not accepted.",
    tropDeCommandes: "Too many orders in a short time. Please try again in a few minutes.",
    panierIllisible: "We couldn't read your cart: please reload the page.",
    ferme: "Orders are closed for the moment. Please try again a little later.",
    villeNonLivree: "We don't deliver to this city yet.",
    jourIndisponible: "This day is no longer available: please choose another.",
    creneauComplet: "This time slot has just filled up: please choose another.",
    creneauCompletChamp: "This time slot is full: please choose another.",
    creneauIndisponible: "This time slot is no longer available: please choose another.",
    expressNonPropose: "Express delivery isn't available for this time slot.",
    expressChamp: "No express for this time slot.",
    paiementRequis: "Choose a payment method.",
    pourboirePerime: "This tip amount is no longer offered: please reload the page.",
    pourboireChamp: "Choose an amount from the list.",
    panierPerime: "Some items in your cart are no longer available or have changed. We've updated your cart: please check it.",
    minimum: "The minimum order for {ville} is {prix} in items (excluding fees).",

    nomRequis: "Your name is required.",
    telephoneRequis: "Your phone number is required.",
    telephoneLong: "Number too long.",
    telephoneInvalide: "Invalid number.",
    telephoneIndicatif: "Invalid number: include the country code (e.g. +44 7700 900123).",
    emailRequis: "Your email address is required.",
    emailInvalide: "Invalid email address.",
    emailLong: "Email address too long.",
    villeRequise: "Choose a city.",
    adresseRequise: "Enter the street and number, or the hotel name.",
    etageRequis: "Enter the floor (0 for the ground floor).",
    appartementRequis: "Enter the apartment or room number.",
    jourRequis: "Choose a day.",
    creneauRequis: "Choose a time slot.",
    maxCaracteres: "{max} characters maximum.",
    remplacementRequis: "Choose what to do if an item is unavailable.",
    tropArticles: "Too many different items.",
    panierVide: "Your cart is empty.",

    tropDeDemandes: "Too many requests. Please try again in a moment.",
    emailNonConfigure: "Email sending isn't set up on this site yet.",
  },

  // Les e-mails envoyés au client. {par} = « by Bit », espace devant compris, ou rien.
  courriel: {
    par: " by {mode}",
    // {numero} = « #42 » (en gras dans l'e-mail).
    merciCommande: "Thank you, {prenom}! We've received your order {numero}.",
    merciDemande: "Thank you, {prenom}! We've received your request {numero}.",
    suiteCommande: "We'll prepare it as soon as we receive your payment, then deliver it to where you're staying.",
    suiteDemande: "We're looking for the item and will confirm its price on WhatsApp before any payment.",
    paiementTitre: "Payment",
    reglement: "Payment is due when you order: {montant}{par}. We'll send you the payment details on WhatsApp and start your shopping as soon as we receive your payment.",
    recevoirCoordonnees: "Get the payment details",
    livraisonTitre: "Delivery",
    suivreCommande: "Track my order",
    suivreDemande: "Track my request",
    votreCommande: "Your order",
    totalAPayer: "Total to pay",
    demandeHorsCatalogue: "Your special request:",
    demandeAide: "We'll confirm its price on WhatsApp before adding it to your order.",
    votreNote: "Your note:",
    siManque: "If an item is unavailable, we'll let you know on WhatsApp and refund it.",
    espaceTitre: "Your account",
    espaceTexte: "Find your orders, reorder in one tap and save your address.",
    ouvrirEspace: "Open my account",
    // « Any questions? [Message us on WhatsApp]. »
    question: "Any questions?",
    ecrivezNous: "Message us on WhatsApp",
    raisonCommande: "You're receiving this email because an order was placed on {site} with this address.",
    monEspace: "My account",
    // {jour} = « tomorrow », « Friday 13 November ».
    sujetCommande: "Your order {numero} has been received — delivery: {jour}, {creneau}",
    sujetDemande: "Your request {numero} has been received — delivery: {jour}, {creneau}",
    apercuCommande: "Delivery: {quand} · total {total}",
    apercuDemande: "Delivery: {quand}",
    titreCommande: "Order received",
    titreDemande: "Request received",

    connexionSujet: "Your sign-in link for {site}",
    connexionTitre: "Your account",
    connexionCorps: "Here is your link to open your account. It is valid for {minutes} minutes.",
    connexionIgnorer: "If you didn't request this, just ignore this email: no one can get in without this link.",
    connexionApercu: "Link valid for {minutes} minutes",
    connexionRaison: "You're receiving this email because a sign-in to {site} was requested with this address.",
    connexionTexte: "Your link to open your account (valid for {minutes} minutes):",
    connexionTexteIgnorer: "If you didn't request this, just ignore this email.",
  },

  // Les messages WhatsApp que le gérant envoie au client, écrits dans la langue du client.
  // {par} = « by Bit », espace devant compris, ou rien.
  messages: {
    par: " by {mode}",
    debut: "Hello {prenom}, this is {site}!",
    montantARegler: "Amount to pay: {montant}{par}.",
    recueAPayer: "We've received your order #{numero}.",
    desReception: "As soon as we receive your payment, we'll start your shopping.",
    suivi: "Track your order: {lien}",
    recueSansPaiement: "We've received your order #{numero}. We're taking care of it.",
    recuePayee: "We've received your payment for order #{numero}, thank you. We're taking care of it.",
    preparation: "Your order #{numero} is being prepared. We'll let you know as soon as we set off.",
    enRoute: "Your order #{numero} is on its way.",
    merci: "Thank you for your order #{numero}! Just message us if you need anything else during your stay.",
    annulee: "Your order #{numero} has been cancelled.",
    remboursement: "We're refunding you {montant}.",
    question: "Please message us if you have any questions.",
    jArrive: "I'm on my way with your order #{numero} and will be there in about ten minutes.",
    // {mode} = « (Bit) », espace devant compris, ou rien.
    resteARegler: "There is {montant} left to pay{mode}.",
  },

  juridique: {
    misAJour: "Last updated: {date}",
    traduction: "This translation is provided for your convenience; in case of any difference, the French version prevails.",

    conditions: {
      titre: "Terms of sale",
      metaDescription: "Ordering, prices, payment, delivery, unavailable items, cancellation: the terms of sale of {site}.",
      intro: "These terms apply to every order placed on {site}. By confirming an order, you accept them.",
      // Quand le gérant n'a pas renseigné de mode de paiement : remplace {paiements}.
      paiementsParDefaut: "the payment methods shown when you order",
      service: {
        titre: "1. The service",
        p1: "{vendeur} provides a shopping and home delivery service: we buy the items you order on your behalf from local shops, then deliver them to the address you give us (accommodation, hotel, rental).",
      },
      commande: {
        titre: "2. Ordering",
        p1: "You choose your items on the site, then enter your contact details, your full address (street, floor, apartment or room number), your phone number and the delivery time slot you would like. A confirmation email is sent to you, with a link to track your order.",
        p2: "You can also request an item that is not in the catalogue. We look for it, then confirm its price with you on WhatsApp: it is added to your order only with your agreement.",
        p3: "We may refuse or cancel an order, in particular if an item cannot be found, the address is outside our delivery area or the information is incomplete. Any amount already paid is then refunded.",
      },
      prix: {
        titre: "3. Prices",
        p1: "Prices are shown in shekels (₪). The amount of your order includes the price of the items, the service fee and the delivery fee. These fees may vary depending on the city, the day and the time of delivery, or if you choose express delivery: they are always shown before you confirm your order. The tip is optional.",
        p2: "The price of an item may change from one day to the next; the price charged is the one shown at the time of your order.",
      },
      paiement: {
        titre: "4. Payment",
        p1: "Payment is made when you order, before your order is prepared, by {paiements}. The payment details are sent to you on WhatsApp. We start your shopping as soon as we receive your payment.",
        p2: "Until payment is received, the order is not prepared. If payment arrives too late for the chosen time slot, we will offer you another time slot or the cancellation of the order.",
      },
      livraison: {
        titre: "5. Delivery",
        villes: "We deliver to the following cities: {villes}.",
        sansVilles: "We deliver to the cities listed on the site.",
        horaires: "Deliveries take place in the evening ({amplitude}), within the time slot you chose.",
        creneau: "Delivery takes place within the time slot you chose.",
        limite: "An order placed and paid for before {heure} can be delivered the same evening, depending on the time slots still available.",
        p2: "Please be reachable on WhatsApp and present at the address given during the time slot. If delivery is impossible for reasons on your side (absence, wrong address, phone unreachable), a new delivery may be charged, and fresh products cannot be refunded.",
        p3: "Times are given as a guide only: a delay caused by traffic or by a shop does not give rise to compensation, but we will let you know.",
      },
      indisponible: {
        titre: "6. Unavailable items",
        p1: "If an item is out of stock in the shop, we follow the choice you made when ordering: contact you, replace it with a similar item or remove it. An item that is not delivered is not charged; if it has already been paid for, it is refunded to you through the payment method used.",
      },
      annulation: {
        titre: "7. Cancellation",
        p1: "You can cancel your order free of charge as long as we have not started your shopping: message us on WhatsApp. The amount paid is then refunded to you. Once the shopping has been done for you, the order can no longer be cancelled.",
        p2: "Food, fresh and hygiene products cannot be returned or exchanged, unless we made a mistake or the product is damaged. These terms do not deprive you of any of the rights granted to you by law.",
      },
      reclamations: {
        titre: "8. Complaints",
        p1: "Check your order on delivery. If an item is missing, wrong or damaged, contact us within 24 hours, with a photo if possible: we will replace the item or refund it.",
      },
      produits: {
        titre: "9. Products",
        p1: "We are not the manufacturer of the products delivered. Descriptions and photos are given as a guide only; the packaging may differ. For products sold by weight, the weight delivered may vary slightly. If you have an allergy or follow a special diet, always check the product label.",
        p2: "Alcohol is sold only to adults of legal age: proof of identity may be requested on delivery.",
      },
      donnees: {
        titre: "10. Personal data",
        p1: "The information you give us is used to process and deliver your order. The details are in our [privacy policy](/confidentialite).",
      },
      droit: {
        titre: "11. Governing law and contact",
        p1: "These terms are governed by Israeli law. If a problem arises, please contact us first: we always look for an amicable solution.",
        p2: "For any questions: [contact page](/contact). The seller's identity is given in the [legal notice](/mentions-legales).",
      },
    },

    confidentialite: {
      titre: "Privacy policy",
      metaDescription: "What information {site} collects, why, for how long, and how to have it changed or deleted.",
      intro: "{responsable} respects your privacy. This page explains what information we collect when you use {site}, what we do with it, and how to have it changed or deleted.",
      recueil: {
        titre: "The information we collect",
        points: [
          "**For an order**: your name, your phone number (WhatsApp), your email address, your delivery address (street or hotel, floor, apartment or room number, entry code), the contents of the order and any notes you add.",
          "**For payment**: the method chosen and the date of payment. We do not collect card numbers or bank login details on this site.",
          "**For your account**: your email address, your saved details, the language you chose and your order history.",
          "**Technical data**: your IP address, used briefly to protect the site against abuse.",
        ],
      },
      usage: {
        titre: "What we do with it",
        points: [
          "Prepare, deliver and track your order.",
          "Contact you about it, by WhatsApp, phone or email.",
          "Keep our accounts and meet our legal obligations.",
          "Let you find your orders and reorder more quickly.",
        ],
        p1: "We do not sell your information and we do not use it for targeted advertising.",
      },
      partage: {
        titre: "Who it is shared with",
        p1: "Only with the technical service providers needed to run the service: the hosting of the site and its database, the sending of confirmation emails, and the messaging services we use to write to you and to be notified of a new order. These providers may be located outside Israel and the European Union. The shops where we buy your items do not receive your contact details.",
      },
      cookies: {
        titre: "Cookies and storage in your browser",
        p1: "The site uses no advertising cookies and no tracking tools. It uses only what it needs to work: a sign-in cookie if you open your account, a cookie that remembers the language you chose, and your browser's storage to keep your cart and the tracking links for your orders.",
      },
      duree: {
        titre: "How long we keep it",
        p1: "Orders are kept for as long as our accounting and legal obligations require. Your account exists for as long as you wish: you can delete it at any time from [your account](/compte).",
      },
      droits: {
        titre: "Your rights",
        p1: "You can ask to see, correct or delete the information we hold about you. You can change your contact details directly in your account; for any other request, [contact us](/contact). We reply as soon as possible.",
        // La même phrase quand le gérant a renseigné une adresse e-mail de contact.
        p1AvecEmail: "You can ask to see, correct or delete the information we hold about you. You can change your contact details directly in your account; for any other request, [contact us](/contact) ([{email}](mailto:{email})). We reply as soon as possible.",
      },
      securite: {
        titre: "Security",
        p1: "Communication with the site is encrypted. You access your account through a personal link sent to your email address, with no password to remember. Access to orders is restricted to the manager.",
      },
    },

    mentions: {
      titre: "Legal notice",
      metaDescription: "Publisher, contact and hosting of the {site} website.",
      editeur: "Site publisher",
      site: "Website",
      exploitant: "Operator",
      numero: "Business number",
      adresse: "Address",
      email: "Email",
      contact: "Contact",
      pageContact: "Contact page",
      hebergement: {
        titre: "Hosting",
        p1: "The site is hosted by Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, United States (vercel.com). Data is stored in a database managed by Supabase.",
      },
      propriete: {
        titre: "Intellectual property",
        p1: "The site, its logo and its texts belong to their publisher. The brands and product names mentioned belong to their respective owners: they are mentioned only to identify the items we buy for you.",
      },
      renvoi: {
        titre: "Terms and personal data",
        p1: "See the [terms of sale](/conditions) and the [privacy policy](/confidentialite).",
      },
    },

    credits: {
      titre: "Photo credits",
      metaDescription: "The authors and licences of the illustrative photos used on {site}.",
      intro: "Some photos of fresh products are illustrative photos, under a free licence, from Wikimedia Commons. They show the product, not necessarily the variety or the packaging delivered. Thank you to their authors.",
      auteurs: "Authors and licences",
      photoOrigine: "original photo",
      modifications: {
        titre: "Changes",
        p1: "The photos have been cropped and compressed. Those published under a “share-alike” licence (CC BY-SA) remain available, in their cropped version, under the same licence.",
      },
    },
  },
};

export default en;
