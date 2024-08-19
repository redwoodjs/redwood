import type { BaseAdapter } from '../adapters/BaseAdapter/BaseAdapter';
import type { BasicLogger } from '../types';
export interface WorkerOptions {
    adapter: BaseAdapter;
    processName: string;
    queues: string[];
    logger?: BasicLogger;
    clear?: boolean;
    maxAttempts?: number;
    maxRuntime?: number;
    deleteSuccessfulJobs?: boolean;
    deleteFailedJobs?: boolean;
    sleepDelay?: number;
    workoff?: boolean;
    forever?: boolean;
}
type CompleteOptions = Required<WorkerOptions>;
export declare class Worker {
    #private;
    options: CompleteOptions;
    adapter: CompleteOptions['adapter'];
    logger: CompleteOptions['logger'];
    clear: CompleteOptions['clear'];
    processName: CompleteOptions['processName'];
    queues: CompleteOptions['queues'];
    maxAttempts: CompleteOptions['maxAttempts'];
    maxRuntime: CompleteOptions['maxRuntime'];
    deleteSuccessfulJobs: CompleteOptions['deleteSuccessfulJobs'];
    deleteFailedJobs: CompleteOptions['deleteFailedJobs'];
    sleepDelay: CompleteOptions['sleepDelay'];
    forever: CompleteOptions['forever'];
    workoff: CompleteOptions['workoff'];
    lastCheckTime: Date;
    constructor(options: WorkerOptions);
    run(): Promise<void>;
    get queueNames(): string;
}
export {};
//# sourceMappingURL=Worker.d.ts.map