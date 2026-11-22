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
import { ARTICLES_DYNAMICA, ARTICLES_DYNAMICA_DU_13_NOVEMBRE, BOUTIQUE_DYNAMICA } from "./articles-dynamica";
import { ARTICLES_WOLT_FICHES, DESCRIPTIONS_ENRICHIES } from "./articles-wolt-fiches";
import { ARTICLES_DE_LA_LISTE, ARTICLES_MIS_EN_VENTE, type ArticleDeListe } from "./articles-liste";
import { ARTICLES_DE_LA_LISTE_DYNAMICA } from "./articles-liste-dynamica";
import { RAYON_BOUCHERIE, RAYON_POISSON, VIANDE_ET_VOLAILLE } from "./retrait-viande";
import { ARTICLES_WOLT_DES_CAPTURES } from "./articles-wolt-captures";
import { ARTICLES_WOLT_BOISSONS_ET_ELECTRONIQUE, RELEVE_DES_BOISSONS } from "./articles-wolt-captures-boissons";
import { CREMERIE_GARDEE, INTROUVABLES_SUR_WOLT, RAYON_CREMERIE } from "./allegement-cremerie";
import { ABSENTS_DE_WOLT } from "./absents-de-wolt";
import { MASQUAGES } from "./masquages-1115";
import { CLE_REMISE_EN_VENTE_AVEC_PHOTO, REMIS_EN_VENTE_AVEC_PHOTO } from "./remise-en-vente-1116";
import { CLE_RETRAIT_VIANDE_FRAICHE, VIANDE_FRAICHE } from "./retrait-viande-fraiche-1119";
import { CLE_RETRAIT_POISSON, POISSON_RETIRE } from "./retrait-poisson-1119";
import { CLE_RETRAIT_SURGELES, SURGELES_RETIRES } from "./retrait-surgeles-1119";
import { CLE_RENOMMAGE_SURGELES, RAYON_SURGELES } from "./renommage-surgeles-1122";
import { BOISSONS_GARDEES, BOISSONS_REMISES_EN_VENTE, RAYON_BOISSONS } from "./allegement-boissons";
import { ARTICLES_WOLT_DU_12_NOVEMBRE, RELEVE_DU_12_NOVEMBRE, RELEVE_DU_POISSON_SURGELE, REMPLACEMENTS_DU_12_NOVEMBRE, changementsDuReleve, type LigneDeReleve } from "./releve-wolt-1112";
import { RELEVE_DES_CANETTES, RELEVE_DES_CHOCOLATS, RELEVE_DU_15_NOVEMBRE } from "./releve-wolt-1115";

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
  { nom: "Wolt Market, relevé du 12 novembre", boutique: BOUTIQUE_WOLT, articles: ARTICLES_WOLT_DU_12_NOVEMBRE, ordre: 600 },
  // Ce que montrent les captures du gérant et que le site ne vendait pas (sa demande : « rajoute-moi des produits »).
  { nom: "Wolt Market, captures du 12 novembre", boutique: BOUTIQUE_WOLT, articles: ARTICLES_WOLT_DES_CAPTURES, ordre: 700 },
  // Trois autres captures le même jour (« rajoute-moi ça, les prix et les images ») : boissons, électronique, capsules Nespresso.
  { nom: "Wolt Market, captures du 12 novembre (boissons, électronique, Nespresso)", boutique: BOUTIQUE_WOLT, articles: ARTICLES_WOLT_BOISSONS_ET_ELECTRONIQUE, ordre: 800 },
  // Deux articles de Dynamica ajoutés à sa demande (15 novembre), relevés sur sa capture du 13.
  { nom: "Dynamica, capture du 13 novembre", boutique: BOUTIQUE_DYNAMICA, articles: ARTICLES_DYNAMICA_DU_13_NOVEMBRE, ordre: 900 },
];

/**
 * Les rayons dont une installation a besoin : retrouvés par leur nom ou par leur adresse (un rayon que
 * le gérant renomme change de nom, parfois d'adresse), créés seulement s'ils manquent. Appelé au moment
 * d'installer, jamais à chaque mise en ligne : sinon un rayon renommé reviendrait en double, vide.
 */
async function rayonsDe(prisma: PrismaClient, noms: Iterable<string>): Promise<Map<string, string>> {
  const connus = new Map([...CATEGORIES, ...CATEGORIES_WOLT].map((c, i) => [c.nom as string, { emoji: c.emoji, ordre: "ordre" in c ? c.ordre : (i + 1) * 10 }]));
  // « Poisson » est le rayon « Boucherie & poisson » renommé quand la viande a été retirée : sur une base
  // où il porte encore son premier nom, c'est lui — on ne crée jamais un second rayon de poisson.
  connus.set(RAYON_POISSON.nom, connus.get(RAYON_BOUCHERIE)!);
  const trouver = (nom: string) => prisma.categorie.findFirst({ where: { OR: [{ nom }, { slug: slugDe(nom) }] }, select: { id: true } });
  const ids = new Map<string, string>();
  for (const nom of new Set(noms)) {
    const rayon = connus.get(nom);
    if (!rayon) throw new Error(`Rayon inconnu : ${nom}`);
    const c =
      (await trouver(nom)) ??
      (nom === RAYON_POISSON.nom ? await trouver(RAYON_BOUCHERIE) : null) ??
      (await prisma.categorie.create({ data: { nom, emoji: rayon.emoji, slug: slugDe(nom), ordre: rayon.ordre }, select: { id: true } }));
    ids.set(nom, c.id);
  }
  return ids;
}

