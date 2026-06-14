import { randomUUID } from "node:crypto";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { execa } from "execa";
import { generateProject } from "../generateProject.js";
import { patchDockerComposeContainerName } from "./patchDockerCompose.js";
import { checkDockerAvailable, shouldRunE2e } from "./prerequisites.js";
import { waitForPort } from "./waitForPort.js";
const DEFAULT_PROJECT_NAME = "smoke-generated-app";
const POSTGRES_PORT = 5432;
function createComposeProjectName() {
    return `agentic-smoke-${randomUUID().slice(0, 8)}`;
}
function createContainerName(composeProjectName) {
    return `${composeProjectName}_postgres`;
}
function composeEnvironment(composeProjectName) {
    return {
        ...process.env,
        COMPOSE_PROJECT_NAME: composeProjectName,
    };
}
async function runStep(label, steps, task) {
    steps.push(label);
    console.log(`\n[smoke] ${label}`);
    await task();
}
export async function cleanupSmokeTest(context, options = {}) {
    if (context.appDir && context.composeProjectName) {
        try {
            await execa("docker", ["compose", "-p", context.composeProjectName, "down", "-v"], {
                cwd: context.appDir,
                stdio: "pipe",
                env: composeEnvironment(context.composeProjectName),
            });
            console.log("[smoke] Stopped PostgreSQL container.");
        }
        catch {
            console.warn("[smoke] Failed to stop PostgreSQL container during cleanup.");
        }
    }
    if (!options.keepArtifacts && context.workDir) {
        await rm(context.workDir, { recursive: true, force: true });
        console.log(`[smoke] Removed workspace ${context.workDir}.`);
    }
}
export async function runGeneratedAppSmokeTest(options = {}) {
    await checkDockerAvailable();
    const context = {};
    const steps = [];
    const projectName = options.projectName ?? DEFAULT_PROJECT_NAME;
    const composeProjectName = createComposeProjectName();
    const runE2e = shouldRunE2e(options.runE2e);
    try {
        context.workDir =
            options.workDir ??
                (await mkdtemp(path.join(tmpdir(), "create-agentic-sql-app-smoke-")));
        context.composeProjectName = composeProjectName;
        await runStep("Generate app", steps, async () => {
            const result = await generateProject({
                projectName,
                api: options.api ?? "express",
                dbTests: options.dbTests ?? "integration",
                template: options.template ?? "base",
                packageManager: "npm",
                install: false,
                gitInit: false,
                cwd: context.workDir,
            });
            context.appDir = result.projectDirectory;
        });
        const appDir = context.appDir;
        await runStep("Install dependencies", steps, async () => {
            await execa("npm", ["install"], {
                cwd: appDir,
                stdio: "inherit",
            });
        });
        await runStep("Prepare environment file", steps, async () => {
            await cp(path.join(appDir, ".env.example"), path.join(appDir, ".env"));
            await patchDockerComposeContainerName(appDir, createContainerName(composeProjectName));
        });
        await runStep("Start PostgreSQL", steps, async () => {
            await execa("npm", ["run", "db:up"], {
                cwd: appDir,
                stdio: "inherit",
                env: composeEnvironment(composeProjectName),
            });
            await waitForPort(POSTGRES_PORT);
        });
        await runStep("Run migrations", steps, async () => {
            await execa("npm", ["run", "db:migrate"], {
                cwd: appDir,
                stdio: "inherit",
                env: composeEnvironment(composeProjectName),
            });
        });
        await runStep("Run seed", steps, async () => {
            await execa("npm", ["run", "db:seed"], {
                cwd: appDir,
                stdio: "inherit",
                env: composeEnvironment(composeProjectName),
            });
        });
        await runStep("Run database tests", steps, async () => {
            await execa("npm", ["run", "test:db"], {
                cwd: appDir,
                stdio: "inherit",
                env: composeEnvironment(composeProjectName),
            });
        });
        await runStep("Run server tests", steps, async () => {
            await execa("npm", ["run", "test:server"], {
                cwd: appDir,
                stdio: "inherit",
                env: composeEnvironment(composeProjectName),
            });
        });
        await runStep("Run web tests", steps, async () => {
            await execa("npm", ["run", "test:web"], {
                cwd: appDir,
                stdio: "inherit",
                env: composeEnvironment(composeProjectName),
            });
        });
        if (runE2e) {
            await runStep("Install Playwright browser", steps, async () => {
                await execa("npm", ["run", "test:e2e:install", "-w", "web"], {
                    cwd: appDir,
                    stdio: "inherit",
                    env: composeEnvironment(composeProjectName),
                });
            });
            await runStep("Run Playwright E2E tests", steps, async () => {
                await execa("npm", ["run", "test:e2e"], {
                    cwd: appDir,
                    stdio: "inherit",
                    env: {
                        ...composeEnvironment(composeProjectName),
                        CI: "1",
                    },
                });
            });
        }
        else {
            console.log("\n[smoke] Skipping Playwright E2E. Set SMOKE_RUN_E2E=1 to enable it.");
        }
        console.log("\n[smoke] Generated app smoke test passed.");
        return {
            appDirectory: appDir,
            workDirectory: context.workDir,
            composeProjectName,
            ranE2e: runE2e,
            steps,
        };
    }
    finally {
        await cleanupSmokeTest(context, {
            keepArtifacts: options.keepArtifacts,
        });
    }
}
//# sourceMappingURL=runGeneratedAppSmokeTest.js.map