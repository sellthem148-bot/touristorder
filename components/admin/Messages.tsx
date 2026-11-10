type Params = Record<string, string | string[] | undefined>;

const un = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";

/** Le message laissé par une action dans l'adresse (?ok=… ou ?erreur=…). */
export function Messages({ params }: { params: Params }) {
  const ok = un(params.ok).slice(0, 300);
  const erreur = un(params.erreur).slice(0, 300);
  if (!ok && !erreur) return null;
  return erreur ? (
    <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-800">{erreur}</p>
  ) : (
    <p role="status" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900">{ok}</p>
  );
}
