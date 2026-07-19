export function formatCompletionMessage(
  projectName: string,
  auth = false,
): string {
  const lines = [
    `Created ${projectName}.`,
    "Next steps:",
    `cd ${projectName}`,
    "cp .env.example .env",
    "npm run db:up",
    "npm run db:migrate",
    "npm run db:seed",
    "npm run test",
    "npm run dev",
  ];

  if (auth) {
    lines.splice(
      8,
      0,
      "",
      "Auth mode:",
      "- Server uses DATABASE_RUNTIME_URL for least-privilege PostgreSQL access.",
      "- Seeded logins: admin@example.com / password123 (owner), viewer@example.com / password123 (viewer).",
    );
  }

  lines.push(
    "",
    "Agent workflow:",
    "1. Open the project in Cursor.",
    "2. Ask Cursor to read AGENTS.md and TASKS.md.",
    "3. Use /tech-spec-architect to turn functional requirements into agentic specs.",
    "4. Use scripts/cursor-prompts/001-orientation.md.",
    "5. Work one task at a time.",
  );

  return lines.join("\n");
}
