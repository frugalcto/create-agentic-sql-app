import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

export async function patchDockerComposeContainerName(
  appDirectory: string,
  containerName: string,
): Promise<void> {
  const composePath = path.join(appDirectory, "docker-compose.yml");
  const content = await readFile(composePath, "utf8");
  const patched = content.replace(
    /container_name:\s*agentic_sql_postgres/,
    `container_name: ${containerName}`,
  );

  if (patched === content) {
    throw new Error(
      `Expected docker-compose.yml in ${appDirectory} to define container_name: agentic_sql_postgres.`,
    );
  }

  await writeFile(composePath, patched, "utf8");
}
