import type { DbTestStyle } from "./generateProject.js";

export const PROJECT_NAME_TOKEN = "__PROJECT_NAME__";
export const PROJECT_NAME_PKG_TOKEN = "__PROJECT_NAME_PKG__";
export const DB_TEST_STYLE_TOKEN = "__DB_TEST_STYLE__";
export const DB_TEST_STYLE_DESCRIPTION_TOKEN = "__DB_TEST_STYLE_DESCRIPTION__";

export interface TemplateVariables {
  projectName: string;
  packageName: string;
  dbTestStyle: DbTestStyle;
  dbTestStyleLabel: string;
  dbTestStyleDescription: string;
}

const DB_TEST_STYLE_LABELS: Record<DbTestStyle, string> = {
  integration: "SQL integration tests",
  pgtap: "pgTAP",
};

const DB_TEST_STYLE_DESCRIPTIONS: Record<DbTestStyle, string> = {
  integration:
    "Database tests run through `db/scripts/test-db.ts`, executing SQL setup and assertion files in `db/tests/`.",
  pgtap:
    "Database tests run through `db/scripts/test-db.ts` using pgTAP via `pg_prove` inside the PostgreSQL Docker container.",
};

export function toPackageName(projectName: string): string {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function createTemplateVariables(
  projectName: string,
  dbTestStyle: DbTestStyle = "integration",
): TemplateVariables {
  return {
    projectName: projectName.trim(),
    packageName: toPackageName(projectName),
    dbTestStyle,
    dbTestStyleLabel: DB_TEST_STYLE_LABELS[dbTestStyle],
    dbTestStyleDescription: DB_TEST_STYLE_DESCRIPTIONS[dbTestStyle],
  };
}

export function applyTemplateVariables(
  content: string,
  variables: TemplateVariables,
): string {
  return content
    .replaceAll(PROJECT_NAME_TOKEN, variables.projectName)
    .replaceAll(PROJECT_NAME_PKG_TOKEN, variables.packageName)
    .replaceAll(DB_TEST_STYLE_TOKEN, variables.dbTestStyleLabel)
    .replaceAll(
      DB_TEST_STYLE_DESCRIPTION_TOKEN,
      variables.dbTestStyleDescription,
    );
}
