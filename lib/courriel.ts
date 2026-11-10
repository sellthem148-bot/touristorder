import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NOM_DU_SITE } from "./marque";

// L'envoi des e-mails : un seul chemin (Resend, par son API HTTP).
// - Ne lève jamais : une commande enregistrée ne doit pas échouer parce qu'un e-mail n'est pas parti.
// - Les journaux ne contiennent ni l'adresse, ni le contenu (seulement le sujet et le résultat).
// - En développement, sans clé Resend, l'e-mail est écrit dans le dossier .courriels/
//   pour le relire dans un navigateur ; en production, sans clé, rien ne part (et c'est dit).

export type Courriel = { a: string; sujet: string; html: string; texte: string };
export type ResultatEnvoi = { ok: true } | { ok: false; raison: string };

/** Un sujet ne contient jamais de saut de ligne (injection d'en-tête). */
export function sujetSur(sujet: string): string {
  return sujet.replace(/[\r\n]+/g, " ").trim().slice(0, 200);
}

function expediteur(): string {
  return process.env.EMAIL_EXPEDITEUR || `${NOM_DU_SITE} <onboarding@resend.dev>`;
}

export async function envoyerCourriel(c: Courriel): Promise<ResultatEnvoi> {
  const sujet = sujetSur(c.sujet);
  const cle = process.env.RESEND_API_KEY;

  if (!cle) {
    if (process.env.NODE_ENV === "production") {
      console.error(`[courriel] non envoyé (RESEND_API_KEY absente) : ${sujet}`);
      return { ok: false, raison: "Envoi d'e-mails non configuré." };
    }
    try {
      const dossier = path.join(process.cwd(), ".courriels");
      await mkdir(dossier, { recursive: true });
      const nom = `${Date.now()}-${sujet.replace(/[^a-zA-Z0-9À-ÿ]+/g, "-").slice(0, 60)}`;
      await writeFile(path.join(dossier, `${nom}.html`), `<!-- À : ${c.a} | Sujet : ${sujet} -->\n${c.html}`);
      await writeFile(path.join(dossier, `${nom}.txt`), `À : ${c.a}\nSujet : ${sujet}\n\n${c.texte}`);
      console.log(`[courriel] (développement) écrit dans .courriels/${nom}.html`);
    } catch {
      // Le dossier de développement n'est qu'un confort.
    }
    return { ok: true };
  }

  try {
    const reponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${cle}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: expediteur(), to: [c.a], subject: sujet, html: c.html, text: c.texte }),
      signal: AbortSignal.timeout(8000),
    });
    if (!reponse.ok) {
      console.error(`[courriel] refusé par Resend (${reponse.status}) : ${sujet}`);
      return { ok: false, raison: `Refusé par le service d'envoi (${reponse.status}).` };
    }
    return { ok: true };
  } catch (e) {
    console.error(`[courriel] échec d'envoi (${e instanceof Error ? e.name : "erreur"}) : ${sujet}`);
    return { ok: false, raison: "Le service d'envoi ne répond pas." };
  }
}
