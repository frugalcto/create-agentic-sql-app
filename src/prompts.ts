import { confirm, isCancel, select, text } from "@clack/prompts";

import {
  API_FRAMEWORKS,
  DB_TEST_STYLES,
  TEMPLATE_NAMES,
  type ApiFramework,
  type DbTestStyle,
  type TemplateName,
} from "./generateProject.js";
import { isInteractive as readIsInteractive } from "./util/isInteractive.js";

export class NonInteractiveError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NonInteractiveError";
  }
}

export interface CliPromptInput {
  projectName?: string;
  api?: string;
  auth?: boolean;
  dbTests?: string;
  template?: string;
  skipInstall?: boolean;
  git?: boolean;
}

export interface ResolvedPromptValues {
  projectName: string;
  api: ApiFramework;
  auth: boolean;
  dbTests: DbTestStyle;
  template: TemplateName;
  install: boolean;
  gitInit: boolean;
}

export interface PromptRunner {
  projectName(): Promise<string>;
  apiFramework(): Promise<ApiFramework>;
  authMode(): Promise<boolean>;
  dbTestStyle(): Promise<DbTestStyle>;
  template(): Promise<TemplateName>;
  installDependencies(): Promise<boolean>;
  initializeGit(): Promise<boolean>;
}

export const PROMPT_DEFAULTS = {
  api: "express" as ApiFramework,
  auth: false,
  dbTests: "integration" as DbTestStyle,
  template: "base" as TemplateName,
  install: true,
  gitInit: true,
};

function parseApi(value: string): ApiFramework {
  if (!API_FRAMEWORKS.includes(value as ApiFramework)) {
    throw new Error(`Invalid API framework: ${value}`);
  }

  return value as ApiFramework;
}

function parseDbTests(value: string): DbTestStyle {
  if (!DB_TEST_STYLES.includes(value as DbTestStyle)) {
    throw new Error(`Invalid database test style: ${value}`);
  }

  return value as DbTestStyle;
}

function parseTemplate(value: string): TemplateName {
  if (!TEMPLATE_NAMES.includes(value as TemplateName)) {
    throw new Error(`Invalid template: ${value}`);
  }

  return value as TemplateName;
}

function assertNotCancelled<T>(value: T | symbol, message: string): T {
  if (isCancel(value)) {
    throw new Error(message);
  }

  return value;
}

export const clackPromptRunner: PromptRunner = {
  async projectName() {
    const response = await text({
      message: "Project name:",
      placeholder: "my-app",
      validate(value) {
        const candidate = value ?? "";
        return candidate.trim().length > 0 ? undefined : "Project name is required.";
      },
    });

    return assertNotCancelled(response, "Prompt cancelled.").trim();
  },

  async apiFramework() {
    const response = await select({
      message: "API framework:",
      options: [
        { value: "express", label: "Express" },
        { value: "fastify", label: "Fastify" },
      ],
      initialValue: PROMPT_DEFAULTS.api,
    });

    return assertNotCancelled(response, "Prompt cancelled.") as ApiFramework;
  },

  async authMode() {
    const response = await confirm({
      message: "Enable PostgreSQL session auth with RLS?",
      initialValue: PROMPT_DEFAULTS.auth,
    });

    return assertNotCancelled(response, "Prompt cancelled.");
  },

  async dbTestStyle() {
    const response = await select({
      message: "Database test style:",
      options: [
        { value: "integration", label: "SQL integration tests" },
        { value: "pgtap", label: "pgTAP" },
      ],
      initialValue: PROMPT_DEFAULTS.dbTests,
    });

    return assertNotCancelled(response, "Prompt cancelled.") as DbTestStyle;
  },

  async template() {
    const response = await select({
      message: "Template:",
      options: [
        { value: "base", label: "base" },
        { value: "release-risk", label: "release-risk" },
      ],
      initialValue: PROMPT_DEFAULTS.template,
    });

    return assertNotCancelled(response, "Prompt cancelled.") as TemplateName;
  },

  async installDependencies() {
    const response = await confirm({
      message: "Install dependencies?",
      initialValue: PROMPT_DEFAULTS.install,
    });

    return assertNotCancelled(response, "Prompt cancelled.");
  },

  async initializeGit() {
    const response = await confirm({
      message: "Initialize git?",
      initialValue: PROMPT_DEFAULTS.gitInit,
    });

    return assertNotCancelled(response, "Prompt cancelled.");
  },
};

export interface PromptEnvironment {
  isInteractive?: boolean;
  runner?: PromptRunner;
}

export async function promptForMissingValues(
  input: CliPromptInput,
  environment: PromptEnvironment = {},
): Promise<ResolvedPromptValues> {
  const interactive =
    environment.isInteractive ?? readIsInteractive(process.stdin);
  const runner = environment.runner ?? clackPromptRunner;

  let projectName = input.projectName?.trim();

  if (!projectName) {
    if (!interactive) {
      throw new NonInteractiveError(
        "Project name is required. Pass it as the first argument or run the CLI in an interactive terminal.",
      );
    }

    projectName = await runner.projectName();
  }

  const api =
    input.api !== undefined
      ? parseApi(input.api)
      : interactive
        ? await runner.apiFramework()
        : PROMPT_DEFAULTS.api;

  const auth =
    input.auth !== undefined
      ? input.auth
      : interactive
        ? await runner.authMode()
        : PROMPT_DEFAULTS.auth;

  const dbTests =
    input.dbTests !== undefined
      ? parseDbTests(input.dbTests)
      : interactive
        ? await runner.dbTestStyle()
        : PROMPT_DEFAULTS.dbTests;

  const template =
    input.template !== undefined
      ? parseTemplate(input.template)
      : interactive
        ? await runner.template()
        : PROMPT_DEFAULTS.template;

  const install =
    input.skipInstall !== undefined
      ? !input.skipInstall
      : interactive
        ? await runner.installDependencies()
        : PROMPT_DEFAULTS.install;

  const gitInit =
    input.git !== undefined
      ? input.git
      : interactive
        ? await runner.initializeGit()
        : PROMPT_DEFAULTS.gitInit;

  return {
    projectName,
    api,
    auth,
    dbTests,
    template,
    install,
    gitInit,
  };
}

export interface OverwritePromptRunner {
  confirmOverwrite(projectDirectory: string): Promise<boolean>;
}

export interface OverwritePromptEnvironment {
  isInteractive?: boolean;
  runner?: OverwritePromptRunner;
}

export const clackOverwritePromptRunner: OverwritePromptRunner = {
  async confirmOverwrite(projectDirectory: string) {
    const response = await confirm({
      message: `"${projectDirectory}" is not empty. Overwrite existing files?`,
      initialValue: false,
    });

    return assertNotCancelled(response, "Prompt cancelled.");
  },
};

export function createConfirmOverwriteHandler(
  projectDirectory: string,
  environment: OverwritePromptEnvironment = {},
): (() => Promise<boolean>) | undefined {
  const interactive =
    environment.isInteractive ?? readIsInteractive(process.stdin);

  if (!interactive) {
    return undefined;
  }

  const runner = environment.runner ?? clackOverwritePromptRunner;

  return async () => runner.confirmOverwrite(projectDirectory);
}
