// npm run seed         → les catégories de départ et les réglages (sans danger, rejouable)
// npm run seed:demo    → + quelques produits D'EXEMPLE pour tester en local
//                        (prix inventés : à ne pas lancer sur la base de production)
import { PrismaClient } from "@prisma/client";
import { slugDe } from "../lib/slug";

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

const DEMO: { categorie: string; nom: string; description: string; prix: number; prixAchat: number; boutique: string }[] = [
  { categorie: "Courses & épicerie", nom: "Pack d'eau 6 × 1,5 L", description: "Eau minérale", prix: 2490, prixAchat: 1990, boutique: "Wolt Market" },
  { categorie: "Courses & épicerie", nom: "Lait 3 % 1 L", description: "Tnuva", prix: 990, prixAchat: 790, boutique: "Wolt Market" },
  { categorie: "Courses & épicerie", nom: "Pain challah", description: "Frais du jour", prix: 1890, prixAchat: 1490, boutique: "Wolt Market" },
  { categorie: "Bébé & enfants", nom: "Couches Huggies taille 4", description: "Paquet de 40", prix: 6990, prixAchat: 5990, boutique: "Super-Pharm" },
  { categorie: "Bébé & enfants", nom: "Lingettes bébé", description: "Paquet de 72", prix: 1990, prixAchat: 1590, boutique: "Super-Pharm" },
  { categorie: "Plage & soleil", nom: "Crème solaire SPF 50", description: "200 ml", prix: 7990, prixAchat: 6490, boutique: "Super-Pharm" },
  { categorie: "Plage & soleil", nom: "Maillot de bain enfant", description: "Tailles 2 à 8 ans — précise la taille en note", prix: 8990, prixAchat: 6990, boutique: "Boutique à définir" },
  { categorie: "Chargeurs & électronique", nom: "Chargeur iPhone USB-C 20 W", description: "Avec câble USB-C vers Lightning", prix: 9990, prixAchat: 7990, boutique: "Boutique électronique" },
  { categorie: "Chargeurs & électronique", nom: "Adaptateur prise Israël (type H)", description: "Pour prises françaises", prix: 3490, prixAchat: 2490, boutique: "Boutique électronique" },
  { categorie: "Pharmacie & hygiène", nom: "Brosse à dents + dentifrice", description: "Kit voyage", prix: 2490, prixAchat: 1890, boutique: "Super-Pharm" },
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
      const existe = await prisma.produit.findFirst({ where: { nom: p.nom } });
      if (existe) continue;
      await prisma.produit.create({
        data: {
          nom: p.nom,
          description: p.description,
          prix: p.prix,
          prixAchat: p.prixAchat,
          boutique: p.boutique,
          categorieId: categorie.id,
          ordre: i,
        },
      });
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
