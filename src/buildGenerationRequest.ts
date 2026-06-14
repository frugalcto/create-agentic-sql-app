import type { CliRawOptions } from "./cliTypes.js";
import { resolveGenerationOptions } from "./resolveOptions.js";
import type { GenerateProjectOptions } from "./generateProject.js";
import {
  createConfirmOverwriteHandler,
  type OverwritePromptRunner,
  type PromptRunner,
} from "./prompts.js";
import { resolveProjectDirectory } from "./util/ensureProjectDirectory.js";
import { isInteractive } from "./util/isInteractive.js";

export interface BuildGenerationRequestEnvironment {
  isInteractive?: boolean;
  cwd?: string;
  overwriteRunner?: OverwritePromptRunner;
  promptRunner?: PromptRunner;
}

export async function buildGenerationRequest(
  projectName: string | undefined,
  rawOptions: CliRawOptions,
  environment: BuildGenerationRequestEnvironment = {},
): Promise<GenerateProjectOptions> {
  const interactive = environment.isInteractive ?? isInteractive();
  const cwd = environment.cwd ?? process.cwd();
  const generationOptions = await resolveGenerationOptions(
    projectName,
    rawOptions,
    {
      isInteractive: interactive,
      cwd,
      runner: environment.promptRunner,
    },
  );
  const projectDirectory = resolveProjectDirectory(
    generationOptions.projectName,
    cwd,
  );
  const confirmOverwrite = createConfirmOverwriteHandler(projectDirectory, {
    isInteractive: interactive,
    runner: environment.overwriteRunner,
  });

  return {
    ...generationOptions,
    cwd,
    ...(confirmOverwrite ? { confirmOverwrite } : {}),
  };
}
