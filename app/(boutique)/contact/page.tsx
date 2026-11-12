import Link from "next/link";
import type { Metadata } from "next";
import { Clock, Mail, MapPin } from "lucide-react";
import { LIEN_TEXTE, PageTexte } from "@/components/PageTexte";
import { IconeWhatsapp } from "@/components/Icones";
import { infosLegales } from "@/lib/reglages";
import { lienWhatsapp } from "@/lib/whatsapp";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { NOM_DU_SITE } from "@/lib/marque";
import { remplir } from "@/lib/langues";
import { traduction } from "@/lib/traduction";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await traduction();
  return {
    title: t.contact.titre,
    description: remplir(t.contact.metaDescription, { site: NOM_DU_SITE }),
    alternates: { canonical: "/contact" },
  };
}

export default async function Contact() {
  const [i, { langue, t }] = await Promise.all([infosLegales(), traduction()]);
  const whatsapp = lienWhatsapp(i.whatsapp, remplir(t.whatsapp.contact, { site: NOM_DU_SITE }));
  const amplitude = amplitudeDesCreneaux(i.creneaux, langue);
  return (
    <PageTexte titre={t.contact.titre} accueil={t.commun.accueil}>
      <p>{t.contact.intro}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {whatsapp && (
          <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="bouton-whatsapp">
            <IconeWhatsapp /> {t.suivi.ecrire}
          </a>
        )}
        {i.email && (
          <a href={`mailto:${i.email}`} className="bouton-secondaire">
            <Mail className="h-5 w-5" strokeWidth={1.7} aria-hidden="true" /> <bdi dir="ltr">{i.email}</bdi>
          </a>
        )}
      </div>
      {!whatsapp && !i.email && (
        <p className="carte p-5">{t.contact.sansContact}</p>
      )}

      <dl className="grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 sm:grid-cols-2">
        {amplitude && (
          <div className="flex gap-3 bg-white p-4">
            <Clock className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.6} aria-hidden="true" />
            <div><dt className="text-[13px] text-slate-500">{t.contact.livraisons}</dt><dd className="font-semibold text-encre">{remplir(t.accueil.leSoir, { amplitude: amplitude.replace(/ /g, "\u00a0") })}</dd></div>
          </div>
        )}
        {i.villes.length > 0 && (
          <div className="flex gap-3 bg-white p-4">
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-slate-500" strokeWidth={1.6} aria-hidden="true" />
            <div><dt className="text-[13px] text-slate-500">{t.contact.villesLivrees}</dt><dd className="text-sm">{i.villes.join(" · ")}</dd></div>
          </div>
        )}
      </dl>

      <p>
        {t.commun.introuvableQuestion} <Link href="/panier?demande=" className={LIEN_TEXTE}>{t.commun.demandezLe}</Link>{t.commun.introuvableSuite}
      </p>
      {(i.nom || i.adresse) && (
        <p className="text-sm text-slate-500"><bdi>{[i.nom, i.adresse].filter(Boolean).join(" — ")}</bdi></p>
      )}
    </PageTexte>
  );
}
