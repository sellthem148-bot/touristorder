// Les e-mails du site : le texte et la mise en page, en fonctions pures
// (testables, sans réseau). L'envoi lui-même est dans lib/courriel.ts.
// Tout ce qui vient d'un client ou du catalogue passe par `echapper`.
import { formatPrix } from "./argent";
import type { Totaux } from "./calcul";
import { lignesDeMontants, type PresentationMontants } from "./montants";

export type CourrielPret = { sujet: string; html: string; texte: string };

const BLEU = "#1557ff";
const ENCRE = "#0f172a";
const DOUX = "#5b6478";
const TRAIT = "#e3e7f0";
const FOND = "#f5f6fa";
const SABLE = "#fff6e5";
const POLICE = "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

/** Rend un texte inoffensif dans du HTML (nom, adresse, note, nom de produit…). */
export function echapper(texte: string): string {
  return texte
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const multiligne = (t: string) => echapper(t).replace(/\r?\n/g, "<br>");

function bouton(lien: string, libelle: string, plein = true): string {
  const style = plein
    ? `background:${BLEU};color:#ffffff;border:2px solid ${BLEU};`
    : `background:#ffffff;color:${BLEU};border:2px solid ${BLEU};`;
  return `<a href="${echapper(lien)}" style="display:inline-block;${style}padding:12px 22px;border-radius:14px;font-weight:700;font-size:15px;text-decoration:none;font-family:${POLICE};">${echapper(libelle)}</a>`;
}

/** La mise en page commune : bandeau à la marque, carte blanche, pied. */
function gabarit(o: { site: string; apercu: string; titre: string; corps: string; pied: string }): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${echapper(o.titre)}</title></head>
<body style="margin:0;padding:0;background:${FOND};font-family:${POLICE};color:${ENCRE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(o.apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOND};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="background:${BLEU};border-radius:24px 24px 0 0;padding:22px 28px;">
  <span style="font-size:20px;font-weight:800;color:#ffffff;font-family:${POLICE};">${echapper(o.site)}</span>
</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 24px 24px;padding:28px;border:1px solid ${TRAIT};border-top:0;">
  <h1 style="margin:0 0 12px;font-size:24px;line-height:1.25;font-weight:800;color:${ENCRE};">${echapper(o.titre)}</h1>
  ${o.corps}
</td></tr>
<tr><td style="padding:18px 28px;font-size:12px;line-height:1.5;color:${DOUX};">${o.pied}</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export type CommandePourCourriel = {
  site: string;
  numero: number;
  nomClient: string;
  prenom: string;
  telephone: string;
  ville: string;
  adresse: string;
  jour: string; // « Aujourd'hui », « Demain », « Jeudi 12 novembre »
  creneau: string;
  paiement: string;
  notes: string;
  lignes: { nom: string; options: string; quantite: number; prixUnitaire: number }[];
  totaux: Totaux;
  presentation: PresentationMontants;
  lienSuivi: string;
  lienEspace: string | null; // connexion directe à l'espace client
  lienWhatsapp: string | null; // écrire au gérant
};

function tableauDesArticles(c: CommandePourCourriel): string {
  const lignes = c.lignes
    .map(
      (l) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${TRAIT};font-size:15px;">
    <strong>${l.quantite} ×</strong> ${echapper(l.nom)}${l.options ? `<br><span style="font-size:13px;color:${DOUX};">${echapper(l.options)}</span>` : ""}
  </td>
  <td align="right" style="padding:10px 0;border-bottom:1px solid ${TRAIT};font-size:15px;white-space:nowrap;vertical-align:top;">${formatPrix(l.prixUnitaire * l.quantite)}</td>
</tr>`,
    )
    .join("");
  const montants = lignesDeMontants(c.totaux, c.presentation)
    .map(
      (m) => `<tr><td style="padding:4px 0;font-size:14px;color:${DOUX};">${echapper(m.libelle)}</td><td align="right" style="padding:4px 0;font-size:14px;white-space:nowrap;">${formatPrix(m.montant)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lignes}
<tr><td colspan="2" style="height:10px;"></td></tr>${montants}
<tr><td style="padding:12px 0 0;font-size:18px;font-weight:800;border-top:2px solid ${ENCRE};">Total à payer</td><td align="right" style="padding:12px 0 0;font-size:18px;font-weight:800;border-top:2px solid ${ENCRE};white-space:nowrap;">${formatPrix(c.totaux.total)}</td></tr>
</table>`;
}

function texteDesArticles(c: CommandePourCourriel): string {
  return [
    ...c.lignes.map((l) => `- ${l.quantite} × ${l.nom}${l.options ? ` (${l.options})` : ""} : ${formatPrix(l.prixUnitaire * l.quantite)}`),
    "",
    ...lignesDeMontants(c.totaux, c.presentation).map((m) => `${m.libelle} : ${formatPrix(m.montant)}`),
    `TOTAL À PAYER : ${formatPrix(c.totaux.total)}`,
  ].join("\n");
}

/** L'e-mail que reçoit le client quand sa commande est enregistrée. */
export function courrielDeConfirmation(c: CommandePourCourriel): CourrielPret {
  const quand = `${c.jour}, ${c.creneau}`;
  const paiement = c.paiement ? `Paiement à la livraison : ${c.paiement}.` : "Paiement à la livraison.";
  const corps = `
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">Merci ${echapper(c.prenom)} ! Ta commande <strong>n°${c.numero}</strong> est bien enregistrée. On s'occupe de tout et on te livre à ton logement.</p>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SABLE};border-radius:16px;margin:0 0 22px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${DOUX};">Livraison</strong><br>
    <strong>${echapper(quand)}</strong><br>
    ${multiligne(c.adresse)}, ${echapper(c.ville)}<br>
    <span style="color:${DOUX};">${echapper(paiement)}</span>
  </td></tr>
  </table>

  <p style="margin:0 0 22px;">${bouton(c.lienSuivi, "Suivre ma commande")}</p>

  <h2 style="margin:0 0 6px;font-size:17px;font-weight:800;">Ta commande</h2>
  ${tableauDesArticles(c)}
  ${c.notes ? `<p style="margin:18px 0 0;font-size:14px;color:${DOUX};">Ta note : ${multiligne(c.notes)}</p>` : ""}

  <p style="margin:22px 0 0;font-size:14px;line-height:1.55;color:${DOUX};">Si un article manque, on te prévient sur WhatsApp et il n'est pas facturé.</p>
  ${
    c.lienEspace
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border:1px solid ${TRAIT};border-radius:16px;">
  <tr><td style="padding:16px 18px;">
    <strong style="font-size:15px;">Ton espace client</strong>
    <p style="margin:4px 0 12px;font-size:14px;line-height:1.5;color:${DOUX};">Retrouve tes commandes, recommande en un geste et enregistre ton adresse.</p>
    ${bouton(c.lienEspace, "Ouvrir mon espace", false)}
  </td></tr>
  </table>`
      : ""
  }`;
  const pied = `${c.lienWhatsapp ? `Une question ? <a href="${echapper(c.lienWhatsapp)}" style="color:${BLEU};font-weight:700;">Écris-nous sur WhatsApp</a>.<br>` : ""}Tu reçois cet e-mail parce qu'une commande a été passée sur ${echapper(c.site)} avec cette adresse.`;
  const texte = [
    `Merci ${c.prenom} ! Ta commande n°${c.numero} est bien enregistrée.`,
    "",
    `Livraison : ${quand}`,
    `${c.adresse.replace(/\s+/g, " ")}, ${c.ville}`,
    paiement,
    "",
    texteDesArticles(c),
    "",
    `Suivre ma commande : ${c.lienSuivi}`,
    ...(c.lienEspace ? [`Mon espace client : ${c.lienEspace}`] : []),
    "",
    "Si un article manque, on te prévient sur WhatsApp et il n'est pas facturé.",
  ].join("\n");
  return {
    sujet: `Ta commande n°${c.numero} est enregistrée — livraison ${c.jour.toLowerCase()}, ${c.creneau}`,
    html: gabarit({ site: c.site, apercu: `Livraison ${quand} · total ${formatPrix(c.totaux.total)}`, titre: "Commande enregistrée", corps, pied }),
    texte,
  };
}

/** L'e-mail que reçoit le gérant à chaque nouvelle commande. */
export function courrielNouvelleCommande(c: CommandePourCourriel & { lienAdmin: string }): CourrielPret {
  const quand = `${c.jour}, ${c.creneau}`;
  const corps = `
  <p style="margin:0 0 18px;font-size:16px;line-height:1.5;"><strong>${echapper(c.nomClient)}</strong> · ${echapper(c.ville)} · <strong>${formatPrix(c.totaux.total)}</strong>${c.paiement ? ` (${echapper(c.paiement)})` : ""}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SABLE};border-radius:16px;margin:0 0 20px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong>${echapper(quand)}</strong><br>
    ${multiligne(c.adresse)}, ${echapper(c.ville)}<br>
    ${echapper(c.telephone)}
  </td></tr>
  </table>
  <p style="margin:0 0 22px;">${bouton(c.lienAdmin, "Ouvrir la commande")}</p>
  ${tableauDesArticles(c)}
  ${c.notes ? `<p style="margin:18px 0 0;font-size:14px;color:${DOUX};">Note du client : ${multiligne(c.notes)}</p>` : ""}`;
  return {
    sujet: `Nouvelle commande n°${c.numero} — ${c.ville}, ${c.jour.toLowerCase()} ${c.creneau} — ${formatPrix(c.totaux.total)}`,
    html: gabarit({ site: c.site, apercu: `${c.nomClient}, ${c.ville}, ${quand}`, titre: `Nouvelle commande n°${c.numero}`, corps, pied: "E-mail envoyé au gérant à chaque nouvelle commande." }),
    texte: [`Nouvelle commande n°${c.numero}`, `${c.nomClient} · ${c.telephone}`, `${quand}`, `${c.adresse.replace(/\s+/g, " ")}, ${c.ville}`, "", texteDesArticles(c), "", `Ouvrir : ${c.lienAdmin}`].join("\n"),
  };
}

/** Le lien de connexion à l'espace client, demandé depuis la page de connexion. */
export function courrielDeConnexion(o: { site: string; lien: string; minutes: number }): CourrielPret {
  const corps = `
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">Voici ton lien pour ouvrir ton espace client. Il est valable ${o.minutes} minutes.</p>
  <p style="margin:0 0 20px;">${bouton(o.lien, "Ouvrir mon espace")}</p>
  <p style="margin:0;font-size:14px;line-height:1.5;color:${DOUX};">Si tu n'as rien demandé, ignore cet e-mail : personne n'entre sans ce lien.</p>`;
  return {
    sujet: `Ton lien de connexion à ${o.site}`,
    html: gabarit({ site: o.site, apercu: `Lien valable ${o.minutes} minutes`, titre: "Ton espace client", corps, pied: `Tu reçois cet e-mail parce qu'une connexion à ${echapper(o.site)} a été demandée avec cette adresse.` }),
    texte: `Ton lien pour ouvrir ton espace client (valable ${o.minutes} minutes) :\n${o.lien}\n\nSi tu n'as rien demandé, ignore cet e-mail.`,
  };
}

/**
 * L'adresse à laquelle un client répond quand il fait « Répondre » à un de nos e-mails (EMAIL_REPONSE).
 * L'expéditeur (commandes@…) n'a pas forcément de boîte de réception : sans elle, une réponse se perd.
 * Rien si la variable est absente ou n'est pas une adresse.
 */
export function adresseDeReponse(env: Record<string, string | undefined> = process.env): string | undefined {
  const adresse = (env.EMAIL_REPONSE ?? "").trim();
  return /^[^\s@<>,;]+@[^\s@<>,;]+\.[^\s@<>,;]+$/.test(adresse) && adresse.length <= 254 ? adresse : undefined;
}

/** Ce qu'on envoie à Resend pour un e-mail (pur : testé sans réseau). */
export function corpsPourResend(
  c: { a: string; sujet: string; html: string; texte: string },
  expediteur: string,
  env: Record<string, string | undefined> = process.env,
) {
  const reponse = adresseDeReponse(env);
  return { from: expediteur, to: [c.a], subject: c.sujet, html: c.html, text: c.texte, ...(reponse ? { reply_to: reponse } : {}) };
}
