import type {
  Adapters,
  BasicLogger,
  CreateSchedulerConfig,
  Job,
  JobDefinition,
  JobManagerConfig,
  ScheduleJobOptions,
  WorkerConfig,
} from '../types'

import { Scheduler } from './Scheduler'

export class JobManager<
  TAdapters extends Adapters,
  TQueues extends string[],
  TLogger extends BasicLogger,
> {
  adapters: TAdapters
  queues: TQueues
  logger: TLogger
  workers: WorkerConfig<TAdapters, TQueues>[]

  constructor(config: JobManagerConfig<TAdapters, TQueues, TLogger>) {
    this.adapters = config.adapters
    this.queues = config.queues
    this.logger = config.logger
    this.workers = config.workers
  }

  createScheduler(schedulerConfig: CreateSchedulerConfig<TAdapters>) {
    const scheduler = new Scheduler({
      adapter: this.adapters[schedulerConfig.adapter],
      logger: this.logger,
    })

    return <T extends Job<TQueues, any[]>>(
      job: T,
      jobArgs?: Parameters<T['perform']>,
      jobOptions?: ScheduleJobOptions,
    ) => {
      return scheduler.schedule({ job, jobArgs, jobOptions })
    }
  }

  createJob<TArgs extends unknown[]>(
    jobDefinition: JobDefinition<TQueues, TArgs>,
  ): Job<TQueues, TArgs> {
    // The cast is necessary because the JobDefinition type lacks the `name` and
    // `path` properties that are required by the Job type. These properties are
    // added to the job at build time by a plugin in the build process.
    return jobDefinition as Job<TQueues, TArgs>
  }

  createWorker() {
    // coming soon
  }
}
