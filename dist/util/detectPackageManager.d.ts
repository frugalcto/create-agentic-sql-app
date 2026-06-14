import type { PackageManager } from "../generateProject.js";
export interface PackageManagerSignals {
    npm_config_user_agent?: string;
}
export declare function detectPackageManager(cwd?: string, signals?: PackageManagerSignals): PackageManager;
