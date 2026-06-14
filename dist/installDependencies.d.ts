import type { PackageManager } from "./generateProject.js";
export interface InstallDependenciesOptions {
    enabled: boolean;
    packageManager: PackageManager;
    projectDirectory: string;
}
export declare function installDependencies(options: InstallDependenciesOptions): Promise<void>;
