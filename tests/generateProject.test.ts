import { access, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  generateProject,
  type GenerateProjectOptions,
} from "../src/generateProject.js";
import { initializeGit } from "../src/initializeGit.js";
import { installDependencies } from "../src/installDependencies.js";
import {
  REQUIRED_CURSOR_AGENT_FILES,
  REQUIRED_DOCUMENTATION_FILES,
  REQUIRED_ROOT_SCRIPTS,
} from "../src/templateContract.js";

vi.mock("../src/installDependencies.js", () => ({
  installDependencies: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../src/initializeGit.js", () => ({
  initializeGit: vi.fn().mockResolvedValue(undefined),
}));

function createBaseOptions(
  overrides: Partial<GenerateProjectOptions> = {},
): GenerateProjectOptions {
  return {
    projectName: "my-app",
    api: "express",
    dbTests: "integration",
    template: "base",
    packageManager: "npm",
    install: true,
    gitInit: false,
    ...overrides,
  };
}

describe("generateProject", () => {
  let testRoot = "";

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "create-agentic-sql-app-"));
    vi.mocked(installDependencies).mockClear();
    vi.mocked(initializeGit).mockClear();
  });

  afterEach(async () => {
    if (testRoot) {
      await rm(testRoot, { recursive: true, force: true });
    }
  });

  it("returns completion output with next steps", async () => {
    const result = await generateProject(createBaseOptions({ cwd: testRoot }));

    expect(result.message).toContain("Created my-app.");
    expect(result.message).toContain("cd my-app");
    expect(result.message).toContain("cp .env.example .env");
    expect(result.message).toContain("npm run db:up");
    expect(result.message).toContain("scripts/cursor-prompts/001-orientation.md");
    expect(result.message).toContain("/tech-spec-architect");
  });

  it("rejects invalid API values at generator boundary", async () => {
    const options = {
      ...createBaseOptions({ cwd: testRoot }),
      api: "koa",
    } as unknown as GenerateProjectOptions;

    await expect(generateProject(options)).rejects.toThrow(
      "Unsupported api option: koa",
    );
  });

  it("creates project directory", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "new-app",
        cwd: testRoot,
      }),
    );

    expect(result.projectDirectory).toBe(join(testRoot, "new-app"));
    expect(result.directoryState).toBe("created");
  });

  it("rejects invalid project name", async () => {
    await expect(
      generateProject(
        createBaseOptions({
          projectName: "bad name",
          cwd: testRoot,
        }),
      ),
    ).rejects.toThrow("Invalid project name:");
  });

  it("rejects path traversal project names", async () => {
    await expect(
      generateProject(
        createBaseOptions({
          projectName: "../escape",
          cwd: testRoot,
        }),
      ),
    ).rejects.toThrow("Invalid project name: path separators are not allowed.");
  });

  it("rejects non-empty directory without confirmation", async () => {
    const projectDirectory = join(testRoot, "occupied-app");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "existing.txt"), "keep me");

    await expect(
      generateProject(
        createBaseOptions({
          projectName: "occupied-app",
          cwd: testRoot,
        }),
      ),
    ).rejects.toThrow(
      'Cannot generate project: "' + projectDirectory + '" is not empty. Choose a different name or confirm overwrite.',
    );
  });

  it("allows empty existing directory", async () => {
    const projectDirectory = join(testRoot, "empty-app");
    await mkdir(projectDirectory, { recursive: true });

    const result = await generateProject(
      createBaseOptions({
        projectName: "empty-app",
        cwd: testRoot,
      }),
    );

    expect(result.projectDirectory).toBe(projectDirectory);
    expect(result.directoryState).toBe("exists_empty");
  });

  it("allows non-empty directory only with explicit overwrite confirmation", async () => {
    const projectDirectory = join(testRoot, "overwrite-app");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "existing.txt"), "keep me");

    const result = await generateProject(
      createBaseOptions({
        projectName: "overwrite-app",
        cwd: testRoot,
        confirmOverwrite: async () => true,
      }),
    );

    expect(result.directoryState).toBe("overwrite_confirmed");
  });

  it("cancels when overwrite confirmation is declined", async () => {
    const projectDirectory = join(testRoot, "declined-app");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "existing.txt"), "keep me");

    await expect(
      generateProject(
        createBaseOptions({
          projectName: "declined-app",
          cwd: testRoot,
          confirmOverwrite: async () => false,
        }),
      ),
    ).rejects.toThrow(
      'Cannot generate project: "' + projectDirectory + '" is not empty. Generation cancelled.',
    );
  });
});