/** Une opération sur les données qui ne se fait qu'une fois : déjà faite ? (`null` : pas encore de réglages) */
async function operationFaite(prisma: PrismaClient, cle: string): Promise<boolean | null> {
  const r = await prisma.reglages.findUnique({ where: { id: 1 }, select: { operationsFaites: true } });
  return r ? r.operationsFaites.includes(cle) : null;
}

/** À mettre dans la même transaction que l'opération : elle ne se refera pas. */
function noterOperation(prisma: PrismaClient, cle: string) {
  return prisma.reglages.update({ where: { id: 1 }, data: { operationsFaites: { push: cle } } });
}

/**
 * Installe les articles réels de Wolt, avec leur prix, lot par lot (prisma/articles-*.ts).
 * Chaque lot UNE SEULE FOIS : dès qu'un de ses articles existe (reconnu à son nom sur Wolt), on ne
 * touche plus à ce lot — les prix se gèrent ensuite dans l'admin, et un article supprimé par le
 * gérant ne revient pas. Un nouveau lot s'ajoute sans toucher aux précédents.
 * Un article « à compléter » du même nom (sans prix) est complété ; un article qui a déjà un prix n'est jamais modifié.
 */
export async function installerLesArticlesWolt(prisma: PrismaClient): Promise<string> {
  const bilans: string[] = [];
  for (const lot of LOTS_WOLT) {
    const dejaLa = await prisma.produit.count({ where: { nomWolt: { in: lot.articles.map((a) => a.nomWolt) } } });
    if (dejaLa > 0) {
      bilans.push(`${lot.nom} : déjà installé (${dejaLa}), rien de changé`);
      continue;
    }
    // Les rayons du lot (les quatre rayons propres à Wolt compris), au moment de l'installer seulement.
    const categories = await rayonsDe(prisma, lot.articles.map((a) => a.categorie));
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
const ORDRE_DE_LA_LISTE_DYNAMICA = 2000;

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

  await prisma.produit.createMany({ data: await articlesACompleter(prisma, ARTICLES_DE_LA_LISTE, BOUTIQUE_WOLT, ORDRE_DE_LA_LISTE) });
  return `Liste du gérant : ${ARTICLES_DE_LA_LISTE.length} articles ajoutés « à compléter », masqués, avec leur prix indicatif.`;
}

/**
 * Les articles d'une liste du gérant, tels qu'ils s'installent : « à compléter » — sans prix de vente,
 * masqués — avec le prix de la liste gardé à part. Les rayons sont créés s'ils manquent.
 */
async function articlesACompleter(prisma: PrismaClient, articles: ArticleDeListe[], boutique: string, ordre: number) {
  const categories = await rayonsDe(prisma, articles.map((a) => a.categorie));
  return articles.map((a, i) => ({
    nom: a.nom,
    description: a.description,
    prix: 0, // à définir : le prix de la liste n'est pas un prix de vente
    prixIndicatif: enAgorot(a.prixIndicatif),
    actif: false,
    boutique,
    categorieId: categories.get(a.categorie)!,
    ordre: ordre + i,
  }));
}

export const CLE_LISTE_DYNAMICA = "liste-dynamica-2026-11-11";

/**
 * Installe la liste « Dynamica Store » du gérant (prisma/articles-liste-dynamica.ts) : « à compléter »,
 * sans prix de vente, masquée. Et elle le reste : ses modèles datent, ses prix et ses garanties sont
 * invérifiables, ses montants se comptent en milliers de shekels — rien ici ne la met en vente.
 * Une seule fois (`Reglages.operationsFaites`) ; rien si un de ses noms existe déjà.
 */
export async function installerLaListeDynamica(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_LISTE_DYNAMICA);
  if (faite === null) return "Liste Dynamica : réglages pas encore créés, rien installé.";
  if (faite) return "Liste Dynamica : déjà installée, rien de changé.";
  const noms = ARTICLES_DE_LA_LISTE_DYNAMICA.map((a) => a.nom);
  const pris = await prisma.produit.count({ where: { nom: { in: noms } } });
  if (pris > 0) {
    await noterOperation(prisma, CLE_LISTE_DYNAMICA);
    return `Liste Dynamica : ${pris} nom(s) déjà au catalogue, rien installé.`;
  }
  const data = await articlesACompleter(prisma, ARTICLES_DE_LA_LISTE_DYNAMICA, BOUTIQUE_DYNAMICA, ORDRE_DE_LA_LISTE_DYNAMICA);
  await prisma.$transaction([prisma.produit.createMany({ data }), noterOperation(prisma, CLE_LISTE_DYNAMICA)]);
  return `Liste Dynamica : ${data.length} articles ajoutés « à compléter », masqués, avec leur prix indicatif. Aucun n'est mis en vente.`;
}

export const CLE_RELEVE_DU_12_NOVEMBRE = "releve-prix-2026-11-12";

/**
 * Applique le relevé de prix du 12 novembre (prisma/releve-wolt-1112.ts), demandé par le gérant d'après
 * ses captures de Wolt : prix normaux, hors promotion. Une seule fois (`Reglages.operationsFaites`).
 * Un prix que le gérant a changé lui-même n'est jamais remplacé (`changementsDuReleve`) ; le nom exact
 * de l'article sur Wolt est noté s'il manquait.
 */
