import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  endpoints,
  ERROR_CODES,
  INTERNAL_PROCEDURES,
} from "@__PROJECT_NAME_PKG__/contract";

export interface CheckViolation {
  check: string;
  message: string;
  file?: string;
}

const INTERNAL_SQL_HELPERS = new Set<string>(INTERNAL_PROCEDURES);

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

function loadDocumentedErrorCodes(): Set<string> {
  return new Set<string>(ERROR_CODES);
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

function runEndpointRegistrationChecks(
  projectRoot: string,
): CheckViolation[] {
  const violations: CheckViolation[] = [];
  const routesPath = path.join(
    projectRoot,
    "server",
    "src",
    "routes",
    "api.routes.ts",
  );

  if (!statSync(routesPath, { throwIfNoEntry: false })?.isFile()) {
    return [
      {
        check: "missing-route-registry",
        file: "server/src/routes/api.routes.ts",
        message:
          "Contract route registry is missing. Register every endpoint via registerEndpoint.",
      },
    ];
  }

  const source = readText(routesPath);

  for (const [key, endpoint] of Object.entries(endpoints)) {
    const registration = `endpoints.${key}`;

    if (!source.includes(registration)) {
      violations.push({
        check: "missing-endpoint-registration",
        file: "server/src/routes/api.routes.ts",
        message: `Endpoint "${registration}" (${endpoint.method} ${endpoint.path}) is not registered.`,
      });
    }
  }

  return violations;
}

export function runContractCoverageChecks(
  projectRoot = getProjectRoot(),
): CheckViolation[] {
  const violations: CheckViolation[] = [];
  const documentedErrors = loadDocumentedErrorCodes();
  const sqlFiles = walkFiles(path.join(projectRoot, "db"), (filePath) =>
    filePath.endsWith(".sql"),
  );
  const migrationFiles = sqlFiles.filter((filePath) =>
    filePath.includes(`${path.sep}migrations${path.sep}`),
  );
  const testFiles = sqlFiles.filter(
    (filePath) =>
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
          message: `SQL uses undocumented error code "${code}". Add it to contract/src/errors.ts and run npm run contract:generate.`,
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

  violations.push(...runEndpointRegistrationChecks(projectRoot));

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
