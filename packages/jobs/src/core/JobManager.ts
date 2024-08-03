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
    return jobDefinition
  }

  createWorker() {
    // coming soon
  }
}
