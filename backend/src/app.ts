import cors from "cors";
import express from "express";

import { getEnv } from "./config/env.js";
import { RepositoryConflictError } from "./repositories/repository-errors.js";
import { apiRouter } from "./routes/api.js";
import { healthRouter } from "./routes/health.js";
import { HttpError } from "./routes/http-error.js";

export function createApp() {
  const env = getEnv();
  const app = express();

  app.use(
    cors({
      origin: true,
    }),
  );
  app.use(express.json());

  app.get("/", (_request, response) => {
    response.json({
      name: "family-meal-planner-api",
      version: "0.1.0",
      environment: env.nodeEnv,
    });
  });

  app.use("/health", healthRouter);
  app.use("/api", apiRouter);

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    const statusCode =
      error instanceof HttpError ? error.statusCode : error instanceof RepositoryConflictError ? 409 : 500;
    const message = error instanceof Error ? error.message : "Unknown server error";

    response.status(statusCode).json({
      error:
        statusCode === 500
          ? "internal_server_error"
          : statusCode === 409
            ? "conflict"
            : "request_failed",
      message,
      ...(error instanceof RepositoryConflictError && error.field ? { field: error.field } : {}),
    });
  });

  return app;
}
