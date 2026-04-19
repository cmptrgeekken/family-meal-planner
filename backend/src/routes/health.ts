import { Router } from "express";

import { getEnv } from "../config/env.js";

export const healthRouter = Router();

healthRouter.get("/", (_request, response) => {
  const env = getEnv();

  response.json({
    status: "ok",
    environment: env.nodeEnv,
    databaseConfigured: Boolean(env.databaseUrl),
  });
});
