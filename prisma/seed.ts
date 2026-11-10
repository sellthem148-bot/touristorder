// npm run seed         → les catégories de départ et les réglages (sans danger, rejouable)
// npm run seed:demo    → + quelques produits D'EXEMPLE pour tester en local
//                        (prix inventés : à ne pas lancer sur la base de production)
import { PrismaClient } from "@prisma/client";
import { slugDe } from "../lib/slug";
import { lireOptionsSaisies } from "../lib/options";

const prisma = new PrismaClient();

const CATEGORIES = [
  { nom: "Courses & épicerie", emoji: "🛒" },
  { nom: "Bébé & enfants", emoji: "🍼" },
  { nom: "Plage & soleil", emoji: "🏖️" },
  { nom: "Chargeurs & électronique", emoji: "🔌" },
  { nom: "Vêtements", emoji: "👕" },
  { nom: "Pharmacie & hygiène", emoji: "🧴" },
  { nom: "Cadeaux", emoji: "🎁" },
];

type Demo = {
  categorie: string; nom: string; description: string; prix: number; prixAchat: number; boutique: string;
  badge?: string; prixBarre?: number; options?: string;
};

const DEMO: Demo[] = [
  { categorie: "Courses & épicerie", nom: "Pack d'eau 6 × 1,5 L", description: "Eau minérale", prix: 2490, prixAchat: 1990, boutique: "Wolt Market", badge: "populaire" },
  { categorie: "Courses & épicerie", nom: "Lait 3 % 1 L", description: "Tnuva", prix: 990, prixAchat: 790, boutique: "Wolt Market" },
  { categorie: "Courses & épicerie", nom: "Pain challah", description: "Frais du jour", prix: 1890, prixAchat: 1490, boutique: "Wolt Market" },
  { categorie: "Courses & épicerie", nom: "Café en capsules × 10", description: "Compatibles Nespresso", prix: 2990, prixAchat: 2290, boutique: "Wolt Market", options: "Intensité : Doux | Corsé" },
  { categorie: "Bébé & enfants", nom: "Couches Huggies", description: "Paquet de 40", prix: 6990, prixAchat: 5990, boutique: "Super-Pharm", badge: "populaire", options: "Taille : 3 | 4 | 5 | 6 +5" },
  { categorie: "Bébé & enfants", nom: "Lingettes bébé", description: "Paquet de 72", prix: 1990, prixAchat: 1590, boutique: "Super-Pharm" },
  { categorie: "Bébé & enfants", nom: "Body bébé coton", description: "Lot de 2", prix: 5990, prixAchat: 4490, boutique: "Boutique à définir", badge: "nouveau", options: "Taille : 3 mois | 6 mois | 12 mois | 18 mois" },
  { categorie: "Plage & soleil", nom: "Crème solaire SPF 50", description: "200 ml", prix: 6990, prixAchat: 5490, boutique: "Super-Pharm", badge: "promo", prixBarre: 7990 },
  { categorie: "Plage & soleil", nom: "Maillot de bain enfant", description: "Garçon ou fille", prix: 8990, prixAchat: 6990, boutique: "Boutique à définir", options: "Taille : 2 ans | 4 ans | 6 ans | 8 ans | 10 ans\nModèle : Garçon | Fille" },
  { categorie: "Plage & soleil", nom: "Tongs adulte", description: "Pointure à préciser", prix: 4990, prixAchat: 3490, boutique: "Boutique à définir", options: "Pointure : 36-37 | 38-39 | 40-41 | 42-43 | 44-45" },
  { categorie: "Chargeurs & électronique", nom: "Chargeur téléphone 20 W", description: "Avec câble", prix: 9990, prixAchat: 7990, boutique: "Boutique électronique", badge: "populaire", options: "Modèle : iPhone (Lightning) | iPhone 15 et + (USB-C) | Android (USB-C)" },
  { categorie: "Chargeurs & électronique", nom: "Adaptateur prise Israël (type H)", description: "Pour prises françaises", prix: 3490, prixAchat: 2490, boutique: "Boutique électronique", badge: "nouveau" },
  { categorie: "Chargeurs & électronique", nom: "Batterie externe 10 000 mAh", description: "Recharge 2 téléphones", prix: 14990, prixAchat: 11990, boutique: "Boutique électronique" },
  { categorie: "Pharmacie & hygiène", nom: "Brosse à dents + dentifrice", description: "Kit voyage", prix: 2490, prixAchat: 1890, boutique: "Super-Pharm" },
  { categorie: "Cadeaux", nom: "Bouquet de fleurs", description: "Composé le jour même", prix: 18990, prixAchat: 14990, boutique: "Fleuriste à définir", options: "Taille : Moyen | Grand +60" },
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

  await prisma.reglages.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      fraisService: 1500,
      fraisLivraison: 3000,
      villes: ["Tel Aviv", "Jérusalem", "Netanya", "Herzliya", "Ra'anana"],
      creneaux: ["Dès que possible", "09:00 – 12:00", "12:00 – 15:00", "15:00 – 18:00", "18:00 – 21:00"],
      messageAccueil: "Chargeur oublié, couches, maillot, courses… on s'en occupe et on te livre.",
    },
  });

  if (demo) {
    for (const [i, p] of DEMO.entries()) {
      const categorie = await prisma.categorie.findUniqueOrThrow({ where: { nom: p.categorie } });
      const lues = lireOptionsSaisies(p.options ?? "");
      if (!lues.ok) throw new Error(`${p.nom} : ${lues.erreur}`);
      const data = {
        nom: p.nom,
        description: p.description,
        prix: p.prix,
        prixAchat: p.prixAchat,
        prixBarre: p.prixBarre ?? null,
        badge: p.badge ?? "",
        options: lues.groupes,
        boutique: p.boutique,
        categorieId: categorie.id,
        ordre: i,
      };
      const existe = await prisma.produit.findFirst({ where: { nom: p.nom } });
      if (existe) await prisma.produit.update({ where: { id: existe.id }, data });
      else await prisma.produit.create({ data });
    }
  }

  console.log(`Catégories et réglages prêts${demo ? ", produits d'exemple ajoutés" : ""}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
