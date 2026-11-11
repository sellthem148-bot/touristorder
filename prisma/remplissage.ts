// Le remplissage de la base, partagé par `npm run seed` (prisma/seed.ts) et par la préparation
// automatique de la production (prisma/preparer.ts).
import { ANCIEN_MESSAGE_ACCUEIL, ANCIENS_PAIEMENTS, MESSAGE_ACCUEIL_PAR_DEFAUT, PAIEMENTS_PAR_DEFAUT } from "../lib/marque";
import { Prisma, type PrismaClient } from "@prisma/client";
import { DOSSIER_PHOTOS_FRAIS } from "../lib/credits-photos";
import { PHOTOS_FRAIS } from "./photos-frais";
import { slugDe } from "../lib/slug";
import { lireOptionsSaisies } from "../lib/options";
import { CATALOGUE, CATEGORIES, PLAGES_EXEMPLE, VILLES_EXEMPLE } from "./catalogue";
import { ARTICLES_WOLT, BOUTIQUE_WOLT, CATEGORIES_WOLT, REMPLACES_PAR_WOLT, enAgorot, type ArticleWolt } from "./articles-wolt";
import { ARTICLES_DYNAMICA, BOUTIQUE_DYNAMICA } from "./articles-dynamica";
import { ARTICLES_WOLT_FICHES, DESCRIPTIONS_ENRICHIES } from "./articles-wolt-fiches";
import { ARTICLES_DE_LA_LISTE, ARTICLES_MIS_EN_VENTE } from "./articles-liste";

function options(texte: string | undefined, nom: string) {
  const lues = lireOptionsSaisies(texte ?? "");
  if (!lues.ok) throw new Error(`${nom} : ${lues.erreur}`);
  return lues.groupes;
}

// Prix d'exemple (agorot) pour le mode démo. Couches : taille 6 à +5 ₪, pour tester un supplément.
const DEMO: { nom: string; prix: number; prixAchat: number; prixBarre?: number; options?: string }[] = [
  { nom: "Pack d'eau 6 × 1,5 L", prix: 2490, prixAchat: 1990 },
  { nom: "Lait 3 % 1 L", prix: 990, prixAchat: 790 },
  { nom: "Œufs × 12", prix: 2290, prixAchat: 1790 },
  { nom: "Houmous 400 g", prix: 1590, prixAchat: 1190 },
  { nom: "Café en capsules × 10", prix: 2990, prixAchat: 2290 },
  { nom: "Couches Huggies", prix: 6990, prixAchat: 5990, options: "Taille : 3 | 4 | 5 | 6 +5" },
  { nom: "Lingettes bébé", prix: 1990, prixAchat: 1590 },
  { nom: "Body bébé coton", prix: 5990, prixAchat: 4490 },
  { nom: "Crème solaire SPF 50", prix: 6990, prixAchat: 5490, prixBarre: 7990 },
  { nom: "Maillot de bain enfant", prix: 8990, prixAchat: 6990 },
  { nom: "Tongs adulte", prix: 4990, prixAchat: 3490 },
  { nom: "Chargeur téléphone 20 W", prix: 9990, prixAchat: 7990 },
  { nom: "Adaptateur prise Israël (type H)", prix: 3490, prixAchat: 2490 },
  { nom: "Batterie externe 10 000 mAh", prix: 14990, prixAchat: 11990 },
  { nom: "Brosse à dents + dentifrice", prix: 2490, prixAchat: 1890 },
  { nom: "Bamba", prix: 690, prixAchat: 490 },
  { nom: "Bougies de Shabbat", prix: 1490, prixAchat: 990 },
  { nom: "Bouquet de fleurs", prix: 18990, prixAchat: 14990, options: "Taille : Moyen | Grand +60" },
];

/**
 * Un relevé de prix d'une boutique de Wolt : installé en une fois, une seule fois.
 * `ordre` : le rang du premier article du lot dans son rayon (0 par défaut). Un lot ajouté plus tard
 * à une boutique déjà installée prend un rang élevé : ses articles se rangent après ceux qui y sont déjà.
 */
export type LotWolt = { nom: string; boutique: string; articles: ArticleWolt[]; ordre?: number };

