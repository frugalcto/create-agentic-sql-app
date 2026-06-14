import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  applyTemplateVariables,
  type TemplateVariables,
} from "./templateVars.js";

const RENAME_ON_COPY: Record<string, string> = {
  "_package.json": "package.json",
  "_gitignore": ".gitignore",
  "_env.example": ".env.example",
};

const TEXT_FILE_EXTENSIONS = new Set([
  ".md",
  ".json",
  ".ts",
  ".tsx",
  ".sql",
  ".yml",
  ".yaml",
  ".html",
  ".txt",
]);

function destinationFileName(sourceName: string): string {
  return RENAME_ON_COPY[sourceName] ?? sourceName;
}

function shouldApplyTemplateVariables(fileName: string): boolean {
  const outputName = destinationFileName(fileName);

  if (
    outputName === "package.json" ||
    outputName === ".env.example" ||
    outputName === ".gitignore"
  ) {
    return true;
  }

  const extension = path.extname(outputName);
  return TEXT_FILE_EXTENSIONS.has(extension);
}

async function copyDirectory(
  sourceDirectory: string,
  destinationDirectory: string,
  variables: TemplateVariables,
): Promise<void> {
  await mkdir(destinationDirectory, { recursive: true });
  const entries = await readdir(sourceDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDirectory, entry.name);
    const outputName = destinationFileName(entry.name);
    const destinationPath = path.join(destinationDirectory, outputName);

    if (entry.isDirectory()) {
      await copyDirectory(sourcePath, destinationPath, variables);
      continue;
    }

    if (shouldApplyTemplateVariables(entry.name)) {
      const content = await readFile(sourcePath, "utf8");
      await writeFile(
        destinationPath,
        applyTemplateVariables(content, variables),
        "utf8",
      );
      continue;
    }

    const content = await readFile(sourcePath);
    await writeFile(destinationPath, content);
  }
}

export async function copyTemplate(
  templateDirectory: string,
  destinationDirectory: string,
  variables: TemplateVariables,
): Promise<void> {
  await copyDirectory(templateDirectory, destinationDirectory, variables);
}
