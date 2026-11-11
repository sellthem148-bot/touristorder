// Les e-mails du site : le texte et la mise en page, en fonctions pures
// (testables, sans réseau). L'envoi lui-même est dans lib/courriel.ts.
// Tout ce qui vient d'un client ou du catalogue passe par `echapper`.
import { formatPrix } from "./argent";
import type { Totaux } from "./calcul";
import { lignesDeMontants, type PresentationMontants } from "./montants";

export type CourrielPret = { sujet: string; html: string; texte: string };

// Les mêmes teintes que le site : encre, gris neutres, un bleu pour les liens.
const BLEU = "#1d4fd8";
const ENCRE = "#0d1321";
const DOUX = "#52525b";
const TRAIT = "#e4e4e7";
const FOND = "#f7f7f6";
const SABLE = "#f4f4f5";
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
    ? `background:${ENCRE};color:#ffffff;border:1px solid ${ENCRE};`
    : `background:#ffffff;color:${ENCRE};border:1px solid #d4d4d8;`;
  return `<a href="${echapper(lien)}" style="display:inline-block;${style}padding:12px 22px;border-radius:10px;font-weight:600;font-size:15px;text-decoration:none;font-family:${POLICE};">${echapper(libelle)}</a>`;
}

/** L'adresse de l'image du logo, pour un e-mail : le sigle sur fond clair, servi par le site. */
export function adresseDuLogo(adresseDuSite: string): string {
  return `${adresseDuSite.replace(/\/$/, "")}/logo/tourist-order-sigle-clair.png`;
}

/**
 * Le bandeau : le logo (s'il est fourni) et le nom. Le nom reste du texte : une messagerie
 * qui bloque les images affiche quand même la marque, et l'image n'a pas de texte de remplacement.
 */
function bandeau(site: string, logo?: string | null): string {
  const nom = `font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;font-family:${POLICE};`;
  if (!logo) return `<span style="${nom}">${echapper(site)}</span>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding:0 12px 0 0;line-height:0;"><img src="${echapper(logo)}" width="36" height="36" alt="" style="display:block;border:0;border-radius:9px;"></td>
    <td style="${nom}">${echapper(site)}</td>
  </tr></table>`;
}

