import path from "node:path";
import { fileURLToPath } from "node:url";
import { runCompose } from "./docker-compose.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..");
const composeFilePath = path.join(repoRoot, "docker-compose.yml");

try {
  await runCompose(["-f", composeFilePath, "up", "-d", "--wait", "db"], { cwd: repoRoot });
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
