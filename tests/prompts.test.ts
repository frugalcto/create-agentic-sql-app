import { describe, expect, it, vi } from "vitest";

import {
  createConfirmOverwriteHandler,
  NonInteractiveError,
  promptForMissingValues,
  type PromptRunner,
} from "../src/prompts.js";

function createMockRunner(
  overrides: Partial<PromptRunner> = {},
): PromptRunner {
  return {
    projectName: vi.fn().mockResolvedValue("prompted-app"),
    apiFramework: vi.fn().mockResolvedValue("fastify"),
    dbTestStyle: vi.fn().mockResolvedValue("pgtap"),
    template: vi.fn().mockResolvedValue("release-risk"),
    installDependencies: vi.fn().mockResolvedValue(false),
    initializeGit: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe("promptForMissingValues", () => {
  it("uses explicit flags without prompting", async () => {
    const runner = createMockRunner();

    const result = await promptForMissingValues(
      {
        projectName: "flagged-app",
        api: "fastify",
        dbTests: "pgtap",
        template: "release-risk",
        skipInstall: true,
        git: false,
      },
      { isInteractive: true, runner },
    );

    expect(result).toEqual({
      projectName: "flagged-app",
      api: "fastify",
      dbTests: "pgtap",
      template: "release-risk",
      install: false,
      gitInit: false,
    });
    expect(runner.projectName).not.toHaveBeenCalled();
    expect(runner.apiFramework).not.toHaveBeenCalled();
    expect(runner.dbTestStyle).not.toHaveBeenCalled();
    expect(runner.template).not.toHaveBeenCalled();
    expect(runner.installDependencies).not.toHaveBeenCalled();
    expect(runner.initializeGit).not.toHaveBeenCalled();
  });

  it("prompts for project name when it is missing", async () => {
    const runner = createMockRunner();

    const result = await promptForMissingValues(
      {},
      { isInteractive: true, runner },
    );

    expect(result.projectName).toBe("prompted-app");
    expect(runner.projectName).toHaveBeenCalledOnce();
    expect(runner.apiFramework).toHaveBeenCalledOnce();
    expect(runner.dbTestStyle).toHaveBeenCalledOnce();
    expect(runner.template).toHaveBeenCalledOnce();
    expect(runner.installDependencies).toHaveBeenCalledOnce();
    expect(runner.initializeGit).toHaveBeenCalledOnce();
  });

  it("fails clearly in non-interactive mode without a project name", async () => {
    const runner = createMockRunner();

    await expect(
      promptForMissingValues({}, { isInteractive: false, runner }),
    ).rejects.toThrow(NonInteractiveError);

    await expect(
      promptForMissingValues({}, { isInteractive: false, runner }),
    ).rejects.toThrow(
      "Project name is required. Pass it as the first argument or run the CLI in an interactive terminal.",
    );

    expect(runner.projectName).not.toHaveBeenCalled();
  });

  it("applies non-interactive defaults for omitted options", async () => {
    const runner = createMockRunner();

    const result = await promptForMissingValues(
      { projectName: "ci-app" },
      { isInteractive: false, runner },
    );

    expect(result).toEqual({
      projectName: "ci-app",
      api: "express",
      dbTests: "integration",
      template: "base",
      install: true,
      gitInit: true,
    });
    expect(runner.apiFramework).not.toHaveBeenCalled();
  });

  it("honors skip-install without prompting", async () => {
    const runner = createMockRunner();

    const result = await promptForMissingValues(
      { projectName: "no-install-app", skipInstall: true },
      { isInteractive: true, runner },
    );

    expect(result.install).toBe(false);
    expect(runner.installDependencies).not.toHaveBeenCalled();
  });

  it("returns no overwrite handler outside interactive mode", () => {
    const handler = createConfirmOverwriteHandler("/tmp/demo-app", {
      isInteractive: false,
    });

    expect(handler).toBeUndefined();
  });

  it("prompts for overwrite confirmation in interactive mode", async () => {
    const confirmOverwrite = vi.fn().mockResolvedValue(true);
    const handler = createConfirmOverwriteHandler("/tmp/demo-app", {
      isInteractive: true,
      runner: {
        confirmOverwrite: async (projectDirectory: string) =>
          confirmOverwrite(projectDirectory),
      },
    });

    await expect(handler?.()).resolves.toBe(true);
    expect(confirmOverwrite).toHaveBeenCalledWith("/tmp/demo-app");
  });

  it("can disable git initialization with --no-git", async () => {
    const runner = createMockRunner();

    const result = await promptForMissingValues(
      { projectName: "no-git-app", git: false },
      { isInteractive: true, runner },
    );

    expect(result.gitInit).toBe(false);
    expect(runner.initializeGit).not.toHaveBeenCalled();
  });
});
