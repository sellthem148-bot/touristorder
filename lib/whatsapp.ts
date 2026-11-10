/** Numéro saisi (« +33 6 12 34 56 78 », « 054-123-4567 ») → chiffres seuls pour wa.me. */
export function numeroPourWhatsapp(numero: string): string {
  let chiffres = numero.replace(/\D/g, "");
  if (chiffres.startsWith("00")) chiffres = chiffres.slice(2);
  // Un numéro israélien saisi en local (05x…) → indicatif 972.
  if (/^05\d{8}$/.test(chiffres)) chiffres = "972" + chiffres.slice(1);
  // Un numéro français saisi en local (06/07…) → indicatif 33.
  if (/^0[67]\d{8}$/.test(chiffres)) chiffres = "33" + chiffres.slice(1);
  return chiffres;
}

export function lienWhatsapp(numero: string, message: string): string | null {
  const n = numeroPourWhatsapp(numero);
  if (n.length < 8) return null;
  return `https://wa.me/${n}?text=${encodeURIComponent(message)}`;
}
