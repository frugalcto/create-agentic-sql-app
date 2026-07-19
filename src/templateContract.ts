export const REQUIRED_DOCUMENTATION_FILES = [
  "AGENTS.md",
  "DB_API_CONTRACT.md",
  "ERROR_CODES.md",
  "SCENARIOS.md",
  "TASKS.md",
  "TESTING_STRATEGY.md",
] as const;

export const REQUIRED_CONTRACT_FILES = [
  "contract/package.json",
  "contract/src/endpoints.ts",
  "contract/src/errors.ts",
  "contract/src/index.ts",
  "contract/openapi.json",
] as const;

export const REQUIRED_CURSOR_AGENT_FILES = [
  ".cursor/agents/tech-spec-architect.md",
] as const;

export const REQUIRED_ROOT_SCRIPTS = [
  "dev",
  "db:up",
  "db:down",
  "db:migrate",
  "db:seed",
  "test:db",
  "test:server",
  "test:web",
  "test:e2e",
  "test",
  "typecheck",
  "lint",
  "contract:generate",
  "agent:check",
  "agent:check:db",
] as const;
