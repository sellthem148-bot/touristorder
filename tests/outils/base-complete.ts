// Remplit la base LOCALE comme l'est celle de production : tout le catalogue (lots de Wolt, liste du gérant)
// et les opérations faites une fois, dans l'ordre de prisma/preparer.ts. Pour les parcours qui ont besoin de
// rayons bien garnis (tests/navigateur/parcours-rayons.mjs) ; les autres parcours gardent `npm run seed:demo`.
//   npx tsx tests/outils/base-complete.ts          (sur une base vide : voir tests/navigateur/README.md)
// `--tout-en-vente` : remet aussi en vente les rayons raccourcis (Crèmerie, Boissons), pour essayer de longs rayons.
import { PrismaClient } from "@prisma/client";
import * as r from "../../prisma/remplissage";

const prisma = new PrismaClient();
(async () => {
  if (/supabase|pooler/i.test(process.env.DATABASE_URL ?? "")) throw new Error("Jamais sur la base de production.");
  console.log((await r.remplirLaBase(prisma)).slice(0, 200));
  for (const operation of [
    r.mettreEnVenteLaListe, r.appliquerLeReleveDePrix, r.remplacerLesArticles, r.retirerLaViande, r.retirerLesIntrouvables,
    r.allegerLaCremerie, r.allegerLesBoissons, r.remettreEnVenteRedBullEtMonster, r.installerLaListeDynamica, r.installerLesPhotosFrais,
  ]) console.log(" ·", (await operation(prisma)).slice(0, 160));
  if (process.argv.includes("--tout-en-vente")) {
    const { noms } = r.cremerieARetirer();
    const boissons = r.boissonsARetirer().noms;
    const remis = await prisma.produit.updateMany({ where: { actif: false, prix: { gt: 0 }, nom: { in: [...noms, ...boissons] } }, data: { actif: true } });
    console.log(` · essai : ${remis.count} articles des rayons raccourcis remis en vente (base locale seulement).`);
  }
  const rayons = await prisma.categorie.findMany({ orderBy: { ordre: "asc" }, select: { nom: true, _count: { select: { produits: { where: { actif: true, prix: { gt: 0 } } } } } } });
  console.log(rayons.filter((c) => c._count.produits > 0).map((c) => `${c.nom} ${c._count.produits}`).join(" · "));
})()
  .catch((e) => { console.error(e); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
