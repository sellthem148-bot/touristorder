// Les e-mails du site : le texte et la mise en page, en fonctions pures
// (testables, sans réseau). L'envoi lui-même est dans lib/courriel.ts.
// Tout ce qui vient d'un client ou du catalogue passe par `echapper`.
import { formatPrix } from "./argent";
import type { Totaux } from "./calcul";
import { LIBELLES_MONTANTS_FR, lignesDeMontants, type LibellesMontants, type PresentationMontants } from "./montants";
import { jourDansPhrase, LOCALE, NOM_DE_LA_LANGUE, remplir, sens, type Langue } from "./langues";
import frServeur, { type DictionnaireServeur } from "./i18n/serveur/fr";

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
function bandeau(site: string, logo?: string | null, droiteAGauche = false): string {
  const nom = `font-size:18px;font-weight:700;letter-spacing:-0.01em;color:#ffffff;font-family:${POLICE};`;
  if (!logo) return `<span style="${nom}">${echapper(site)}</span>`;
  return `<table role="presentation" cellpadding="0" cellspacing="0"><tr>
    <td style="padding:${droiteAGauche ? "0 0 0 12px" : "0 12px 0 0"};line-height:0;"><img src="${echapper(logo)}" width="36" height="36" alt="" style="display:block;border:0;border-radius:9px;"></td>
    <td style="${nom}">${echapper(site)}</td>
  </tr></table>`;
}

/** La langue d'un e-mail au client : ses textes et les libellés des montants. */
export type LangueDuCourriel = {
  langue: Langue;
  c: DictionnaireServeur["courriel"];
  montants: LibellesMontants;
};

// Le français : la langue du gérant (son avis de commande) et celle par défaut.
export const COURRIEL_FR: LangueDuCourriel = { langue: "fr", c: frServeur.courriel, montants: LIBELLES_MONTANTS_FR };

/** « : » — avec une espace devant en français seulement. */
const deuxPoints = (langue: Langue) => (langue === "fr" ? " : " : ": ");

/** La mise en page commune : bandeau à la marque, carte blanche, pied. En hébreu, tout s'écrit de droite à gauche. */
function gabarit(o: { site: string; logo?: string | null; apercu: string; titre: string; corps: string; pied: string; langue?: Langue }): string {
  const langue = o.langue ?? "fr";
  return `<!doctype html>
<html lang="${langue}" dir="${sens(langue)}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${echapper(o.titre)}</title></head>
<body style="margin:0;padding:0;background:${FOND};font-family:${POLICE};color:${ENCRE};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${echapper(o.apercu)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${FOND};">
<tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" dir="${sens(langue)}" style="max-width:600px;">
<tr><td style="background:${ENCRE};border-radius:14px 14px 0 0;padding:18px 28px;">
  ${bandeau(o.site, o.logo, sens(langue) === "rtl")}
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
  numero: number; // pour le gérant seulement
  reference: string; // ce que le client lit : « BC-58100 » (lib/reference.ts)
  nomClient: string;
  prenom: string;
  telephone: string;
  ville: string;
  adresse: string; // l'adresse entière (lib/adresse.ts) : rue ou hôtel, puis étage, appartement, code
  jour: string; // « Aujourd'hui », « Demain », « Jeudi 12 novembre » — dans la langue de l'e-mail
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

function tableauDesArticles(c: CommandePourCourriel, l: LangueDuCourriel): string {
  // Les montants s'alignent du côté où la ligne finit : à droite, à gauche en hébreu.
  const fin = sens(l.langue) === "rtl" ? "left" : "right";
  const lignes = c.lignes
    .map(
      (x) => `<tr>
  <td style="padding:10px 0;border-bottom:1px solid ${TRAIT};font-size:15px;">
    <strong>${x.quantite} ×</strong> ${echapper(x.nom)}${x.options ? `<br><span style="font-size:13px;color:${DOUX};">${echapper(x.options)}</span>` : ""}
  </td>
  <td align="${fin}" style="padding:10px 0;border-bottom:1px solid ${TRAIT};font-size:15px;white-space:nowrap;vertical-align:top;">${formatPrix(x.prixUnitaire * x.quantite, l.langue)}</td>
</tr>`,
    )
    .join("");
  const montants = lignesDeMontants(c.totaux, c.presentation, l.montants)
    .map(
      (m) => `<tr><td style="padding:4px 0;font-size:14px;color:${DOUX};">${echapper(m.libelle)}</td><td align="${fin}" style="padding:4px 0;font-size:14px;white-space:nowrap;">${formatPrix(m.montant, l.langue)}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lignes}
