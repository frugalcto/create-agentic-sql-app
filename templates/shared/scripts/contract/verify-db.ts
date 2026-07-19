import path from "node:path";
import { fileURLToPath } from "node:url";

import type pg from "pg";

import {
  endpoints,
  errorRegistry,
  INTERNAL_PROCEDURES,
  type EndpointDefinition,
  type ErrorCode,
} from "@__PROJECT_NAME_PKG__/contract";

import { loadEnvFile, withDatabaseClient } from "../../db/scripts/dbClient.js";

export interface VerifyDbViolation {
  check: string;
  message: string;
  procedure?: string;
}

interface DatabaseProcedure {
  name: string;
  identityArguments: string;
  definition: string;
}

function getProjectRoot(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
}

function parseIdentityArguments(identityArguments: string): Array<{
  name: string;
  pgType: string;
}> {
  if (identityArguments.trim().length === 0) {
    return [];
  }

  return identityArguments.split(",").map((segment) => {
    const trimmed = segment.trim();
    const separatorIndex = trimmed.lastIndexOf(" ");

    if (separatorIndex === -1) {
      return { name: trimmed, pgType: "unknown" };
    }

    return {
      name: trimmed.slice(0, separatorIndex).trim(),
      pgType: trimmed.slice(separatorIndex + 1).trim(),
    };
  });
}

function normalizePgType(pgType: string): string {
  return pgType.replace(/\[\]$/, " array").trim();
}

async function loadDatabaseProcedures(
  client: pg.Client,
): Promise<DatabaseProcedure[]> {
  const result = await client.query<{
    proname: string;
    identity_arguments: string;
    definition: string;
  }>(`
    select
      p.proname,
      pg_get_function_identity_arguments(p.oid) as identity_arguments,
      pg_get_functiondef(p.oid) as definition
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'app'
    order by p.proname
  `);

  return result.rows.map((row) => ({
    name: row.proname,
    identityArguments: row.identity_arguments,
    definition: row.definition,
  }));
}

function getContractProcedures(): Map<string, EndpointDefinition["procedure"]> {
  const procedures = new Map<string, EndpointDefinition["procedure"]>();

  for (const endpoint of Object.values(endpoints)) {
    const shortName = endpoint.procedure.name.replace(/^app\./, "");
    procedures.set(shortName, endpoint.procedure);
  }

  return procedures;
}

function extractRaisedErrorCodes(definition: string): string[] {
  const codes = new Set<string>();

  for (const match of definition.matchAll(
    /raise_app_error\(\s*'([A-Z0-9_]+)'\s*\)/g,
  )) {
    codes.add(match[1]);
  }

  for (const match of definition.matchAll(/raise\s+exception\s+'([A-Z0-9_]+)'/gi)) {
    codes.add(match[1]);
  }

  return [...codes];
}

function getEndpointForProcedure(
  procedureName: string,
): EndpointDefinition | undefined {
  return Object.values(endpoints).find(
    (endpoint) => endpoint.procedure.name === `app.${procedureName}`,
  );
}

export async function verifyDatabaseContract(
  client: pg.Client,
): Promise<VerifyDbViolation[]> {
  const violations: VerifyDbViolation[] = [];
  const databaseProcedures = await loadDatabaseProcedures(client);
  const databaseByName = new Map(
    databaseProcedures.map((procedure) => [procedure.name, procedure]),
  );
  const contractProcedures = getContractProcedures();
  const internalProcedures = new Set<string>(INTERNAL_PROCEDURES);

  for (const [shortName, contractProcedure] of contractProcedures.entries()) {
    const databaseProcedure = databaseByName.get(shortName);

    if (!databaseProcedure) {
      violations.push({
        check: "missing-db-procedure",
        procedure: contractProcedure.name,
        message: `Contract procedure "${contractProcedure.name}" does not exist in schema app.`,
      });
      continue;
    }

    const actualParams = parseIdentityArguments(
      databaseProcedure.identityArguments,
    );

    if (actualParams.length !== contractProcedure.params.length) {
      violations.push({
        check: "procedure-param-count-mismatch",
        procedure: contractProcedure.name,
        message: `Procedure "${contractProcedure.name}" expects ${contractProcedure.params.length} params but database has ${actualParams.length}.`,
      });
      continue;
    }

    for (const [index, expectedParam] of contractProcedure.params.entries()) {
      const actualParam = actualParams[index];

      if (
        actualParam.name !== expectedParam.name ||
        normalizePgType(actualParam.pgType) !== normalizePgType(expectedParam.pgType)
      ) {
        violations.push({
          check: "procedure-param-mismatch",
          procedure: contractProcedure.name,
          message: `Procedure "${contractProcedure.name}" param ${index + 1} expected "${expectedParam.name} ${expectedParam.pgType}" but database has "${actualParam.name} ${actualParam.pgType}".`,
        });
      }
    }
  }

  for (const databaseProcedure of databaseProcedures) {
    if (
      contractProcedures.has(databaseProcedure.name) ||
      internalProcedures.has(databaseProcedure.name)
    ) {
      continue;
    }

    violations.push({
      check: "orphan-db-procedure",
      procedure: `app.${databaseProcedure.name}`,
      message: `Database procedure "app.${databaseProcedure.name}" is not declared in contract endpoints and is not internal.`,
    });
  }

  for (const databaseProcedure of databaseProcedures) {
    const raisedCodes = extractRaisedErrorCodes(databaseProcedure.definition);
    const endpoint = getEndpointForProcedure(databaseProcedure.name);

    for (const code of raisedCodes) {
      if (!(code in errorRegistry)) {
        violations.push({
          check: "undocumented-raised-error",
          procedure: `app.${databaseProcedure.name}`,
          message: `Procedure "app.${databaseProcedure.name}" raises undocumented error code "${code}".`,
        });
        continue;
      }

      if (
        endpoint &&
        !endpoint.errorCodes.includes(code as ErrorCode)
      ) {
        violations.push({
          check: "endpoint-missing-error-code",
          procedure: `app.${databaseProcedure.name}`,
          message: `Procedure "app.${databaseProcedure.name}" raises "${code}" but endpoint ${endpoint.method} ${endpoint.path} does not list it in errorCodes.`,
        });
      }
    }
  }

  return violations;
}

async function main(): Promise<void> {
  loadEnvFile();

  const violations = await withDatabaseClient(async (client) =>
    verifyDatabaseContract(client),
  );

  if (violations.length === 0) {
    console.log("Database contract verification passed.");
    return;
  }

  console.error(
    `Database contract verification failed (${violations.length} issues).`,
  );

  for (const violation of violations) {
    const procedure = violation.procedure ? `${violation.procedure}: ` : "";
    console.error(`[${violation.check}] ${procedure}${violation.message}`);
  }

  process.exitCode = 1;
}

const isDirectRun =
  Boolean(process.argv[1]) &&
  import.meta.url === new URL(`file://${path.resolve(process.argv[1]!)}`).href;

if (isDirectRun) {
  main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    process.exitCode = 1;
  });
}

export { getProjectRoot };
