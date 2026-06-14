export function formatCompletionMessage(projectName) {
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
        "3. Use scripts/cursor-prompts/001-orientation.md.",
        "4. Work one task at a time.",
    ].join("\n");
}
//# sourceMappingURL=nextSteps.js.map