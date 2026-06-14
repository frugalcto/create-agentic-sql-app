import { applyDbTestStyle } from "./applyDbTestStyle.js";
import { copyTemplate } from "./copyTemplate.js";
import { initializeGit } from "./initializeGit.js";
import { installDependencies } from "./installDependencies.js";
import { formatCompletionMessage } from "./nextSteps.js";
import { createTemplateVariables } from "./templateVars.js";
import { ensureProjectDirectory, resolveProjectDirectory, } from "./util/ensureProjectDirectory.js";
import { resolveTemplateDirectory } from "./util/paths.js";
import { validateProjectName } from "./util/validateProjectName.js";
export const API_FRAMEWORKS = ["express", "fastify"];
export const DB_TEST_STYLES = ["integration", "pgtap"];
export const TEMPLATE_NAMES = ["base", "release-risk"];
export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn"];
const SUPPORTED_APIS = new Set(API_FRAMEWORKS);
const SUPPORTED_DB_TESTS = new Set(DB_TEST_STYLES);
const SUPPORTED_TEMPLATES = new Set(TEMPLATE_NAMES);
const SUPPORTED_PACKAGE_MANAGERS = new Set(PACKAGE_MANAGERS);
function assertValidOptions(options) {
    validateProjectName(options.projectName);
    if (!SUPPORTED_APIS.has(options.api)) {
        throw new Error(`Unsupported api option: ${options.api}`);
    }
    if (!SUPPORTED_DB_TESTS.has(options.dbTests)) {
        throw new Error(`Unsupported db-tests option: ${options.dbTests}`);
    }
    if (!SUPPORTED_TEMPLATES.has(options.template)) {
        throw new Error(`Unsupported template option: ${options.template}`);
    }
    if (!SUPPORTED_PACKAGE_MANAGERS.has(options.packageManager)) {
        throw new Error(`Unsupported package manager option: ${options.packageManager}`);
    }
}
export async function generateProject(options) {
    assertValidOptions(options);
    const validatedProjectName = validateProjectName(options.projectName);
    const projectDirectory = resolveProjectDirectory(validatedProjectName, options.cwd);
    const directoryState = await ensureProjectDirectory(projectDirectory, {
        confirmOverwrite: options.confirmOverwrite,
    });
    const templateDirectory = resolveTemplateDirectory(options.api, options.template);
    const templateVariables = createTemplateVariables(validatedProjectName, options.dbTests);
    await copyTemplate(templateDirectory, projectDirectory, templateVariables);
    await applyDbTestStyle(projectDirectory, options.dbTests);
    await installDependencies({
        enabled: options.install,
        packageManager: options.packageManager,
        projectDirectory,
    });
    await initializeGit({
        enabled: options.gitInit,
        projectDirectory,
    });
    const message = formatCompletionMessage(validatedProjectName);
    return {
        message,
        options: {
            ...options,
            projectName: validatedProjectName,
        },
        projectDirectory,
        directoryState,
    };
}
//# sourceMappingURL=generateProject.js.map