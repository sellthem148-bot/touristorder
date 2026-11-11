import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { formatDateHeure, libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, LIBELLE_STATUT, STATUTS_EN_COURS } from "@/lib/statuts";
import { COULEUR_PAIEMENT, etatDuPaiement, libellePaiement } from "@/lib/paiement";
import { Actualiser } from "@/components/Actualiser";

export const metadata = { title: "Commandes" };

const FILTRES = {
  "en-cours": { libelle: "En cours", where: { statut: { in: STATUTS_EN_COURS } } },
  // Le paiement passe avant les achats : ce qu'il reste à recevoir (jamais payé, ou complément).
  "a-payer": { libelle: "À payer", where: { statut: { in: STATUTS_EN_COURS }, montantPaye: { lt: prisma.commande.fields.total } } },
  livrees: { libelle: "Livrées", where: { statut: "LIVREE" } },
  annulees: { libelle: "Annulées", where: { statut: "ANNULEE" } },
  toutes: { libelle: "Toutes", where: {} },
} satisfies Record<string, { libelle: string; where: Prisma.CommandeWhereInput }>;

type Filtre = keyof typeof FILTRES;

export default async function PageCommandes({ searchParams }: PageProps<"/admin">) {
  await exigerAdmin();
  const brut = (await searchParams).filtre;
  const filtre: Filtre = typeof brut === "string" && brut in FILTRES ? (brut as Filtre) : "en-cours";

  const [commandes, compteurs] = await Promise.all([
    prisma.commande.findMany({
      where: FILTRES[filtre].where,
      orderBy: filtre === "en-cours" || filtre === "a-payer" ? [{ dateLivraison: "asc" }, { createdAt: "asc" }] : [{ createdAt: "desc" }],
      take: 100,
      select: {
        id: true, numero: true, statut: true, nomClient: true, ville: true,
        dateLivraison: true, creneau: true, total: true, createdAt: true, express: true,
        montantPaye: true, payeLe: true, demandeLibre: true,
        _count: { select: { lignes: true } },
      },
    }),
    Promise.all(
      (Object.keys(FILTRES) as Filtre[]).map(async (f) => [f, await prisma.commande.count({ where: FILTRES[f].where })] as const),
    ),
  ]);
  const nombre = Object.fromEntries(compteurs) as Record<Filtre, number>;

  return (
    <div className="space-y-4">
      <Actualiser secondes={30} />
      <h1 className="text-2xl font-extrabold">Commandes</h1>
      <nav aria-label="Filtrer les commandes" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {(Object.keys(FILTRES) as Filtre[]).map((f) => (
            <li key={f}>
              <Link
                href={`/admin?filtre=${f}`}
                aria-current={f === filtre ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
                  f === filtre ? "bg-marque text-white" : "border border-slate-200 bg-white hover:border-marque"
                }`}
              >
                {FILTRES[f].libelle} ({nombre[f]})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {commandes.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">Aucune commande ici.</p>
      ) : (
        <ul className="space-y-2">
          {commandes.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/commandes/${c.id}`} className="carte flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:border-marque">
                <span className="font-bold">n°{c.numero}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEUR_STATUT[c.statut]}`}>
                  {LIBELLE_STATUT[c.statut]}
                </span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${COULEUR_PAIEMENT[etatDuPaiement(c).etat]}`}>
                  {libellePaiement(etatDuPaiement(c))}
                </span>
                {c.express && <span className="rounded-full bg-soleil px-2.5 py-0.5 text-xs font-bold text-slate-900">Express</span>}
                {c.demandeLibre && <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-200">Demande hors catalogue</span>}
                <span className="font-medium">{c.nomClient}</span>
                <span className="text-slate-600">{c.ville}</span>
                <span className="text-slate-600">
                  {libelleDuJour(c.dateLivraison)} · {c.creneau}
                </span>
                <span className="ml-auto font-semibold">{formatPrix(c.total)}</span>
                <span className="w-full text-xs text-slate-500">
                  Passée le {formatDateHeure(c.createdAt)} · {c._count.lignes} article{c._count.lignes > 1 ? "s" : ""} différent{c._count.lignes > 1 ? "s" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
