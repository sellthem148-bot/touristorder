// L'adresse de livraison : la rue (ou l'hôtel) et ce qui la précise — étage, appartement ou chambre,
// code d'entrée. Pur : sert au site, à l'espace gérant, aux e-mails.

export type AdresseDetaillee = { adresse: string; etage?: string; appartement?: string; codeEntree?: string };

export type LibellesAdresse = { etage: string; appartement: string; code: string };

// Les libellés du gérant (français) ; côté client, ceux de sa langue (`t.adresse`).
export const LIBELLES_ADRESSE_FR: LibellesAdresse = { etage: "Étage {etage}", appartement: "Appt / chambre {appartement}", code: "Code {code}" };

/** « Étage 3 · Appt / chambre 12 · Code 1234 » ; vide pour une commande d'avant ces champs. */
export function precisionsAdresse(a: AdresseDetaillee, libelles: LibellesAdresse = LIBELLES_ADRESSE_FR): string {
  const etage = (a.etage ?? "").trim();
  const appartement = (a.appartement ?? "").trim();
  const code = (a.codeEntree ?? "").trim();
  return [
    etage ? libelles.etage.replace("{etage}", etage) : "",
    appartement ? libelles.appartement.replace("{appartement}", appartement) : "",
    code ? libelles.code.replace("{code}", code) : "",
  ].filter(Boolean).join(" · ");
}

/** L'adresse entière, sur deux lignes : la rue ou l'hôtel, puis les précisions. */
export function adresseComplete(a: AdresseDetaillee, libelles: LibellesAdresse = LIBELLES_ADRESSE_FR): string {
  return [a.adresse.trim(), precisionsAdresse(a, libelles)].filter(Boolean).join("\n");
}
