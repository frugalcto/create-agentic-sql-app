import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("execa", () => ({
  execa: vi.fn(),
}));

import { execa } from "execa";

import { isPackageManagerAvailable } from "../src/util/isPackageManagerAvailable.js";

describe("isPackageManagerAvailable", () => {
  afterEach(() => {
    vi.mocked(execa).mockReset();
  });

  it("returns true when the executable responds successfully", async () => {
    vi.mocked(execa).mockResolvedValue({ exitCode: 0 } as never);

    await expect(isPackageManagerAvailable("pnpm")).resolves.toBe(true);
    expect(execa).toHaveBeenCalledWith("pnpm", ["--version"], {
      stdio: "pipe",
      reject: false,
    });
  });

  it("returns false when the executable is missing", async () => {
    vi.mocked(execa).mockResolvedValue({ exitCode: 1 } as never);

    await expect(isPackageManagerAvailable("yarn")).resolves.toBe(false);
  });
});
