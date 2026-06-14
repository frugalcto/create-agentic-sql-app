import { detectPackageManager } from "./util/detectPackageManager.js";
import { promptForMissingValues, } from "./prompts.js";
import { validateProjectName } from "./util/validateProjectName.js";
function parsePackageManagerFlag(value) {
    if (value === undefined) {
        return undefined;
    }
    if (value !== "npm" && value !== "pnpm" && value !== "yarn") {
        throw new Error(`Invalid --package-manager value: ${value}`);
    }
    return value;
}
export function mergeResolvedOptions(prompted, rawOptions, cwd = process.cwd()) {
    const packageManager = parsePackageManagerFlag(rawOptions.packageManager) ??
        detectPackageManager(cwd);
    return {
        projectName: validateProjectName(prompted.projectName),
        api: prompted.api,
        dbTests: prompted.dbTests,
        template: prompted.template,
        packageManager,
        install: prompted.install,
        gitInit: prompted.gitInit,
    };
}
export async function resolveGenerationOptions(projectName, rawOptions, environment = {}) {
    const prompted = await promptForMissingValues({
        projectName,
        api: rawOptions.api,
        dbTests: rawOptions.dbTests,
        template: rawOptions.template,
        skipInstall: rawOptions.skipInstall,
        git: rawOptions.git,
    }, environment);
    return mergeResolvedOptions(prompted, rawOptions, environment.cwd);
}
//# sourceMappingURL=resolveOptions.js.map