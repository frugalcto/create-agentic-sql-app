import type { ApiFramework, DbTestStyle, TemplateName } from "../generateProject.js";

export interface GeneratedAppSmokeTestOptions {
  projectName?: string;
  api?: ApiFramework;
  dbTests?: DbTestStyle;
  template?: TemplateName;
  runE2e?: boolean;
  workDir?: string;
  keepArtifacts?: boolean;
}

export interface GeneratedAppSmokeTestResult {
  appDirectory: string;
  workDirectory: string;
  composeProjectName: string;
  ranE2e: boolean;
  steps: string[];
}

export interface SmokeTestContext {
  workDir?: string;
  appDir?: string;
  composeProjectName?: string;
}
