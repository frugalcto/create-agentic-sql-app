export interface InitializeGitOptions {
    enabled: boolean;
    projectDirectory: string;
}
export declare function initializeGit(options: InitializeGitOptions): Promise<void>;
