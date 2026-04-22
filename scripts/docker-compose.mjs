import { spawn } from "node:child_process";
import process from "node:process";

export function getExecutable(command) {
  return process.platform === "win32" && (command === "npm" || command === "npx") ? "cmd.exe" : command;
}

export function getArgs(command, args) {
  return process.platform === "win32" && (command === "npm" || command === "npx")
    ? ["/d", "/s", "/c", `${command}.cmd`, ...args]
    : args;
}

export function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(getExecutable(command), getArgs(command, args), {
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

function runCommandCapture(command, args, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(getExecutable(command), getArgs(command, args), {
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (chunk) => {
      stdout += chunk;
    });

    child.stderr?.on("data", (chunk) => {
      stderr += chunk;
    });

    child.on("error", (error) => {
      resolve({ code: 1, stdout, stderr: error.message });
    });

    child.on("close", (code) => {
      resolve({ code: code ?? 1, stdout, stderr });
    });
  });
}

async function commandSucceeds(command, args, options = {}) {
  try {
    await runCommand(command, args, {
      ...options,
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
}

export async function resolveComposeCommand(options = {}) {
  if (await commandSucceeds("docker", ["compose", "version"], options)) {
    return { command: "docker", args: ["compose"] };
  }

  if (await commandSucceeds("docker-compose", ["version"], options)) {
    return { command: "docker-compose", args: [] };
  }

  throw new Error(
    [
      "Docker Compose is required for local development, but neither `docker compose` nor `docker-compose` is available.",
      "On Fedora, install the Compose plugin with `sudo dnf install docker-compose-plugin`, then rerun the command.",
    ].join("\n"),
  );
}

async function verifyDockerAccess(options = {}) {
  const result = await runCommandCapture("docker", ["info"], options);

  if (result.code === 0) {
    return;
  }

  const output = `${result.stdout}\n${result.stderr}`;

  if (output.includes("/var/run/docker.sock") || output.includes("permission denied")) {
    throw new Error(
      [
        "Docker is installed, but this user cannot access the Docker daemon.",
        "Your `sudo docker run hello-world` succeeded because root has access; `npm run dev` runs as your normal user.",
        "On Fedora, add your user to the Docker group with `sudo usermod -aG docker $USER`, then log out and back in or run `newgrp docker`.",
      ].join("\n"),
    );
  }

  throw new Error(`Docker is not ready for local development.\n${output.trim()}`);
}

export async function runCompose(args, options = {}) {
  await verifyDockerAccess(options);
  const compose = await resolveComposeCommand(options);
  await runCommand(compose.command, [...compose.args, ...args], options);
}
