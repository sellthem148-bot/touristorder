import Link from "next/link";
import { Clock, Mail, MapPin } from "lucide-react";
import { LIEN_TEXTE, PageTexte } from "@/components/PageTexte";
import { IconeWhatsapp } from "@/components/Icones";
import { infosLegales } from "@/lib/reglages";
import { lienWhatsapp } from "@/lib/whatsapp";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { NOM_DU_SITE } from "@/lib/marque";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Contact",
  description: `Une question, une commande en cours, un article introuvable : comment joindre ${NOM_DU_SITE}.`,
  alternates: { canonical: "/contact" },
};

export default async function Contact() {
  const i = await infosLegales();
  const whatsapp = lienWhatsapp(i.whatsapp, `Bonjour ! J'ai une question au sujet de ${NOM_DU_SITE}.`);
  const amplitude = amplitudeDesCreneaux(i.creneaux);
  return (
    <PageTexte titre="Contact">
      <p>Une question avant de commander, une commande en cours, un article que vous ne trouvez pas : écrivez-nous, nous répondons en français.</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp">
            <IconeWhatsapp /> Nous écrire sur WhatsApp
          </a>
        )}
        {i.email && (
          <a href={`mailto:${i.email}`} className="bouton-secondaire">
            <Mail className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" /> {i.email}
          </a>
        )}
      </div>
      {!whatsapp && !i.email && (
        <p className="carte p-5">
          Pour une commande en cours, utilisez le lien de suivi reçu par e-mail : il vous permet de nous joindre directement.
        </p>
      )}

      <dl className="grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        {amplitude && (
          <div className="flex gap-3 bg-white p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.6} aria-hidden="true" />
            <div><dt className="text-[13px] text-slate-500">Livraisons</dt><dd className="font-semibold text-encre">Le soir, {amplitude}</dd></div>
          </div>
        )}
        {i.villes.length > 0 && (
          <div className="flex gap-3 bg-white p-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.6} aria-hidden="true" />
            <div><dt className="text-[13px] text-slate-500">Villes livrées</dt><dd className="text-sm">{i.villes.join(" · ")}</dd></div>
          </div>
        )}
      </dl>

      <p>
        Un article introuvable dans le catalogue ? <Link href="/panier?demande=" className={LIEN_TEXTE}>Demandez-le nous</Link> : nous le recherchons et vous confirmons son prix.
      </p>
      {(i.nom || i.adresse) && (
        <p className="text-sm text-slate-500">{[i.nom, i.adresse].filter(Boolean).join(" — ")}</p>
      )}
    </PageTexte>
  );
}
