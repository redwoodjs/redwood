export declare const findCells: (cwd?: string) => string[];
export declare const findPages: (cwd?: string) => string[];
/**
 * This function finds all modules in the 'web' and 'api' directories excluding 'node_modules' and Cell files.
 * Cell files are also directory named modules but they have their special type mirror file, so they are ignored.
 *
 * @param {string} cwd - The directory path to start searching from. By default, it is the base path of the project.
 * @returns {Array} modules - An array of absolute paths for the found modules.
 *
 * @example
 * // Assuming the base directory of your project is '/Users/user/myproject'
 * findDirectoryNamedModules('/Users/user/myproject');
 * // This will return an array with the absolute paths of all matching files, e.g.:
 * // ['/Users/user/myproject/web/src/components/Author/Author.tsx', '/Users/user/myproject/web/src/pages/AboutPage/AboutPage.tsx']
 */
export declare const findDirectoryNamedModules: (cwd?: string) => string[];
export declare const findGraphQLSchemas: (cwd?: string) => string[];
export declare const findApiFiles: (cwd?: string) => string[];
export declare const findWebFiles: (cwd?: string) => string[];
export declare const findApiServerFunctions: (cwd?: string) => string[];
export declare const findApiDistFunctions: (cwd?: string) => string[];
export declare const findRouteHooksSrc: (cwd?: string) => string[];
export declare const isCellFile: (p: string) => boolean;
export declare const findScripts: (cwd?: string) => string[];
export declare const isPageFile: (p: string) => boolean;
/**
 * This function checks if the given path belongs to a directory named module.
 * A directory named module is where the filename (without extension) is the same as the directory it is in.
 *
 * @param {string} p - The absolute path of the file.
 * @returns {boolean} - Returns true if the path belongs to a directory named module, false otherwise.
 *
 * @example
 * isDirectoryNamedModuleFile('/Users/user/myproject/web/src/components/Author/Author.tsx');
 * // Returns: true
 *
 * isDirectoryNamedModuleFile('/Users/user/myproject/web/src/components/Author/AuthorInfo.tsx');
 * // Returns: false
 */
export declare const isDirectoryNamedModuleFile: (p: string) => boolean;
export declare const isGraphQLSchemaFile: (p: string) => boolean;
/**
 * The following patterns are supported for api functions:
 *
 * 1. a module at the top level: `/graphql.js`
 * 2. a module in a folder with a module of the same name: `/health/health.js`
 * 3. a module in a folder named index: `/x/index.js`
 */
export declare const isApiFunction: (p: string, functionsPath: string) => boolean;
export declare const isFileInsideFolder: (filePath: string, folderPath: string) => boolean;
//# sourceMappingURL=files.d.ts.map