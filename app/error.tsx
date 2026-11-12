"use client";

import { useEffect, useSyncExternalStore } from "react";

// Les quatre textes de cette page, dans les cinq langues : elle s'affiche hors de la boutique
// (sans le dictionnaire du serveur), et lit la langue de la page sur <html lang>.
const TEXTES: Record<string, { surtitre: string; titre: string; texte: string; reessayer: string }> = {
  fr: { surtitre: "Erreur", titre: "Petit souci de notre côté", texte: "Le site ne répond pas comme il devrait. Réessayez dans un instant : votre panier est gardé sur votre téléphone.", reessayer: "Réessayer" },
  en: { surtitre: "Error", titre: "Something went wrong on our side", texte: "The site is not responding as it should. Please try again in a moment: your cart is saved on your phone.", reessayer: "Try again" },
  ru: { surtitre: "Ошибка", titre: "Небольшой сбой с нашей стороны", texte: "Сайт отвечает не так, как должен. Попробуйте ещё раз через минуту: ваша корзина сохранена на телефоне.", reessayer: "Повторить" },
  he: { surtitre: "שגיאה", titre: "תקלה קטנה אצלנו", texte: "האתר אינו מגיב כראוי. נסו שוב בעוד רגע: סל הקניות שלכם שמור בטלפון.", reessayer: "לנסות שוב" },
  es: { surtitre: "Error", titre: "Un pequeño problema por nuestra parte", texte: "El sitio no responde como debería. Inténtelo de nuevo en un momento: su carrito queda guardado en su teléfono.", reessayer: "Reintentar" },
};

const sansAbonnement = () => () => {};

// Une panne (base injoignable, erreur inattendue) : une page à nous, jamais l'écran d'erreur brut.
export default function Erreur({ error, retry }: { error: unknown; retry: () => void }) {
  // La langue de la page, lue sur <html lang> (le serveur l'a posée ; elle ne change pas sans rechargement).
  const langue = useSyncExternalStore(sansAbonnement, () => document.documentElement.lang, () => "fr");
  useEffect(() => {
    console.error(error);
  }, [error]);
  const t = TEXTES[langue] ?? TEXTES.fr;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <p className="surtitre">{t.surtitre}</p>
      <h1 className="text-2xl font-bold">{t.titre}</h1>
      <p className="text-slate-600">{t.texte}</p>
      <button type="button" onClick={() => retry()} className="bouton px-6 py-3">{t.reessayer}</button>
    </main>
  );
}
