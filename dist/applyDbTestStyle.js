import { cp, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
async function replaceFile(projectDirectory, relativePath, content) {
    await writeFile(path.join(projectDirectory, relativePath), content, "utf8");
}
async function copyDirectoryContents(sourceDirectory, destinationDirectory) {
    await cp(sourceDirectory, destinationDirectory, { recursive: true });
}
export async function applyDbTestStyle(projectDirectory, dbTests) {
    const testsPgtapDirectory = path.join(projectDirectory, "db", "tests-pgtap");
    const testsDirectory = path.join(projectDirectory, "db", "tests");
    const pgtapTestDbScript = path.join(projectDirectory, "db", "scripts", "test-db.pgtap.ts");
    const integrationDockerCompose = path.join(projectDirectory, "docker-compose.integration.yml");
    const pgtapDockerCompose = path.join(projectDirectory, "docker-compose.pgtap.yml");
    if (dbTests === "integration") {
        await rm(testsPgtapDirectory, { recursive: true, force: true });
        await rm(pgtapTestDbScript, { force: true });
        await rm(pgtapDockerCompose, { force: true });
        await rm(path.join(projectDirectory, "db", "docker"), {
            recursive: true,
            force: true,
        });
        const integrationCompose = await readFile(integrationDockerCompose, "utf8");
        await replaceFile(projectDirectory, "docker-compose.yml", integrationCompose);
        await rm(integrationDockerCompose, { force: true });
        return;
    }
    const integrationTestFiles = ["app_health.test.sql", "app_sample_transition.test.sql"];
    for (const fileName of integrationTestFiles) {
        await rm(path.join(testsDirectory, fileName), { force: true });
    }
    await copyDirectoryContents(testsPgtapDirectory, testsDirectory);
    await rm(testsPgtapDirectory, { recursive: true, force: true });
    const pgtapRunner = await readFile(pgtapTestDbScript, "utf8");
    await replaceFile(projectDirectory, "db/scripts/test-db.ts", pgtapRunner);
    await rm(pgtapTestDbScript, { force: true });
    const pgtapCompose = await readFile(pgtapDockerCompose, "utf8");
    await replaceFile(projectDirectory, "docker-compose.yml", pgtapCompose);
    await rm(pgtapDockerCompose, { force: true });
    await rm(integrationDockerCompose, { force: true });
}
//# sourceMappingURL=applyDbTestStyle.js.map