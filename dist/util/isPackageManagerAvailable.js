import { execa } from "execa";
export async function isPackageManagerAvailable(packageManager) {
    const result = await execa(packageManager, ["--version"], {
        stdio: "pipe",
        reject: false,
    });
    return result.exitCode === 0;
}
//# sourceMappingURL=isPackageManagerAvailable.js.map