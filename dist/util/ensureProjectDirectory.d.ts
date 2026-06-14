export type ProjectDirectoryState = "created" | "exists_empty" | "overwrite_confirmed";
export interface EnsureProjectDirectoryOptions {
    cwd?: string;
    confirmOverwrite?: () => Promise<boolean>;
}
export declare function resolveProjectDirectory(projectName: string, cwd?: string): string;
export declare function ensureProjectDirectory(projectDirectory: string, options?: EnsureProjectDirectoryOptions): Promise<ProjectDirectoryState>;
