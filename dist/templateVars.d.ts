import type { DbTestStyle } from "./generateProject.js";
export declare const PROJECT_NAME_TOKEN = "__PROJECT_NAME__";
export declare const PROJECT_NAME_PKG_TOKEN = "__PROJECT_NAME_PKG__";
export declare const DB_TEST_STYLE_TOKEN = "__DB_TEST_STYLE__";
export declare const DB_TEST_STYLE_DESCRIPTION_TOKEN = "__DB_TEST_STYLE_DESCRIPTION__";
export interface TemplateVariables {
    projectName: string;
    packageName: string;
    dbTestStyle: DbTestStyle;
    dbTestStyleLabel: string;
    dbTestStyleDescription: string;
}
export declare function toPackageName(projectName: string): string;
export declare function createTemplateVariables(projectName: string, dbTestStyle?: DbTestStyle): TemplateVariables;
export declare function applyTemplateVariables(content: string, variables: TemplateVariables): string;
