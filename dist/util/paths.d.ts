import type { ApiFramework, TemplateName } from "../generateProject.js";
export declare function getPackageRoot(): string;
export declare function getTemplatePath(templateName: string): string;
export declare function resolveTemplateDirectory(api: ApiFramework, template: TemplateName): string;
