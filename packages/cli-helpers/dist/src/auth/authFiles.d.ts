interface FilesArgs {
    basedir: string;
    webAuthn: boolean;
}
/**
 * Get the api side file paths and file contents to write
 *
 * Example return value:
 * ```json
 * {
 *   "/Users/tobbe/dev/rw-app/api/src/lib/auth.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/lib/helperFunctions.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/functions/auth.ts": "<file content>"
 * }
 * ```
 */
export declare const apiSideFiles: ({ basedir, webAuthn }: FilesArgs) => Promise<Record<string, string>>;
/**
 * Loops through the keys in `filesRecord` and generates unique file paths if
 * they conflict with existing files
 *
 * Given this input:
 * ```json
 * {
 *   "/Users/tobbe/dev/rw-app/api/src/lib/auth.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/lib/helperFunctions.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/lib/supertokens.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/functions/auth.ts": "<file content>"
 * }
 * ```
 *
 * You could get this output, depending on what existing files there are
 * ```json
 * {
 *   "/Users/tobbe/dev/rw-app/api/src/lib/supertokensAuth3.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/lib/supertokensHelperFunctions.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/lib/supertokens2.ts": "<file content>",
 *   "/Users/tobbe/dev/rw-app/api/src/functions/auth.ts": "<file content>"
 * }
 * ```
 */
export declare function generateUniqueFileNames(filesRecord: Record<string, string>, provider: string): Record<string, string>;
export {};
//# sourceMappingURL=authFiles.d.ts.map