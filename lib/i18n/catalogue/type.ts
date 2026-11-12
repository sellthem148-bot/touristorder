// Le catalogue de départ dans une langue : chaque table va du texte français (tel qu'il est dans
// prisma/*.ts, donc dans la base tant que le gérant ne l'a pas réécrit) à sa traduction.
export type TraductionsCatalogue = {
  /** Noms d'articles. */
  noms: Record<string, string>;
  /** Descriptions d'articles. */
  descriptions: Record<string, string>;
  /** Noms des options (« Taille », « Couleur »). */
  groupes: Record<string, string>;
  /** Choix des options (« 2 ans », « Garçon »). */
  choix: Record<string, string>;
  /** Villes livrées. */
  villes: Record<string, string>;
  /** Noms des tarifs selon le moment (« Week-end »). */
  tarifs: Record<string, string>;
  /** Ce que montrent les photos libres de droits de la page des crédits (« Tomates »). */
  sujets: Record<string, string>;
};
