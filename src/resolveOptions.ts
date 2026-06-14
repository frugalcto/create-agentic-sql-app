import type { CliRawOptions } from "./cliTypes.js";
import { detectPackageManager } from "./util/detectPackageManager.js";
import {
  promptForMissingValues,
  type PromptEnvironment,
  type ResolvedPromptValues,
} from "./prompts.js";
import type { GenerateProjectOptions } from "./generateProject.js";
import { validateProjectName } from "./util/validateProjectName.js";

function parsePackageManagerFlag(value: string | undefined) {
  if (value === undefined) {
    return undefined;
  }

  if (value !== "npm" && value !== "pnpm" && value !== "yarn") {
    throw new Error(`Invalid --package-manager value: ${value}`);
  }

  return value;
}

export function mergeResolvedOptions(
  prompted: ResolvedPromptValues,
  rawOptions: CliRawOptions,
  cwd = process.cwd(),
): GenerateProjectOptions {
  const packageManager =
    parsePackageManagerFlag(rawOptions.packageManager) ??
    detectPackageManager(cwd);

  return {
    projectName: validateProjectName(prompted.projectName),
    api: prompted.api,
    dbTests: prompted.dbTests,
    template: prompted.template,
    packageManager,
    install: prompted.install,
    gitInit: prompted.gitInit,
  };
}

export async function resolveGenerationOptions(
  projectName: string | undefined,
  rawOptions: CliRawOptions,
  environment: PromptEnvironment & { cwd?: string } = {},
): Promise<GenerateProjectOptions> {
  const prompted = await promptForMissingValues(
    {
      projectName,
      api: rawOptions.api,
      dbTests: rawOptions.dbTests,
      template: rawOptions.template,
      skipInstall: rawOptions.skipInstall,
      git: rawOptions.git,
    },
    environment,
  );

  return mergeResolvedOptions(prompted, rawOptions, environment.cwd);
}
