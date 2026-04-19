import { PrismaClient, type Prisma } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __familyMealPlannerPrisma__: PrismaClient | undefined;
}

function getPrismaLogLevels(): Prisma.LogLevel[] {
  switch (process.env.NODE_ENV) {
    case "development":
      return ["warn", "error"];
    case "test":
      return [];
    default:
      return ["error"];
  }
}

export const prisma =
  globalThis.__familyMealPlannerPrisma__ ??
  new PrismaClient({
    log: getPrismaLogLevels(),
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__familyMealPlannerPrisma__ = prisma;
}
