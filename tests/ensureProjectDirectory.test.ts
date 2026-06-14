import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  ensureProjectDirectory,
  resolveProjectDirectory,
} from "../src/util/ensureProjectDirectory.js";

describe("resolveProjectDirectory", () => {
  it("resolves a child directory under cwd", () => {
    const cwd = "/tmp/projects";
    expect(resolveProjectDirectory("my-app", cwd)).toBe(
      join("/tmp/projects", "my-app"),
    );
  });
});

describe("ensureProjectDirectory", () => {
  let testRoot = "";

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "create-agentic-sql-app-dir-"));
  });

  afterEach(async () => {
    if (testRoot) {
      await rm(testRoot, { recursive: true, force: true });
    }
  });

  it("creates a missing directory", async () => {
    const projectDirectory = join(testRoot, "fresh-app");
    const state = await ensureProjectDirectory(projectDirectory);

    expect(state).toBe("created");
  });

  it("allows an empty existing directory", async () => {
    const projectDirectory = join(testRoot, "empty-app");
    await mkdir(projectDirectory, { recursive: true });

    const state = await ensureProjectDirectory(projectDirectory);

    expect(state).toBe("exists_empty");
  });

  it("rejects a non-empty directory", async () => {
    const projectDirectory = join(testRoot, "busy-app");
    await mkdir(projectDirectory, { recursive: true });
    await writeFile(join(projectDirectory, "file.txt"), "data");

    await expect(ensureProjectDirectory(projectDirectory)).rejects.toThrow(
      "is not empty",
    );
  });
});
