import { execa } from "execa";

import type { PackageManager } from "../generateProject.js";

export async function isPackageManagerAvailable(
  packageManager: PackageManager,
): Promise<boolean> {
  const result = await execa(packageManager, ["--version"], {
    stdio: "pipe",
    reject: false,
  });

  return result.exitCode === 0;
}
