import { runGeneratedAppSmokeTest } from "../src/smoke/runGeneratedAppSmokeTest.js";

runGeneratedAppSmokeTest({
  keepArtifacts: process.env.SMOKE_KEEP_ARTIFACTS === "1",
}).catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`\n[smoke] Failed: ${message}`);
  process.exitCode = 1;
});
