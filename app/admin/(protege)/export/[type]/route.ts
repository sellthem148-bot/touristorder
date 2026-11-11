import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { exportDesAchats, exportDesVentes, moisValide } from "@/lib/export";
import { jourEnIsrael } from "@/lib/dates";

export const dynamic = "force-dynamic";

/**
 * Les exports comptables : /admin/export/ventes et /admin/export/achats, ?mois=AAAA-MM (ou « tout »).
 * Une route n'est pas protégée par le layout : exigerAdmin() d'abord.
 */
export async function GET(requete: Request, { params }: { params: Promise<{ type: string }> }) {
  await exigerAdmin();
  const { type } = await params;
  if (type !== "ventes" && type !== "achats") return new Response("Export inconnu.", { status: 404 });
  const mois = moisValide(new URL(requete.url).searchParams.get("mois")) ?? jourEnIsrael().slice(0, 7);

  const commandes = await prisma.commande.findMany({
    // Le mois est celui de la livraison (jour israélien, AAAA-MM-JJ).
    where: mois === "tout" ? {} : { dateLivraison: { startsWith: `${mois}-` } },
    orderBy: [{ dateLivraison: "asc" }, { numero: "asc" }],
    select: {
      numero: true, statut: true, createdAt: true, dateLivraison: true, nomClient: true, ville: true, paiement: true, payeLe: true, montantPaye: true,
      sousTotal: true, majoration: true, fraisService: true, fraisLivraison: true, pourboire: true, total: true,
      lignes: {
        orderBy: [{ boutique: "asc" }, { nom: "asc" }],
        select: {
          nom: true, options: true, boutique: true, quantite: true, prixUnitaire: true, prixAchatUnitaire: true, indisponible: true,
          produit: { select: { nomWolt: true } },
        },
      },
    },
  });

  const contenu = type === "ventes" ? exportDesVentes(commandes) : exportDesAchats(commandes);
  return new Response(contenu, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="tourist-order-${type === "ventes" ? "ventes" : "achats-wolt"}-${mois}.csv"`,
      "cache-control": "no-store",
    },
  });
}
