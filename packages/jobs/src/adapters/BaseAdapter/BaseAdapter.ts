import console from 'node:console'

import type { BaseJob, BasicLogger, PossibleBaseJob } from '../../types'

// Arguments sent to an adapter to schedule a job
export interface SchedulePayload {
  job: string
  args: unknown[]
  runAt: Date
  queue: string
  priority: number
}

export interface FindArgs {
  processName: string
  maxRuntime: number
  queues: string[]
}

export interface BaseAdapterOptions {
  logger?: BasicLogger
}

export interface SuccessOptions<TJob extends BaseJob = BaseJob> {
  job: TJob
  deleteJob?: boolean
}

export interface ErrorOptions<TJob extends BaseJob = BaseJob> {
  job: TJob
  error: Error
}

export interface FailureOptions<TJob extends BaseJob = BaseJob> {
  job: TJob
  deleteJob?: boolean
}

/**
 * Base class for all job adapters. Provides a common interface for scheduling
 * jobs. At a minimum, you must implement the `schedule` method in your adapter.
 *
 * Any object passed to the constructor is saved in `this.options` and should
 * be used to configure your custom adapter. If `options.logger` is included
 * you can access it via `this.logger`
 */
export abstract class BaseAdapter<
  TOptions extends BaseAdapterOptions = BaseAdapterOptions,
  TScheduleReturn = void | Promise<void>,
> {
  options: TOptions
  logger: NonNullable<TOptions['logger']>

  constructor(options: TOptions) {
    this.options = options
    this.logger = options?.logger ?? console
  }

  // It's up to the subclass to decide what to return for these functions.
  // The job engine itself doesn't care about the return value, but the user may
  // want to do something with the result depending on the adapter type, so make
  // it `any` to allow for the subclass to return whatever it wants.

  abstract schedule({
    job,
    args,
    runAt,
    queue,
    priority,
  }: SchedulePayload): TScheduleReturn

  /**
   * Find a single job that's eligible to run with the given args
   */
  abstract find({
    processName,
    maxRuntime,
    queues,
  }: FindArgs): PossibleBaseJob | Promise<PossibleBaseJob>

  /**
   * Called when a job has successfully completed
   */
  abstract success({ job, deleteJob }: SuccessOptions): void | Promise<void>

  /**
   * Called when an attempt to run a job produced an error
   */
  abstract error({ job, error }: ErrorOptions): void | Promise<void>

  /**
   * Called when a job has errored more than maxAttempts and will not be retried
   */
  abstract failure({ job, deleteJob }: FailureOptions): void | Promise<void>

  /**
   * Clear all jobs from storage
   */
  abstract clear(): void | Promise<void>
}
