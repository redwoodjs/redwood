import type { AuthGeneratorCtx } from '@redwoodjs/cli-helpers/src/auth/authTasks';
export declare const extraTask: {
    title: string;
    task: () => void;
};
export declare const createUserModelTask: {
    title: string;
    task: (ctx: AuthGeneratorCtx) => Promise<void>;
};
export declare const notes: string[];
export declare const notesCreatedUserModel: string[];
export declare const noteGenerate: string[];
//# sourceMappingURL=setupData.d.ts.map