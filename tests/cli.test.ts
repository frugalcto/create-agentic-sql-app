import { describe, expect, it } from "vitest";

import { normalizeCliOptions } from "../src/cli.js";

describe("normalizeCliOptions", () => {
  it("applies defaults for omitted flags", () => {
    const normalized = normalizeCliOptions("demo-app", {});

    expect(normalized).toEqual({
      projectName: "demo-app",
      api: "express",
      auth: false,
      dbTests: "integration",
      template: "base",
      packageManager: "npm",
      install: true,
      gitInit: true,
    });
  });

  it("maps skip-install to install=false", () => {
    const normalized = normalizeCliOptions("demo-app", { skipInstall: true });
    expect(normalized.install).toBe(false);
  });

  it("maps no-git to gitInit=false", () => {
    const normalized = normalizeCliOptions("demo-app", { git: false });
    expect(normalized.gitInit).toBe(false);
  });

  it("accepts all valid explicit options", () => {
    const normalized = normalizeCliOptions("my-app", {
      api: "fastify",
      dbTests: "pgtap",
      template: "release-risk",
      packageManager: "pnpm",
    });

    expect(normalized.api).toBe("fastify");
    expect(normalized.dbTests).toBe("pgtap");
    expect(normalized.template).toBe("release-risk");
    expect(normalized.packageManager).toBe("pnpm");
  });

  it("rejects invalid api option values", () => {
    expect(() =>
      normalizeCliOptions("demo-app", {
        api: "koa",
      }),
    ).toThrow("Invalid --api value: koa");
  });

  it("rejects invalid db-tests option values", () => {
    expect(() =>
      normalizeCliOptions("demo-app", {
        dbTests: "unit",
      }),
    ).toThrow("Invalid --db-tests value: unit");
  });

  it("rejects invalid template option values", () => {
    expect(() =>
      normalizeCliOptions("demo-app", {
        template: "enterprise",
      }),
    ).toThrow("Invalid --template value: enterprise");
  });

  it("maps --auth to auth=true", () => {
    const normalized = normalizeCliOptions("demo-app", { auth: true });
    expect(normalized.auth).toBe(true);
  });

  it("rejects invalid package manager option values", () => {
    expect(() =>
      normalizeCliOptions("demo-app", {
        packageManager: "bun",
      }),
    ).toThrow("Invalid --package-manager value: bun");
  });
});
