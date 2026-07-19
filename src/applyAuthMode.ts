import { rm } from "node:fs/promises";
import path from "node:path";

import { copyTemplate } from "./copyTemplate.js";
import type { ApiFramework, DbTestStyle, TemplateName } from "./generateProject.js";
import { createTemplateVariables } from "./templateVars.js";
import { resolveAuthOverlayDirectories } from "./util/paths.js";

export interface ApplyAuthModeOptions {
  api: ApiFramework;
  template: TemplateName;
  auth: boolean;
  projectName: string;
  dbTests: DbTestStyle;
}

const DEMO_ONLY_RELATIVE_PATHS = [
  "server/src/middleware/actorContext.ts",
] as const;

export async function applyAuthMode(
  projectDirectory: string,
  options: ApplyAuthModeOptions,
): Promise<void> {
  if (!options.auth) {
    return;
  }

  const templateVariables = createTemplateVariables(
    options.projectName,
    options.dbTests,
  );

  for (const overlayDirectory of resolveAuthOverlayDirectories(
    options.api,
    options.template,
  )) {
    await copyTemplate(overlayDirectory, projectDirectory, templateVariables);
  }

  for (const relativePath of DEMO_ONLY_RELATIVE_PATHS) {
    await rm(path.join(projectDirectory, relativePath), { force: true });
  }
}
