import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __familyMealPlannerPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__familyMealPlannerPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__familyMealPlannerPrisma__ = prisma;
}
