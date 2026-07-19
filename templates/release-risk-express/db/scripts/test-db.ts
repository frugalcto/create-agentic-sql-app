import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  loadEnvFile,
  resolveDbPath,
  runSqlFile,
  withDatabaseClient,
} from "./dbClient.js";
import { verifyDatabaseContract } from "../../scripts/contract/verify-db.js";

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

    const violations = await verifyDatabaseContract(client);

    if (violations.length > 0) {
      for (const violation of violations) {
        const procedure = violation.procedure ? `${violation.procedure}: ` : "";
        console.error(`[${violation.check}] ${procedure}${violation.message}`);
      }

      throw new Error(
        `Database contract verification failed (${violations.length} issues).`,
      );
    }
  });

  console.log(`Database tests passed (${testFiles.length} files)`);
  console.log("Database contract verification passed.");
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