export async function appliquerLeReleveDePrix(prisma: PrismaClient): Promise<string> {
  const bilans: string[] = [];
  for (const releve of RELEVES_DE_PRIX) bilans.push(await appliquerUnReleve(prisma, releve));
  return bilans.join(" ");
}

export const CLE_RELEVE_DU_POISSON_SURGELE = "releve-prix-2026-11-12-poisson-surgele";
export const CLE_RELEVE_DES_BOISSONS = "releve-prix-2026-11-12-boissons";
export const CLE_RELEVE_DU_15_NOVEMBRE = "releve-prix-2026-11-15";
export const CLE_RELEVE_DES_CHOCOLATS = "releve-prix-2026-11-15-chocolats";
export const CLE_RELEVE_DES_CANETTES = "releve-prix-2026-11-15-canettes";

/** Les relevés de prix, dans l'ordre : chacun a sa clé et ne s'applique qu'une fois. */
export const RELEVES_DE_PRIX: { cle: string; titre: string; lignes: LigneDeReleve[] }[] = [
  { cle: CLE_RELEVE_DU_12_NOVEMBRE, titre: "Relevé de prix du 12 novembre", lignes: RELEVE_DU_12_NOVEMBRE },
  { cle: CLE_RELEVE_DU_POISSON_SURGELE, titre: "Relevé du poisson surgelé (12 novembre)", lignes: RELEVE_DU_POISSON_SURGELE },
  { cle: CLE_RELEVE_DES_BOISSONS, titre: "Relevé des boissons (12 novembre)", lignes: RELEVE_DES_BOISSONS },
  { cle: CLE_RELEVE_DU_15_NOVEMBRE, titre: "Relevé du 15 novembre", lignes: RELEVE_DU_15_NOVEMBRE },
  { cle: CLE_RELEVE_DES_CHOCOLATS, titre: "Relevé du chocolat et des biscuits (15 novembre)", lignes: RELEVE_DES_CHOCOLATS },
  { cle: CLE_RELEVE_DES_CANETTES, titre: "Relevé des canettes Red Bull et Monster (15 novembre)", lignes: RELEVE_DES_CANETTES },
];

async function appliquerUnReleve(prisma: PrismaClient, releve: (typeof RELEVES_DE_PRIX)[number]): Promise<string> {
  const faite = await operationFaite(prisma, releve.cle);
  if (faite === null) return `${releve.titre} : réglages pas encore créés, rien de changé.`;
  if (faite) return `${releve.titre} : déjà appliqué, rien de changé.`;
  const produits = await prisma.produit.findMany({
    where: { OR: [{ nom: { in: releve.lignes.map((l) => l.nom) } }, { nomWolt: { in: releve.lignes.map((l) => l.nomWolt) } }] },
    select: { id: true, nom: true, nomWolt: true, prix: true, prixAchat: true },
  });
  const changements = changementsDuReleve(produits, releve.lignes);
  await prisma.$transaction([
    ...changements.map((c) => prisma.produit.update({ where: { id: c.id }, data: c.data })),
    noterOperation(prisma, releve.cle),
  ]);
  const prix = changements.filter((c) => c.data.prix !== undefined).length;
  return `${releve.titre} : ${prix} prix mis à jour sur ${releve.lignes.length} relevés (les autres ont été fixés par le gérant, ou l'article n'existe plus) ; ${changements.length - prix} nom(s) Wolt noté(s) sans toucher au prix.`;
}

export const CLE_REMPLACEMENTS_DU_12_NOVEMBRE = "remplacements-2026-11-12";

/**
 * Remplace sept articles de la liste du gérant par ce que Wolt vend vraiment (autre marque, autre format) :
 * sa décision, sur la liste que le relevé du 12 novembre lui a montrée (« remplace »). L'article garde sa
 * place, sa photo et son rayon ; il prend le nom, la description, le prix (vente et achat) et le nom exact
 * de Wolt. Une seule fois (`Reglages.operationsFaites`) ; un article qu'il a renommé ou supprimé entre-temps
 * n'est pas touché, et rien n'est fait si le nouveau nom existe déjà.
 */
export async function remplacerLesArticles(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_REMPLACEMENTS_DU_12_NOVEMBRE);
  if (faite === null) return "Remplacements du 12 novembre : réglages pas encore créés, rien de changé.";
  if (faite) return "Remplacements du 12 novembre : déjà faits, rien de changé.";
  const pris = new Set(
    (await prisma.produit.findMany({ where: { nom: { in: REMPLACEMENTS_DU_12_NOVEMBRE.map((r) => r.nom) } }, select: { nom: true } })).map((p) => p.nom),
  );
  const aFaire = REMPLACEMENTS_DU_12_NOVEMBRE.filter((r) => !pris.has(r.nom));
  const resultats = await prisma.$transaction([
    ...aFaire.map((r) =>
      prisma.produit.updateMany({
        where: { nom: r.ancien },
        data: { nom: r.nom, description: r.description, prix: enAgorot(r.prix), prixAchat: enAgorot(r.prix), nomWolt: r.nomWolt },
      }),
    ),
    noterOperation(prisma, CLE_REMPLACEMENTS_DU_12_NOVEMBRE),
  ]);
  const remplaces = resultats.slice(0, aFaire.length).reduce((s, r) => s + ("count" in r ? r.count : 0), 0);
  return `Remplacements du 12 novembre : ${remplaces} article(s) remplacé(s) par ce que Wolt vend vraiment, sur ${REMPLACEMENTS_DU_12_NOVEMBRE.length}.`;
}

