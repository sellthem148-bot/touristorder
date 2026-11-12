import "server-only";
import { prisma } from "./prisma";
import { envoyerCourriel } from "./courriel";
import { adresseDuLogo, courrielDeConfirmation, courrielNouvelleCommande, type CommandePourCourriel } from "./courriels";
import { creerJetonClient, DUREE_LIEN_CONFIRMATION_MS } from "./session-client";
import { libelleDuJour } from "./dates";
import { lireReglages } from "./reglages";
import { lienWhatsapp } from "./whatsapp";
import { prenomDe } from "./messages-client";
import { NOM_DU_SITE } from "./marque";
import { messageDeReglement } from "./paiement";
import { envoyerTelegram, texteDeLAlerte } from "./telegram";
import { adresseComplete } from "./adresse";
import { referenceDeCommande } from "./reference";
import { prefixeDe, remplir } from "./langues";
import { dictionnaire, langueDuCourriel, langueEnregistree, libelleDuMode } from "./i18n";
import { libelleOptions, nomArticle, nomTarif, nomVille } from "./i18n/catalogue";

/**
 * Après une commande : la confirmation au client, l'avis au gérant (EMAIL_GERANT) et son alerte Telegram.
 * Au mieux : ne lève jamais — la commande est déjà enregistrée.
 */
export async function envoyerCourrielsDeCommande(commandeId: string, site: string): Promise<void> {
  try {
    const [c, reglages] = await Promise.all([
      prisma.commande.findUnique({
        where: { id: commandeId },
        select: {
          id: true, numero: true, jeton: true, email: true, clientId: true, nomClient: true, telephone: true, ville: true, logement: true, adresse: true, etage: true, appartement: true, codeEntree: true, langue: true,
          dateLivraison: true, creneau: true, paiement: true, notes: true, demandeLibre: true, express: true, tarifNom: true, majorationPct: true,
          sousTotal: true, majoration: true, fraisService: true, fraisLivraison: true, pourboire: true, total: true,
          // Jamais le prix d'achat, la boutique ni le lien Wolt dans un e-mail au client.
          lignes: { where: { indisponible: false }, orderBy: { nom: "asc" }, select: { nom: true, options: true, quantite: true, prixUnitaire: true } },
        },
      }),
      lireReglages(),
    ]);
    if (!c) return;

    // L'e-mail du client est écrit dans la langue de sa commande ; l'avis au gérant reste en français.
    const langue = langueEnregistree(c.langue);
    const t = dictionnaire(langue);
    const reference = referenceDeCommande(c.numero, c.nomClient);
    const jetonEspace = c.clientId ? creerJetonClient("lien", c.clientId, DUREE_LIEN_CONFIRMATION_MS) : null;
    const donnees: CommandePourCourriel = {
      site: NOM_DU_SITE,
      logo: adresseDuLogo(site),
      numero: c.numero,
      reference,
      nomClient: c.nomClient,
      prenom: prenomDe(c.nomClient),
      telephone: c.telephone,
      ville: c.ville,
      adresse: adresseComplete(c),
      jour: libelleDuJour(c.dateLivraison),
      creneau: c.creneau,
      paiement: c.paiement,
      notes: c.notes,
      demandeLibre: c.demandeLibre,
      lignes: c.lignes,
      totaux: c,
      presentation: { regroupes: reglages.fraisRegroupes, express: c.express, tarifNom: c.tarifNom, majorationPct: c.majorationPct, ville: c.ville },
      lienSuivi: `${site}/suivi/${c.jeton}`,
      lienEspace: jetonEspace ? `${site}/compte/acces?jeton=${jetonEspace}` : null,
      lienWhatsapp: lienWhatsapp(reglages.whatsapp, remplir(dictionnaire("fr").whatsapp.question, { reference })),
      // Les coordonnées de paiement ne sont jamais dans l'e-mail : le client les demande sur WhatsApp.
      lienPaiement: c.total > 0 ? lienWhatsapp(reglages.whatsapp, messageDeReglement({ reference, montant: c.total, mode: c.paiement, site: NOM_DU_SITE })) : null,
    };

    const envois: Promise<unknown>[] = [];
    if (c.email) {
      const mode = libelleDuMode(c.paiement, t);
      const pourLeClient: CommandePourCourriel = {
        ...donnees,
        adresse: adresseComplete(c, t.adresse),
        // Le suivi à l'adresse de sa langue (« /he/suivi/… ») : il y arrive directement, sur n'importe quel appareil.
        lienSuivi: `${site}${prefixeDe(langue)}/suivi/${c.jeton}`,
        ville: nomVille(c.ville, langue),
        // Les articles et leurs options dans la langue du client (les lignes de la commande restent en français).
        lignes: c.lignes.map((l) => ({ ...l, nom: nomArticle(l.nom, langue), options: libelleOptions(l.options, langue) })),
        presentation: { ...donnees.presentation, tarifNom: nomTarif(c.tarifNom, langue), ville: nomVille(c.ville, langue) },
        jour: libelleDuJour(c.dateLivraison, undefined, langue),
        paiement: mode,
        lienWhatsapp: lienWhatsapp(reglages.whatsapp, remplir(t.whatsapp.question, { reference })),
        lienPaiement: c.total > 0
          ? lienWhatsapp(reglages.whatsapp, messageDeReglement({ reference, montant: c.total, mode, site: NOM_DU_SITE }, { reglement: t.whatsapp.reglement, par: t.paiement.par }, langue))
          : null,
      };
      envois.push(envoyerCourriel({ a: c.email, ...courrielDeConfirmation(pourLeClient, langueDuCourriel(langue)) }));
    }
    const gerant = (process.env.EMAIL_GERANT ?? "").trim();
    if (gerant) {
      envois.push(envoyerCourriel({ a: gerant, ...courrielNouvelleCommande({ ...donnees, presentation: { ...donnees.presentation, regroupes: false }, lienAdmin: `${site}/admin/commandes/${c.id}`, langueClient: langue }) }));
    }
    // L'alerte Telegram du gérant (si le robot est relié, Réglages) : immédiate, sur son téléphone.
    if (reglages.telegramJeton && reglages.telegramDiscussion) {
      envois.push(
        envoyerTelegram(
          reglages.telegramJeton,
          reglages.telegramDiscussion,
          texteDeLAlerte({
            numero: c.numero, reference, nomClient: c.nomClient, ville: c.ville, jour: donnees.jour, creneau: c.creneau, total: c.total, paiement: c.paiement,
            nombreArticles: c.lignes.reduce((s, l) => s + l.quantite, 0), demandeLibre: c.demandeLibre, lienAdmin: `${site}/admin/commandes/${c.id}`,
          }),
        ),
      );
    }
    await Promise.all(envois);
  } catch (e) {
    console.error(`[courriel] commande ${commandeId} : ${e instanceof Error ? e.name : "erreur"}`);
  }
}