describe("generateProject template copying", () => {
  let testRoot = "";

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "create-agentic-sql-app-template-"));
    vi.mocked(installDependencies).mockClear();
  });

  afterEach(async () => {
    if (testRoot) {
      await rm(testRoot, { recursive: true, force: true });
    }
  });

  it("generates Express template", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "demo-app",
        cwd: testRoot,
        install: false,
      }),
    );

    await expect(access(join(result.projectDirectory, "server/src/index.ts"))).resolves.toBeUndefined();
    await expect(access(join(result.projectDirectory, "web/src/main.tsx"))).resolves.toBeUndefined();
    await expect(access(join(result.projectDirectory, "docker-compose.yml"))).resolves.toBeUndefined();
  });

  it("applies project name replacements", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "My-Demo-App",
        cwd: testRoot,
        install: false,
      }),
    );

    const readme = await readFile(join(result.projectDirectory, "README.md"), "utf8");
    const packageJson = JSON.parse(
      await readFile(join(result.projectDirectory, "package.json"), "utf8"),
    ) as { name: string; description: string };

    expect(readme).toContain("# My-Demo-App");
    expect(packageJson.name).toBe("my-demo-app");
    expect(packageJson.description).toContain("My-Demo-App");
    expect(readme).not.toContain("__PROJECT_NAME__");
  });

  it("respects --skip-install", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "skip-install-app",
        cwd: testRoot,
        install: false,
      }),
    );

    expect(installDependencies).toHaveBeenCalledWith({
      enabled: false,
      packageManager: "npm",
      projectDirectory: result.projectDirectory,
    });
  });

  it("installs dependencies when install is enabled", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "install-app",
        cwd: testRoot,
        install: true,
      }),
    );

    expect(installDependencies).toHaveBeenCalledWith({
      enabled: true,
      packageManager: "npm",
      projectDirectory: result.projectDirectory,
    });
  });

  it("passes pnpm to installDependencies when selected", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "pnpm-install-app",
        packageManager: "pnpm",
        cwd: testRoot,
        install: true,
      }),
    );

    expect(installDependencies).toHaveBeenCalledWith({
      enabled: true,
      packageManager: "pnpm",
      projectDirectory: result.projectDirectory,
    });
  });

  it("passes yarn to installDependencies when selected", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "yarn-install-app",
        packageManager: "yarn",
        cwd: testRoot,
        install: true,
      }),
    );

    expect(installDependencies).toHaveBeenCalledWith({
      enabled: true,
      packageManager: "yarn",
      projectDirectory: result.projectDirectory,
    });
  });

  it("skips git initialization when gitInit is disabled", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "no-git-app",
        cwd: testRoot,
        gitInit: false,
      }),
    );

    expect(initializeGit).toHaveBeenCalledWith({
      enabled: false,
      projectDirectory: result.projectDirectory,
    });
  });

  it("initializes git when gitInit is enabled", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "git-app",
        cwd: testRoot,
        gitInit: true,
      }),
    );

    expect(initializeGit).toHaveBeenCalledWith({
      enabled: true,
      projectDirectory: result.projectDirectory,
    });
  });

  it("includes required documentation files", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "docs-app",
        cwd: testRoot,
        install: false,
      }),
    );

    for (const fileName of REQUIRED_DOCUMENTATION_FILES) {
      await expect(
        access(join(result.projectDirectory, fileName)),
      ).resolves.toBeUndefined();
    }
  });

  it("includes required Cursor agent definitions", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "agents-app",
        cwd: testRoot,
        install: false,
      }),
    );

    for (const fileName of REQUIRED_CURSOR_AGENT_FILES) {
      await expect(
        access(join(result.projectDirectory, fileName)),
      ).resolves.toBeUndefined();
    }

    const agentDefinition = await readFile(
      join(result.projectDirectory, ".cursor/agents/tech-spec-architect.md"),
      "utf8",
    );

    expect(agentDefinition).toContain("name: tech-spec-architect");
    expect(agentDefinition).toContain(
      "Agent Definition: Agentic PostgreSQL Tech Spec Architect",
    );
  });

  it("excludes Playwright specs from base template web tests", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "vitest-config-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const vitestConfig = await readFile(
      join(result.projectDirectory, "web/vitest.config.ts"),
      "utf8",
    );

    expect(vitestConfig).toContain('exclude: ["e2e/**"');
  });

  it("includes pnpm workspace config for pnpm compatibility", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "pnpm-workspace-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const workspaceConfig = await readFile(
      join(result.projectDirectory, "pnpm-workspace.yaml"),
      "utf8",
    );

    expect(workspaceConfig).toContain("server");
    expect(workspaceConfig).toContain("web");
  });

  it("maps lint to typecheck without requiring ESLint", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "lint-alias-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const packageJson = JSON.parse(
      await readFile(join(result.projectDirectory, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    expect(packageJson.scripts.lint).toBe("npm run typecheck");
  });

  it("includes required root scripts", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "scripts-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const packageJson = JSON.parse(
      await readFile(join(result.projectDirectory, "package.json"), "utf8"),
    ) as { scripts: Record<string, string> };

    for (const scriptName of REQUIRED_ROOT_SCRIPTS) {
      expect(packageJson.scripts[scriptName]).toBeTruthy();
    }
  });

  it("generates Fastify template", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "fastify-app",
        api: "fastify",
        cwd: testRoot,
        install: false,
      }),
    );

    const packageJson = JSON.parse(
      await readFile(
        join(result.projectDirectory, "server/package.json"),
        "utf8",
      ),
    ) as { dependencies: Record<string, string> };

    expect(packageJson.dependencies.fastify).toBeTruthy();
    expect(packageJson.dependencies.express).toBeUndefined();

    const appSource = await readFile(
      join(result.projectDirectory, "server/src/app.ts"),
      "utf8",
    );
    expect(appSource).toContain("Fastify");
  });

  it("defaults to Express template", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "express-default-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const packageJson = JSON.parse(
      await readFile(
        join(result.projectDirectory, "server/package.json"),
        "utf8",
      ),
    ) as { dependencies: Record<string, string> };

    expect(packageJson.dependencies.express).toBeTruthy();
    expect(packageJson.dependencies.fastify).toBeUndefined();
    expect(result.options.api).toBe("express");
  });

  it("uses release-risk orientation prompt wording", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "release-risk-orientation-app",
        template: "release-risk",
        cwd: testRoot,
        install: false,
      }),
    );

    const orientationPrompt = await readFile(
      join(
        result.projectDirectory,
        "scripts/cursor-prompts/001-orientation.md",
      ),
      "utf8",
    );

    expect(orientationPrompt).toContain("release-risk domain");
    expect(orientationPrompt).not.toContain("sample domain");
  });

  it("generates release-risk Express template", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "release-risk-app",
        template: "release-risk",
        cwd: testRoot,
        install: false,
      }),
    );

    const contract = await readFile(
      join(result.projectDirectory, "DB_API_CONTRACT.md"),
      "utf8",
    );
    const migration = await readFile(
      join(
        result.projectDirectory,
        "db/migrations/004_release_risk_procedures.sql",
      ),
      "utf8",
    );

    expect(contract).toContain("GET /api/release-risk-dashboard");
    expect(migration).toContain("app_calculate_release_risk");
    expect(result.options.template).toBe("release-risk");
  });

  it("generates release-risk Fastify template", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "release-risk-fastify-app",
        api: "fastify",
        template: "release-risk",
        cwd: testRoot,
        install: false,
      }),
    );

    const packageJson = JSON.parse(
      await readFile(
        join(result.projectDirectory, "server/package.json"),
        "utf8",
      ),
    ) as { dependencies: Record<string, string> };

    expect(packageJson.dependencies.fastify).toBeTruthy();
    expect(
      await readFile(
        join(result.projectDirectory, "server/src/routes/release-risk.routes.ts"),
        "utf8",
      ),
    ).toContain("app_get_release_risk_dashboard");
  });

  it("defaults to base template", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "base-default-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const contract = await readFile(
      join(result.projectDirectory, "DB_API_CONTRACT.md"),
      "utf8",
    );

    expect(contract).toContain("GET /api/sample-dashboard");
    expect(result.options.template).toBe("base");
  });

  it("defaults to SQL integration database tests", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "integration-db-app",
        cwd: testRoot,
        install: false,
      }),
    );

    const healthTest = await readFile(
      join(result.projectDirectory, "db/tests/app_health.test.sql"),
      "utf8",
    );
    const testDbScript = await readFile(
      join(result.projectDirectory, "db/scripts/test-db.ts"),
      "utf8",
    );
    const testingStrategy = await readFile(
      join(result.projectDirectory, "TESTING_STRATEGY.md"),
      "utf8",
    );
    const dockerCompose = await readFile(
      join(result.projectDirectory, "docker-compose.yml"),
      "utf8",
    );

    expect(healthTest).toContain("do $$");
    expect(testDbScript).toContain("withDatabaseClient");
    expect(testDbScript).not.toContain("pg_prove");
    expect(testingStrategy).toContain("SQL integration tests");
    expect(dockerCompose).toContain("image: postgres:16");
    await expect(
      access(join(result.projectDirectory, "db/tests-pgtap")),
    ).rejects.toThrow();
  });

  it("generates pgTAP database tests when --db-tests pgtap is selected", async () => {
    const result = await generateProject(
      createBaseOptions({
        projectName: "pgtap-db-app",
        dbTests: "pgtap",
        cwd: testRoot,
        install: false,
      }),
    );

    const healthTest = await readFile(
      join(result.projectDirectory, "db/tests/app_health.test.sql"),
      "utf8",
    );
    const setupSql = await readFile(
      join(result.projectDirectory, "db/tests/setup.sql"),
      "utf8",
    );
    const testDbScript = await readFile(
      join(result.projectDirectory, "db/scripts/test-db.ts"),
      "utf8",
    );
    const testingStrategy = await readFile(
      join(result.projectDirectory, "TESTING_STRATEGY.md"),
      "utf8",
    );
    const dockerCompose = await readFile(
      join(result.projectDirectory, "docker-compose.yml"),
      "utf8",
    );

    expect(healthTest).toContain("SELECT plan");
    expect(healthTest).not.toContain("do $$");
    expect(setupSql).toContain("CREATE EXTENSION IF NOT EXISTS pgtap");
    expect(testDbScript).toContain("pg_prove");
    expect(testingStrategy).toContain("pgTAP");
    expect(dockerCompose).toContain("postgres-pgtap.Dockerfile");
    expect(dockerCompose).toContain("/pgtap-tests");
    await expect(
      access(join(result.projectDirectory, "db/tests-pgtap")),
    ).rejects.toThrow();
    await expect(
      access(join(result.projectDirectory, "db/scripts/test-db.pgtap.ts")),
    ).rejects.toThrow();
  });
});
