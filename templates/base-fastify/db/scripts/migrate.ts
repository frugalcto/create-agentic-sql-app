import { readdir, readFile } from "node:fs/promises";

import type pg from "pg";

import {
  loadEnvFile,
  resolveDbPath,
  withDatabaseClient,
} from "./dbClient.js";

async function isMigrationApplied(
  client: pg.Client,
  fileName: string,
): Promise<boolean> {
  try {
    const result = await client.query(
      "select 1 from app.schema_migrations where filename = $1",
      [fileName],
    );

    return (result.rowCount ?? 0) > 0;
  } catch {
    return false;
  }
}

async function main(): Promise<void> {
  loadEnvFile();

  const migrationsDirectory = resolveDbPath("migrations");
  const migrationFiles = (await readdir(migrationsDirectory))
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort();

  await withDatabaseClient(async (client) => {
    for (const fileName of migrationFiles) {
      const alreadyApplied = await isMigrationApplied(client, fileName);

      if (alreadyApplied) {
        console.log(`Skipped ${fileName}`);
        continue;
      }

      const sql = await readFile(
        resolveDbPath("migrations", fileName),
        "utf8",
      );

      await client.query("begin");

      try {
        await client.query(sql);
        await client.query(
          "insert into app.schema_migrations (filename) values ($1)",
          [fileName],
        );
        await client.query("commit");
        console.log(`Applied ${fileName}`);
      } catch (error) {
        await client.query("rollback");
        throw error;
      }
    }
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
