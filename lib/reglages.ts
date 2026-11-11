import "server-only";
import { prisma } from "./prisma";
import type { PlageTarifaire } from "./tarifs";
import type { VilleLivree } from "./villes";
import { MESSAGE_ACCUEIL_PAR_DEFAUT } from "./marque";

// Livraison le soir seulement : de 19h à minuit.
export const CRENEAUX_PAR_DEFAUT = ["19:00 – 20:00", "20:00 – 21:00", "21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"];

/** Les réglages (une seule ligne, créée au premier besoin). */
export async function lireReglages() {
  const existants = await prisma.reglages.findUnique({ where: { id: 1 } });
  if (existants) return existants;
  return prisma.reglages.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      creneaux: CRENEAUX_PAR_DEFAUT,
      messageAccueil: MESSAGE_ACCUEIL_PAR_DEFAUT,
    },
  });
}

/** Ce que le public a le droit de lire des réglages. */
export async function reglagesPublics() {
  const [r, plages, villes] = await Promise.all([lireReglages(), plagesActives(), villesActives()]);
  return {
    plages,
    fraisRegroupes: r.fraisRegroupes,
    fraisService: r.fraisService,
    fraisLivraison: r.fraisLivraison,
    fraisExpress: r.fraisExpress,
    pourboires: r.pourboires,
    paiements: r.paiements,
    minimumCommande: r.minimumCommande,
    joursLivres: r.joursLivres,
    delaiPreparation: r.delaiPreparation,
    heureLimite: r.heureLimite,
    villes,
    creneaux: r.creneaux,
    whatsapp: r.whatsapp,
    messageAccueil: r.messageAccueil,
    ouvert: r.ouvert,
  };
}

export type ReglagesPublics = Awaited<ReturnType<typeof reglagesPublics>>;

/** Ce que les pages légales et la page de contact affichent : l'entreprise et la façon de la joindre. */
export async function infosLegales() {
  const [r, villes] = await Promise.all([lireReglages(), villesActives()]);
  return {
    nom: r.entrepriseNom,
    numero: r.entrepriseNumero,
    adresse: r.entrepriseAdresse,
    email: r.emailContact,
    whatsapp: r.whatsapp,
    paiements: r.paiements,
    creneaux: r.creneaux,
    heureLimite: r.heureLimite,
    villes: villes.map((v) => v.nom),
  };
}

/** Les plages tarifaires actives, dans l'ordre où elles s'appliquent. */
export async function plagesActives(): Promise<PlageTarifaire[]> {
  return prisma.plageTarifaire.findMany({
    where: { active: true },
    orderBy: [{ ordre: "asc" }, { createdAt: "asc" }],
    select: {
      id: true, nom: true, jours: true, debut: true, fin: true,
      fraisService: true, fraisLivraison: true, fraisExpress: true, majorationPct: true,
    },
  });
}

/** Les villes livrées, dans l'ordre d'affichage. */
export async function villesActives(): Promise<VilleLivree[]> {
  return prisma.ville.findMany({
    where: { active: true },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: { nom: true, supplementLivraison: true, minimumCommande: true },
  });
}