export const CLE_RETRAIT_VIANDE = "retrait-viande-2026-11-11";

/**
 * Retire la viande et la volaille de la vente : décision du gérant (prisma/retrait-viande.ts).
 * Les articles sont MASQUÉS, jamais supprimés. Une seule fois (`Reglages.operationsFaites`) : un
 * article qu'il remet en ligne ensuite y reste. Un article de Wolt est retrouvé par son nom sur Wolt
 * (le gérant a pu le renommer), un article de sa liste par son nom.
 * Le rayon « Boucherie & poisson », qui ne contient plus que du poisson, devient « Poisson » — s'il
 * porte encore son nom de départ.
 */
export async function retirerLaViande(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_RETRAIT_VIANDE);
  if (faite === null) return "Viande et volaille : réglages pas encore créés, rien retiré.";
  if (faite) return "Viande et volaille : déjà retirées, rien de changé.";
  const viande = new Set(VIANDE_ET_VOLAILLE);
  const nomsWolt = LOTS_WOLT.flatMap((l) => l.articles).filter((a) => viande.has(a.nom)).map((a) => a.nomWolt);
  const [retires] = await prisma.$transaction([
    prisma.produit.updateMany({ where: { actif: true, OR: [{ nom: { in: VIANDE_ET_VOLAILLE } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false } }),
    noterOperation(prisma, CLE_RETRAIT_VIANDE),
  ]);
  const rayon = await prisma.categorie.findUnique({ where: { nom: RAYON_BOUCHERIE }, select: { id: true } });
  const pris = await prisma.categorie.count({ where: { OR: [{ nom: RAYON_POISSON.nom }, { slug: RAYON_POISSON.slug }] } });
  const renomme = rayon != null && pris === 0;
  if (renomme) await prisma.categorie.update({ where: { id: rayon.id }, data: RAYON_POISSON });
  return `Viande et volaille : ${retires.count} article(s) retiré(s) de la vente (masqués)${renomme ? ` ; rayon renommé « ${RAYON_POISSON.nom} »` : ""}.`;
}

export const CLE_RETRAIT_INTROUVABLES = "retrait-introuvables-2026-11-12";

/**
 * Cinq articles de la liste du gérant que Wolt ne vend pas : retirés de la vente (sa décision, 12 novembre
 * 2026). Une seule fois, et d'abord seulement MASQUÉS ; il les a fait supprimer le lendemain
 * (`supprimerLesIntrouvables`).
 */
export async function retirerLesIntrouvables(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_RETRAIT_INTROUVABLES);
  if (faite === null) return "Articles introuvables sur Wolt : réglages pas encore créés, rien retiré.";
  if (faite) return "Articles introuvables sur Wolt : déjà retirés, rien de changé.";
  const [retires] = await prisma.$transaction([
    prisma.produit.updateMany({ where: { actif: true, nom: { in: INTROUVABLES_SUR_WOLT } }, data: { actif: false } }),
    noterOperation(prisma, CLE_RETRAIT_INTROUVABLES),
  ]);
  return `Articles introuvables sur Wolt : ${retires.count} retiré(s) de la vente (masqués).`;
}

export const CLE_SUPPRESSION_INTROUVABLES = "suppression-introuvables-2026-11-13";

/**
 * Les cinq articles introuvables sur Wolt, supprimés pour de bon : la demande du gérant (13 novembre 2026,
 * « enlève »), qui les avait déjà fait retirer la veille — masqués, ils restaient dans son espace.
 * Une seule fois, et ces cinq noms seulement. Les commandes passées gardent leur copie de l'article (nom,
 * prix : `LigneCommande.produitId` se vide). Ils ne reviennent pas : sa liste ne s'installe qu'une fois
 * (`installerLaListeDuGerant`) ; sur une base neuve, elle les installe et cette opération les supprime.
 */
export async function supprimerLesIntrouvables(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_SUPPRESSION_INTROUVABLES);
  if (faite === null) return "Articles introuvables sur Wolt : réglages pas encore créés, rien supprimé.";
  if (faite) return "Articles introuvables sur Wolt : déjà supprimés, rien de changé.";
  const [supprimes] = await prisma.$transaction([
    prisma.produit.deleteMany({ where: { nom: { in: INTROUVABLES_SUR_WOLT } } }),
    noterOperation(prisma, CLE_SUPPRESSION_INTROUVABLES),
  ]);
  return `Articles introuvables sur Wolt : ${supprimes.count} supprimé(s).`;
}

/**
 * Ce que Wolt ne vend pas est supprimé du site (décision du gérant, 15 novembre 2026 : prisma/absents-de-wolt.ts).
 * Une liste par page ENTIÈRE de rayon reçue, chacune une seule fois. Supprimés pour de bon ; les commandes passées
 * gardent leur copie de l'article (`LigneCommande.produitId` se vide). Un article de sa liste dont il a noté
 * lui-même le prix d'achat n'est pas touché : c'est qu'il l'a trouvé sur Wolt.
 */
