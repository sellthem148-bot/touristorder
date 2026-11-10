import { PrismaClient } from "@prisma/client";

// Un seul client par processus (le rechargement à chaud de `next dev`
// en créerait un à chaque modification).
const globale = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globale.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globale.prisma = prisma;
