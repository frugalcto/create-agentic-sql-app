import { execa } from "execa";

import type { PackageManager } from "./generateProject.js";

export interface InstallDependenciesOptions {
  enabled: boolean;
  packageManager: PackageManager;
  projectDirectory: string;
}

export async function installDependencies(
  options: InstallDependenciesOptions,
): Promise<void> {
  if (!options.enabled) {
    return;
  }

  const installCommand = options.packageManager === "yarn" ? [] : ["install"];

  await execa(options.packageManager, installCommand, {
    cwd: options.projectDirectory,
    stdio: "inherit",
  });
}