export async function supprimerLesAbsentsDeWolt(prisma: PrismaClient): Promise<string> {
  const bilans: string[] = [];
  for (const liste of ABSENTS_DE_WOLT) {
    const faite = await operationFaite(prisma, liste.cle);
    if (faite === null) { bilans.push(`${liste.titre} : réglages pas encore créés, rien supprimé.`); continue; }
    if (faite) { bilans.push(`${liste.titre} : déjà supprimés, rien de changé.`); continue; }
    const [supprimes] = await prisma.$transaction([
      prisma.produit.deleteMany({ where: { OR: [{ nom: { in: liste.deLaListe }, prixAchat: null }, { nom: { in: liste.releves } }] } }),
      noterOperation(prisma, liste.cle),
    ]);
    bilans.push(`${liste.titre} : ${supprimes.count} supprimé(s) sur ${liste.deLaListe.length + liste.releves.length}.`);
  }
  return bilans.join(" ");
}

/**
 * Ce que le gérant fait masquer « pour le moment » (15 novembre 2026 : prisma/masquages-1115.ts) — le poisson
 * surgelé, les boissons que Wolt n'affiche plus, et les articles jamais vus sur ses captures de Wolt.
 * Chaque liste une seule fois, et rien n'est supprimé : il remet en vente ce qu'il veut. Un article de sa liste
 * dont il a noté lui-même le prix d'achat n'est pas touché : c'est qu'il l'a trouvé sur Wolt.
 */
export async function masquerCeQuiManque(prisma: PrismaClient): Promise<string> {
  const bilans: string[] = [];
  for (const m of MASQUAGES) {
    const faite = await operationFaite(prisma, m.cle);
    if (faite === null) { bilans.push(`${m.titre} : réglages pas encore créés, rien masqué.`); continue; }
    if (faite) { bilans.push(`${m.titre} : déjà masqués, rien de changé.`); continue; }
    const [masques] = await prisma.$transaction([
      prisma.produit.updateMany({
        where: { actif: true, OR: [{ nom: { in: m.releves } }, { nom: { in: m.deLaListe }, prixAchat: null }] },
        data: { actif: false },
      }),
      noterOperation(prisma, m.cle),
    ]);
    bilans.push(`${m.titre} : ${masques.count} masqué(s) sur ${m.releves.length + m.deLaListe.length}.`);
  }
  return bilans.join(" ");
}

/**
 * Les articles masqués qui ont leur photo de Wolt, remis en vente : décision du gérant (16 novembre 2026,
 * prisma/remise-en-vente-1116.ts) — sept boissons que Wolt n'affiche plus, vingt poissons surgelés, treize
 * viandes et volailles, choisis par lui groupe par groupe. Une seule fois : ce qu'il remasque ensuite le reste.
 * Seulement un article encore masqué et qui a un prix ; un article de Wolt est retrouvé par son nom sur Wolt
 * (il a pu le renommer). Rien n'est créé, aucun prix n'est touché.
 * Le rayon « Poisson », où la viande revient, reprend son nom « Boucherie & poisson » — s'il porte encore le
 * nom que le retrait de la viande lui avait donné ; son adresse (`poisson`) ne change pas.
 */
export async function remettreEnVenteCeQuiAUnePhoto(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_REMISE_EN_VENTE_AVEC_PHOTO);
  if (faite === null) return "Articles masqués qui ont leur photo : réglages pas encore créés, rien remis en vente.";
  if (faite) return "Articles masqués qui ont leur photo : déjà remis en vente, rien de changé.";
  const choisis = new Set(REMIS_EN_VENTE_AVEC_PHOTO);
  const nomsWolt = LOTS_WOLT.flatMap((l) => l.articles).filter((a) => choisis.has(a.nom) && a.nomWolt).map((a) => a.nomWolt);
  const [remis] = await prisma.$transaction([
    prisma.produit.updateMany({
      where: { actif: false, prix: { gt: 0 }, OR: [{ nom: { in: REMIS_EN_VENTE_AVEC_PHOTO } }, { nomWolt: { in: nomsWolt } }] },
      data: { actif: true },
    }),
    noterOperation(prisma, CLE_REMISE_EN_VENTE_AVEC_PHOTO),
  ]);
  const rayon = await prisma.categorie.findFirst({ where: RAYON_POISSON, select: { id: true } });
  const pris = await prisma.categorie.count({ where: { nom: RAYON_BOUCHERIE } });
  const renomme = rayon != null && pris === 0;
  if (renomme) await prisma.categorie.update({ where: { id: rayon.id }, data: { nom: RAYON_BOUCHERIE } });
  return `Articles masqués qui ont leur photo : ${remis.count} remis en vente sur ${REMIS_EN_VENTE_AVEC_PHOTO.length}${renomme ? ` ; rayon renommé « ${RAYON_BOUCHERIE} »` : ""}.`;
}

/**
 * « Enlève-moi tout ce qui est viande, poulet frais » (le gérant, 19 novembre 2026) : les sept articles de
 * viande et de poulet FRAIS revenus en vente le 16 novembre sont masqués (prisma/retrait-viande-fraiche-1119.ts).
 * Masqués, pas supprimés ; la charcuterie sous vide et les deux surgelés restent en vente. Une seule fois : ce
 * qu'il remet en vente lui-même ensuite y reste. Un article de Wolt est retrouvé par son nom sur Wolt (il a pu
 * le renommer). À lancer APRÈS `remettreEnVenteCeQuiAUnePhoto` : sur une base neuve, elle les aurait remis.
 */
