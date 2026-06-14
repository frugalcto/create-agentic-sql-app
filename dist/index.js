#!/usr/bin/env node
import { runCli } from "./cli.js";
runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map