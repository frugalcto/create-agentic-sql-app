import { type ApiFramework, type DbTestStyle, type PackageManager, type TemplateName } from "./generateProject.js";
import type { CliRawOptions } from "./cliTypes.js";
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
export declare function normalizeCliOptions(projectName: string, options: CliRawOptions): NormalizedCliOptions;
export declare function runCli(argv?: string[]): Promise<void>;
