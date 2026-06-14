import { cac } from "cac";
import { API_FRAMEWORKS, DB_TEST_STYLES, PACKAGE_MANAGERS, TEMPLATE_NAMES, generateProject, } from "./generateProject.js";
import { buildGenerationRequest } from "./buildGenerationRequest.js";
import { validateProjectName } from "./util/validateProjectName.js";
const DEFAULTS = {
    api: "express",
    dbTests: "integration",
    template: "base",
    packageManager: "npm",
    install: true,
    gitInit: true,
};
function parseApi(value) {
    const selected = value ?? DEFAULTS.api;
    if (!API_FRAMEWORKS.includes(selected)) {
        throw new Error(`Invalid --api value: ${selected}`);
    }
    return selected;
}
function parseDbTests(value) {
    const selected = value ?? DEFAULTS.dbTests;
    if (!DB_TEST_STYLES.includes(selected)) {
        throw new Error(`Invalid --db-tests value: ${selected}`);
    }
    return selected;
}
function parseTemplate(value) {
    const selected = value ?? DEFAULTS.template;
    if (!TEMPLATE_NAMES.includes(selected)) {
        throw new Error(`Invalid --template value: ${selected}`);
    }
    return selected;
}
function parsePackageManager(value) {
    const selected = value ?? DEFAULTS.packageManager;
    if (!PACKAGE_MANAGERS.includes(selected)) {
        throw new Error(`Invalid --package-manager value: ${selected}`);
    }
    return selected;
}
export function normalizeCliOptions(projectName, options) {
    const validatedProjectName = validateProjectName(projectName);
    return {
        projectName: validatedProjectName,
        api: parseApi(options.api),
        dbTests: parseDbTests(options.dbTests),
        template: parseTemplate(options.template),
        packageManager: parsePackageManager(options.packageManager),
        install: options.skipInstall ? false : DEFAULTS.install,
        gitInit: options.git !== undefined ? options.git : DEFAULTS.gitInit,
    };
}
export async function runCli(argv = process.argv) {
    const cli = cac("create-agentic-sql-app");
    cli
        .command("[projectName]", "Create a PostgreSQL-first TypeScript app")
        .option("--api <api>", "API framework: express|fastify")
        .option("--db-tests <dbTests>", "DB test style: integration|pgtap")
        .option("--template <template>", "Template: base|release-risk")
        .option("--skip-install", "Skip dependency installation")
        .option("--no-git", "Skip git repository initialization")
        .option("--package-manager <packageManager>", "Package manager: npm|pnpm|yarn")
        .action(async (projectName, options) => {
        const generationOptions = await buildGenerationRequest(projectName, options);
        const result = await generateProject(generationOptions);
        console.log(result.message);
    });
    cli.help();
    cli.version("0.1.0");
    await cli.parse(argv, { run: true });
}
//# sourceMappingURL=cli.js.map