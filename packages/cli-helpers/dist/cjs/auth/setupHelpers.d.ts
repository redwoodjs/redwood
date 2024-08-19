import type { ListrTask } from 'listr2';
import type { Argv } from 'yargs';
import type { AuthGeneratorCtx } from './authTasks.js';
export declare const standardAuthBuilder: (yargs: Argv) => Argv<{
    force: boolean;
} & {
    verbose: boolean;
}>;
export interface AuthHandlerArgs {
    basedir: string;
    forceArg: boolean;
    provider: string;
    authDecoderImport?: string;
    webAuthn?: boolean;
    webPackages?: string[];
    apiPackages?: string[];
    extraTasks?: (ListrTask<AuthGeneratorCtx> | undefined)[];
    notes?: string[];
    verbose?: boolean;
}
/**
 * basedir assumes that you must have a templates folder in that directory.
 * See folder structure of auth providers in packages/auth-providers/<provider>/setup/src
 */
export declare const standardAuthHandler: ({ basedir, forceArg, provider, authDecoderImport, webAuthn, webPackages, apiPackages, extraTasks, notes, verbose, }: AuthHandlerArgs) => Promise<void>;
//# sourceMappingURL=setupHelpers.d.ts.map