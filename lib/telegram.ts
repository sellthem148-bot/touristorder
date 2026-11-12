// L'alerte Telegram : un message sur le téléphone du gérant à chaque nouvelle commande.
// Ne lève jamais (une commande ne doit pas échouer parce que Telegram ne répond pas)
// et n'écrit jamais le jeton du robot dans un journal.
import { formatPrix } from "./argent";

// L'adresse de l'API de Telegram. TELEGRAM_API ne sert qu'aux parcours de test (un faux Telegram local).
const API = (process.env.TELEGRAM_API || "https://api.telegram.org").replace(/\/$/, "");
const DELAI_MS = 6000;

/** La forme d'un jeton de robot Telegram, tel que @BotFather le donne (« 123456789:AA… »). */
export function estJetonTelegram(t: string): boolean {
  return /^\d{6,12}:[A-Za-z0-9_-]{30,60}$/.test(t);
}

export type AlerteCommande = {
  numero: number;
  /** La référence que le client cite (« BC-58100 »). */
  reference?: string;
  nomClient: string;
  ville: string;
  jour: string;
  creneau: string;
  total: number;
  paiement: string;
  nombreArticles: number;
  demandeLibre: string;
  lienAdmin: string;
};

/** Le texte de l'alerte (pur). Du texte brut : aucun balisage, donc rien à échapper. */
export function texteDeLAlerte(c: AlerteCommande): string {
  const demande = c.demandeLibre.replace(/\s+/g, " ").trim();
  return [
    `Nouvelle commande n°${c.numero}${c.reference ? ` · réf. ${c.reference}` : ""}`,
    `${c.nomClient} · ${c.ville}`,
    `${c.jour}, ${c.creneau}`,
    c.nombreArticles > 0
      ? `${c.nombreArticles} article${c.nombreArticles > 1 ? "s" : ""} · ${formatPrix(c.total)} à recevoir${c.paiement ? ` (${c.paiement})` : ""}`
      : "Aucun article du catalogue",
    ...(demande ? [`Demande hors catalogue : ${demande.length > 300 ? `${demande.slice(0, 300)}…` : demande}`] : []),
    c.lienAdmin,
  ].join("\n");
}

type Reponse = { ok: true; resultat: unknown } | { ok: false; raison: string };

async function appeler(jeton: string, methode: string, corps?: Record<string, unknown>): Promise<Reponse> {
  if (!estJetonTelegram(jeton)) return { ok: false, raison: "jeton invalide" };
  try {
    const r = await fetch(`${API}/bot${jeton}/${methode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corps ?? {}),
      signal: AbortSignal.timeout(DELAI_MS),
      cache: "no-store",
    });
    const donnees = (await r.json().catch(() => null)) as { ok?: boolean; result?: unknown; description?: string } | null;
    if (r.ok && donnees?.ok) return { ok: true, resultat: donnees.result };
    // La description de Telegram ne contient pas le jeton ; l'adresse appelée, si : on ne la journalise pas.
    return { ok: false, raison: `${r.status} ${String(donnees?.description ?? "").slice(0, 120)}`.trim() };
  } catch (e) {
    return { ok: false, raison: e instanceof Error ? e.name : "erreur" };
  }
}

/** Le robot que ce jeton désigne, ou rien si Telegram ne le reconnaît pas. */
export async function robotTelegram(jeton: string): Promise<{ nom: string } | null> {
  const r = await appeler(jeton, "getMe");
  if (!r.ok) return null;
  const robot = r.resultat as { username?: unknown } | null;
  return { nom: typeof robot?.username === "string" ? robot.username : "" };
}

/** La discussion du dernier message reçu par le robot : celle du gérant, qui vient de lui écrire. */
export async function derniereDiscussion(jeton: string): Promise<{ id: string; nom: string } | null> {
  // offset négatif : les derniers messages reçus par le robot (sans lui, Telegram rend les plus anciens d'abord).
  const r = await appeler(jeton, "getUpdates", { offset: -20, limit: 20, allowed_updates: ["message"] });
  if (!r.ok || !Array.isArray(r.resultat)) return null;
  for (const maj of [...r.resultat].reverse()) {
    const chat = (maj as { message?: { chat?: { id?: unknown; first_name?: unknown; title?: unknown; username?: unknown } } })?.message?.chat;
    if (chat && (typeof chat.id === "number" || typeof chat.id === "string")) {
      const nom = [chat.first_name, chat.title, chat.username].find((x) => typeof x === "string" && x.length > 0);
      return { id: String(chat.id), nom: typeof nom === "string" ? nom.slice(0, 80) : "" };
    }
  }
  return null;
}

/** Envoie un message dans la discussion reliée. Vrai si Telegram l'a accepté. */
export async function envoyerTelegram(jeton: string, discussion: string, texte: string): Promise<boolean> {
  if (!jeton || !discussion) return false;
  const r = await appeler(jeton, "sendMessage", { chat_id: discussion, text: texte.slice(0, 3500), disable_web_page_preview: true });
  if (!r.ok) console.error(`[telegram] message refusé : ${r.raison}`);
  return r.ok;
}
