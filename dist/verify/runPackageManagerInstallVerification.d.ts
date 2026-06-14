import type { PackageManager } from "../generateProject.js";
export interface PackageManagerVerificationResult {
    packageManager: PackageManager;
    projectDirectory: string;
    workDirectory: string;
    skipped: boolean;
}
export interface PackageManagerVerificationSummary {
    results: PackageManagerVerificationResult[];
    skippedManagers: PackageManager[];
    verifiedManagers: PackageManager[];
}
export declare function verifyPackageManagerInstall(packageManagers?: PackageManager[]): Promise<PackageManagerVerificationSummary>;
