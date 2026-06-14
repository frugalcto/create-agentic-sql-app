import { type ApiFramework, type DbTestStyle, type TemplateName } from "./generateProject.js";
export declare class NonInteractiveError extends Error {
    constructor(message: string);
}
export interface CliPromptInput {
    projectName?: string;
    api?: string;
    dbTests?: string;
    template?: string;
    skipInstall?: boolean;
    git?: boolean;
}
export interface ResolvedPromptValues {
    projectName: string;
    api: ApiFramework;
    dbTests: DbTestStyle;
    template: TemplateName;
    install: boolean;
    gitInit: boolean;
}
export interface PromptRunner {
    projectName(): Promise<string>;
    apiFramework(): Promise<ApiFramework>;
    dbTestStyle(): Promise<DbTestStyle>;
    template(): Promise<TemplateName>;
    installDependencies(): Promise<boolean>;
    initializeGit(): Promise<boolean>;
}
export declare const PROMPT_DEFAULTS: {
    api: ApiFramework;
    dbTests: DbTestStyle;
    template: TemplateName;
    install: boolean;
    gitInit: boolean;
};
export declare const clackPromptRunner: PromptRunner;
export interface PromptEnvironment {
    isInteractive?: boolean;
    runner?: PromptRunner;
}
export declare function promptForMissingValues(input: CliPromptInput, environment?: PromptEnvironment): Promise<ResolvedPromptValues>;
export interface OverwritePromptRunner {
    confirmOverwrite(projectDirectory: string): Promise<boolean>;
}
export interface OverwritePromptEnvironment {
    isInteractive?: boolean;
    runner?: OverwritePromptRunner;
}
export declare const clackOverwritePromptRunner: OverwritePromptRunner;
export declare function createConfirmOverwriteHandler(projectDirectory: string, environment?: OverwritePromptEnvironment): (() => Promise<boolean>) | undefined;
