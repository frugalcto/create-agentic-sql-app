import { describe, expect, it } from "vitest";

import { detectPackageManager } from "../src/util/detectPackageManager.js";

describe("detectPackageManager", () => {
  it("detects pnpm from npm user agent", () => {
    expect(
      detectPackageManager("/tmp", {
        npm_config_user_agent: "pnpm/9.0.0",
      }),
    ).toBe("pnpm");
  });

  it("detects yarn from npm user agent", () => {
    expect(
      detectPackageManager("/tmp", {
        npm_config_user_agent: "yarn/1.22.0",
      }),
    ).toBe("yarn");
  });

  it("defaults to npm when no signals are present", () => {
    expect(detectPackageManager("/tmp", {})).toBe("npm");
  });
});
