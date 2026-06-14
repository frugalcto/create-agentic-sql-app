import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn().mockResolvedValue({ exitCode: 0 }),
}));

import { execa } from "execa";

import { installDependencies } from "../src/installDependencies.js";

describe("installDependencies", () => {
  afterEach(() => {
    vi.mocked(execa).mockClear();
  });

  it("skips installation when disabled", async () => {
    await installDependencies({
      enabled: false,
      packageManager: "npm",
      projectDirectory: "/tmp/demo-app",
    });

    expect(execa).not.toHaveBeenCalled();
  });

  it("runs npm install in the project directory", async () => {
    await installDependencies({
      enabled: true,
      packageManager: "npm",
      projectDirectory: "/tmp/npm-app",
    });

    expect(execa).toHaveBeenCalledWith("npm", ["install"], {
      cwd: "/tmp/npm-app",
      stdio: "inherit",
    });
  });

  it("runs pnpm install in the project directory", async () => {
    await installDependencies({
      enabled: true,
      packageManager: "pnpm",
      projectDirectory: "/tmp/pnpm-app",
    });

    expect(execa).toHaveBeenCalledWith("pnpm", ["install"], {
      cwd: "/tmp/pnpm-app",
      stdio: "inherit",
    });
  });

  it("runs yarn without an install subcommand", async () => {
    await installDependencies({
      enabled: true,
      packageManager: "yarn",
      projectDirectory: "/tmp/yarn-app",
    });

    expect(execa).toHaveBeenCalledWith("yarn", [], {
      cwd: "/tmp/yarn-app",
      stdio: "inherit",
    });
  });
});
