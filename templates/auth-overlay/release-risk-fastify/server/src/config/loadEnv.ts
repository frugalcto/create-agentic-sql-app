import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);

export function loadEnvFile(): void {
  const envPath = path.join(packageRoot, ".env");

  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");

  for (const line of content.split("\n")) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

export function getPort(): number {
  return Number(process.env.PORT ?? 3000);
}

export function getDatabaseRuntimeUrl(): string {
  return process.env.DATABASE_RUNTIME_URL ?? process.env.DATABASE_URL ?? "";
}

export function isSessionCookieSecure(): boolean {
  return process.env.SESSION_COOKIE_SECURE === "true";
}

export function getSessionCookieMaxAgeSeconds(): number {
  return Number(process.env.SESSION_COOKIE_MAX_AGE_SECONDS ?? 60 * 60 * 24 * 7);
}
