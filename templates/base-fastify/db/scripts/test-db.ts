import { readdir } from "node:fs/promises";

import {
  loadEnvFile,
  resolveDbPath,
  runSqlFile,
  withDatabaseClient,
} from "./dbClient.js";

async function main(): Promise<void> {
  loadEnvFile();

  const testsDirectory = resolveDbPath("tests");
  const testFiles = (await readdir(testsDirectory))
    .filter((fileName) => fileName.endsWith(".test.sql"))
    .sort();

  await withDatabaseClient(async (client) => {
    await runSqlFile(client, resolveDbPath("tests", "setup.sql"));

    for (const fileName of testFiles) {
      await runSqlFile(client, resolveDbPath("tests", fileName));
      console.log(`Passed ${fileName}`);
    }
  });

  console.log(`Database tests passed (${testFiles.length} files)`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
