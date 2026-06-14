import { existsSync } from "node:fs";
import path from "node:path";
export function detectPackageManager(cwd = process.cwd(), signals = process.env) {
    const userAgent = signals.npm_config_user_agent ?? "";
    if (userAgent.startsWith("pnpm")) {
        return "pnpm";
    }
    if (userAgent.startsWith("yarn")) {
        return "yarn";
    }
    if (existsSync(path.join(cwd, "pnpm-lock.yaml"))) {
        return "pnpm";
    }
    if (existsSync(path.join(cwd, "yarn.lock"))) {
        return "yarn";
    }
    return "npm";
}
//# sourceMappingURL=detectPackageManager.js.map