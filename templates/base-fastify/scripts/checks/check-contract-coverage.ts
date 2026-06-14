import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface CheckViolation {
  check: string;
  message: string;
  file?: string;
}

const DOCUMENTED_ERROR_CODES = [
  "PERMISSION_DENIED",
  "RELEASE_NOT_FOUND",
  "RELEASE_INVALID_TRANSITION",
  "VALIDATION_FAILED",
  "SYSTEM_ERROR",
] as const;

const INTERNAL_SQL_HELPERS = new Set(["raise_app_error"]);

export function getProjectRoot(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
}

function readText(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function walkFiles(
  directory: string,
  matcher: (filePath: string) => boolean,
): string[] {
  const results: string[] = [];

  for (const entry of readdirSync(directory)) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      results.push(...walkFiles(fullPath, matcher));
      continue;
    }

    if (matcher(fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function loadDocumentedErrorCodes(projectRoot: string): Set<string> {
  const errorCodesPath = path.join(projectRoot, "ERROR_CODES.md");
  const content = readText(errorCodesPath);
  const documented = new Set<string>(DOCUMENTED_ERROR_CODES);

  for (const match of content.matchAll(/^###\s+([A-Z0-9_]+)/gm)) {
    documented.add(match[1]);
  }

  return documented;
}

function extractSqlErrorCodes(sql: string): string[] {
  const codes = new Set<string>();

  for (const match of sql.matchAll(
    /raise_app_error\(\s*'([A-Z0-9_]+)'\s*\)/g,
  )) {
    codes.add(match[1]);
  }

  for (const match of sql.matchAll(/raise\s+exception\s+'([A-Z0-9_]+)'/gi)) {
    codes.add(match[1]);
  }

  return [...codes];
}

function extractProcedures(sql: string): string[] {
  const procedures = new Set<string>();

  for (const match of sql.matchAll(
    /create\s+or\s+replace\s+function\s+app\.(\w+)/gi,
  )) {
    procedures.add(match[1]);
  }

  return [...procedures];
}

function extractContractRoutes(contractMarkdown: string): string[] {
  const routes: string[] = [];

  for (const match of contractMarkdown.matchAll(
    /^##\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+)/gm,
  )) {
    routes.push(`${match[1]} ${match[2]}`);
  }

  return routes;
}

function extractApiRoutes(routeSource: string): string[] {
  const routes: string[] = [];

  for (const match of routeSource.matchAll(
    /\.(get|post|put|patch|delete)\(\s*["'`]([^"'`]+)["'`]/gi,
  )) {
    routes.push(`${match[1].toUpperCase()} ${match[2]}`);
  }

  return routes;
}

export function runContractCoverageChecks(
  projectRoot = getProjectRoot(),
): CheckViolation[] {
  const violations: CheckViolation[] = [];
  const documentedErrors = loadDocumentedErrorCodes(projectRoot);
  const sqlFiles = walkFiles(path.join(projectRoot, "db"), (filePath) =>
    filePath.endsWith(".sql"),
  );
  const migrationFiles = sqlFiles.filter((filePath) =>
    filePath.includes(`${path.sep}migrations${path.sep}`),
  );
  const testFiles = sqlFiles.filter((filePath) =>
    filePath.includes(`${path.sep}tests${path.sep}`) &&
    filePath.endsWith(".test.sql"),
  );
  const testContents = testFiles.map(readText).join("\n");
  const migrationContents = migrationFiles.map(readText).join("\n");
  const procedures = extractProcedures(migrationContents).filter(
    (name) => !INTERNAL_SQL_HELPERS.has(name),
  );

  for (const filePath of sqlFiles) {
    const relativePath = path.relative(projectRoot, filePath);

    for (const code of extractSqlErrorCodes(readText(filePath))) {
      if (!documentedErrors.has(code)) {
        violations.push({
          check: "undocumented-sql-error",
          file: relativePath,
          message: `SQL uses undocumented error code "${code}". Add it to ERROR_CODES.md.`,
        });
      }
    }
  }

  for (const procedureName of procedures) {
    const mention = `app.${procedureName}`;

    if (!testContents.includes(mention)) {
      violations.push({
        check: "missing-db-test",
        file: "db/tests",
        message: `No database test references procedure "${mention}". Add coverage in db/tests/*.test.sql.`,
      });
    }
  }

  const contractPath = path.join(projectRoot, "DB_API_CONTRACT.md");
  const contractRoutes = new Set(
    extractContractRoutes(readText(contractPath)),
  );
  const routeFiles = walkFiles(
    path.join(projectRoot, "server", "src", "routes"),
    (filePath) => filePath.endsWith(".ts"),
  );

  for (const routeFile of routeFiles) {
    const relativePath = path.relative(projectRoot, routeFile);
    const source = readText(routeFile);
    const routes = extractApiRoutes(source);

    for (const route of routes) {
      if (!contractRoutes.has(route)) {
        violations.push({
          check: "missing-contract-entry",
          file: relativePath,
          message: `API route "${route}" is not documented in DB_API_CONTRACT.md.`,
        });
      }
    }
  }

  return violations;
}

function printViolations(violations: CheckViolation[]): void {
  for (const violation of violations) {
    const location = violation.file ? `${violation.file}: ` : "";
    console.error(`[${violation.check}] ${location}${violation.message}`);
  }
}

export function main(): void {
  const violations = runContractCoverageChecks();

  if (violations.length === 0) {
    console.log("Contract coverage checks passed.");
    return;
  }

  console.error(`Contract coverage checks failed (${violations.length} issues).`);
  printViolations(violations);
  process.exitCode = 1;
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1]!)).href;

if (isDirectRun) {
  main();
}
