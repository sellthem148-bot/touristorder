import { PrismaClient } from "@prisma/client";
import { adresseDeLaBase } from "./adresses-base";

// Un seul client par processus (le rechargement à chaud de `next dev`
// en créerait un à chaque modification).
const globale = globalThis as unknown as { prisma?: PrismaClient };

// L'adresse vient de DATABASE_URL, ou de ce que l'intégration Supabase de Vercel pose (lib/adresses-base.ts).
const adresse = adresseDeLaBase();

export const prisma = globale.prisma ?? new PrismaClient(adresse ? { datasourceUrl: adresse } : undefined);

if (process.env.NODE_ENV !== "production") globale.prisma = prisma;
