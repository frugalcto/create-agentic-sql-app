import { verifyPackageManagerInstall } from "../src/verify/runPackageManagerInstallVerification.js";

verifyPackageManagerInstall().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[package-managers] Failed: ${message}`);
  process.exitCode = 1;
});
