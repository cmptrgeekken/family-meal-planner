import { spawn } from "node:child_process";
import process from "node:process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const backendDir = path.resolve(scriptDir, "..");
const repoRoot = path.resolve(backendDir, "..");
const composeFilePath = path.join(repoRoot, "docker-compose.yml");
const testDatabaseUrl = "postgresql://mealplanner:mealplanner@localhost:5433/family_meal_planner_test";

function runCommand(command, args, options = {}) {
  const executable = process.platform === "win32" && (command === "npm" || command === "npx") ? "cmd.exe" : command;
  const commandArgs =
    process.platform === "win32" && (command === "npm" || command === "npx")
      ? ["/d", "/s", "/c", `${command}.cmd`, ...args]
      : args;

  return new Promise((resolve, reject) => {
    const child = spawn(executable, commandArgs, {
      cwd: backendDir,
      stdio: "inherit",
      ...options,
    });

    child.on("error", reject);
    child.on("close", (code, signal) => {
      if (signal) {
        reject(new Error(`${command} exited from signal ${signal}`));
        return;
      }

      if (code !== 0) {
        reject(new Error(`${command} exited with code ${code ?? "unknown"}`));
        return;
      }

      resolve();
    });
  });
}

async function main() {
  await runCommand("docker", ["compose", "-f", composeFilePath, "up", "-d", "--wait", "db-test"]);

  const commandEnv = {
    ...process.env,
    TEST_DATABASE_URL: testDatabaseUrl,
    DATABASE_URL: testDatabaseUrl,
  };

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
} finally {
  try {
    await runCommand("docker", ["compose", "-f", composeFilePath, "stop", "db-test"]);
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
