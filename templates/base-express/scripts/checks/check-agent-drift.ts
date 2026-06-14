import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import {
  getProjectRoot,
  runContractCoverageChecks,
  type CheckViolation,
} from "./check-contract-coverage.js";

interface PatternRule {
  id: string;
  pattern: RegExp;
  message: string;
}

const REACT_RULES: PatternRule[] = [
  {
    id: "react-status-rule",
    pattern: /\bif\s*\([^)]*\.status\s*===/,
    message:
      "Possible release status rule in React. Status transitions belong in PostgreSQL.",
  },
  {
    id: "react-permission-helper",
    pattern: /\b(hasPermission|isOwner|isAdmin|inferPermission)\b/,
    message:
      "Possible permission inference in React. Permissions belong in PostgreSQL.",
  },
  {
    id: "react-transition-helper",
    pattern: /\b(validateTransition|allowedTransition|canMoveTo)\b/,
    message:
      "Possible transition rule in React. State transitions belong in PostgreSQL.",
  },
  {
    id: "react-role-check",
    pattern: /\brole\s*===\s*['"]/,
    message:
      "Possible role-based permission check in React. Render contract fields instead.",
  },
  {
    id: "react-metric-calculation",
    pattern: /\b(calculate|compute|derive)(?:Metric|Score|Risk|Permission)\b/i,
    message:
      "Possible business metric or permission calculation in React.",
  },
];

const API_RULES: PatternRule[] = [
  {
    id: "api-direct-sql",
    pattern: /\bpool\.query\s*\(/,
    message:
      "Direct SQL detected in an API route. Routes should call stored procedures via callProcedure.",
  },
  {
    id: "api-permission-helper",
    pattern: /\b(hasPermission|isOwner|isAdmin|checkPermission)\b/,
    message:
      "Possible permission rule in API route. Permissions belong in PostgreSQL.",
  },
  {
    id: "api-transition-helper",
    pattern: /\b(validateTransition|allowedStatuses|validTransitions)\b/,
    message:
      "Possible business transition validation in API route. Validations belong in PostgreSQL.",
  },
  {
    id: "api-status-rule",
    pattern: /\bif\s*\([^)]*\.status\s*===/,
    message:
      "Possible release status rule in API route. State transitions belong in PostgreSQL.",
  },
  {
    id: "api-target-status-rule",
    pattern: /\bif\s*\([^)]*targetStatus\s*===\s*['"][^'"]+['"]\s*&&/,
    message:
      "Possible transition validation in API route. Do not validate business transitions in Express.",
  },
];

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

function scanFile(
  projectRoot: string,
  filePath: string,
  rules: PatternRule[],
  checkPrefix: string,
): CheckViolation[] {
  const violations: CheckViolation[] = [];
  const relativePath = path.relative(projectRoot, filePath);
  const lines = readFileSync(filePath, "utf8").split("\n");

  for (const [index, line] of lines.entries()) {
    const trimmed = line.trim();

    if (trimmed.startsWith("//")) {
      continue;
    }

    for (const rule of rules) {
      if (rule.pattern.test(line)) {
        violations.push({
          check: `${checkPrefix}:${rule.id}`,
          file: relativePath,
          message: `${rule.message} (line ${index + 1})`,
        });
      }
    }
  }

  return violations;
}

function runReactDriftChecks(projectRoot: string): CheckViolation[] {
  const reactDirectory = path.join(projectRoot, "web", "src");
  const files = walkFiles(
    reactDirectory,
    (filePath) =>
      (filePath.endsWith(".tsx") || filePath.endsWith(".ts")) &&
      !filePath.includes(`${path.sep}api${path.sep}`),
  );

  return files.flatMap((filePath) =>
    scanFile(projectRoot, filePath, REACT_RULES, "react-drift"),
  );
}

function runApiDriftChecks(projectRoot: string): CheckViolation[] {
  const routesDirectory = path.join(projectRoot, "server", "src", "routes");

  if (!statSync(routesDirectory, { throwIfNoEntry: false })?.isDirectory()) {
    return [];
  }

  const files = walkFiles(routesDirectory, (filePath) => filePath.endsWith(".ts"));
  const violations = files.flatMap((filePath) =>
    scanFile(projectRoot, filePath, API_RULES, "api-drift"),
  );

  for (const filePath of files) {
    const relativePath = path.relative(projectRoot, filePath);
    const source = readFileSync(filePath, "utf8");
    const declaresRoute = /\.(get|post|put|patch|delete)\(/i.test(source);
    const usesCallProcedure = source.includes("callProcedure");

    if (declaresRoute && !usesCallProcedure) {
      violations.push({
        check: "api-drift:missing-call-procedure",
        file: relativePath,
        message:
          "API route file does not call callProcedure. Keep routes thin and delegate to PostgreSQL.",
      });
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

export function runAgentDriftChecks(
  projectRoot = getProjectRoot(),
): CheckViolation[] {
  return [
    ...runReactDriftChecks(projectRoot),
    ...runApiDriftChecks(projectRoot),
    ...runContractCoverageChecks(projectRoot),
  ];
}

function main(): void {
  const projectRoot = getProjectRoot();
  const violations = runAgentDriftChecks(projectRoot);

  if (violations.length === 0) {
    console.log("Agent drift checks passed.");
    return;
  }

  console.error(`Agent drift checks failed (${violations.length} issues).`);
  printViolations(violations);
  process.exitCode = 1;
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1]!)).href;

if (isDirectRun) {
  main();
}
