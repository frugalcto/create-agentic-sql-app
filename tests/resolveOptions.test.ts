import { describe, expect, it, vi } from "vitest";

import { resolveGenerationOptions } from "../src/resolveOptions.js";
import type { PromptRunner } from "../src/prompts.js";

function createMockRunner(
  overrides: Partial<PromptRunner> = {},
): PromptRunner {
  return {
    projectName: vi.fn().mockResolvedValue("prompted-app"),
    apiFramework: vi.fn().mockResolvedValue("express"),
    authMode: vi.fn().mockResolvedValue(false),
    dbTestStyle: vi.fn().mockResolvedValue("integration"),
    template: vi.fn().mockResolvedValue("base"),
    installDependencies: vi.fn().mockResolvedValue(true),
    initializeGit: vi.fn().mockResolvedValue(true),
    ...overrides,
  };
}

describe("resolveGenerationOptions", () => {
  it("merges explicit flags with auto-detected package manager", async () => {
    const runner = createMockRunner();

    const result = await resolveGenerationOptions(
      "demo-app",
      {
        api: "fastify",
        dbTests: "pgtap",
        template: "release-risk",
        skipInstall: true,
        git: false,
      },
      { isInteractive: true, runner, cwd: "/tmp/demo" },
    );

    expect(result).toEqual({
      projectName: "demo-app",
      api: "fastify",
      auth: false,
      dbTests: "pgtap",
      template: "release-risk",
      packageManager: "npm",
      install: false,
      gitInit: false,
    });
    expect(runner.apiFramework).not.toHaveBeenCalled();
  });

  it("respects an explicit package manager flag", async () => {
    const result = await resolveGenerationOptions(
      "demo-app",
      { packageManager: "pnpm" },
      { isInteractive: false },
    );

    expect(result.packageManager).toBe("pnpm");
  });
});
