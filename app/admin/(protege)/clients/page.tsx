import type { Prisma } from "@prisma/client";
import { exigerAdmin } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { formatPrix } from "@/lib/argent";
import { formatDateHeure } from "@/lib/dates";
import { lienWhatsapp } from "@/lib/whatsapp";
import { prenomDe } from "@/lib/messages-client";
import { NOM_DU_SITE } from "@/lib/marque";

export const metadata = { title: "Clients" };

export default async function PageClients({ searchParams }: PageProps<"/admin/clients">) {
  await exigerAdmin();
  const params = await searchParams;
  const q = (typeof params.q === "string" ? params.q : "").trim().slice(0, 80);
  const where: Prisma.ClientWhereInput = q
    ? { OR: [{ nom: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { telephone: { contains: q } }, { ville: { contains: q, mode: "insensitive" } }] }
    : {};
  const clients = await prisma.client.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
    select: {
      id: true, nom: true, email: true, telephone: true, ville: true, createdAt: true,
      commandes: { where: { statut: { not: "ANNULEE" } }, orderBy: { createdAt: "desc" }, select: { total: true, statut: true, createdAt: true } },
    },
  });
  // Les meilleurs clients d'abord : nombre de commandes, puis montant livré.
  const lignes = clients
    .map((c) => ({
      ...c,
      nombre: c.commandes.length,
      depense: c.commandes.filter((x) => x.statut === "LIVREE").reduce((s, x) => s + x.total, 0),
      derniere: c.commandes[0]?.createdAt ?? null,
    }))
    .sort((a, b) => b.nombre - a.nombre || b.depense - a.depense);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Clients ({lignes.length})</h1>
      <form method="get" className="flex flex-wrap gap-2">
        <label htmlFor="q" className="sr-only">Rechercher un client</label>
        <input id="q" name="q" defaultValue={q} placeholder="Nom, e-mail, téléphone, ville…" className="champ max-w-sm py-2" />
        <button type="submit" className="bouton-secondaire py-2">Rechercher</button>
      </form>
      {lignes.length === 0 ? (
        <p className="carte p-6 text-center text-slate-600">{q ? "Aucun client trouvé." : "Les clients apparaissent ici à leur première commande."}</p>
      ) : (
        <ul className="carte divide-y divide-slate-100">
          {lignes.map((c) => {
            const whatsapp = lienWhatsapp(c.telephone, `Bonjour ${prenomDe(c.nom)}, c'est ${NOM_DU_SITE} !`);
            return (
              <li key={c.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 p-4">
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{c.nom || "—"}{c.ville && <span className="font-normal text-slate-600"> · {c.ville}</span>}</p>
                  <p className="break-all text-sm text-slate-600">{c.email} · {c.telephone}</p>
                  <p className="text-xs text-slate-500">
                    Client depuis le {formatDateHeure(c.createdAt)}
                    {c.derniere && <> · dernière commande le {formatDateHeure(c.derniere)}</>}
                  </p>
                </div>
                <div className="text-right text-sm">
                  <p className="font-extrabold">{c.nombre} commande{c.nombre > 1 ? "s" : ""}</p>
                  <p className="tabular-nums text-emerald-700">{formatPrix(c.depense)} livrés</p>
                </div>
                {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp px-3 py-2 text-sm">WhatsApp</a>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
