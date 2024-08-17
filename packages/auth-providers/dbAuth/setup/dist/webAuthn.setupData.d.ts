import type { AuthGeneratorCtx } from '@redwoodjs/cli-helpers/src/auth/authTasks.js';
export { extraTask } from './setupData';
export declare const webPackages: string[];
export declare const apiPackages: string[];
export declare const createUserModelTask: {
    title: string;
    task: (ctx: AuthGeneratorCtx) => Promise<void>;
};
export declare const notes: string[];
export declare const noteGenerate: string[];
//# sourceMappingURL=webAuthn.setupData.d.ts.map