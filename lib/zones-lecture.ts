import "server-only";
import { prisma } from "./prisma";
import { LANGUES } from "./langues";
import { nomVille } from "./i18n/catalogue";
import { zoneReperee, type ZoneReperee } from "./zones";

export type ZoneLivree = ZoneReperee & { supplementLivraison: number };

/**
 * Les zones livrées et ce qui désigne chacune dans une adresse : ses repères (saisis par le gérant dans
 * « Villes ») et son nom dans les cinq langues. Côté serveur seulement : les noms traduits viennent des
 * tables du catalogue, trop lourdes pour le navigateur — c'est ce résultat, léger, qu'on lui envoie.
 */
export async function zonesLivrees(): Promise<ZoneLivree[]> {
  const villes = await prisma.ville.findMany({
    where: { active: true },
    orderBy: [{ ordre: "asc" }, { nom: "asc" }],
    select: { nom: true, reperes: true, supplementLivraison: true },
  });
  return villes.map((v) => ({
    ...zoneReperee(v.nom, v.reperes, LANGUES.map((l) => nomVille(v.nom, l))),
    supplementLivraison: v.supplementLivraison,
  }));
}
