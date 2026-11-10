// npm run seed       → catégories, réglages, villes et plages tarifaires d'exemple, et la base
//                      du catalogue (SANS prix, masquée). Rejouable et sans danger
//                      en production : n'écrase jamais un article ou un réglage existant.
// npm run seed:demo  → + des PRIX D'EXEMPLE sur quelques articles, pour tester en local.
//                      Prix inventés : à ne JAMAIS lancer sur la base de production.
import { PrismaClient } from "@prisma/client";
import { slugDe } from "../lib/slug";
import { lireOptionsSaisies } from "../lib/options";
import { CATALOGUE, CATEGORIES, PLAGES_EXEMPLE, VILLES_EXEMPLE } from "./catalogue";

const prisma = new PrismaClient();

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

async function main() {
  const demo = process.argv.includes("--demo");

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
      creneaux: ["Dès que possible", "09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 21:00", "21:00 – 00:00"],
      messageAccueil: "Chargeur oublié, couches, maillot, courses… on s'en occupe et on te livre.",
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

  console.log(
    `Catalogue : ${ajoutes} article(s) ajouté(s) sans prix (${CATALOGUE.length} dans la base), ${CATEGORIES.length} catégories.` +
      (demo ? ` Prix d'exemple posés sur ${DEMO.length} articles.` : ""),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
