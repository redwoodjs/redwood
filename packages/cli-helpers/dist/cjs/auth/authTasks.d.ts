import type { ListrRenderer, ListrTask, ListrTaskWrapper } from 'listr2';
export declare const getWebAppPath: () => string;
export declare const addApiConfig: ({ replaceExistingImport, authDecoderImport, }: {
    replaceExistingImport: boolean;
    authDecoderImport?: string;
}) => void;
export declare const hasAuthProvider: (content: string) => boolean;
/**
 * Removes <AuthProvider ...> and </AuthProvider> if they exist, and un-indents
 * the content.
 *
 * Exported for testing
 */
export declare const removeAuthProvider: (content: string) => string;
/**
 * Actually inserts the required config lines into App.{jsx,tsx}
 * Exported for testing
 */
export declare const addConfigToWebApp: <Renderer extends typeof ListrRenderer>() => ListrTask<AuthGeneratorCtx, Renderer>;
export declare const createWebAuth: (basedir: string, webAuthn: boolean) => {
    title: string;
    task: (ctx: AuthGeneratorCtx) => Promise<void>;
};
export declare const addConfigToRoutes: () => {
    title: string;
    task: () => void;
};
/**
 * Will find the templates inside `${basedir}/templates/api`,
 * and write these files to disk with unique names if they are clashing.
 *
 * @returns Listr task
 */
export declare const generateAuthApiFiles: <Renderer extends typeof ListrRenderer>(basedir: string, webAuthn: boolean) => ListrTask<AuthGeneratorCtx, Renderer>;
export declare const addAuthConfigToGqlApi: <Renderer extends typeof ListrRenderer>(authDecoderImport?: string) => {
    title: string;
    task: (ctx: AuthGeneratorCtx, _task: ListrTaskWrapper<AuthGeneratorCtx, Renderer>) => void;
};
export type AuthSetupMode = 'FORCE' | 'REPLACE' | 'COMBINE' | 'UNKNOWN';
export interface AuthGeneratorCtx {
    setupMode: AuthSetupMode;
    provider: string;
    force: boolean;
}
export declare const setAuthSetupMode: <Renderer extends typeof ListrRenderer>(force: boolean) => {
    title: string;
    task: (ctx: AuthGeneratorCtx, task: ListrTaskWrapper<AuthGeneratorCtx, Renderer>) => Promise<void>;
};
//# sourceMappingURL=authTasks.d.ts.map