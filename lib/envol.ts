/**
 * L'envol vers le panier : au toucher d'un « + », une pastille (la photo de l'article, sinon un rond au jaune du logo)
 * part de l'endroit touché et file vers le panier — la barre du bas sur téléphone, le panier de l'en-tête
 * sinon (repérés par `data-cible-panier`, components/LienPanier.tsx).
 *
 * Purement décoratif : rien n'en dépend. Il ne fait rien pour qui a demandé moins d'animations à son
 * appareil, ne reçoit aucun toucher, et la pastille se retire toujours (fin du vol, ou minuterie).
 * À n'appeler que dans le navigateur (au toucher d'un bouton).
 */
export function envolVersLePanier(depart: DOMRect | null | undefined, photo?: string | null) {
  if (!depart || typeof document === "undefined" || typeof document.body.animate !== "function") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  // À l'image suivante : au premier article, la barre du panier vient d'être posée en bas de l'écran.
  requestAnimationFrame(() => {
    const affiche = (el: Element | null): el is HTMLElement => el instanceof HTMLElement && el.getClientRects().length > 0;
    const barre = document.querySelector("[data-cible-panier='barre']");
    const entete = document.querySelector("[data-cible-panier='entete']");
    let x: number;
    let y: number;
    if (affiche(barre)) {
      const compteur = (barre.querySelector("[data-compteur]") ?? barre).getBoundingClientRect();
      x = compteur.left + compteur.width / 2;
      // La barre est peut-être encore en train de monter : on vise sa place, au bord bas de l'écran.
      y = window.innerHeight - barre.offsetHeight / 2;
    } else if (affiche(entete)) {
      const r = entete.getBoundingClientRect();
      x = r.left + r.width / 2;
      y = r.top + r.height / 2;
    } else {
      return;
    }

    const TAILLE = 44;
    const dx = x - (depart.left + depart.width / 2);
    const dy = y - (depart.top + depart.height / 2);
    // Deux éléments : le porteur avance de côté à vitesse régulière, la pastille monte un peu puis tombe —
    // ensemble, une courbe (un seul élément ferait deux segments droits).
    const porteur = document.createElement("div");
    porteur.setAttribute("aria-hidden", "true");
    porteur.dataset.envol = "";
    Object.assign(porteur.style, {
      position: "fixed",
      left: `${depart.left + depart.width / 2 - TAILLE / 2}px`,
      top: `${depart.top + depart.height / 2 - TAILLE / 2}px`,
      width: `${TAILLE}px`,
      height: `${TAILLE}px`,
      zIndex: "60",
      pointerEvents: "none",
    });
    const pastille = document.createElement(photo ? "img" : "div");
    if (pastille instanceof HTMLImageElement) {
      pastille.src = photo!;
      pastille.alt = "";
      Object.assign(pastille.style, { width: "100%", height: "100%", objectFit: "contain", background: "#fff", border: "1px solid var(--color-slate-200)", borderRadius: "12px", boxShadow: "0 8px 20px rgb(0 0 0 / 0.18)" });
    } else {
      Object.assign(pastille.style, { width: "26px", height: "26px", margin: "9px", background: "var(--color-soleil)", borderRadius: "9999px", boxShadow: "0 8px 20px rgb(0 0 0 / 0.22)" });
    }
    porteur.appendChild(pastille);
    document.body.appendChild(porteur);

    const DUREE = 620;
    const retirer = () => porteur.remove();
    const saut = Math.min(70, Math.abs(dy) * 0.2 + 26);
    const vol = porteur.animate([{ transform: "translateX(0)" }, { transform: `translateX(${dx}px)` }], { duration: DUREE, easing: "cubic-bezier(0.35, 0, 0.65, 1)" });
    pastille.animate(
      [
        { transform: "translateY(0) scale(0.6)", opacity: 0.4, easing: "cubic-bezier(0.2, 0.8, 0.4, 1)" },
        { transform: `translateY(${-saut}px) scale(1.08)`, opacity: 1, offset: 0.32, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
        { transform: `translateY(${dy}px) scale(0.3)`, opacity: 0.5 },
      ],
      { duration: DUREE },
    );
    vol.onfinish = retirer;
    vol.oncancel = retirer;
    window.setTimeout(retirer, DUREE + 500);
  });
}
