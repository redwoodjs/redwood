// Base class for all job adapters. Provides a common interface for scheduling
// jobs. At a minimum, you must implement the `schedule` method in your adapter.
//
// Any object passed to the constructor is saved in `this.options` and should
// be used to configure your custom adapter. If `options.logger` is included
// you can access it via `this.logger`

import console from 'node:console'

import type { BasicLogger } from '../types'

// Arguments sent to an adapter to schedule a job
export interface SchedulePayload {
  job: string
  args: unknown[]
  runAt: Date
  queue: string
  priority: number
}

// Arguments returned from an adapter when a job is found. This is the absolute
// minimum interface that's needed for the Executor to invoke the job, but any
// adapter will likely return more info, like the number of previous tries, so
// that it can reschedule the job to run in the future.
export interface BaseJob {
  handler: string
  args: any
}

export interface FindArgs {
  processName: string
  maxRuntime: number
  queue: string | null
}

export interface BaseAdapterOptions {
  logger?: BasicLogger
}

export interface FailureOptions {
  maxAttempts?: number
  deleteFailedJobs?: boolean
}

export abstract class BaseAdapter<
  TOptions extends BaseAdapterOptions = BaseAdapterOptions,
> {
  options: TOptions
  logger: BasicLogger

  constructor(options: TOptions) {
    this.options = options
    this.logger = options?.logger || console
  }

  // It's up to the subclass to decide what to return for these functions.
  // The job engine itself doesn't care about the return value, but the user may
  // want to do something with the result depending on the adapter type, so make
  // it `any` to allow for the subclass to return whatever it wants.

  abstract schedule(payload: SchedulePayload): any

  abstract find(
    args: FindArgs,
  ): BaseJob | null | undefined | Promise<BaseJob | null | undefined>

  // TODO accept an optional `queue` arg to clear only jobs in that queue
  abstract clear(): any

  abstract success(job: BaseJob): any

  abstract failure(job: BaseJob, error: Error, options: FailureOptions): any
}
