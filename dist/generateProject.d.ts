export declare const API_FRAMEWORKS: readonly ["express", "fastify"];
export declare const DB_TEST_STYLES: readonly ["integration", "pgtap"];
export declare const TEMPLATE_NAMES: readonly ["base", "release-risk"];
export declare const PACKAGE_MANAGERS: readonly ["npm", "pnpm", "yarn"];
export type ApiFramework = (typeof API_FRAMEWORKS)[number];
export type DbTestStyle = (typeof DB_TEST_STYLES)[number];
export type TemplateName = (typeof TEMPLATE_NAMES)[number];
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];
export interface GenerateProjectOptions {
    projectName: string;
    api: ApiFramework;
    dbTests: DbTestStyle;
    template: TemplateName;
    packageManager: PackageManager;
    install: boolean;
    gitInit: boolean;
    cwd?: string;
    confirmOverwrite?: () => Promise<boolean>;
}
export interface GenerationIntent {
    message: string;
    options: GenerateProjectOptions;
    projectDirectory: string;
    directoryState: "created" | "exists_empty" | "overwrite_confirmed";
}
export declare function generateProject(options: GenerateProjectOptions): Promise<GenerationIntent>;
