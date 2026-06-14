import { execa } from "execa";

export interface InitializeGitOptions {
  enabled: boolean;
  projectDirectory: string;
}

export async function initializeGit(
  options: InitializeGitOptions,
): Promise<void> {
  if (!options.enabled) {
    return;
  }

  await execa("git", ["init"], {
    cwd: options.projectDirectory,
    stdio: "inherit",
  });
}