export async function retirerLaViandeFraiche(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_RETRAIT_VIANDE_FRAICHE);
  if (faite === null) return "Viande et poulet frais : réglages pas encore créés, rien de masqué.";
  if (faite) return "Viande et poulet frais : déjà retirés, rien de changé.";
  const frais = new Set(VIANDE_FRAICHE);
  const nomsWolt = LOTS_WOLT.flatMap((l) => l.articles).filter((a) => frais.has(a.nom) && a.nomWolt).map((a) => a.nomWolt);
  const [masques] = await prisma.$transaction([
    prisma.produit.updateMany({ where: { actif: true, OR: [{ nom: { in: VIANDE_FRAICHE } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false } }),
    noterOperation(prisma, CLE_RETRAIT_VIANDE_FRAICHE),
  ]);
  return `Viande et poulet frais : ${masques.count} articles masqués sur ${VIANDE_FRAICHE.length}.`;
}

/**
 * « Enlève : Poisson surgelé - Poisson frais » (le gérant, 19 novembre 2026) : les 22 articles de ces deux
 * sous-rayons de « Boucherie & poisson » sont masqués (prisma/retrait-poisson-1119.ts). Masqués, pas supprimés ;
 * le poisson fumé et salé, la charcuterie, les sauces et le rayon « Surgelés & glaces » ne sont pas touchés. Une
 * seule fois : ce qu'il remet en vente lui-même ensuite y reste. Un article de Wolt est retrouvé par son nom sur
 * Wolt (il a pu le renommer). À lancer APRÈS `remettreEnVenteCeQuiAUnePhoto` : sur une base neuve, elle aurait
 * remis en vente les poissons surgelés.
 */
export async function retirerLePoissonFraisEtSurgele(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_RETRAIT_POISSON);
  if (faite === null) return "Poisson frais et surgelé : réglages pas encore créés, rien de masqué.";
  if (faite) return "Poisson frais et surgelé : déjà retirés, rien de changé.";
  const retires = new Set(POISSON_RETIRE);
  const nomsWolt = LOTS_WOLT.flatMap((l) => l.articles).filter((a) => retires.has(a.nom) && a.nomWolt).map((a) => a.nomWolt);
  const [masques] = await prisma.$transaction([
    prisma.produit.updateMany({ where: { actif: true, OR: [{ nom: { in: POISSON_RETIRE } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false } }),
    noterOperation(prisma, CLE_RETRAIT_POISSON),
  ]);
  return `Poisson frais et surgelé : ${masques.count} articles masqués sur ${POISSON_RETIRE.length}.`;
}

/**
 * « Supprime : Viande & volaille - Poisson - Glaces » (le gérant, 19 novembre 2026) : les onze articles de ces
 * trois sous-rayons de « Surgelés & glaces » sont masqués (prisma/retrait-surgeles-1119.ts) ; le rayon garde ses
 * pizzas et plats. Masqués, pas effacés de sa base ; la charcuterie de « Boucherie & poisson » n'est pas touchée.
 * Une seule fois : ce qu'il remet en vente lui-même ensuite y reste. À lancer APRÈS
 * `remettreEnVenteCeQuiAUnePhoto` : sur une base neuve, elle aurait remis en vente poisson et viande surgelés.
 */
export async function retirerLesSurgeles(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_RETRAIT_SURGELES);
  if (faite === null) return "Surgelés (viande, poisson, glaces) : réglages pas encore créés, rien de masqué.";
  if (faite) return "Surgelés (viande, poisson, glaces) : déjà retirés, rien de changé.";
  const retires = new Set(SURGELES_RETIRES);
  const nomsWolt = LOTS_WOLT.flatMap((l) => l.articles).filter((a) => retires.has(a.nom) && a.nomWolt).map((a) => a.nomWolt);
  const [masques] = await prisma.$transaction([
    prisma.produit.updateMany({ where: { actif: true, OR: [{ nom: { in: SURGELES_RETIRES } }, { nomWolt: { in: nomsWolt } }] }, data: { actif: false } }),
    noterOperation(prisma, CLE_RETRAIT_SURGELES),
  ]);
  return `Surgelés (viande, poisson, glaces) : ${masques.count} articles masqués sur ${SURGELES_RETIRES.length}.`;
}

/**
 * « Oui, renomme-le en Surgelés » (le gérant, 22 novembre 2026) : le rayon « Surgelés & glaces », qui ne vend
 * plus de glaces, devient « Surgelés » (prisma/renommage-surgeles-1122.ts). Son adresse ne change pas. Une seule
 * fois, et seulement s'il porte encore son nom de départ : un nom que le gérant lui a donné lui-même reste.
 */
export async function renommerLesSurgeles(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_RENOMMAGE_SURGELES);
  if (faite === null) return "Rayon « Surgelés » : réglages pas encore créés, rien de renommé.";
  if (faite) return "Rayon « Surgelés » : déjà renommé une fois, rien de changé.";
  // Jamais deux rayons du même nom : s'il en a créé un « Surgelés » entre-temps, on ne touche à rien.
  const pris = await prisma.categorie.count({ where: { nom: RAYON_SURGELES.nom } });
  const [renomme] = await prisma.$transaction([
    prisma.categorie.updateMany({ where: pris === 0 ? { slug: RAYON_SURGELES.slug, nom: RAYON_SURGELES.ancien } : { id: "aucun" }, data: { nom: RAYON_SURGELES.nom } }),
    noterOperation(prisma, CLE_RENOMMAGE_SURGELES),
  ]);
  return renomme.count === 1 ? `Rayon « ${RAYON_SURGELES.ancien} » renommé « ${RAYON_SURGELES.nom} ».` : "Rayon « Surgelés » : il ne porte plus son nom de départ, rien de renommé.";
}

