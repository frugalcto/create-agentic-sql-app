import { execa } from "execa";
export async function installDependencies(options) {
    if (!options.enabled) {
        return;
    }
    const installCommand = options.packageManager === "yarn" ? [] : ["install"];
    await execa(options.packageManager, installCommand, {
        cwd: options.projectDirectory,
        stdio: "inherit",
    });
}
//# sourceMappingURL=installDependencies.js.map