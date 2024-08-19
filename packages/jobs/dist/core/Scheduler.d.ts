import type { BaseAdapter, SchedulePayload } from '../adapters/BaseAdapter/BaseAdapter';
import type { BasicLogger, Job, ScheduleJobOptions } from '../types';
interface SchedulerConfig<TAdapter extends BaseAdapter> {
    adapter: TAdapter;
    logger?: BasicLogger;
}
export declare class Scheduler<TAdapter extends BaseAdapter> {
    adapter: TAdapter;
    logger: NonNullable<SchedulerConfig<TAdapter>['logger']>;
    constructor({ adapter, logger }: SchedulerConfig<TAdapter>);
    computeRunAt({ wait, waitUntil }: {
        wait: number;
        waitUntil: Date | null;
    }): Date;
    buildPayload<T extends Job<string[], unknown[]>>(job: T, args?: Parameters<T['perform']>, options?: ScheduleJobOptions): SchedulePayload;
    schedule<T extends Job<string[], unknown[]>>({ job, jobArgs, jobOptions, }: {
        job: T;
        jobArgs?: Parameters<T['perform']>;
        jobOptions?: ScheduleJobOptions;
    }): Promise<boolean>;
}
export {};
//# sourceMappingURL=Scheduler.d.ts.map