import type { ListrTaskWrapper, ListrRenderer } from 'listr2';
import { Listr } from 'listr2';
export declare const transformTSToJS: (filename: string, content: string) => string | Promise<string>;
/**
 * This returns the config present in `prettier.config.js` of a Redwood project.
 */
export declare const getPrettierOptions: () => Promise<any>;
export declare const prettify: (templateFilename: string, renderedTemplate: string) => Promise<string>;
export type ExistingFiles = 'OVERWRITE' | 'SKIP' | 'FAIL';
export declare const writeFile: <Renderer extends typeof ListrRenderer>(target: string, contents: string, { existingFiles }?: {
    existingFiles?: ExistingFiles;
}, task?: ListrTaskWrapper<never, Renderer>) => void;
/**
 * Creates a list of tasks that write files to the disk.
 *
 * @param files - {[filepath]: contents}
 */
export declare const writeFilesTask: <Renderer extends typeof ListrRenderer>(files: Record<string, string>, options: {
    existingFiles: ExistingFiles;
}) => Listr<never, Renderer, "simple">;
//# sourceMappingURL=index.d.ts.map