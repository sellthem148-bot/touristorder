import "server-only";
import { prisma } from "./prisma";
import { envoyerCourriel } from "./courriel";
import { courrielDeConfirmation, courrielNouvelleCommande, type CommandePourCourriel } from "./courriels";
import { creerJetonClient, DUREE_LIEN_CONFIRMATION_MS } from "./session-client";
import { libelleDuJour } from "./dates";
import { lireReglages } from "./reglages";
import { lienWhatsapp } from "./whatsapp";
import { prenomDe } from "./messages-client";
import { NOM_DU_SITE } from "./marque";

/**
 * Après une commande : la confirmation au client et l'avis au gérant (EMAIL_GERANT).
 * Au mieux : ne lève jamais — la commande est déjà enregistrée.
 */
export async function envoyerCourrielsDeCommande(commandeId: string, site: string): Promise<void> {
  try {
    const [c, reglages] = await Promise.all([
      prisma.commande.findUnique({
        where: { id: commandeId },
        select: {
          id: true, numero: true, jeton: true, email: true, clientId: true, nomClient: true, telephone: true, ville: true, adresse: true,
          dateLivraison: true, creneau: true, paiement: true, notes: true, express: true, tarifNom: true, majorationPct: true,
          sousTotal: true, majoration: true, fraisService: true, fraisLivraison: true, pourboire: true, total: true,
          // Jamais le prix d'achat, la boutique ni le lien Wolt dans un e-mail au client.
          lignes: { where: { indisponible: false }, orderBy: { nom: "asc" }, select: { nom: true, options: true, quantite: true, prixUnitaire: true } },
        },
      }),
      lireReglages(),
    ]);
    if (!c) return;

    const jetonEspace = c.clientId ? creerJetonClient("lien", c.clientId, DUREE_LIEN_CONFIRMATION_MS) : null;
    const donnees: CommandePourCourriel = {
      site: NOM_DU_SITE,
      numero: c.numero,
      nomClient: c.nomClient,
      prenom: prenomDe(c.nomClient),
      telephone: c.telephone,
      ville: c.ville,
      adresse: c.adresse,
      jour: libelleDuJour(c.dateLivraison),
      creneau: c.creneau,
      paiement: c.paiement,
      notes: c.notes,
      lignes: c.lignes,
      totaux: c,
      presentation: { regroupes: reglages.fraisRegroupes, express: c.express, tarifNom: c.tarifNom, majorationPct: c.majorationPct, ville: c.ville },
      lienSuivi: `${site}/suivi/${c.jeton}`,
      lienEspace: jetonEspace ? `${site}/compte/acces?jeton=${jetonEspace}` : null,
      lienWhatsapp: lienWhatsapp(reglages.whatsapp, `Bonjour ! J'ai une question sur ma commande n°${c.numero}.`),
    };

    const envois: Promise<unknown>[] = [];
    if (c.email) envois.push(envoyerCourriel({ a: c.email, ...courrielDeConfirmation(donnees) }));
    const gerant = (process.env.EMAIL_GERANT ?? "").trim();
    if (gerant) {
      envois.push(envoyerCourriel({ a: gerant, ...courrielNouvelleCommande({ ...donnees, presentation: { ...donnees.presentation, regroupes: false }, lienAdmin: `${site}/admin/commandes/${c.id}` }) }));
    }
    await Promise.all(envois);
  } catch (e) {
    console.error(`[courriel] commande ${commandeId} : ${e instanceof Error ? e.name : "erreur"}`);
  }
}