<tr><td colspan="2" style="height:10px;"></td></tr>${montants}
<tr><td style="padding:12px 0 0;font-size:18px;font-weight:800;border-top:2px solid ${ENCRE};">${echapper(l.c.totalAPayer)}</td><td align="${fin}" style="padding:12px 0 0;font-size:18px;font-weight:800;border-top:2px solid ${ENCRE};white-space:nowrap;">${formatPrix(c.totaux.total, l.langue)}</td></tr>
</table>`;
}

function texteDesArticles(c: CommandePourCourriel, l: LangueDuCourriel): string {
  const dp = deuxPoints(l.langue);
  return [
    ...c.lignes.map((x) => `- ${x.quantite} × ${x.nom}${x.options ? ` (${x.options})` : ""}${dp}${formatPrix(x.prixUnitaire * x.quantite, l.langue)}`),
    "",
    ...lignesDeMontants(c.totaux, c.presentation, l.montants).map((m) => `${m.libelle}${dp}${formatPrix(m.montant, l.langue)}`),
    `${l.c.totalAPayer.toLocaleUpperCase(LOCALE[l.langue])}${dp}${formatPrix(c.totaux.total, l.langue)}`,
  ].join("\n");
}

// Une marque qu'aucun texte ne contient : la place du numéro, mis en gras après l'échappement.
const PLACE = "\u0000";

/** L'e-mail que reçoit le client quand sa commande est enregistrée, dans sa langue. */
export function courrielDeConfirmation(c: CommandePourCourriel, l: LangueDuCourriel = COURRIEL_FR): CourrielPret {
  const t = l.c;
  const dp = deuxPoints(l.langue);
  const quand = `${c.jour}, ${c.creneau}`;
  const total = formatPrix(c.totaux.total, l.langue);
  // Une demande d'article hors catalogue, sans article du catalogue : rien à régler pour l'instant.
  const demandeSeule = c.lignes.length === 0;
  const par = c.paiement ? remplir(t.par, { mode: c.paiement }) : "";
  const reglement = remplir(t.reglement, { montant: total, par });
  const suite = demandeSeule ? t.suiteDemande : t.suiteCommande;
  const merci = demandeSeule ? t.merciDemande : t.merciCommande;
  const suivre = demandeSeule ? t.suivreDemande : t.suivreCommande;
  const corps = `
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">${echapper(remplir(merci, { prenom: c.prenom, reference: PLACE })).replace(PLACE, `<strong>${echapper(c.reference)}</strong>`)} ${echapper(suite)}</p>
  ${
    demandeSeule
      ? ""
      : `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${TRAIT};border-radius:10px;margin:0 0 16px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${DOUX};">${echapper(t.paiementTitre)}</strong><br>
    ${echapper(reglement)}
    ${c.lienPaiement ? `<p style="margin:12px 0 0;">${bouton(c.lienPaiement, t.recevoirCoordonnees, false)}</p>` : ""}
  </td></tr>
  </table>`
  }
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SABLE};border-radius:10px;margin:0 0 22px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong style="font-size:13px;letter-spacing:0.06em;text-transform:uppercase;color:${DOUX};">${echapper(t.livraisonTitre)}</strong><br>
    <strong>${echapper(quand)}</strong><br>
    ${multiligne(c.adresse)}, ${echapper(c.ville)}
  </td></tr>
  </table>

  <p style="margin:0 0 22px;">${bouton(c.lienSuivi, suivre)}</p>

  ${demandeSeule ? "" : `<h2 style="margin:0 0 6px;font-size:17px;font-weight:800;">${echapper(t.votreCommande)}</h2>
  ${tableauDesArticles(c, l)}`}
  ${c.demandeLibre ? `<p style="margin:18px 0 0;font-size:14px;line-height:1.55;"><strong>${echapper(t.demandeHorsCatalogue)}</strong> ${multiligne(c.demandeLibre)}<br><span style="color:${DOUX};">${echapper(t.demandeAide)}</span></p>` : ""}
  ${c.notes ? `<p style="margin:18px 0 0;font-size:14px;color:${DOUX};">${echapper(t.votreNote)} ${multiligne(c.notes)}</p>` : ""}

  ${demandeSeule ? "" : `<p style="margin:22px 0 0;font-size:14px;line-height:1.55;color:${DOUX};">${echapper(t.siManque)}</p>`}
  ${
    c.lienEspace
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border:1px solid ${TRAIT};border-radius:10px;">
  <tr><td style="padding:16px 18px;">
    <strong style="font-size:15px;">${echapper(t.espaceTitre)}</strong>
    <p style="margin:4px 0 12px;font-size:14px;line-height:1.5;color:${DOUX};">${echapper(t.espaceTexte)}</p>
    ${bouton(c.lienEspace, t.ouvrirEspace, false)}
  </td></tr>
  </table>`
      : ""
  }`;
  const pied = `${c.lienWhatsapp ? `${echapper(t.question)} <a href="${echapper(c.lienWhatsapp)}" style="color:${BLEU};font-weight:700;">${echapper(t.ecrivezNous)}</a>.<br>` : ""}${echapper(remplir(t.raisonCommande, { site: c.site }))}`;
  const texte = [
    `${remplir(merci, { prenom: c.prenom, reference: c.reference })} ${suite}`,
    "",
    ...(demandeSeule ? [] : [reglement, ...(c.lienPaiement ? [`${t.recevoirCoordonnees}${dp}${c.lienPaiement}`] : []), ""]),
    `${t.livraisonTitre}${dp}${quand}`,
    `${c.adresse.replace(/\s+/g, " ")}, ${c.ville}`,
    "",
    ...(demandeSeule ? [] : [texteDesArticles(c, l), ""]),
    ...(c.demandeLibre ? [`${t.demandeHorsCatalogue} ${c.demandeLibre.replace(/\s+/g, " ")}`, ""] : []),
    `${suivre}${dp}${c.lienSuivi}`,
    ...(c.lienEspace ? [`${t.monEspace}${dp}${c.lienEspace}`] : []),
    ...(demandeSeule ? [] : ["", t.siManque]),
  ].join("\n");
  const jour = jourDansPhrase(c.jour, l.langue);
  return {
    sujet: remplir(demandeSeule ? t.sujetDemande : t.sujetCommande, { reference: c.reference, jour, creneau: c.creneau }),
    html: gabarit({
      site: c.site,
      logo: c.logo,
      apercu: demandeSeule ? remplir(t.apercuDemande, { quand }) : remplir(t.apercuCommande, { quand, total }),
      titre: demandeSeule ? t.titreDemande : t.titreCommande,
      corps,
      pied,
      langue: l.langue,
    }),
    texte,
  };
}

