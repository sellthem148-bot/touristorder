// L'adresse de livraison : où le client loge (appartement, maison, hôtel), la rue ou l'hôtel, et ce qui
// la précise — étage, appartement ou chambre, code d'entrée. Pur : sert au site, à l'espace gérant, aux e-mails.

/** Où le client loge. À l'hôtel, on ne monte pas dans les chambres : on l'appelle et il descend chercher sa commande. */
export const LOGEMENTS = ["APPARTEMENT", "MAISON", "HOTEL"] as const;
export type Logement = (typeof LOGEMENTS)[number];

export function estLogement(x: unknown): x is Logement {
  return typeof x === "string" && (LOGEMENTS as readonly string[]).includes(x);
}

export type AdresseDetaillee = { adresse: string; logement?: string; etage?: string; appartement?: string; codeEntree?: string };

export type LibellesAdresse = {
  etage: string; // « Étage {etage} »
  appartement: string; // « Appt / chambre {appartement} »
  code: string; // « Code {code} »
  maison: string;
  hotel: string;
  chambre: string; // « Chambre {chambre} »
  remiseHotel: string; // comment la commande est remise à l'hôtel
};

// Les libellés du gérant (français) ; côté client, ceux de sa langue (`t.adresse`).
export const LIBELLES_ADRESSE_FR: LibellesAdresse = {
  etage: "Étage {etage}",
  appartement: "Appt / chambre {appartement}",
  code: "Code {code}",
  maison: "Maison",
  hotel: "Hôtel",
  chambre: "Chambre {chambre}",
  remiseHotel: "Ne pas monter : appeler le client, il descend chercher sa commande",
};

/**
 * Ce qui précise l'adresse, sur une ligne : « Étage 3 · Appt / chambre 12 · Code 1234 », « Maison »,
 * « Hôtel · Chambre 512 · … ». Vide pour une commande d'avant ces champs.
 */
export function precisionsAdresse(a: AdresseDetaillee, libelles: LibellesAdresse = LIBELLES_ADRESSE_FR): string {
  const etage = (a.etage ?? "").trim();
  const appartement = (a.appartement ?? "").trim();
  const code = (a.codeEntree ?? "").trim();
  const leCode = code ? libelles.code.replace("{code}", code) : "";
  if (a.logement === "HOTEL") {
    return [libelles.hotel, appartement ? libelles.chambre.replace("{chambre}", appartement) : "", libelles.remiseHotel].filter(Boolean).join(" · ");
  }
  if (a.logement === "MAISON") return [libelles.maison, leCode].filter(Boolean).join(" · ");
  return [
    etage ? libelles.etage.replace("{etage}", etage) : "",
    appartement ? libelles.appartement.replace("{appartement}", appartement) : "",
    leCode,
  ].filter(Boolean).join(" · ");
}

/** L'adresse entière, sur deux lignes : la rue ou l'hôtel, puis les précisions. */
export function adresseComplete(a: AdresseDetaillee, libelles: LibellesAdresse = LIBELLES_ADRESSE_FR): string {
  return [a.adresse.trim(), precisionsAdresse(a, libelles)].filter(Boolean).join("\n");
}
