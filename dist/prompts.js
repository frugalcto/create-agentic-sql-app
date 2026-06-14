import { confirm, isCancel, select, text } from "@clack/prompts";
import { API_FRAMEWORKS, DB_TEST_STYLES, TEMPLATE_NAMES, } from "./generateProject.js";
import { isInteractive as readIsInteractive } from "./util/isInteractive.js";
export class NonInteractiveError extends Error {
    constructor(message) {
        super(message);
        this.name = "NonInteractiveError";
    }
}
export const PROMPT_DEFAULTS = {
    api: "express",
    dbTests: "integration",
    template: "base",
    install: true,
    gitInit: true,
};
function parseApi(value) {
    if (!API_FRAMEWORKS.includes(value)) {
        throw new Error(`Invalid API framework: ${value}`);
    }
    return value;
}
function parseDbTests(value) {
    if (!DB_TEST_STYLES.includes(value)) {
        throw new Error(`Invalid database test style: ${value}`);
    }
    return value;
}
function parseTemplate(value) {
    if (!TEMPLATE_NAMES.includes(value)) {
        throw new Error(`Invalid template: ${value}`);
    }
    return value;
}
function assertNotCancelled(value, message) {
    if (isCancel(value)) {
        throw new Error(message);
    }
    return value;
}
export const clackPromptRunner = {
    async projectName() {
        const response = await text({
            message: "Project name:",
            placeholder: "my-app",
            validate(value) {
                const candidate = value ?? "";
                return candidate.trim().length > 0 ? undefined : "Project name is required.";
            },
        });
        return assertNotCancelled(response, "Prompt cancelled.").trim();
    },
    async apiFramework() {
        const response = await select({
            message: "API framework:",
            options: [
                { value: "express", label: "Express" },
                { value: "fastify", label: "Fastify" },
            ],
            initialValue: PROMPT_DEFAULTS.api,
        });
        return assertNotCancelled(response, "Prompt cancelled.");
    },
    async dbTestStyle() {
        const response = await select({
            message: "Database test style:",
            options: [
                { value: "integration", label: "SQL integration tests" },
                { value: "pgtap", label: "pgTAP" },
            ],
            initialValue: PROMPT_DEFAULTS.dbTests,
        });
        return assertNotCancelled(response, "Prompt cancelled.");
    },
    async template() {
        const response = await select({
            message: "Template:",
            options: [
                { value: "base", label: "base" },
                { value: "release-risk", label: "release-risk" },
            ],
            initialValue: PROMPT_DEFAULTS.template,
        });
        return assertNotCancelled(response, "Prompt cancelled.");
    },
    async installDependencies() {
        const response = await confirm({
            message: "Install dependencies?",
            initialValue: PROMPT_DEFAULTS.install,
        });
        return assertNotCancelled(response, "Prompt cancelled.");
    },
    async initializeGit() {
        const response = await confirm({
            message: "Initialize git?",
            initialValue: PROMPT_DEFAULTS.gitInit,
        });
        return assertNotCancelled(response, "Prompt cancelled.");
    },
};
export async function promptForMissingValues(input, environment = {}) {
    const interactive = environment.isInteractive ?? readIsInteractive(process.stdin);
    const runner = environment.runner ?? clackPromptRunner;
    let projectName = input.projectName?.trim();
    if (!projectName) {
        if (!interactive) {
            throw new NonInteractiveError("Project name is required. Pass it as the first argument or run the CLI in an interactive terminal.");
        }
        projectName = await runner.projectName();
    }
    const api = input.api !== undefined
        ? parseApi(input.api)
        : interactive
            ? await runner.apiFramework()
            : PROMPT_DEFAULTS.api;
    const dbTests = input.dbTests !== undefined
        ? parseDbTests(input.dbTests)
        : interactive
            ? await runner.dbTestStyle()
            : PROMPT_DEFAULTS.dbTests;
    const template = input.template !== undefined
        ? parseTemplate(input.template)
        : interactive
            ? await runner.template()
            : PROMPT_DEFAULTS.template;
    const install = input.skipInstall !== undefined
        ? !input.skipInstall
        : interactive
            ? await runner.installDependencies()
            : PROMPT_DEFAULTS.install;
    const gitInit = input.git !== undefined
        ? input.git
        : interactive
            ? await runner.initializeGit()
            : PROMPT_DEFAULTS.gitInit;
    return {
        projectName,
        api,
        dbTests,
        template,
        install,
        gitInit,
    };
}
export const clackOverwritePromptRunner = {
    async confirmOverwrite(projectDirectory) {
        const response = await confirm({
            message: `"${projectDirectory}" is not empty. Overwrite existing files?`,
            initialValue: false,
        });
        return assertNotCancelled(response, "Prompt cancelled.");
    },
};
export function createConfirmOverwriteHandler(projectDirectory, environment = {}) {
    const interactive = environment.isInteractive ?? readIsInteractive(process.stdin);
    if (!interactive) {
        return undefined;
    }
    const runner = environment.runner ?? clackOverwritePromptRunner;
    return async () => runner.confirmOverwrite(projectDirectory);
}
//# sourceMappingURL=prompts.js.map