export const LOTS_WOLT: LotWolt[] = [
  { nom: "Wolt Market", boutique: BOUTIQUE_WOLT, articles: ARTICLES_WOLT },
  { nom: "Dynamica", boutique: BOUTIQUE_DYNAMICA, articles: ARTICLES_DYNAMICA },
  { nom: "Wolt Market, fiches du 11 novembre", boutique: BOUTIQUE_WOLT, articles: ARTICLES_WOLT_FICHES, ordre: 500 },
];

/**
 * Installe les articles réels de Wolt, avec leur prix, lot par lot (prisma/articles-*.ts).
 * Chaque lot UNE SEULE FOIS : dès qu'un de ses articles existe (reconnu à son nom sur Wolt), on ne
 * touche plus à ce lot — les prix se gèrent ensuite dans l'admin, et un article supprimé par le
 * gérant ne revient pas. Un nouveau lot s'ajoute sans toucher aux précédents.
 * Un article « à compléter » du même nom (sans prix) est complété ; un article qui a déjà un prix n'est jamais modifié.
 */
export async function installerLesArticlesWolt(prisma: PrismaClient): Promise<string> {
  for (const c of CATEGORIES_WOLT) {
    await prisma.categorie.upsert({
      where: { nom: c.nom },
      update: {},
      create: { nom: c.nom, emoji: c.emoji, slug: slugDe(c.nom), ordre: c.ordre },
    });
  }
  const categories = new Map((await prisma.categorie.findMany({ select: { id: true, nom: true } })).map((c) => [c.nom, c.id]));

  const bilans: string[] = [];
  for (const lot of LOTS_WOLT) {
    const dejaLa = await prisma.produit.count({ where: { nomWolt: { in: lot.articles.map((a) => a.nomWolt) } } });
    if (dejaLa > 0) {
      bilans.push(`${lot.nom} : déjà installé (${dejaLa}), rien de changé`);
      continue;
    }
    const existants = new Map((await prisma.produit.findMany({ select: { id: true, nom: true, prix: true } })).map((p) => [p.nom, p]));
    let crees = 0;
    let completes = 0;
    for (const [i, a] of lot.articles.entries()) {
      const categorieId = categories.get(a.categorie);
      if (!categorieId) throw new Error(`Catégorie inconnue : ${a.categorie} (${a.nom})`);
      const prix = enAgorot(a.prix);
      const donnees = {
        description: a.description,
        prix,
        prixAchat: prix, // même prix que Wolt : la marge est sur les frais
        actif: !a.horsLigne,
        badge: a.populaire ? "populaire" : "",
        boutique: lot.boutique,
        nomWolt: a.nomWolt,
        categorieId,
      };
      const existant = existants.get(a.nom);
      if (existant) {
        if (existant.prix > 0) continue; // déjà chiffré par le gérant : on n'y touche pas
        await prisma.produit.update({ where: { id: existant.id }, data: donnees });
        completes += 1;
      } else {
        await prisma.produit.create({ data: { nom: a.nom, ordre: (lot.ordre ?? 0) + i, ...donnees } });
        crees += 1;
      }
    }
    const horsLigne = lot.articles.filter((a) => a.horsLigne).length;
    bilans.push(`${lot.nom} : ${crees} ajouté(s) avec leur prix${completes ? `, ${completes} complété(s)` : ""}${horsLigne ? ` (${horsLigne} hors ligne)` : ""}`);
  }
  return `Articles Wolt — ${bilans.join(" ; ")}.`;
}

/** Le rang du premier article de la liste du gérant dans son rayon : après tous les articles de Wolt. */
const ORDRE_DE_LA_LISTE = 1000;

/**
 * Installe la liste de produits dressée par le gérant (prisma/articles-liste.ts) : des articles
 * « à compléter », SANS prix de vente (masqués, impossibles à commander), avec le prix indicatif de sa
 * liste gardé à part comme repère. Ses prix ne sont pas ceux de Wolt : c'est lui qui tape le vrai
 * prix dans « Prix rapides », et l'article passe en ligne.
 * Une seule fois : dès qu'un article porte un prix indicatif, ou qu'un nom de la liste existe, on ne
 * touche plus à rien — un article supprimé ou renommé par le gérant ne revient pas. Un nom déjà pris
 * par un autre article est laissé tel quel.
 */
