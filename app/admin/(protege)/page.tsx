import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { formatDateHeure, libelleDuJour } from "@/lib/dates";
import { COULEUR_STATUT, LIBELLE_STATUT, STATUTS_EN_COURS } from "@/lib/statuts";
import { COULEUR_PAIEMENT, etatDuPaiement, libellePaiement } from "@/lib/paiement";
import { Actualiser } from "@/components/Actualiser";
import { numeroDepuisReference, referenceDeCommande } from "@/lib/reference";

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
  const { filtre: brut, q: recherche } = await searchParams;
  const filtre: Filtre = typeof brut === "string" && brut in FILTRES ? (brut as Filtre) : "en-cours";
  // Chercher une commande : par la référence que le client cite (« BC-58001 »), par son numéro, ou par le nom du client.
  const q = typeof recherche === "string" ? recherche.trim().slice(0, 60) : "";
  const numeroCherche = q ? numeroDepuisReference(q) : null;
  const trouver: Prisma.CommandeWhereInput | null = q
    ? { OR: [...(numeroCherche ? [{ numero: numeroCherche }] : []), { nomClient: { contains: q, mode: "insensitive" } }] }
    : null;

  const [commandes, compteurs] = await Promise.all([
    prisma.commande.findMany({
      where: trouver ?? FILTRES[filtre].where,
      orderBy: !trouver && (filtre === "en-cours" || filtre === "a-payer") ? [{ dateLivraison: "asc" }, { createdAt: "asc" }] : [{ createdAt: "desc" }],
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
      <form action="/admin" className="flex flex-wrap items-end gap-2" role="search">
        <div className="min-w-0 flex-1">
          <label htmlFor="q" className="etiquette">Retrouver une commande</label>
          <input id="q" name="q" type="search" defaultValue={q} maxLength={60} className="champ" placeholder="Référence du client (BC-58001), numéro ou nom" />
        </div>
        <button type="submit" className="bouton-secondaire">Chercher</button>
        {q && <Link href="/admin" className="py-2.5 text-sm font-semibold text-marque hover:underline">Tout afficher</Link>}
      </form>
      <details className="text-sm text-slate-600">
        <summary className="cursor-pointer font-semibold text-slate-700">Lire une référence client</summary>
        <p className="mt-1">
          Le client ne voit jamais « n°1 » : il voit une référence, par exemple <strong>BC-58001</strong>. Les lettres sont ses initiales. Dans le nombre, laisse de côté les deux premiers chiffres (58) : ce qui reste est le numéro de la commande (001 → commande n°1). Ici, chaque commande affiche son vrai numéro et sa référence.
        </p>
      </details>
      <nav aria-label="Filtrer les commandes" className="-mx-4 overflow-x-auto px-4">
        <ul className="flex gap-2">
          {(Object.keys(FILTRES) as Filtre[]).map((f) => (
            <li key={f}>
              <Link
                href={`/admin?filtre=${f}`}
                aria-current={f === filtre && !q ? "page" : undefined}
                className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium ${
                  f === filtre && !q ? "bg-marque text-white" : "border border-slate-200 bg-white hover:border-marque"
                }`}
              >
                {FILTRES[f].libelle} ({nombre[f]})
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {commandes.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">{q ? `Aucune commande pour « ${q} ».` : "Aucune commande ici."}</p>
      ) : (
        <ul className="space-y-2">
          {commandes.map((c) => (
            <li key={c.id}>
              <Link href={`/admin/commandes/${c.id}`} className="carte flex flex-wrap items-center gap-x-4 gap-y-1 p-4 hover:border-marque">
                <span className="font-bold">n°{c.numero}</span>
                <span className="text-xs text-slate-500">réf. {referenceDeCommande(c.numero, c.nomClient)}</span>
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
