import { Router } from "express";

import { getEnv } from "../config/env.js";
import { prisma } from "../config/prisma.js";
import { asyncHandler } from "./async-handler.js";

export const healthRouter = Router();

healthRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
  const env = getEnv();
  await prisma.$queryRaw`SELECT 1`;

  response.json({
    status: "ok",
    environment: env.nodeEnv,
    databaseConfigured: Boolean(env.databaseUrl),
    databaseReachable: true,
  });
  }),
);
