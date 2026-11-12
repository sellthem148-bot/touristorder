// L'espace gérant reste en français, de gauche à droite, quelle que soit la langue choisie côté client :
// proxy.ts donne le français à toute adresse « /admin… » (la page entière suit), et ce cadre le garantit.
export default function LayoutEspaceGerant({ children }: LayoutProps<"/admin">) {
  return (
    <div lang="fr" dir="ltr" className="contents">
      {children}
    </div>
  );
}
