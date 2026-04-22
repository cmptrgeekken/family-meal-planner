import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { runCommand, runCompose } from "../../scripts/docker-compose.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(backendDir, "..");
const composeFilePath = path.join(repoRoot, "docker-compose.yml");
const testDatabaseUrl = "postgresql://mealplanner:mealplanner@localhost:5433/family_meal_planner_test";
let testDatabaseStarted = false;

async function main() {
  await runCompose(["-f", composeFilePath, "up", "-d", "--wait", "db-test"], { cwd: backendDir });
  testDatabaseStarted = true;

  const commandEnv = {
    ...process.env,
    TEST_DATABASE_URL: testDatabaseUrl,
    DATABASE_URL: testDatabaseUrl,
  };

  await runCommand("npx", ["prisma", "generate"], { env: commandEnv });
  await runCommand("npx", ["prisma", "migrate", "deploy"], { env: commandEnv });
  await runCommand("npm", ["run", "prisma:seed"], { env: commandEnv });

  const vitestEnv = {
    ...process.env,
    TEST_DATABASE_URL: testDatabaseUrl,
  };

  const vitestArgs = process.argv.slice(2);
  const args = vitestArgs.length > 0 ? ["vitest", ...vitestArgs] : ["vitest", "run"];
  await runCommand("npx", args, { env: vitestEnv });
}

try {
  await main();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  if (testDatabaseStarted) {
    try {
      await runCompose(["-f", composeFilePath, "stop", "db-test"], { cwd: backendDir });
    } catch (error) {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    }
  }
}
