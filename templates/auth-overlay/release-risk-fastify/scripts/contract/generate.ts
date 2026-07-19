import { mkdir, writeFile } from "node:fs/promises";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  endpoints,
  errorRegistry,
  type EndpointDefinition,
  type ErrorCode,
} from "@__PROJECT_NAME_PKG__/contract";

const GENERATED_HEADER =
  "<!-- GENERATED from contract/src — edit the contract module, then run npm run contract:generate. Do not edit by hand. -->\n";

function getProjectRoot(): string {
  return path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  );
}

function formatErrorPayload(code: ErrorCode): string {
  const definition = errorRegistry[code];

  return `{ "error": { "code": "${code}", "category": "${definition.category}", "displayMessage": "${definition.displayMessage}" } }`;
}

function formatProcedureParams(endpoint: EndpointDefinition): string {
  if (endpoint.procedure.params.length === 0) {
    return "none";
  }

  return endpoint.procedure.params
    .map((param) => `${param.name} ${param.pgType}`)
    .join(", ");
}

function formatParamSources(endpoint: EndpointDefinition): string {
  if (endpoint.procedure.params.length === 0) {
    return "none";
  }

  return endpoint.procedure.params
    .map((param) => `${param.name} ← ${param.source}`)
    .join("; ");
}

function formatFrontendExpectation(endpoint: EndpointDefinition): string {
  if (endpoint.frontend.binding === "none") {
    return "not used by React routes in the base template";
  }

  const bindingLabel =
    endpoint.frontend.binding === "loader" ? "loader" : "action";

  return `${endpoint.frontend.file} ${bindingLabel} uses this route`;
}

function renderEndpointSection(
  endpointKey: string,
  endpoint: EndpointDefinition,
): string {
  const routeLabel = `${endpoint.method} ${endpoint.path}`;
  const lines = [
    `## ${routeLabel}`,
    "",
    "| Field | Value |",
    "| --- | --- |",
    `| Key | \`${endpointKey}\` |`,
    `| Method | \`${endpoint.method}\` |`,
    `| Route | \`${endpoint.path}\` |`,
    `| Stored procedure | \`${endpoint.procedure.name}(${formatProcedureParams(endpoint)})\` |`,
    `| Parameter sources | ${formatParamSources(endpoint)} |`,
    `| Response schema | \`${endpoint.response.description ?? "see contract/src/endpoints.ts"}\` |`,
    `| Error codes | ${endpoint.errorCodes.map((code) => `\`${code}\``).join(", ")} |`,
    `| Frontend expectation | ${formatFrontendExpectation(endpoint)} |`,
    `| Forbidden responsibilities | ${endpoint.forbidden} |`,
    "",
  ];

  if (endpoint.query) {
    lines.splice(
      8,
      0,
      `| Query params | see contract schema for \`${endpointKey}\` |`,
    );
  }

  if (endpoint.pathParams) {
    lines.splice(
      8,
      0,
      `| Path params | see contract schema for \`${endpointKey}\` |`,
    );
  }

  if (endpoint.body) {
    lines.splice(
      8,
      0,
      `| Request body | see contract schema for \`${endpointKey}\` |`,
    );
  }

  return lines.join("\n");
}

function renderDbApiContract(projectName: string): string {
  const sections = Object.entries(endpoints).map(([key, endpoint]) =>
    renderEndpointSection(key, endpoint),
  );

  return [
    GENERATED_HEADER,
    `# DB API Contract — ${projectName}`,
    "",
    "This document is generated from `contract/src/endpoints.ts`. API and React code must follow it exactly.",
    "",
    "## Session context",
    "",
    "Protected routes require a valid HttpOnly session cookie issued by PostgreSQL:",
    "",
    "- Cookie: `app_session`",
    "- Login: `POST /api/auth/login`",
    "- Logout: `POST /api/auth/logout`",
    "- Current user: `GET /api/auth/me`",
    "",
    "The API sets `app.session_token` locally for each database transaction. PostgreSQL RLS and stored procedures derive identity from the opaque session token. React must not infer permissions locally.",
    "",
    "---",
    "",
    ...sections.flatMap((section) => [section, "---", ""]),
    "## Contract change rules",
    "",
    "When adding a route or procedure:",
    "",
    "1. Update `contract/src/endpoints.ts` first.",
    "2. Run `npm run contract:generate`.",
    "3. Add database tests before API exposure.",
    "4. Add API tests before frontend wiring.",
    "5. Update `SCENARIOS.md` when user-visible behavior changes.",
    "",
  ].join("\n");
}