export async function installerLaListeDuGerant(prisma: PrismaClient): Promise<string> {
  const noms = ARTICLES_DE_LA_LISTE.map((a) => a.nom);
  const dejaLa = await prisma.produit.count({ where: { OR: [{ prixIndicatif: { not: null } }, { nom: { in: noms } }] } });
  if (dejaLa > 0) return `Liste du gérant : déjà installée (${dejaLa}), rien de changé.`;

  // Les rayons de la liste : créés s'ils manquent (le gérant a pu supprimer un rayon resté vide).
  const rayons = new Map([...CATEGORIES, ...CATEGORIES_WOLT].map((c, i) => [c.nom as string, { emoji: c.emoji, ordre: "ordre" in c ? c.ordre : (i + 1) * 10 }]));
  const categories = new Map<string, string>();
  for (const nom of new Set(ARTICLES_DE_LA_LISTE.map((a) => a.categorie))) {
    const rayon = rayons.get(nom);
    if (!rayon) throw new Error(`Rayon inconnu dans la liste du gérant : ${nom}`);
    // Retrouvé par son nom ou par son adresse (un rayon renommé garde son adresse), créé seulement s'il manque.
    const c =
      (await prisma.categorie.findFirst({ where: { OR: [{ nom }, { slug: slugDe(nom) }] }, select: { id: true } })) ??
      (await prisma.categorie.create({ data: { nom, emoji: rayon.emoji, slug: slugDe(nom), ordre: rayon.ordre }, select: { id: true } }));
    categories.set(nom, c.id);
  }

  await prisma.produit.createMany({
    data: ARTICLES_DE_LA_LISTE.map((a, i) => ({
      nom: a.nom,
      description: a.description,
      prix: 0, // à définir : le prix de la liste n'est pas un prix de vente
      prixIndicatif: enAgorot(a.prixIndicatif),
      actif: false,
      boutique: BOUTIQUE_WOLT,
      categorieId: categories.get(a.categorie)!,
      ordre: ORDRE_DE_LA_LISTE + i,
    })),
  });
  return `Liste du gérant : ${ARTICLES_DE_LA_LISTE.length} articles ajoutés « à compléter », masqués, avec leur prix indicatif.`;
}

/**
 * Met en vente les articles de la liste du gérant au prix de sa liste : SA décision (11 novembre 2026),
 * prise après avoir vu que ces prix sont souvent plus bas que ceux de Wolt (prisma/articles-liste.ts).
 * - Une seule fois (`Reglages.listeEnVenteLe`) : un article qu'il remasque ou remet « à compléter »
 *   ensuite ne revient pas en vente.
 * - Seulement les articles restés tels qu'installés (sans prix, masqués) : jamais un article qu'il a
 *   déjà chiffré, renommé ou supprimé. Jamais l'alcool ni un article marqué `masque`.
 * - Le prix d'achat reste vide : on ne sait pas ce que l'article coûte sur Wolt, et c'est ce vide qui
 *   le garde repéré « prix non vérifié » dans l'espace gérant (lib/prix-indicatif.ts).
 */
export async function mettreEnVenteLaListe(prisma: PrismaClient): Promise<string> {
  const r = await prisma.reglages.findUnique({ where: { id: 1 }, select: { listeEnVenteLe: true } });
  if (!r) return "Liste du gérant : réglages pas encore créés, rien mis en vente.";
  if (r.listeEnVenteLe) return "Liste du gérant : déjà mise en vente, rien de changé.";
  const noms = ARTICLES_MIS_EN_VENTE.map((a) => a.nom);
  const [misEnVente] = await prisma.$transaction([
    prisma.$executeRaw`UPDATE "Produit" SET "prix" = "prixIndicatif", "actif" = true, "updatedAt" = now()
      WHERE "nom" IN (${Prisma.join(noms)}) AND "prix" = 0 AND "actif" = false AND "prixIndicatif" > 0`,
    prisma.reglages.update({ where: { id: 1 }, data: { listeEnVenteLe: new Date() } }),
  ]);
  return `Liste du gérant : ${misEnVente} article(s) mis en vente au prix de la liste (décision du gérant) ; ${ARTICLES_DE_LA_LISTE.length - noms.length} gardés masqués (alcool, médicament).`;
}

