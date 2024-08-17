/**
 * Converts all the TypeScript files in the `api` and `web` sides to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
export declare const convertTsProjectToJs: (cwd?: string) => void;
/**
 * Converts all the TypeScript files in the `api` and `web` sides to JavaScript.
 *
 * @param {string} cwd - The base path to the project.
 */
export declare const convertTsScriptsToJs: (cwd?: string) => void;
/**
 * Converts TypeScript files to JavaScript.
 *
 * @param {string} cwd - Current directory
 * @param {string[]} files - Collection of files to convert
 */
export declare const convertTsFilesToJs: (cwd: string, files: string[]) => Promise<void>;
/**
 * Get all the source code from a Redwood project
 */
export declare const typeScriptSourceFiles: (cwd: string, globPattern?: string) => string[];
/**
 * Read the contents of a TypeScript file, transpile it to JavaScript,
 * but leave the JSX intact and format via Prettier.
 *
 * @param {string} file - The path to the TypeScript file.
 */
export declare const transformTSToJS: (file: string) => Promise<string> | undefined;
export declare const getPrettierConfig: () => Promise<any>;
/**
 * Prettify `code` according to the extension in `filename`.
 * This will also read a user's `prettier.config.js` file if it exists.
 *
 * @param {string} code
 * @param {string} filename
 */
export declare const prettify: (code: string, filename: string) => Promise<string>;
//# sourceMappingURL=ts2js.d.ts.map