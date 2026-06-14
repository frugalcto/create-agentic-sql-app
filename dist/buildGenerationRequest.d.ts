import type { CliRawOptions } from "./cliTypes.js";
import type { GenerateProjectOptions } from "./generateProject.js";
import { type OverwritePromptRunner, type PromptRunner } from "./prompts.js";
export interface BuildGenerationRequestEnvironment {
    isInteractive?: boolean;
    cwd?: string;
    overwriteRunner?: OverwritePromptRunner;
    promptRunner?: PromptRunner;
}
export declare function buildGenerationRequest(projectName: string | undefined, rawOptions: CliRawOptions, environment?: BuildGenerationRequestEnvironment): Promise<GenerateProjectOptions>;
