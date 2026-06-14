import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { copyTemplate } from "../src/copyTemplate.js";
import { createTemplateVariables } from "../src/templateVars.js";

describe("copyTemplate", () => {
  let testRoot = "";
  let templateDirectory = "";
  let destinationDirectory = "";

  beforeEach(async () => {
    testRoot = await mkdtemp(join(tmpdir(), "create-agentic-sql-app-copy-"));
    templateDirectory = join(testRoot, "template");
    destinationDirectory = join(testRoot, "output");

    await mkdir(templateDirectory, { recursive: true });
    await writeFile(
      join(templateDirectory, "README.md"),
      "Project __PROJECT_NAME__ package __PROJECT_NAME_PKG__",
      "utf8",
    );
    await writeFile(
      join(templateDirectory, "_package.json"),
      '{"name":"__PROJECT_NAME_PKG__"}',
      "utf8",
    );
    await writeFile(join(templateDirectory, "_gitignore"), "node_modules\n", "utf8");
  });

  afterEach(async () => {
    if (testRoot) {
      await rm(testRoot, { recursive: true, force: true });
    }
  });

  it("renames underscore files and applies placeholders", async () => {
    await copyTemplate(
      templateDirectory,
      destinationDirectory,
      createTemplateVariables("My-App"),
    );

    const readme = await readFile(join(destinationDirectory, "README.md"), "utf8");
    const packageJson = await readFile(
      join(destinationDirectory, "package.json"),
      "utf8",
    );
    const gitignore = await readFile(
      join(destinationDirectory, ".gitignore"),
      "utf8",
    );

    expect(readme).toContain("Project My-App package my-app");
    expect(packageJson).toContain('"name":"my-app"');
    expect(gitignore).toContain("node_modules");
  });
});
