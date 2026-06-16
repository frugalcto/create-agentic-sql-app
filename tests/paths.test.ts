import { describe, expect, it } from "vitest";

import { resolveSharedTemplateDirectory, resolveTemplateDirectory } from "../src/util/paths.js";

describe("resolveTemplateDirectory", () => {
  it("resolves Express base template", () => {
    expect(resolveTemplateDirectory("express", "base")).toMatch(
      /templates\/base-express$/,
    );
  });

  it("resolves Fastify base template", () => {
    expect(resolveTemplateDirectory("fastify", "base")).toMatch(
      /templates\/base-fastify$/,
    );
  });

  it("resolves release-risk Express template", () => {
    expect(resolveTemplateDirectory("express", "release-risk")).toMatch(
      /templates\/release-risk-express$/,
    );
  });

  it("resolves release-risk Fastify template", () => {
    expect(resolveTemplateDirectory("fastify", "release-risk")).toMatch(
      /templates\/release-risk-fastify$/,
    );
  });
});

describe("resolveSharedTemplateDirectory", () => {
  it("resolves shared template assets", () => {
    expect(resolveSharedTemplateDirectory()).toMatch(/templates\/shared$/);
  });
});
