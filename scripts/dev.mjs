import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const backendDir = path.join(repoRoot, "backend");
const frontendDir = path.join(repoRoot, "frontend");
const composeFilePath = path.join(repoRoot, "docker-compose.yml");

const defaultDatabaseUrl = "postgresql://mealplanner:mealplanner@localhost:5432/family_meal_planner";
const defaultApiBaseUrl = "http://localhost:3001/api";

const childProcesses = new Set();
let shuttingDown = false;

function getExecutable(command) {
  return process.platform === "win32" && (command === "npm" || command === "npx") ? "cmd.exe" : command;
}

function getArgs(command, args) {
  return process.platform === "win32" && (command === "npm" || command === "npx")
    ? ["/d", "/s", "/c", `${command}.cmd`, ...args]
    : args;
}

function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(getExecutable(command), getArgs(command, args), {
      cwd: repoRoot,
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

function startDevProcess(name, cwd, command, args, env) {
  const child = spawn(getExecutable(command), getArgs(command, args), {
    cwd,
    env,
    stdio: "inherit",
  });

  childProcesses.add(child);
  child.on("close", (code, signal) => {
    childProcesses.delete(child);

    if (!shuttingDown) {
      shuttingDown = true;
      stopDevProcesses();
      const reason = signal ? `signal ${signal}` : `code ${code ?? "unknown"}`;
      console.error(`${name} dev server exited with ${reason}.`);
      process.exitCode = code ?? 1;
    }
  });

  return child;
}

function stopDevProcesses() {
  for (const child of childProcesses) {
    child.kill();
  }
}

function handleShutdown() {
  shuttingDown = true;
  stopDevProcesses();
}

process.on("SIGINT", handleShutdown);
process.on("SIGTERM", handleShutdown);

const devEnv = {
  ...process.env,
  DATABASE_URL: process.env.DATABASE_URL ?? defaultDatabaseUrl,
  VITE_API_BASE_URL: process.env.VITE_API_BASE_URL ?? defaultApiBaseUrl,
};

console.log("Starting PostgreSQL dev database...");
await runCommand("docker", ["compose", "-f", composeFilePath, "up", "-d", "--wait", "db"]);

console.log("Applying database migrations...");
await runCommand("npx", ["prisma", "migrate", "deploy"], {
  cwd: backendDir,
  env: devEnv,
});

console.log("Seeding development data...");
await runCommand("npm", ["run", "prisma:seed"], {
  cwd: backendDir,
  env: devEnv,
});

console.log("Starting API and UI hot-reload servers...");
startDevProcess("Backend", backendDir, "npm", ["run", "dev"], devEnv);
startDevProcess("Frontend", frontendDir, "npm", ["run", "dev"], devEnv);
