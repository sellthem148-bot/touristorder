import Link from "next/link";
import { Article, LIEN_TEXTE, PageTexte } from "@/components/PageTexte";
import { infosLegales } from "@/lib/reglages";
import { amplitudeDesCreneaux } from "@/lib/creneaux";
import { NOM_DU_SITE } from "@/lib/marque";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "Conditions générales de vente",
  description: `Commande, prix, paiement, livraison, article indisponible, annulation : les conditions de vente de ${NOM_DU_SITE}.`,
  alternates: { canonical: "/conditions" },
};

export default async function Conditions() {
  const i = await infosLegales();
  const vendeur = i.nom || NOM_DU_SITE;
  const paiements = i.paiements.length > 0 ? i.paiements.join(", ") : "les moyens indiqués au moment de la commande";
  const amplitude = amplitudeDesCreneaux(i.creneaux);
  return (
    <PageTexte titre="Conditions générales de vente" misAJour="11 novembre 2026">
      <p>
        Les présentes conditions s&apos;appliquent à toute commande passée sur {NOM_DU_SITE}. En validant une commande, vous les acceptez.
      </p>

      <Article titre="1. Le service">
        <p>
          {vendeur} propose un service de courses et de livraison à domicile : nous achetons pour vous, auprès de commerces locaux,
          les articles que vous commandez, puis nous vous les livrons à l&apos;adresse indiquée (logement, hôtel, location).
        </p>
      </Article>

      <Article titre="2. La commande">
        <p>
          Vous choisissez vos articles sur le site, puis indiquez vos coordonnées, votre adresse et le créneau de livraison souhaité.
          Un e-mail de confirmation vous est envoyé, avec un lien pour suivre votre commande.
        </p>
        <p>
          Vous pouvez aussi demander un article qui n&apos;est pas dans le catalogue. Nous le recherchons, puis nous vous confirmons son prix
          sur WhatsApp : il n&apos;est ajouté à votre commande qu&apos;avec votre accord.
        </p>
        <p>Nous pouvons refuser ou annuler une commande, notamment en cas d&apos;article introuvable, d&apos;adresse hors zone ou d&apos;informations incomplètes. Toute somme déjà versée est alors remboursée.</p>
      </Article>

      <Article titre="3. Les prix">
        <p>
          Les prix sont indiqués en shekels (₪). Le montant de votre commande comprend le prix des articles, les frais de service et les frais
          de livraison. Ces frais peuvent varier selon la ville, le jour et l&apos;heure de livraison, ou si vous choisissez la livraison express :
          ils sont toujours affichés avant la validation de la commande. Le pourboire est facultatif.
        </p>
        <p>Le prix d&apos;un article peut évoluer d&apos;un jour à l&apos;autre ; le prix appliqué est celui affiché au moment de votre commande.</p>
      </Article>

      <Article titre="4. Le paiement">
        <p>
          Le paiement se fait à la commande, avant la préparation, par {paiements}. Les coordonnées de paiement vous sont communiquées
          sur WhatsApp. Nous lançons vos achats dès réception de votre paiement.
        </p>
        <p>
          Tant que le paiement n&apos;est pas reçu, la commande n&apos;est pas préparée. Si le paiement arrive trop tard pour le créneau choisi,
          nous vous proposons un autre créneau ou l&apos;annulation de la commande.
        </p>
      </Article>

      <Article titre="5. La livraison">
        <p>
          Nous livrons {i.villes.length > 0 ? <>dans les villes suivantes : {i.villes.join(", ")}</> : "dans les villes indiquées sur le site"}
          {amplitude ? <>, le soir ({amplitude})</> : null}, dans le créneau que vous avez choisi.
          {i.heureLimite ? <> Une commande passée et réglée avant {i.heureLimite.replace(":", "h").replace("h00", "h")} peut être livrée le soir même, selon les créneaux encore disponibles.</> : null}
        </p>
        <p>
          Merci d&apos;être joignable sur WhatsApp et présent à l&apos;adresse indiquée pendant le créneau. Si la livraison est impossible de votre fait
          (absence, adresse erronée, téléphone injoignable), une nouvelle livraison peut être facturée, et les produits frais ne peuvent pas être remboursés.
        </p>
        <p>Les horaires sont donnés à titre indicatif : un retard lié à la circulation ou à un commerce ne donne pas lieu à indemnité, mais nous vous prévenons.</p>
      </Article>

      <Article titre="6. Article indisponible">
        <p>
          Si un article manque en magasin, nous suivons le choix que vous avez fait à la commande : vous contacter, le remplacer par un équivalent
          ou le retirer. Un article non livré n&apos;est pas facturé ; s&apos;il a déjà été payé, il vous est remboursé par le moyen de paiement utilisé.
        </p>
      </Article>

      <Article titre="7. Annulation">
        <p>
          Vous pouvez annuler votre commande sans frais tant que nous n&apos;avons pas commencé vos achats : écrivez-nous sur WhatsApp. La somme versée
          vous est alors remboursée. Une fois les achats effectués pour vous, la commande ne peut plus être annulée.
        </p>
        <p>
          Les produits alimentaires, frais ou d&apos;hygiène ne sont ni repris ni échangés, sauf erreur de notre part ou produit abîmé.
          Ces conditions ne vous privent d&apos;aucun des droits que la loi vous accorde.
        </p>
      </Article>

      <Article titre="8. Réclamations">
        <p>
          Vérifiez votre commande à la livraison. En cas d&apos;article manquant, erroné ou abîmé, contactez-nous dans les 24 heures, si possible avec
          une photo : nous remplaçons l&apos;article ou nous vous le remboursons.
        </p>
      </Article>

      <Article titre="9. Produits">
        <p>
          Nous ne sommes pas le fabricant des produits livrés. Les descriptions et les photos sont données à titre indicatif ; l&apos;emballage peut différer.
          Pour les produits vendus au poids, le poids livré peut varier légèrement. En cas d&apos;allergie ou de régime particulier, vérifiez toujours
          l&apos;étiquette du produit.
        </p>
        <p>L&apos;alcool n&apos;est vendu qu&apos;aux personnes majeures : une pièce d&apos;identité peut être demandée à la livraison.</p>
      </Article>

      <Article titre="10. Données personnelles">
        <p>
          Les informations que vous nous confiez servent à traiter et à livrer votre commande. Le détail est dans notre{" "}
          <Link href="/confidentialite" className={LIEN_TEXTE}>politique de confidentialité</Link>.
        </p>
      </Article>

      <Article titre="11. Droit applicable et contact">
        <p>Les présentes conditions sont soumises au droit israélien. En cas de difficulté, contactez-nous d&apos;abord : nous cherchons toujours une solution amiable.</p>
        <p>
          Pour toute question : <Link href="/contact" className={LIEN_TEXTE}>page de contact</Link>. L&apos;identité du vendeur figure dans les{" "}
          <Link href="/mentions-legales" className={LIEN_TEXTE}>mentions légales</Link>.
        </p>
      </Article>
    </PageTexte>
  );
}
