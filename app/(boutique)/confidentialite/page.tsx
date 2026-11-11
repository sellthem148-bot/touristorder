import Link from "next/link";
import { Article, LIEN_TEXTE, PageTexte } from "@/components/PageTexte";
import { infosLegales } from "@/lib/reglages";
import { NOM_DU_SITE } from "@/lib/marque";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Politique de confidentialité",
  description: `Quelles informations ${NOM_DU_SITE} recueille, pourquoi, combien de temps, et comment les faire modifier ou supprimer.`,
  alternates: { canonical: "/confidentialite" },
};

export default async function Confidentialite() {
  const i = await infosLegales();
  const responsable = i.nom || NOM_DU_SITE;
  return (
    <PageTexte titre="Politique de confidentialité" misAJour="11 novembre 2026">
      <p>
        {responsable} respecte votre vie privée. Cette page explique quelles informations nous recueillons quand vous utilisez {NOM_DU_SITE},
        ce que nous en faisons, et comment les faire modifier ou supprimer.
      </p>

      <Article titre="Les informations que nous recueillons">
        <ul className="list-disc space-y-1.5 pl-5">
          <li><strong>Pour une commande</strong> : votre nom, votre numéro WhatsApp, votre adresse e-mail, votre adresse de livraison (ou votre hôtel), le contenu de la commande et vos éventuelles notes.</li>
          <li><strong>Pour le paiement</strong> : le mode choisi et la date du règlement. Nous ne recueillons ni numéro de carte ni identifiants bancaires sur ce site.</li>
          <li><strong>Pour votre espace client</strong> : votre adresse e-mail, vos coordonnées enregistrées et l&apos;historique de vos commandes.</li>
          <li><strong>Données techniques</strong> : l&apos;adresse IP, utilisée brièvement pour protéger le site contre les abus.</li>
        </ul>
      </Article>

      <Article titre="Ce que nous en faisons">
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Préparer, livrer et suivre votre commande.</li>
          <li>Vous contacter à son sujet, par WhatsApp, par téléphone ou par e-mail.</li>
          <li>Tenir notre comptabilité et respecter nos obligations légales.</li>
          <li>Vous permettre de retrouver vos commandes et de recommander plus vite.</li>
        </ul>
        <p>Nous ne vendons pas vos informations et nous ne les utilisons pas pour de la publicité ciblée.</p>
      </Article>

      <Article titre="Avec qui elles sont partagées">
        <p>
          Uniquement avec les prestataires techniques nécessaires au service : l&apos;hébergement du site et de sa base de données, l&apos;envoi des e-mails
          de confirmation, et les messageries que nous utilisons pour vous écrire et pour être prévenus d&apos;une nouvelle commande.
          Ces prestataires peuvent être situés hors d&apos;Israël et de l&apos;Union européenne. Les commerces où nous achetons vos articles ne reçoivent
          pas vos coordonnées.
        </p>
      </Article>

      <Article titre="Cookies et stockage dans votre navigateur">
        <p>
          Le site n&apos;utilise ni cookie publicitaire ni outil de suivi. Il utilise seulement ce qui est nécessaire à son fonctionnement :
          un cookie de connexion si vous ouvrez votre espace client, et le stockage de votre navigateur pour garder votre panier et les liens de suivi de vos commandes.
        </p>
      </Article>

      <Article titre="Combien de temps">
        <p>
          Les commandes sont conservées le temps exigé par nos obligations comptables et légales. Votre espace client existe tant que vous le souhaitez :
          vous pouvez le supprimer à tout moment depuis <Link href="/compte" className={LIEN_TEXTE}>votre espace</Link>.
        </p>
      </Article>

      <Article titre="Vos droits">
        <p>
          Vous pouvez demander à consulter, corriger ou supprimer les informations qui vous concernent. Vos coordonnées se modifient directement dans
          votre espace client ; pour toute autre demande, <Link href="/contact" className={LIEN_TEXTE}>contactez-nous</Link>
          {i.email ? <> (<a href={`mailto:${i.email}`} className={LIEN_TEXTE}>{i.email}</a>)</> : null}. Nous répondons dans les meilleurs délais.
        </p>
      </Article>

      <Article titre="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés. L&apos;accès à votre espace client se fait par un lien personnel envoyé à votre adresse e-mail,
          sans mot de passe à retenir. L&apos;accès aux commandes est réservé au gérant.
        </p>
      </Article>
    </PageTexte>
  );
}
