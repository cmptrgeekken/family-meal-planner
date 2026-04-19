import { Prisma } from "@prisma/client";

import { RepositoryConflictError } from "./repository-errors.js";

export function throwIfUniqueConstraintError(error: unknown, fieldLabelByPath: Record<string, string>) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) {
    throw error;
  }

  if (error.code !== "P2002") {
    throw error;
  }

  const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
  const matchingFieldPath = target.find((entry): entry is string => typeof entry === "string");
  const field = matchingFieldPath ? fieldLabelByPath[matchingFieldPath] ?? matchingFieldPath : undefined;
  const fieldPrefix = field ? `${field} ` : "";

  throw new RepositoryConflictError(`${fieldPrefix}already exists.`, field);
}
