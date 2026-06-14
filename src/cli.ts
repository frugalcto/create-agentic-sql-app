import { cac } from "cac";

import {
  API_FRAMEWORKS,
  DB_TEST_STYLES,
  PACKAGE_MANAGERS,
  TEMPLATE_NAMES,
  generateProject,
  type ApiFramework,
  type DbTestStyle,
  type PackageManager,
  type TemplateName,
} from "./generateProject.js";
import { buildGenerationRequest } from "./buildGenerationRequest.js";
import type { CliRawOptions } from "./cliTypes.js";
import { validateProjectName } from "./util/validateProjectName.js";

export type { CliRawOptions } from "./cliTypes.js";

export interface NormalizedCliOptions {
  projectName: string;
  api: ApiFramework;
  dbTests: DbTestStyle;
  template: TemplateName;
  packageManager: PackageManager;
  install: boolean;
  gitInit: boolean;
}

const DEFAULTS = {
  api: "express" as ApiFramework,
  dbTests: "integration" as DbTestStyle,
  template: "base" as TemplateName,
  packageManager: "npm" as PackageManager,
  install: true,
  gitInit: true,
};

function parseApi(value: string | undefined): ApiFramework {
  const selected = value ?? DEFAULTS.api;
  if (!API_FRAMEWORKS.includes(selected as ApiFramework)) {
    throw new Error(`Invalid --api value: ${selected}`);
  }
  return selected as ApiFramework;
}

function parseDbTests(value: string | undefined): DbTestStyle {
  const selected = value ?? DEFAULTS.dbTests;
  if (!DB_TEST_STYLES.includes(selected as DbTestStyle)) {
    throw new Error(`Invalid --db-tests value: ${selected}`);
  }
  return selected as DbTestStyle;
}

function parseTemplate(value: string | undefined): TemplateName {
  const selected = value ?? DEFAULTS.template;
  if (!TEMPLATE_NAMES.includes(selected as TemplateName)) {
    throw new Error(`Invalid --template value: ${selected}`);
  }
  return selected as TemplateName;
}

function parsePackageManager(value: string | undefined): PackageManager {
  const selected = value ?? DEFAULTS.packageManager;
  if (!PACKAGE_MANAGERS.includes(selected as PackageManager)) {
    throw new Error(`Invalid --package-manager value: ${selected}`);
  }
  return selected as PackageManager;
}

export function normalizeCliOptions(
  projectName: string,
  options: CliRawOptions,
): NormalizedCliOptions {
  const validatedProjectName = validateProjectName(projectName);

  return {
    projectName: validatedProjectName,
    api: parseApi(options.api),
    dbTests: parseDbTests(options.dbTests),
    template: parseTemplate(options.template),
    packageManager: parsePackageManager(options.packageManager),
    install: options.skipInstall ? false : DEFAULTS.install,
    gitInit: options.git !== undefined ? options.git : DEFAULTS.gitInit,
  };
}

export async function runCli(argv = process.argv): Promise<void> {
  const cli = cac("create-agentic-sql-app");

  cli
    .command("[projectName]", "Create a PostgreSQL-first TypeScript app")
    .option("--api <api>", "API framework: express|fastify")
    .option("--db-tests <dbTests>", "DB test style: integration|pgtap")
    .option("--template <template>", "Template: base|release-risk")
    .option("--skip-install", "Skip dependency installation")
    .option("--no-git", "Skip git repository initialization")
    .option("--package-manager <packageManager>", "Package manager: npm|pnpm|yarn")
    .action(async (projectName: string | undefined, options: CliRawOptions) => {
      const generationOptions = await buildGenerationRequest(projectName, options);
      const result = await generateProject(generationOptions);
      console.log(result.message);
    });

  cli.help();
  cli.version("0.1.0");

  await cli.parse(argv, { run: true });
}