function renderErrorCodes(projectName: string): string {
  const sections = Object.entries(errorRegistry).map(([code, definition]) => {
    return [
      `### ${code}`,
      "",
      "| Field | Value |",
      "| --- | --- |",
      `| PostgreSQL error | \`${code}\` |`,
      "| SQLSTATE | `P0001` |",
      `| HTTP status | \`${definition.statusCode}\` |`,
      `| Category | \`${definition.category}\` |`,
      `| Description | ${definition.description} |`,
      `| API payload | \`${formatErrorPayload(code as ErrorCode)}\` |`,
      `| UI behavior | ${definition.uiBehavior} |`,
      "",
    ].join("\n");
  });

  return [
    GENERATED_HEADER,
    `# Error Codes — ${projectName}`,
    "",
    "This document is generated from `contract/src/errors.ts`. PostgreSQL raises application errors. The API maps them to a standard JSON payload. React displays `displayMessage` from the API error response.",
    "",
    "## API error shape",
    "",
    "```json",
    JSON.stringify(
      {
        error: {
          code: "RELEASE_INVALID_TRANSITION",
          category: "business_rule",
          displayMessage:
            errorRegistry.RELEASE_INVALID_TRANSITION.displayMessage,
        },
      },
      null,
      2,
    ),
    "```",
    "",
    "## Error catalog",
    "",
    ...sections,
    "## PostgreSQL convention",
    "",
    "Known application errors should be raised from stored procedures:",
    "",
    "```sql",
    "perform app.raise_app_error('RELEASE_INVALID_TRANSITION');",
    "```",
    "",
    "Only documented codes in this file may be raised for business behavior.",
    "",
  ].join("\n");
}

function renderOpenApi(projectName: string): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};

  for (const [key, endpoint] of Object.entries(endpoints)) {
    const pathItem = paths[endpoint.path] ?? {};
    const operation: Record<string, unknown> = {
      operationId: key,
      summary: `${endpoint.method} ${endpoint.path}`,
      responses: {
        "200": {
          description: "Successful response",
        },
      },
    };

    const errorResponses = endpoint.errorCodes.map((code) => {
      const definition = errorRegistry[code];

      return {
        code,
        status: definition.statusCode,
        category: definition.category,
        displayMessage: definition.displayMessage,
      };
    });

    for (const errorResponse of errorResponses) {
      const status = String(errorResponse.status);

      if (operation.responses && typeof operation.responses === "object") {
        (operation.responses as Record<string, unknown>)[status] = {
          description: errorResponse.displayMessage,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  error: {
                    type: "object",
                    properties: {
                      code: { type: "string", enum: [errorResponse.code] },
                      category: { type: "string" },
                      displayMessage: { type: "string" },
                    },
                    required: ["code", "category", "displayMessage"],
                  },
                },
                required: ["error"],
              },
            },
          },
        };
      }
    }

    pathItem[endpoint.method.toLowerCase()] = operation;
    paths[endpoint.path] = pathItem;
  }

  return {
    openapi: "3.1.0",
    info: {
      title: `${projectName} API`,
      version: "0.1.0",
      description:
        "Generated from contract/src/endpoints.ts. PostgreSQL stored procedures own business behavior.",
    },
    paths,
  };
}

function resolveProjectName(projectRoot: string): string {
  const packageJsonPath = path.join(projectRoot, "package.json");
  const packageJson = JSON.parse(
    readFileSync(packageJsonPath, "utf8"),
  ) as { description?: string; name?: string };

  const descriptionMatch = String(packageJson.description ?? "").match(
    /generated for (.+)\.$/,
  );

  if (descriptionMatch) {
    return descriptionMatch[1];
  }

  return packageJson.name ?? "generated-app";
}

export async function generateContractArtifacts(
  projectRoot = getProjectRoot(),
  projectName?: string,
): Promise<void> {
  const resolvedProjectName = projectName ?? resolveProjectName(projectRoot);
  await mkdir(path.join(projectRoot, "contract"), { recursive: true });

  await writeFile(
    path.join(projectRoot, "DB_API_CONTRACT.md"),
    renderDbApiContract(resolvedProjectName),
    "utf8",
  );

  await writeFile(
    path.join(projectRoot, "ERROR_CODES.md"),
    renderErrorCodes(resolvedProjectName),
    "utf8",
  );

  await writeFile(
    path.join(projectRoot, "contract", "openapi.json"),
    `${JSON.stringify(renderOpenApi(resolvedProjectName), null, 2)}\n`,
    "utf8",
  );
}

async function main(): Promise<void> {
  await generateContractArtifacts();
  console.log("Contract artifacts generated.");
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
