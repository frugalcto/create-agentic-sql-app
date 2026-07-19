import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { generateContractArtifacts } from "../contract/generate.js";

const GENERATED_FILES = [
  "DB_API_CONTRACT.md",
  "ERROR_CODES.md",
  "contract/openapi.json",
] as const;

function getProjectRoot(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
}

async function readIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

export async function checkContractFreshness(
  projectRoot = getProjectRoot(),
): Promise<string[]> {
  const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "contract-gen-"));

  try {
    await generateContractArtifacts(tempDirectory, "__PROJECT_NAME__");

    const staleFiles: string[] = [];

    for (const relativePath of GENERATED_FILES) {
      const committed = await readIfExists(path.join(projectRoot, relativePath));
      const generated = await readIfExists(
        path.join(tempDirectory, relativePath),
      );

      if (committed === null || generated === null || committed !== generated) {
        staleFiles.push(relativePath);
      }
    }

    return staleFiles;
  } finally {
    await rm(tempDirectory, { recursive: true, force: true });
  }
}

async function main(): Promise<void> {
  const staleFiles = await checkContractFreshness();

  if (staleFiles.length === 0) {
    console.log("Contract artifacts are up to date.");
    return;
  }

  console.error("Contract artifacts are stale:");
  for (const file of staleFiles) {
    console.error(`- ${file}`);
  }

  console.error("Run `npm run contract:generate` and commit the updated files.");
  process.exitCode = 1;
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === new URL(`file://${path.resolve(process.argv[1]!)}`).href;

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}
