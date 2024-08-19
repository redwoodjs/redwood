import type { Adapters, BasicLogger, CreateSchedulerConfig, Job, JobDefinition, JobManagerConfig, ScheduleJobOptions, WorkerConfig } from '../types';
import type { WorkerOptions } from './Worker';
import { Worker } from './Worker';
export interface CreateWorkerArgs {
    index: number;
    workoff: WorkerOptions['workoff'];
    clear: WorkerOptions['clear'];
}
export declare class JobManager<TAdapters extends Adapters, TQueues extends string[], TLogger extends BasicLogger> {
    adapters: TAdapters;
    queues: TQueues;
    logger: TLogger;
    workers: WorkerConfig<TAdapters, TQueues>[];
    constructor(config: JobManagerConfig<TAdapters, TQueues, TLogger>);
    createScheduler(schedulerConfig: CreateSchedulerConfig<TAdapters>): <T extends Job<TQueues, any[]>>(job: T, jobArgs?: Parameters<T["perform"]>, jobOptions?: ScheduleJobOptions) => Promise<boolean>;
    createJob<TArgs extends unknown[]>(jobDefinition: JobDefinition<TQueues, TArgs>): Job<TQueues, TArgs>;
    createWorker({ index, workoff, clear }: CreateWorkerArgs): Worker;
}
//# sourceMappingURL=JobManager.d.ts.map