/**
 * Pose les photos libres de droits des produits frais (prisma/photos-frais.ts) sur les articles
 * qui n'ont pas encore de photo. Une seule fois : dès qu'un article porte une photo de ce dossier,
 * le lot est considéré comme installé — une photo retirée ou remplacée par le gérant ne revient pas.
 */
export async function installerLesPhotosFrais(prisma: PrismaClient): Promise<string> {
  const dejaLa = await prisma.produit.count({ where: { photoUrl: { startsWith: `${DOSSIER_PHOTOS_FRAIS}/` } } });
  if (dejaLa > 0) return `Photos des produits frais : déjà installées (${dejaLa} article(s)).`;
  const nomWolt = new Map(ARTICLES_WOLT.map((a) => [a.nom, a.nomWolt]));
  let posees = 0;
  for (const [nom, fichier] of Object.entries(PHOTOS_FRAIS)) {
    const repere = nomWolt.get(nom);
    if (!repere) continue;
    // Retrouvé par son nom sur Wolt (le gérant a pu renommer l'article) ; jamais sur un article qui a déjà une photo.
    posees += (await prisma.produit.updateMany({ where: { nomWolt: repere, photoUrl: "" }, data: { photoUrl: `${DOSSIER_PHOTOS_FRAIS}/${fichier}` } })).count;
  }
  return `Photos des produits frais : ${posees} article(s) illustré(s).`;
}

// Le numéro WhatsApp du site (celui des boutons « Nous écrire sur WhatsApp »), donné par le gérant.
// Il se change dans Réglages ; la mise en ligne ne le pose que si le champ est vide.
const WHATSAPP_DU_GERANT = "+33 1 76 39 00 78";

// Les descriptions du catalogue de départ qui tutoyaient le client, et leur nouveau texte.
const ANCIENNES_DESCRIPTIONS: [string, string][] = [
  ["Précise la marque en note si besoin", "Précisez la marque en note si besoin"],
  ["Pour brancher tes appareils français", "Pour brancher vos appareils français"],
  ["Pour un anniversaire — précise le message en note", "Pour un anniversaire — précisez le message en note"],
];

/**
 * Met à niveau les réglages restés à leur ancienne valeur par défaut : modes de paiement
 * (le paiement se fait désormais à la commande : Bit, PayBox, virement) et message d'accueil
 * (vouvoiement), et les descriptions d'articles restées à leur texte de départ (celles qui
 * tutoyaient, celles que les fiches de Wolt ont permis d'enrichir). Ne touche jamais une valeur que
 * le gérant a modifiée. Sans effet la deuxième fois.
 */
export async function mettreLesReglagesANiveau(prisma: PrismaClient): Promise<string> {
  const r = await prisma.reglages.findUnique({ where: { id: 1 }, select: { paiements: true, messageAccueil: true, whatsapp: true } });
  if (!r) return "Réglages : pas encore créés.";
  const data: { paiements?: string[]; messageAccueil?: string; whatsapp?: string } = {};
  // Le numéro WhatsApp donné par le gérant : seulement si le champ est encore vide.
  if (r.whatsapp.trim() === "") data.whatsapp = WHATSAPP_DU_GERANT;
  if (r.paiements.length === ANCIENS_PAIEMENTS.length && r.paiements.every((p, i) => p === ANCIENS_PAIEMENTS[i])) data.paiements = PAIEMENTS_PAR_DEFAUT;
  if (r.messageAccueil === ANCIEN_MESSAGE_ACCUEIL) data.messageAccueil = MESSAGE_ACCUEIL_PAR_DEFAUT;
  const changes = Object.keys(data);
  if (changes.length > 0) await prisma.reglages.update({ where: { id: 1 }, data });

  // Les descriptions d'articles restées à leur ancien texte (tutoiement) : jamais celles que le gérant a réécrites.
  let descriptions = 0;
  for (const [ancienne, nouvelle] of ANCIENNES_DESCRIPTIONS) {
    descriptions += (await prisma.produit.updateMany({ where: { description: ancienne }, data: { description: nouvelle } })).count;
  }
  // Les descriptions enrichies d'après les fiches de Wolt : l'article est retrouvé par son nom sur Wolt
  // (« Le pack de 6 » sert à plusieurs articles), et seulement si sa description est restée celle de départ.
  for (const d of DESCRIPTIONS_ENRICHIES) {
    descriptions += (await prisma.produit.updateMany({ where: { nomWolt: d.nomWolt, description: d.ancienne }, data: { description: d.nouvelle } })).count;
  }
  if (changes.length === 0 && descriptions === 0) return "Réglages et descriptions : rien à mettre à niveau.";
  return `Mis à niveau : ${[...changes, ...(descriptions > 0 ? [`${descriptions} description(s) d'article`] : [])].join(", ")}.`;
}

