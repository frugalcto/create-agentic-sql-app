import { execa } from "execa";
export async function initializeGit(options) {
    if (!options.enabled) {
        return;
    }
    await execa("git", ["init"], {
        cwd: options.projectDirectory,
        stdio: "inherit",
    });
}
//# sourceMappingURL=initializeGit.js.map