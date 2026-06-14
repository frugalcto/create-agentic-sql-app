import {
  loadEnvFile,
  resolveDbPath,
  runSqlFile,
  withDatabaseClient,
} from "./dbClient.js";

async function main(): Promise<void> {
  loadEnvFile();

  await withDatabaseClient(async (client) => {
    await runSqlFile(client, resolveDbPath("seeds", "demo.sql"));
    console.log("Seeded demo data");
  });
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
