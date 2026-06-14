import { resolveGenerationOptions } from "./resolveOptions.js";
import { createConfirmOverwriteHandler, } from "./prompts.js";
import { resolveProjectDirectory } from "./util/ensureProjectDirectory.js";
import { isInteractive } from "./util/isInteractive.js";
export async function buildGenerationRequest(projectName, rawOptions, environment = {}) {
    const interactive = environment.isInteractive ?? isInteractive();
    const cwd = environment.cwd ?? process.cwd();
    const generationOptions = await resolveGenerationOptions(projectName, rawOptions, {
        isInteractive: interactive,
        cwd,
        runner: environment.promptRunner,
    });
    const projectDirectory = resolveProjectDirectory(generationOptions.projectName, cwd);
    const confirmOverwrite = createConfirmOverwriteHandler(projectDirectory, {
        isInteractive: interactive,
        runner: environment.overwriteRunner,
    });
    return {
        ...generationOptions,
        cwd,
        ...(confirmOverwrite ? { confirmOverwrite } : {}),
    };
}
//# sourceMappingURL=buildGenerationRequest.js.map