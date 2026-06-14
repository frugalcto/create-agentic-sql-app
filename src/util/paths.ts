import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ApiFramework, TemplateName } from "../generateProject.js";

export function getPackageRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  const currentDir = path.dirname(currentFile);
  return path.resolve(currentDir, "..", "..");
}

export function getTemplatePath(templateName: string): string {
  return path.join(getPackageRoot(), "templates", templateName);
}

const TEMPLATE_DIRECTORIES: Record<TemplateName, Record<ApiFramework, string>> =
  {
    base: {
      express: "base-express",
      fastify: "base-fastify",
    },
    "release-risk": {
      express: "release-risk-express",
      fastify: "release-risk-fastify",
    },
  };

export function resolveTemplateDirectory(
  api: ApiFramework,
  template: TemplateName,
): string {
  const templateDirectory = TEMPLATE_DIRECTORIES[template]?.[api];

  if (!templateDirectory) {
    throw new Error(`Unsupported template combination: ${template} with ${api}.`);
  }

  return getTemplatePath(templateDirectory);
}
