import { mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { validateProjectName } from "./validateProjectName.js";
export function resolveProjectDirectory(projectName, cwd = process.cwd()) {
    const validatedName = validateProjectName(projectName);
    const baseDirectory = path.resolve(cwd);
    const projectDirectory = path.resolve(baseDirectory, validatedName);
    const relativePath = path.relative(baseDirectory, projectDirectory);
    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        throw new Error("Project path escapes the output directory.");
    }
    return projectDirectory;
}
export async function ensureProjectDirectory(projectDirectory, options = {}) {
    let directoryStat;
    try {
        directoryStat = await stat(projectDirectory);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            await mkdir(projectDirectory, { recursive: true });
            return "created";
        }
        throw error;
    }
    if (!directoryStat.isDirectory()) {
        throw new Error(`Cannot generate project: "${projectDirectory}" exists and is not a directory.`);
    }
    const entries = await readdir(projectDirectory);
    if (entries.length === 0) {
        return "exists_empty";
    }
    if (options.confirmOverwrite) {
        const confirmed = await options.confirmOverwrite();
        if (!confirmed) {
            throw new Error(`Cannot generate project: "${projectDirectory}" is not empty. Generation cancelled.`);
        }
        return "overwrite_confirmed";
    }
    throw new Error(`Cannot generate project: "${projectDirectory}" is not empty. Choose a different name or confirm overwrite.`);
}
//# sourceMappingURL=ensureProjectDirectory.js.map