import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
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

export function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is required. Copy .env.example to .env and start PostgreSQL.",
    );
  }

  return databaseUrl;
}

export async function withDatabaseClient<T>(
  run: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const client = new pg.Client({
    connectionString: getDatabaseUrl(),
  });

  await client.connect();

  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export async function runSqlFile(
  client: pg.Client,
  filePath: string,
): Promise<void> {
  const sql = readFileSync(filePath, "utf8");
  await client.query(sql);
}

export function resolveDbPath(...segments: string[]): string {
  return path.join(packageRoot, "db", ...segments);
}
