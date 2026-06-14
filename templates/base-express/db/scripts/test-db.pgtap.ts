import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import path from "node:path";

import { loadEnvFile, resolveDbPath } from "./dbClient.js";

const packageRoot = path.resolve(resolveDbPath("scripts"), "../..");

async function runCommand(command: string, args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: packageRoot,
      stdio: "inherit",
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Command failed (${code}): ${command} ${args.join(" ")}`));
    });
  });
}

async function main(): Promise<void> {
  loadEnvFile();

  await runCommand("docker", [
    "compose",
    "exec",
    "-T",
    "postgres",
    "psql",
    "-U",
    "app",
    "-d",
    "app_dev",
    "-f",
    "/pgtap-tests/setup.sql",
  ]);

  const testsDirectory = resolveDbPath("tests");
  const testFiles = (await readdir(testsDirectory))
    .filter((fileName) => fileName.endsWith(".test.sql"))
    .sort();

  for (const fileName of testFiles) {
    await runCommand("docker", [
      "compose",
      "exec",
      "-T",
      "postgres",
      "pg_prove",
      "-U",
      "app",
      "-d",
      "app_dev",
      `/pgtap-tests/${fileName}`,
    ]);
    console.log(`Passed ${fileName}`);
  }

  console.log(`pgTAP database tests passed (${testFiles.length} files)`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
