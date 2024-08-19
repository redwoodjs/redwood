import type { BaseAdapter } from '../adapters/BaseAdapter/BaseAdapter';
import type { BaseJob, BasicLogger } from '../types';
interface Options {
    adapter: BaseAdapter;
    job: BaseJob;
    logger?: BasicLogger;
    maxAttempts?: number;
    deleteFailedJobs?: boolean;
    deleteSuccessfulJobs?: boolean;
}
export declare const DEFAULTS: {
    logger: Console;
    maxAttempts: number;
    deleteFailedJobs: boolean;
    deleteSuccessfulJobs: boolean;
};
export declare class Executor {
    options: Required<Options>;
    adapter: Options['adapter'];
    logger: NonNullable<Options['logger']>;
    job: BaseJob;
    maxAttempts: NonNullable<Options['maxAttempts']>;
    deleteFailedJobs: NonNullable<Options['deleteFailedJobs']>;
    deleteSuccessfulJobs: NonNullable<Options['deleteSuccessfulJobs']>;
    constructor(options: Options);
    get jobIdentifier(): string;
    perform(): Promise<void>;
}
export {};
//# sourceMappingURL=Executor.d.ts.map