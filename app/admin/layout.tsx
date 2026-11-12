// L'espace gérant reste en français, de gauche à droite, quelle que soit la langue choisie côté client
// (la page entière, elle, suit la langue du visiteur : app/layout.tsx).
export default function LayoutEspaceGerant({ children }: LayoutProps<"/admin">) {
  return (
    <div lang="fr" dir="ltr" className="contents">
      {children}
    </div>
  );
}