/** La mise en page commune : bandeau à la marque, carte blanche, pied. */
function gabarit(o: { site: string; logo?: string | null; apercu: string; titre: string; corps: string; pied: string }): string {
  return `<!doctype html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${echapper(o.titre)}</title></head>
<body style="margin:0;padding:0;background:${FOND};font-family:${POLICE};color:${ENCRE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(o.apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOND};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
<tr><td style="background:${ENCRE};border-radius:14px 14px 0 0;padding:18px 28px;">
  ${bandeau(o.site, o.logo)}
</td></tr>
<tr><td style="background:#ffffff;border-radius:0 0 14px 14px;padding:28px;border:1px solid ${TRAIT};border-top:0;">
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
  logo?: string | null; // adresse de l'image du logo (adresseDuLogo) ; absente = nom seul
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
  demandeLibre: string; // « Je ne trouve pas mon article » : ce que le client demande hors catalogue
  lignes: { nom: string; options: string; quantite: number; prixUnitaire: number }[];
  totaux: Totaux;
  presentation: PresentationMontants;
  lienSuivi: string;
  lienEspace: string | null; // connexion directe à l'espace client
  lienWhatsapp: string | null; // écrire au gérant
  lienPaiement: string | null; // demander au gérant, sur WhatsApp, les coordonnées de paiement
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
  // Une demande d'article hors catalogue, sans article du catalogue : rien à régler pour l'instant.
  const demandeSeule = c.lignes.length === 0;
  const objet = demandeSeule ? "demande" : "commande";
  const par = c.paiement ? ` par ${c.paiement}` : "";
  const reglement = `Paiement à la commande : ${formatPrix(c.totaux.total)}${par}. Nous vous envoyons les coordonnées de paiement sur WhatsApp et nous lançons vos achats dès réception.`;
  const suite = demandeSeule
    ? "Nous recherchons l'article et vous confirmons son prix sur WhatsApp avant tout paiement."
    : "Elle est préparée dès réception de votre paiement, puis livrée à votre logement.";
  const corps = `
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">Merci ${echapper(c.prenom)} ! Votre ${objet} <strong>n°${c.numero}</strong> est bien enregistrée. ${suite}</p>
  ${
    demandeSeule
      ? ""
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${TRAIT};border-radius:10px;margin:0 0 16px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${DOUX};">Paiement</strong><br>
    ${echapper(reglement)}
    ${c.lienPaiement ? `<p style="margin:12px 0 0;">${bouton(c.lienPaiement, "Recevoir les coordonnées de paiement", false)}</p>` : ""}
  </td></tr>
  </table>`
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SABLE};border-radius:10px;margin:0 0 22px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${DOUX};">Livraison</strong><br>
    <strong>${echapper(quand)}</strong><br>
    ${multiligne(c.adresse)}, ${echapper(c.ville)}
  </td></tr>
  </table>

  <p style="margin:0 0 22px;">${bouton(c.lienSuivi, demandeSeule ? "Suivre ma demande" : "Suivre ma commande")}</p>

  ${demandeSeule ? "" : `<h2 style="margin:0 0 6px;font-size:17px;font-weight:800;">Votre commande</h2>
  ${tableauDesArticles(c)}`}
  ${c.demandeLibre ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.55;"><strong>Votre demande hors catalogue :</strong> ${multiligne(c.demandeLibre)}<br><span style="color:${DOUX};">Nous vous confirmons son prix sur WhatsApp avant de l'ajouter à votre commande.</span></p>` : ""}
  ${c.notes ? `<p style="margin:18px 0 0;font-size:14px;color:${DOUX};">Votre note : ${multiligne(c.notes)}</p>` : ""}

  ${demandeSeule ? "" : `<p style="margin:22px 0 0;font-size:14px;line-height:1.55;color:${DOUX};">Si un article manque, nous vous prévenons sur WhatsApp et il vous est remboursé.</p>`}
  ${
    c.lienEspace
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border:1px solid ${TRAIT};border-radius:10px;">
  <tr><td style="padding:16px 18px;">
    <strong style="font-size:15px;">Votre espace client</strong>
    <p style="margin:4px 0 12px;font-size:14px;line-height:1.5;color:${DOUX};">Retrouvez vos commandes, recommandez en un geste et enregistrez votre adresse.</p>
    ${bouton(c.lienEspace, "Ouvrir mon espace", false)}
  </td></tr>
  </table>`
      : ""
  }`;
  const pied = `${c.lienWhatsapp ? `Une question ? <a href="${echapper(c.lienWhatsapp)}" style="color:${BLEU};font-weight:700;">Écrivez-nous sur WhatsApp</a>.<br>` : ""}Vous recevez cet e-mail parce qu'une commande a été passée sur ${echapper(c.site)} avec cette adresse.`;
  const texte = [
    `Merci ${c.prenom} ! Votre ${objet} n°${c.numero} est bien enregistrée. ${suite}`,
    "",
    ...(demandeSeule ? [] : [reglement, ...(c.lienPaiement ? [`Recevoir les coordonnées de paiement : ${c.lienPaiement}`] : []), ""]),
    `Livraison : ${quand}`,
    `${c.adresse.replace(/\s+/g, " ")}, ${c.ville}`,
    "",
    ...(demandeSeule ? [] : [texteDesArticles(c), ""]),
    ...(c.demandeLibre ? [`Votre demande hors catalogue : ${c.demandeLibre.replace(/\s+/g, " ")}`, ""] : []),
    `Suivre ma ${objet} : ${c.lienSuivi}`,
    ...(c.lienEspace ? [`Mon espace client : ${c.lienEspace}`] : []),
    ...(demandeSeule ? [] : ["", "Si un article manque, nous vous prévenons sur WhatsApp et il vous est remboursé."]),
  ].join("\n");
  return {
    sujet: `Votre ${objet} n°${c.numero} est enregistrée — livraison ${c.jour.toLowerCase()}, ${c.creneau}`,
    html: gabarit({
      site: c.site,
      logo: c.logo,
      apercu: demandeSeule ? `Livraison ${quand}` : `Livraison ${quand} · total ${formatPrix(c.totaux.total)}`,
      titre: demandeSeule ? "Demande enregistrée" : "Commande enregistrée",
      corps,
      pied,
    }),
    texte,
  };
}

/** L'e-mail que reçoit le gérant à chaque nouvelle commande. */
export function courrielNouvelleCommande(c: CommandePourCourriel & { lienAdmin: string }): CourrielPret {
  const quand = `${c.jour}, ${c.creneau}`;
  const demande = c.demandeLibre.replace(/\s+/g, " ");
  const corps = `
  <p style="margin:0 0 18px;font-size:16px;line-height:1.5;"><strong>${echapper(c.nomClient)}</strong> · ${echapper(c.ville)} · <strong>${formatPrix(c.totaux.total)}</strong> à recevoir${c.paiement ? ` (${echapper(c.paiement)})` : ""}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SABLE};border-radius:10px;margin:0 0 20px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong>${echapper(quand)}</strong><br>
    ${multiligne(c.adresse)}, ${echapper(c.ville)}<br>
    ${echapper(c.telephone)}
  </td></tr>
  </table>
  <p style="margin:0 0 22px;">${bouton(c.lienAdmin, "Ouvrir la commande")}</p>
  ${c.demandeLibre ? `<p style="margin:0 0 18px;padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:15px;line-height:1.5;"><strong>Demande hors catalogue :</strong> ${multiligne(c.demandeLibre)}</p>` : ""}
  ${c.lignes.length > 0 ? tableauDesArticles(c) : ""}
  ${c.notes ? `<p style="margin:18px 0 0;font-size:14px;color:${DOUX};">Note du client : ${multiligne(c.notes)}</p>` : ""}`;
  return {
    sujet: `Nouvelle commande n°${c.numero} — ${c.ville}, ${c.jour.toLowerCase()} ${c.creneau} — ${formatPrix(c.totaux.total)}`,
    html: gabarit({ site: c.site, logo: c.logo, apercu: `${c.nomClient}, ${c.ville}, ${quand}`, titre: `Nouvelle commande n°${c.numero}`, corps, pied: "E-mail envoyé au gérant à chaque nouvelle commande." }),
    texte: [
      `Nouvelle commande n°${c.numero}`,
      `${c.nomClient} · ${c.telephone}`,
      `${quand}`,
      `${c.adresse.replace(/\s+/g, " ")}, ${c.ville}`,
      "",
      ...(demande ? [`Demande hors catalogue : ${demande}`, ""] : []),
      ...(c.lignes.length > 0 ? [texteDesArticles(c), ""] : []),
      `Ouvrir : ${c.lienAdmin}`,
    ].join("\n"),
  };
}

/** Le lien de connexion à l'espace client, demandé depuis la page de connexion. */
export function courrielDeConnexion(o: { site: string; logo?: string | null; lien: string; minutes: number }): CourrielPret {
  const corps = `
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">Voici votre lien pour ouvrir votre espace client. Il est valable ${o.minutes} minutes.</p>
  <p style="margin:0 0 20px;">${bouton(o.lien, "Ouvrir mon espace")}</p>
  <p style="margin:0;font-size:14px;line-height:1.5;color:${DOUX};">Si vous n'avez rien demandé, ignorez cet e-mail : personne n'entre sans ce lien.</p>`;
  return {
    sujet: `Votre lien de connexion à ${o.site}`,
    html: gabarit({ site: o.site, logo: o.logo, apercu: `Lien valable ${o.minutes} minutes`, titre: "Votre espace client", corps, pied: `Vous recevez cet e-mail parce qu'une connexion à ${echapper(o.site)} a été demandée avec cette adresse.` }),
    texte: `Votre lien pour ouvrir votre espace client (valable ${o.minutes} minutes) :\n${o.lien}\n\nSi vous n'avez rien demandé, ignorez cet e-mail.`,
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
