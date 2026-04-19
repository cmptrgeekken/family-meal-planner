import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3001),
  DATABASE_URL: z
    .string()
    .url()
    .or(z.string().startsWith("postgresql://"))
    .default("postgresql://mealplanner:mealplanner@localhost:5432/family_meal_planner"),
});

export type AppEnv = {
  nodeEnv: "development" | "test" | "production";
  port: number;
  databaseUrl: string;
};

let cachedEnv: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cachedEnv) {
    return cachedEnv;
  }

  const parsed = envSchema.parse(process.env);

  cachedEnv = {
    nodeEnv: parsed.NODE_ENV,
    port: parsed.PORT,
    databaseUrl: parsed.DATABASE_URL,
  };

  return cachedEnv;
}
