// npm run seed       → catégories, réglages, villes et plages tarifaires d'exemple, et la base
//                      du catalogue (SANS prix, masquée). Rejouable et sans danger
//                      en production : n'écrase jamais un article ou un réglage existant.
// npm run seed:demo  → + des PRIX D'EXEMPLE sur quelques articles, pour tester en local.
//                      Prix inventés : à ne JAMAIS lancer sur la base de production.
import { PrismaClient } from "@prisma/client";
import { adresseDirecte } from "../lib/adresses-base";
import { remplirLaBase } from "./remplissage";

const adresse = adresseDirecte();
const prisma = new PrismaClient(adresse ? { datasourceUrl: adresse } : undefined);

remplirLaBase(prisma, { demo: process.argv.includes("--demo") })
  .then((bilan) => console.log(bilan))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