/**
 * Remplit la base : catégories, réglages, villes et plages d'exemple, la base du catalogue
 * (sans prix, masquée) et les articles réels de Wolt Market avec leur prix.
 * N'écrase jamais rien : seulement ce qui manque.
 * `demo` : le jeu de test — la base entière avec des prix inventés, sans les articles Wolt.
 */
export async function remplirLaBase(prisma: PrismaClient, { demo = false }: { demo?: boolean } = {}): Promise<string> {

  for (const [i, c] of CATEGORIES.entries()) {
    await prisma.categorie.upsert({
      where: { nom: c.nom },
      update: {},
      create: { ...c, slug: slugDe(c.nom), ordre: (i + 1) * 10 },
    });
  }
  const categories = new Map((await prisma.categorie.findMany({ select: { id: true, nom: true } })).map((c) => [c.nom, c.id]));

  await prisma.reglages.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      fraisService: 1500,
      fraisLivraison: 3000,
      fraisExpress: 2000,
      // Livraison le soir seulement (le gérant travaille la journée).
      creneaux: ["19:00 – 20:00", "20:00 – 21:00", "21:00 – 22:00", "22:00 – 23:00", "23:00 – 00:00"],
      messageAccueil: MESSAGE_ACCUEIL_PAR_DEFAUT,
    },
  });

  if ((await prisma.plageTarifaire.count()) === 0) {
    await prisma.plageTarifaire.createMany({ data: PLAGES_EXEMPLE });
  }
  if ((await prisma.ville.count()) === 0) {
    await prisma.ville.createMany({ data: VILLES_EXEMPLE.map((v, i) => ({ ...v, ordre: (i + 1) * 10 })) });
  }

  // La base du catalogue : seulement les articles qui n'existent pas encore (par nom).
  const existants = new Set((await prisma.produit.findMany({ select: { nom: true } })).map((p) => p.nom));
  let ajoutes = 0;
  for (const [i, a] of CATALOGUE.entries()) {
    if (existants.has(a.nom)) continue;
    // Remplacé par un article réel de Wolt (sauf dans le jeu de test, qui garde la base entière).
    if (!demo && REMPLACES_PAR_WOLT.has(a.nom)) continue;
    const categorieId = categories.get(a.categorie);
    if (!categorieId) throw new Error(`Catégorie inconnue : ${a.categorie}`);
    await prisma.produit.create({
      data: {
        nom: a.nom,
        description: a.description,
        prix: 0, // à définir par le gérant
        actif: false,
        badge: a.badge ?? "",
        options: options(a.options, a.nom),
        boutique: a.boutique,
        categorieId,
        ordre: i,
      },
    });
    ajoutes += 1;
  }

  if (demo) {
    for (const d of DEMO) {
      const p = await prisma.produit.findFirst({ where: { nom: d.nom }, select: { id: true } });
      if (!p) throw new Error(`Article de démo absent du catalogue : ${d.nom}`);
      await prisma.produit.update({
        where: { id: p.id },
        data: {
          prix: d.prix,
          prixAchat: d.prixAchat,
          prixBarre: d.prixBarre ?? null,
          actif: true,
          ...(d.options ? { options: options(d.options, d.nom) } : {}),
        },
      });
    }
  }

  const wolt = demo ? "" : ` ${await installerLesArticlesWolt(prisma)} ${await installerLaListeDuGerant(prisma)} ${await installerLesPhotosFrais(prisma)}`;

  return (
    `Catalogue : ${ajoutes} article(s) ajouté(s) sans prix (${CATALOGUE.length} dans la base), ${CATEGORIES.length} catégories.` +
    (demo ? ` Prix d'exemple posés sur ${DEMO.length} articles.` : "") +
    wolt
  );
}
