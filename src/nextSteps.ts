export function formatCompletionMessage(projectName: string): string {
  return [
    `Created ${projectName}.`,
    "Next steps:",
    `cd ${projectName}`,
    "cp .env.example .env",
    "npm run db:up",
    "npm run db:migrate",
    "npm run db:seed",
    "npm run test",
    "npm run dev",
    "",
    "Agent workflow:",
    "1. Open the project in Cursor.",
    "2. Ask Cursor to read AGENTS.md and TASKS.md.",
    "3. Use /tech-spec-architect to turn functional requirements into agentic specs.",
    "4. Use scripts/cursor-prompts/001-orientation.md.",
    "5. Work one task at a time.",
  ].join("\n");
}
