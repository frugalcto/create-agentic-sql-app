import { applyDbTestStyle } from "./applyDbTestStyle.js";
import { copyTemplate } from "./copyTemplate.js";
import { initializeGit } from "./initializeGit.js";
import { installDependencies } from "./installDependencies.js";
import { formatCompletionMessage } from "./nextSteps.js";
import { createTemplateVariables } from "./templateVars.js";
import {
  ensureProjectDirectory,
  resolveProjectDirectory,
} from "./util/ensureProjectDirectory.js";
import {
  resolveSharedTemplateDirectory,
  resolveTemplateDirectory,
} from "./util/paths.js";
import { validateProjectName } from "./util/validateProjectName.js";

export const API_FRAMEWORKS = ["express", "fastify"] as const;
export const DB_TEST_STYLES = ["integration", "pgtap"] as const;
export const TEMPLATE_NAMES = ["base", "release-risk"] as const;
export const PACKAGE_MANAGERS = ["npm", "pnpm", "yarn"] as const;

export type ApiFramework = (typeof API_FRAMEWORKS)[number];
export type DbTestStyle = (typeof DB_TEST_STYLES)[number];
export type TemplateName = (typeof TEMPLATE_NAMES)[number];
export type PackageManager = (typeof PACKAGE_MANAGERS)[number];

export interface GenerateProjectOptions {
  projectName: string;
  api: ApiFramework;
  dbTests: DbTestStyle;
  template: TemplateName;
  packageManager: PackageManager;
  install: boolean;
  gitInit: boolean;
  cwd?: string;
  confirmOverwrite?: () => Promise<boolean>;
}

export interface GenerationIntent {
  message: string;
  options: GenerateProjectOptions;
  projectDirectory: string;
  directoryState: "created" | "exists_empty" | "overwrite_confirmed";
}

const SUPPORTED_APIS = new Set<ApiFramework>(API_FRAMEWORKS);
const SUPPORTED_DB_TESTS = new Set<DbTestStyle>(DB_TEST_STYLES);
const SUPPORTED_TEMPLATES = new Set<TemplateName>(TEMPLATE_NAMES);
const SUPPORTED_PACKAGE_MANAGERS = new Set<PackageManager>(PACKAGE_MANAGERS);

function assertValidOptions(options: GenerateProjectOptions): void {
  validateProjectName(options.projectName);

  if (!SUPPORTED_APIS.has(options.api)) {
    throw new Error(`Unsupported api option: ${options.api}`);
  }

  if (!SUPPORTED_DB_TESTS.has(options.dbTests)) {
    throw new Error(`Unsupported db-tests option: ${options.dbTests}`);
  }

  if (!SUPPORTED_TEMPLATES.has(options.template)) {
    throw new Error(`Unsupported template option: ${options.template}`);
  }

  if (!SUPPORTED_PACKAGE_MANAGERS.has(options.packageManager)) {
    throw new Error(`Unsupported package manager option: ${options.packageManager}`);
  }
}

export async function generateProject(
  options: GenerateProjectOptions,
): Promise<GenerationIntent> {
  assertValidOptions(options);

  const validatedProjectName = validateProjectName(options.projectName);
  const projectDirectory = resolveProjectDirectory(
    validatedProjectName,
    options.cwd,
  );
  const directoryState = await ensureProjectDirectory(projectDirectory, {
    confirmOverwrite: options.confirmOverwrite,
  });

  const templateDirectory = resolveTemplateDirectory(
    options.api,
    options.template,
  );
  const templateVariables = createTemplateVariables(
    validatedProjectName,
    options.dbTests,
  );

  await copyTemplate(templateDirectory, projectDirectory, templateVariables);
  await copyTemplate(
    resolveSharedTemplateDirectory(),
    projectDirectory,
    templateVariables,
  );
  await applyDbTestStyle(projectDirectory, options.dbTests);

  await installDependencies({
    enabled: options.install,
    packageManager: options.packageManager,
    projectDirectory,
  });

  await initializeGit({
    enabled: options.gitInit,
    projectDirectory,
  });

  const message = formatCompletionMessage(validatedProjectName);

  return {
    message,
    options: {
      ...options,
      projectName: validatedProjectName,
    },
    projectDirectory,
    directoryState,
  };
}
