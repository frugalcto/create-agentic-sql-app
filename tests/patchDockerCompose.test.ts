import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { patchDockerComposeContainerName } from "../src/smoke/patchDockerCompose.js";

describe("patchDockerComposeContainerName", () => {
  let workDir = "";

  beforeEach(async () => {
    workDir = await mkdtemp(join(tmpdir(), "smoke-compose-patch-"));
    await writeFile(
      join(workDir, "docker-compose.yml"),
      [
        "services:",
        "  postgres:",
        "    image: postgres:16",
        "    container_name: agentic_sql_postgres",
      ].join("\n"),
      "utf8",
    );
  });

  afterEach(async () => {
    if (workDir) {
      await rm(workDir, { recursive: true, force: true });
    }
  });

  it("replaces the default container name with a unique smoke name", async () => {
    await patchDockerComposeContainerName(workDir, "agentic_smoke_demo");

    const content = await readFile(join(workDir, "docker-compose.yml"), "utf8");
    expect(content).toContain("container_name: agentic_smoke_demo");
    expect(content).not.toContain("container_name: agentic_sql_postgres");
  });
});