/** La clé de l'opération ci-dessous (Reglages.operationsFaites). */
export const CLE_PHOTOS_DE_WOLT_POUR_TOUS = "photos-de-wolt-pour-tous-2026-11-17";

/**
 * « Le site a 0 client, on est 2 à bosser dessus et on ne peut pas se connecter à l'admin à chaque fois :
 * active-moi les photos pour tout le monde » (le gérant, 17 novembre 2026). Le réglage « Photos de Wolt pour
 * tout le monde » est coché, une seule fois : s'il le décoche ensuite dans ses réglages, il le reste.
 * (Prévenu que ces photos sont celles de Wolt et des marques : c'est sa décision, et c'est lui qui la défait.)
 */
export async function montrerLesPhotosDeWoltATous(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_PHOTOS_DE_WOLT_POUR_TOUS);
  if (faite === null) return "Photos de Wolt pour tout le monde : réglages pas encore créés, rien de changé.";
  if (faite) return "Photos de Wolt pour tout le monde : déjà activées une fois, rien de changé.";
  await prisma.$transaction([
    prisma.reglages.update({ where: { id: 1 }, data: { photosWoltPourTous: true } }),
    noterOperation(prisma, CLE_PHOTOS_DE_WOLT_POUR_TOUS),
  ]);
  return "Photos de Wolt pour tout le monde : activées (le gérant les coupe dans ses réglages).";
}

/**
 * Ce qu'un rayon ne garde pas quand le gérant en demande une courte sélection (pur) : les articles que le CODE
 * y a mis en vente — lots de Wolt, liste du gérant, et les articles de sa liste remplacés le 12 novembre, sous
 * leur nouveau nom — moins la sélection gardée. Reconnus à leur nom ou à leur nom sur Wolt (un article
 * renommé reste reconnu).
 * N'y sont jamais : un article que le gérant a créé lui-même, ni un article que le code a installé masqué
 * (alcool, médicament) — s'il est en vente, c'est que le gérant l'a décidé.
 */
export function rayonARetirer(rayon: string, selection: string[]): { noms: string[]; nomsWolt: string[] } {
  const gardes = new Set(selection);
  const duRayon: { nom: string; nomWolt?: string }[] = [
    ...LOTS_WOLT.flatMap((l) => l.articles).filter((a) => !a.horsLigne),
    ...ARTICLES_MIS_EN_VENTE,
  ].filter((a) => a.categorie === rayon);
  const noms = new Set(duRayon.map((a) => a.nom));
  const tous = [...duRayon, ...REMPLACEMENTS_DU_12_NOVEMBRE.filter((r) => noms.has(r.ancien))];
  // Un nom sur Wolt porté par un article gardé n'est jamais dans la liste à retirer.
  const woltGardes = new Set(tous.filter((a) => gardes.has(a.nom)).map((a) => a.nomWolt ?? ""));
  const aRetirer = tous.filter((a) => !gardes.has(a.nom));
  return {
    noms: [...new Set(aRetirer.map((a) => a.nom))],
    nomsWolt: [...new Set(aRetirer.map((a) => a.nomWolt ?? "").filter((n) => n !== "" && !woltGardes.has(n)))],
  };
}

/**
 * Ramène un rayon à sa courte sélection. Une seule fois (`cle`), et rien n'est supprimé : les autres articles
 * sont masqués, le gérant remet en vente ceux qu'il veut. Jamais un article de la sélection.
 */
export async function allegerUnRayon(prisma: PrismaClient, o: { cle: string; titre: string; rayon: string; selection: string[] }): Promise<string> {
  const faite = await operationFaite(prisma, o.cle);
  if (faite === null) return `${o.titre} : réglages pas encore créés, rien retiré.`;
  if (faite) return `${o.titre} : déjà ramené à sa sélection, rien de changé.`;
  const { noms, nomsWolt } = rayonARetirer(o.rayon, o.selection);
  const [retires] = await prisma.$transaction([
    prisma.produit.updateMany({
      where: { actif: true, nom: { notIn: o.selection }, OR: [{ nom: { in: noms } }, { nomWolt: { in: nomsWolt } }] },
      data: { actif: false },
    }),
    noterOperation(prisma, o.cle),
  ]);
  return `${o.titre} : ${retires.count} article(s) retiré(s) de la vente (masqués), ${o.selection.length} gardés.`;
}

/** Ce que le rayon « Crèmerie & œufs » ne garde pas (pur). */
export const cremerieARetirer = () => rayonARetirer(RAYON_CREMERIE, CREMERIE_GARDEE);

export const CLE_ALLEGEMENT_CREMERIE = "allegement-cremerie-2026-11-12";

/**
 * Le rayon « Crèmerie & œufs » ramené à une courte sélection : la décision du gérant (12 novembre 2026),
 * qui trouvait 280 articles trop longs à faire défiler (« il en faut quelques-uns, pas plus »).
 */
