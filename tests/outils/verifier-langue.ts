// Vérifie une traduction contre le français : npx tsx tests/outils/verifier-langue.ts he
import { comparer } from "../../lib/i18n/verifier";

async function main() {
  const code = process.argv[2];
  if (!code) throw new Error("Indique le code de la langue : en, ru, he, es");
  const problemes: string[] = [];
  for (const dossier of ["", "serveur/"]) {
    const reference = (await import(`../../lib/i18n/${dossier}fr.ts`)).default;
    const traduction = (await import(`../../lib/i18n/${dossier}${code}.ts`)).default;
    problemes.push(...comparer(reference, traduction, `${dossier}${code}`));
  }
  if (problemes.length > 0) {
    console.error(problemes.join("\n"));
    console.error(`\n${problemes.length} problème(s).`);
    process.exit(1);
  }
  console.log(`${code} : traduction complète, valeurs et liens identiques au français.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
