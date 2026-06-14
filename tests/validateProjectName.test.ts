import { describe, expect, it } from "vitest";

import { validateProjectName } from "../src/util/validateProjectName.js";

describe("validateProjectName", () => {
  it("accepts valid project names", () => {
    expect(validateProjectName("my-app")).toBe("my-app");
    expect(validateProjectName(" demo_app ")).toBe("demo_app");
  });

  it("rejects missing project names", () => {
    expect(() => validateProjectName("")).toThrow("Project name is required.");
    expect(() => validateProjectName("   ")).toThrow("Project name is required.");
  });

  it("rejects invalid project names", () => {
    expect(() => validateProjectName("my app")).toThrow("Invalid project name:");
    expect(() => validateProjectName("-leading-hyphen")).toThrow(
      "Invalid project name:",
    );
    expect(() => validateProjectName("name!")).toThrow("Invalid project name:");
  });

  it("rejects path traversal patterns", () => {
    expect(() => validateProjectName("..")).toThrow(
      "Invalid project name: path traversal is not allowed.",
    );
    expect(() => validateProjectName(".")).toThrow(
      "Invalid project name: path traversal is not allowed.",
    );
    expect(() => validateProjectName("../escape")).toThrow(
      "Invalid project name: path separators are not allowed.",
    );
    expect(() => validateProjectName("foo/bar")).toThrow(
      "Invalid project name: path separators are not allowed.",
    );
    expect(() => validateProjectName("foo\\bar")).toThrow(
      "Invalid project name: path separators are not allowed.",
    );
    expect(() => validateProjectName("foo..bar")).toThrow(
      "Invalid project name: path traversal is not allowed.",
    );
  });
});
