// Le remplissage de la base, partagé par `npm run seed` (prisma/seed.ts) et par la préparation
// automatique de la production (prisma/preparer.ts).
import { ANCIEN_MESSAGE_ACCUEIL, ANCIENS_PAIEMENTS, MESSAGE_ACCUEIL_PAR_DEFAUT, PAIEMENTS_PAR_DEFAUT } from "../lib/marque";
import type { PrismaClient } from "@prisma/client";
import { slugDe } from "../lib/slug";
import { lireOptionsSaisies } from "../lib/options";
import { CATALOGUE, CATEGORIES, PLAGES_EXEMPLE, VILLES_EXEMPLE } from "./catalogue";
import { ARTICLES_WOLT, BOUTIQUE_WOLT, CATEGORIES_WOLT, REMPLACES_PAR_WOLT, enAgorot, type ArticleWolt } from "./articles-wolt";
import { ARTICLES_DYNAMICA, BOUTIQUE_DYNAMICA } from "./articles-dynamica";

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

/** Un relevé de prix d'une boutique de Wolt : installé en une fois, une seule fois. */
export type LotWolt = { nom: string; boutique: string; articles: ArticleWolt[] };

export const LOTS_WOLT: LotWolt[] = [
  { nom: "Wolt Market", boutique: BOUTIQUE_WOLT, articles: ARTICLES_WOLT },
  { nom: "Dynamica", boutique: BOUTIQUE_DYNAMICA, articles: ARTICLES_DYNAMICA },
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
        await prisma.produit.create({ data: { nom: a.nom, ordre: i, ...donnees } });
        crees += 1;
      }
    }
    const horsLigne = lot.articles.filter((a) => a.horsLigne).length;
    bilans.push(`${lot.nom} : ${crees} ajouté(s) avec leur prix${completes ? `, ${completes} complété(s)` : ""}${horsLigne ? ` (${horsLigne} hors ligne)` : ""}`);
  }
  return `Articles Wolt — ${bilans.join(" ; ")}.`;
}

// Les descriptions du catalogue de départ qui tutoyaient le client, et leur nouveau texte.
const ANCIENNES_DESCRIPTIONS: [string, string][] = [
  ["Précise la marque en note si besoin", "Précisez la marque en note si besoin"],
  ["Pour brancher tes appareils français", "Pour brancher vos appareils français"],
  ["Pour un anniversaire — précise le message en note", "Pour un anniversaire — précisez le message en note"],
];

/**
 * Met à niveau les réglages restés à leur ancienne valeur par défaut : modes de paiement
 * (le paiement se fait désormais à la commande : Bit, PayBox, virement) et message d'accueil
 * (vouvoiement), et les descriptions d'articles qui tutoyaient. Ne touche jamais une valeur que le
 * gérant a modifiée. Sans effet la deuxième fois.
 */
export async function mettreLesReglagesANiveau(prisma: PrismaClient): Promise<string> {
  const r = await prisma.reglages.findUnique({ where: { id: 1 }, select: { paiements: true, messageAccueil: true } });
  if (!r) return "Réglages : pas encore créés.";
  const data: { paiements?: string[]; messageAccueil?: string } = {};
  if (r.paiements.length === ANCIENS_PAIEMENTS.length && r.paiements.every((p, i) => p === ANCIENS_PAIEMENTS[i])) data.paiements = PAIEMENTS_PAR_DEFAUT;
  if (r.messageAccueil === ANCIEN_MESSAGE_ACCUEIL) data.messageAccueil = MESSAGE_ACCUEIL_PAR_DEFAUT;
  const changes = Object.keys(data);
  if (changes.length > 0) await prisma.reglages.update({ where: { id: 1 }, data });

  // Les descriptions d'articles restées à leur ancien texte (tutoiement) : jamais celles que le gérant a réécrites.
  let descriptions = 0;
  for (const [ancienne, nouvelle] of ANCIENNES_DESCRIPTIONS) {
    descriptions += (await prisma.produit.updateMany({ where: { description: ancienne }, data: { description: nouvelle } })).count;
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

  const wolt = demo ? "" : ` ${await installerLesArticlesWolt(prisma)}`;

  return (
    `Catalogue : ${ajoutes} article(s) ajouté(s) sans prix (${CATALOGUE.length} dans la base), ${CATEGORIES.length} catégories.` +
    (demo ? ` Prix d'exemple posés sur ${DEMO.length} articles.` : "") +
    wolt
  );
}
