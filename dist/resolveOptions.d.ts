import type { CliRawOptions } from "./cliTypes.js";
import { type PromptEnvironment, type ResolvedPromptValues } from "./prompts.js";
import type { GenerateProjectOptions } from "./generateProject.js";
export declare function mergeResolvedOptions(prompted: ResolvedPromptValues, rawOptions: CliRawOptions, cwd?: string): GenerateProjectOptions;
export declare function resolveGenerationOptions(projectName: string | undefined, rawOptions: CliRawOptions, environment?: PromptEnvironment & {
    cwd?: string;
}): Promise<GenerateProjectOptions>;
