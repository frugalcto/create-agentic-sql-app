import path from "node:path";
import { fileURLToPath } from "node:url";
export function getPackageRoot() {
    const currentFile = fileURLToPath(import.meta.url);
    const currentDir = path.dirname(currentFile);
    return path.resolve(currentDir, "..", "..");
}
export function getTemplatePath(templateName) {
    return path.join(getPackageRoot(), "templates", templateName);
}
const TEMPLATE_DIRECTORIES = {
    base: {
        express: "base-express",
        fastify: "base-fastify",
    },
    "release-risk": {
        express: "release-risk-express",
        fastify: "release-risk-fastify",
    },
};
export function resolveTemplateDirectory(api, template) {
    const templateDirectory = TEMPLATE_DIRECTORIES[template]?.[api];
    if (!templateDirectory) {
        throw new Error(`Unsupported template combination: ${template} with ${api}.`);
    }
    return getTemplatePath(templateDirectory);
}
//# sourceMappingURL=paths.js.map