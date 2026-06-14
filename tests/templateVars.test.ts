import { describe, expect, it } from "vitest";

import {
  applyTemplateVariables,
  createTemplateVariables,
  toPackageName,
} from "../src/templateVars.js";

describe("templateVars", () => {
  it("creates package-safe names", () => {
    expect(toPackageName("My-Demo-App")).toBe("my-demo-app");
  });

  it("replaces project placeholders", () => {
    const variables = createTemplateVariables("My-Demo-App");
    const output = applyTemplateVariables(
      "Name: __PROJECT_NAME__ Package: __PROJECT_NAME_PKG__",
      variables,
    );

    expect(output).toBe("Name: My-Demo-App Package: my-demo-app");
  });

  it("replaces database test style placeholders", () => {
    const variables = createTemplateVariables("demo-app", "pgtap");
    const output = applyTemplateVariables(
      "Style: __DB_TEST_STYLE__ Description: __DB_TEST_STYLE_DESCRIPTION__",
      variables,
    );

    expect(output).toContain("Style: pgTAP");
    expect(output).toContain("pg_prove");
  });
});