export async function allegerLaCremerie(prisma: PrismaClient): Promise<string> {
  return allegerUnRayon(prisma, { cle: CLE_ALLEGEMENT_CREMERIE, titre: "Crèmerie", rayon: RAYON_CREMERIE, selection: CREMERIE_GARDEE });
}

/** Ce que le rayon « Boissons » garde : la sélection, et ce que le gérant a fait remettre en vente ensuite. */
const BOISSONS_EN_VENTE = [...BOISSONS_GARDEES, ...BOISSONS_REMISES_EN_VENTE];

/** Ce que le rayon « Boissons » ne garde pas (pur). */
export const boissonsARetirer = () => rayonARetirer(RAYON_BOISSONS, BOISSONS_EN_VENTE);

export const CLE_ALLEGEMENT_BOISSONS = "allegement-boissons-2026-11-12";

/**
 * Le rayon « Boissons » ramené à une courte sélection, lui aussi : la demande du gérant (12 novembre 2026)
 * quand ses captures l'ont porté à 173 articles. L'alcool, que le code n'a jamais mis en vente, n'est pas touché.
 */
export async function allegerLesBoissons(prisma: PrismaClient): Promise<string> {
  return allegerUnRayon(prisma, { cle: CLE_ALLEGEMENT_BOISSONS, titre: "Boissons", rayon: RAYON_BOISSONS, selection: BOISSONS_EN_VENTE });
}

export const CLE_REMISE_EN_VENTE_RED_BULL_MONSTER = "remise-en-vente-red-bull-monster-2026-11-12";

/**
 * Red Bull et Monster remis en vente : la demande du gérant (12 novembre 2026), après que la sélection courte
 * des boissons les avait masqués. Une seule fois : s'il les remasque ensuite, ils le restent. Jamais un
 * article sans prix (« à définir ») : seulement ceux qui en ont un.
 */
export async function remettreEnVenteRedBullEtMonster(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_REMISE_EN_VENTE_RED_BULL_MONSTER);
  if (faite === null) return "Red Bull et Monster : réglages pas encore créés, rien de changé.";
  if (faite) return "Red Bull et Monster : déjà remis en vente, rien de changé.";
  const [remis] = await prisma.$transaction([
    prisma.produit.updateMany({ where: { actif: false, prix: { gt: 0 }, nom: { in: BOISSONS_REMISES_EN_VENTE } }, data: { actif: true } }),
    noterOperation(prisma, CLE_REMISE_EN_VENTE_RED_BULL_MONSTER),
  ]);
  return `Red Bull et Monster : ${remis.count} article(s) remis en vente.`;
}

export const CLE_REMISE_EN_VENTE_DES_RAYONS = "remise-en-vente-rayons-2026-11-13";

/**
 * Le moment où les deux rayons ont été raccourcis (la première des deux mises en ligne, 12 novembre 2026) :
 * un article masqué AVANT l'a été par le gérant lui-même (ou par une autre décision), et ne revient pas.
 */
export const RAYONS_RACCOURCIS_LE = new Date("2026-11-12T15:30:00Z");

/**
 * Ce que les rayons « Crèmerie & œufs » et « Boissons » retrouvent (pur) : tout ce que leurs courtes sélections
 * avaient masqué, sauf les articles introuvables sur Wolt (« supprime ça » : ils restent retirés).
 */
export function rayonsARemettre(): { noms: string[]; nomsWolt: string[] } {
  const introuvables = new Set(INTROUVABLES_SUR_WOLT);
  const retires = [cremerieARetirer(), boissonsARetirer()];
  return {
    noms: [...new Set(retires.flatMap((r) => r.noms))].filter((n) => !introuvables.has(n)),
    nomsWolt: [...new Set(retires.flatMap((r) => r.nomsWolt))],
  };
}

/**
 * Les rayons « Crèmerie & œufs » et « Boissons » retrouvent tous leurs articles : la demande du gérant
 * (13 novembre 2026, « remets tout »), une fois le catalogue rangé en sous-rayons — un long rayon se parcourt
 * maintenant sans tout faire défiler. Une seule fois : ce qu'il remasque ensuite le reste.
 * Ne reviennent que les articles masqués par les deux sélections courtes : jamais un article sans prix
 * (« à définir »), ni l'alcool (le code ne l'a jamais mis en vente), ni les introuvables sur Wolt, ni un
 * article qu'il avait masqué lui-même avant (`RAYONS_RACCOURCIS_LE`).
 */
export async function remettreEnVenteLesRayons(prisma: PrismaClient): Promise<string> {
  const faite = await operationFaite(prisma, CLE_REMISE_EN_VENTE_DES_RAYONS);
  if (faite === null) return "Crèmerie et Boissons : réglages pas encore créés, rien de changé.";
  if (faite) return "Crèmerie et Boissons : déjà remis en vente, rien de changé.";
  const { noms, nomsWolt } = rayonsARemettre();
  const [remis] = await prisma.$transaction([
    prisma.produit.updateMany({
      where: {
        actif: false,
        prix: { gt: 0 },
        updatedAt: { gte: RAYONS_RACCOURCIS_LE },
        nom: { notIn: INTROUVABLES_SUR_WOLT },
        OR: [{ nom: { in: noms } }, { nomWolt: { in: nomsWolt } }],
      },
      data: { actif: true },
    }),
    noterOperation(prisma, CLE_REMISE_EN_VENTE_DES_RAYONS),
  ]);
  return `Crèmerie et Boissons : ${remis.count} article(s) remis en vente.`;
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
