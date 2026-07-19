import { access } from "node:fs/promises";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { execa } from "execa";

import { generateProject } from "../generateProject.js";
import type { PackageManager } from "../generateProject.js";
import { installDependencies } from "../installDependencies.js";
import { toPackageName } from "../templateVars.js";
import { isPackageManagerAvailable } from "../util/isPackageManagerAvailable.js";

const VERIFY_PACKAGE_MANAGERS: PackageManager[] = ["pnpm", "yarn"];

export interface PackageManagerVerificationResult {
  packageManager: PackageManager;
  projectDirectory: string;
  workDirectory: string;
  skipped: boolean;
}

export interface PackageManagerVerificationSummary {
  results: PackageManagerVerificationResult[];
  skippedManagers: PackageManager[];
  verifiedManagers: PackageManager[];
}

async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function runGeneratedTypecheck(
  packageManager: PackageManager,
  projectDirectory: string,
  projectName: string,
): Promise<void> {
  const packageName = toPackageName(projectName);
  const serverWorkspace = `@${packageName}/server`;
  const webWorkspace = `@${packageName}/web`;

  if (packageManager === "npm") {
    await execa("npm", ["run", "typecheck", "-w", "server"], {
      cwd: projectDirectory,
      stdio: "inherit",
    });
    await execa("npm", ["run", "typecheck", "-w", "web"], {
      cwd: projectDirectory,
      stdio: "inherit",
    });
    return;
  }

  if (packageManager === "pnpm") {
    await execa("pnpm", ["--filter", serverWorkspace, "run", "typecheck"], {
      cwd: projectDirectory,
      stdio: "inherit",
    });
    await execa("pnpm", ["--filter", webWorkspace, "run", "typecheck"], {
      cwd: projectDirectory,
      stdio: "inherit",
    });
    return;
  }

  await execa("yarn", ["workspace", serverWorkspace, "run", "typecheck"], {
    cwd: projectDirectory,
    stdio: "inherit",
  });
  await execa("yarn", ["workspace", webWorkspace, "run", "typecheck"], {
    cwd: projectDirectory,
    stdio: "inherit",
  });
}

async function verifyInstalledProject(
  packageManager: PackageManager,
  projectDirectory: string,
  projectName: string,
): Promise<void> {
  const rootNodeModules = path.join(projectDirectory, "node_modules");

  if (!(await pathExists(rootNodeModules))) {
    throw new Error(
      `${packageManager} install did not create node_modules in ${projectDirectory}.`,
    );
  }

  await runGeneratedTypecheck(packageManager, projectDirectory, projectName);
}

export async function verifyPackageManagerInstall(
  packageManagers: PackageManager[] = VERIFY_PACKAGE_MANAGERS,
): Promise<PackageManagerVerificationSummary> {
  const workDirectory = await mkdtemp(
    path.join(tmpdir(), "create-agentic-sql-app-pm-verify-"),
  );
  const results: PackageManagerVerificationResult[] = [];
  const skippedManagers: PackageManager[] = [];
  const verifiedManagers: PackageManager[] = [];

  try {
    for (const packageManager of packageManagers) {
      if (!(await isPackageManagerAvailable(packageManager))) {
        skippedManagers.push(packageManager);
        console.log(
          `[package-managers] Skipping ${packageManager}; executable not found on PATH.`,
        );
        continue;
      }

      const projectName = `${packageManager}-verify-app`;
      console.log(`\n[package-managers] Verifying ${packageManager} install...`);

      const generation = await generateProject({
        projectName,
        api: "express",
        auth: false,
        dbTests: "integration",
        template: "base",
        packageManager,
        install: false,
        gitInit: false,
        cwd: workDirectory,
      });

      await installDependencies({
        enabled: true,
        packageManager,
        projectDirectory: generation.projectDirectory,
      });

      await verifyInstalledProject(
        packageManager,
        generation.projectDirectory,
        projectName,
      );

      verifiedManagers.push(packageManager);
      results.push({
        packageManager,
        projectDirectory: generation.projectDirectory,
        workDirectory,
        skipped: false,
      });

      console.log(`[package-managers] ${packageManager} install verification passed.`);
    }

    if (verifiedManagers.length === 0 && skippedManagers.length > 0) {
      console.log(
        "\n[package-managers] No package managers were available to verify. Install pnpm and/or yarn to run this check.",
      );
    }

    return {
      results,
      skippedManagers,
      verifiedManagers,
    };
  } finally {
    await rm(workDirectory, { recursive: true, force: true });
    console.log(`[package-managers] Removed workspace ${workDirectory}.`);
  }
}
