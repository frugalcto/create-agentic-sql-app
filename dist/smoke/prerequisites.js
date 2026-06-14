import { execa } from "execa";
export async function checkDockerAvailable() {
    try {
        await execa("docker", ["info"], { stdio: "pipe" });
    }
    catch {
        throw new Error("Docker is required for the generated app smoke test. Install Docker Desktop or another Docker engine and ensure the daemon is running.");
    }
}
export function shouldRunE2e(explicitValue) {
    if (explicitValue !== undefined) {
        return explicitValue;
    }
    const envValue = process.env.SMOKE_RUN_E2E?.trim().toLowerCase();
    return envValue === "1" || envValue === "true" || envValue === "yes";
}
//# sourceMappingURL=prerequisites.js.map