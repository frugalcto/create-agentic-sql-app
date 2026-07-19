import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildGenerationRequest } from "../src/buildGenerationRequest.js";
import type { PromptRunner } from "../src/prompts.js";

function createMockPromptRunner(
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

describe("buildGenerationRequest", () => {
  let testRoot = "";

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "build-generation-request-"));
  });

  afterEach(async () => {
    if (testRoot) {
      await rm(testRoot, { recursive: true, force: true });
    }
  });

  it("attaches an overwrite confirmation handler in interactive mode", async () => {
    const confirmOverwrite = vi.fn().mockResolvedValue(true);
    const request = await buildGenerationRequest(
      "occupied-app",
      { api: "express", skipInstall: true, git: false },
      {
        isInteractive: true,
        cwd: testRoot,
        promptRunner: createMockPromptRunner(),
        overwriteRunner: {
          confirmOverwrite: async () => confirmOverwrite(),
        },
      },
    );

    expect(request.confirmOverwrite).toBeTypeOf("function");
    await request.confirmOverwrite?.();

    expect(confirmOverwrite).toHaveBeenCalledOnce();
  });

  it("omits overwrite confirmation in non-interactive mode", async () => {
    const request = await buildGenerationRequest(
      "occupied-app",
      { api: "express" },
      {
        isInteractive: false,
        cwd: testRoot,
      },
    );

    expect(request.confirmOverwrite).toBeUndefined();
  });

  it("resolves the target directory for overwrite prompts", async () => {
    const projectDirectory = join(testRoot, "occupied-app");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "existing.txt"), "keep", "utf8");

    let promptedDirectory = "";
    const request = await buildGenerationRequest(
      "occupied-app",
      { skipInstall: true, git: false, api: "express" },
      {
        isInteractive: true,
        cwd: testRoot,
        promptRunner: createMockPromptRunner(),
        overwriteRunner: {
          async confirmOverwrite(projectDirectoryArg: string) {
            promptedDirectory = projectDirectoryArg;
            return true;
          },
        },
      },
    );

    await request.confirmOverwrite?.();
    expect(promptedDirectory).toBe(projectDirectory);
  });
});