/** L'e-mail que reçoit le gérant à chaque nouvelle commande (toujours en français). */
export function courrielNouvelleCommande(c: CommandePourCourriel & { lienAdmin: string; langueClient?: Langue }): CourrielPret {
  const quand = `${c.jour}, ${c.creneau}`;
  const demande = c.demandeLibre.replace(/\s+/g, " ");
  // La langue du client, quand ce n'est pas le français : le gérant sait dans quelle langue lui écrire.
  const langue = c.langueClient && c.langueClient !== "fr" ? NOM_DE_LA_LANGUE[c.langueClient] : "";
  const corps = `
  <p style="margin:0 0 18px;font-size:16px;line-height:1.5;"><strong>${echapper(c.nomClient)}</strong> · ${echapper(c.ville)} · <strong>${formatPrix(c.totaux.total)}</strong> à recevoir${c.paiement ? ` (${echapper(c.paiement)})` : ""}</p>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${SABLE};border-radius:10px;margin:0 0 20px;">
  <tr><td style="padding:16px 18px;font-size:15px;line-height:1.55;">
    <strong>${echapper(quand)}</strong><br>
    ${multiligne(c.adresse)}, ${echapper(c.ville)}<br>
    ${echapper(c.telephone)}${langue ? `<br>Langue du client : ${echapper(langue)}` : ""}
  </td></tr>
  </table>
  <p style="margin:0 0 22px;">${bouton(c.lienAdmin, "Ouvrir la commande")}</p>
  ${c.demandeLibre ? `<p style="margin:0 0 18px;padding:12px 14px;background:#fffbeb;border:1px solid #fde68a;border-radius:10px;font-size:15px;line-height:1.5;"><strong>Demande hors catalogue :</strong> ${multiligne(c.demandeLibre)}</p>` : ""}
  ${c.lignes.length > 0 ? tableauDesArticles(c, COURRIEL_FR) : ""}
  ${c.notes ? `<p style="margin:18px 0 0;font-size:14px;color:${DOUX};">Note du client : ${multiligne(c.notes)}</p>` : ""}`;
  return {
    sujet: `Nouvelle commande n°${c.numero} (${c.reference}) — ${c.ville}, ${c.jour.toLowerCase()} ${c.creneau} — ${formatPrix(c.totaux.total)}`,
    html: gabarit({ site: c.site, logo: c.logo, apercu: `${c.nomClient}, ${c.ville}, ${quand}`, titre: `Nouvelle commande n°${c.numero} · réf. ${c.reference}`, corps, pied: "E-mail envoyé au gérant à chaque nouvelle commande." }),
    texte: [
      `Nouvelle commande n°${c.numero} · réf. ${c.reference}`,
      `${c.nomClient} · ${c.telephone}`,
      `${quand}`,
      `${c.adresse.replace(/\s+/g, " ")}, ${c.ville}`,
      ...(langue ? [`Langue du client : ${langue}`] : []),
      "",
      ...(demande ? [`Demande hors catalogue : ${demande}`, ""] : []),
      ...(c.lignes.length > 0 ? [texteDesArticles(c, COURRIEL_FR), ""] : []),
      `Ouvrir : ${c.lienAdmin}`,
    ].join("\n"),
  };
}

/** Le lien de connexion à l'espace client, demandé depuis la page de connexion (dans la langue du site). */
export function courrielDeConnexion(
  o: { site: string; logo?: string | null; lien: string; minutes: number },
  t: DictionnaireServeur["courriel"] = frServeur.courriel,
  langue: Langue = "fr",
): CourrielPret {
  const corps = `
  <p style="margin:0 0 20px;font-size:16px;line-height:1.5;">${echapper(remplir(t.connexionCorps, { minutes: o.minutes }))}</p>
  <p style="margin:0 0 20px;">${bouton(o.lien, t.ouvrirEspace)}</p>
  <p style="margin:0;font-size:14px;line-height:1.5;color:${DOUX};">${echapper(t.connexionIgnorer)}</p>`;
  return {
    sujet: remplir(t.connexionSujet, { site: o.site }),
    html: gabarit({
      site: o.site, logo: o.logo, apercu: remplir(t.connexionApercu, { minutes: o.minutes }), titre: t.connexionTitre, corps,
      pied: echapper(remplir(t.connexionRaison, { site: o.site })), langue,
    }),
    texte: `${remplir(t.connexionTexte, { minutes: o.minutes })}\n${o.lien}\n\n${t.connexionTexteIgnorer}`,
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
