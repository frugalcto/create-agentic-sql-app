import type { GeneratedAppSmokeTestOptions, GeneratedAppSmokeTestResult, SmokeTestContext } from "./types.js";
export declare function cleanupSmokeTest(context: SmokeTestContext, options?: {
    keepArtifacts?: boolean;
}): Promise<void>;
export declare function runGeneratedAppSmokeTest(options?: GeneratedAppSmokeTestOptions): Promise<GeneratedAppSmokeTestResult>;
