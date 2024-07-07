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
  handler: string
  args: any
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
  queue: string
}

export interface BaseAdapterOptions {
  logger?: BasicLogger
}

export abstract class BaseAdapter {
  options: any
  logger: BasicLogger

  constructor(options: BaseAdapterOptions) {
    this.options = options
    this.logger = options?.logger || console
  }

  abstract schedule(payload: SchedulePayload): any

  abstract find(args: FindArgs): BaseJob | null | Promise<BaseJob | null>

  abstract clear(): any

  abstract success(job: BaseJob): any

  abstract failure(job: BaseJob, error: Error): any
}
