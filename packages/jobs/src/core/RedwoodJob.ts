// Base class for all jobs, providing a common interface for scheduling jobs.
// At a minimum you must implement the `perform` method in your job subclass.
//
// Configuring RedwoodJob is very flexible. You can set the adapter and logger
// once and all subclasses will use it:
//
//   RedwoodJob.config({ adapter, logger })
//
// Or set them in the individual subclasses:
//
//   class MyJob extends RedwoodJob {
//     static adapter = new MyAdapter()
//     static logger = new MyLogger()
//   }

import type { BaseAdapter } from '../adapters/BaseAdapter'
import type { BasicLogger } from '../types'

import {
  AdapterNotConfiguredError,
  SchedulingError,
  PerformError,
} from './errors'

export interface JobConfigOptions {
  adapter: BaseAdapter
  logger?: BasicLogger
}

export interface JobSetOptions {
  wait?: number
  waitUntil?: Date
  queue?: string
  priority?: number
  logger?: BasicLogger
  runAt?: Date
}

export const DEFAULT_QUEUE = 'default'

export const DEFAULT_PRIORITY = 50

export abstract class RedwoodJob {
  // The default queue for all jobs
  static queue = DEFAULT_QUEUE

  // The default priority for all jobs
  // Lower numbers are higher priority (1 is higher priority than 100)
  static priority = DEFAULT_PRIORITY

  // The adapter to use for scheduling jobs
  static adapter: BaseAdapter

  // Set via the static `config` method
  static logger: BasicLogger

  // Configure all jobs to use a specific adapter and logger
  static config(options: JobConfigOptions) {
    if (Object.keys(options).includes('adapter')) {
      this.adapter = options.adapter
    }
    this.logger = options?.logger || console
  }

  // Class method to schedule a job to run later
  //   const scheduleDetails = RedwoodJob.performLater('foo', 'bar')
  static performLater<T extends RedwoodJob>(this: new () => T, ...args: any[]) {
    return new this().performLater(...args)
  }

  // Class method to run the job immediately in the current process
  //   const result = RedwoodJob.performNow('foo', 'bar')
  static performNow<T extends RedwoodJob>(this: new () => T, ...args: any[]) {
    return new this().performNow(...args)
  }

  // Set options on the job before enqueueing it:
  //   const job = RedwoodJob.set({ wait: 300 })
  //   job.performLater('foo', 'bar')
  static set<T extends RedwoodJob>(
    this: new (options: JobSetOptions) => T,
    options: JobSetOptions = {},
  ) {
    return new this(options)
  }

  // Private property to store options set on the job
  private myOptions: JobSetOptions = {};

  declare ['constructor']: typeof RedwoodJob

  // A job can be instantiated manually, but this will also be invoked
  // automatically by .set() or .performLater()
  constructor(options: JobSetOptions = {}) {
    this.set(options)
  }

  // Set options on the job before enqueueing it:
  //   const job = RedwoodJob.set({ wait: 300 })
  //   job.performLater('foo', 'bar')
  set(options = {}) {
    this.myOptions = { queue: this.queue, priority: this.priority, ...options }
    return this
  }

  // Instance method to schedule a job to run later
  //   const job = RedwoodJob
  //   const scheduleDetails = job.performLater('foo', 'bar')
  performLater(...args: any[]) {
    this.logger.info(
      this.payload(args),
      `[RedwoodJob] Scheduling ${this.constructor.name}`,
    )

    return this.schedule(args)
  }

  // Instance method to runs the job immediately in the current process
  //   const result = RedwoodJob.performNow('foo', 'bar')
  performNow(...args: any[]) {
    this.logger.info(
      this.payload(args),
      `[RedwoodJob] Running ${this.constructor.name} now`,
    )

    try {
      return this.perform(...args)
    } catch (e: any) {
      if (e instanceof TypeError) {
        throw e
      } else {
        throw new PerformError(
          `[${this.constructor.name}] exception when running job`,
          e,
        )
      }
    }
  }

  // Must be implemented by the subclass
  abstract perform(..._args: any[]): any

  // Returns data sent to the adapter for scheduling
  payload(args: any[]) {
    return {
      handler: this.constructor.name,
      args,
      runAt: this.runAt as Date,
      queue: this.queue,
      priority: this.priority,
    }
  }

  get logger() {
    return this.myOptions?.logger || this.constructor.logger
  }

  // Determines the name of the queue
  get queue() {
    return this.myOptions?.queue || this.constructor.queue
  }

  // Set the name of the queue directly on an instance of a job
  set queue(value) {
    this.myOptions = Object.assign(this.myOptions || {}, { queue: value })
  }

  // Determines the priority of the job
  get priority() {
    return this.myOptions?.priority || this.constructor.priority
  }

  // Set the priority of the job directly on an instance of a job
  set priority(value) {
    this.myOptions = Object.assign(this.myOptions || {}, {
      priority: value,
    })
  }

  // Determines when the job should run.
  //
  // - If no options were set, defaults to running as soon as possible
  // - If a `wait` option is present it sets the number of seconds to wait
  // - If a `waitUntil` option is present it runs at that specific datetime
  get runAt() {
    if (!this.myOptions?.runAt) {
      this.myOptions = Object.assign(this.myOptions || {}, {
        runAt: this.myOptions?.wait
          ? new Date(new Date().getTime() + this.myOptions.wait * 1000)
          : this.myOptions?.waitUntil
            ? this.myOptions.waitUntil
            : new Date(),
      })
    }

    return this.myOptions.runAt
  }

  // Set the runAt time on a job directly:
  //   const job = new RedwoodJob()
  //   job.runAt = new Date(2030, 1, 2, 12, 34, 56)
  //   job.performLater()
  set runAt(value) {
    this.myOptions = Object.assign(this.myOptions || {}, { runAt: value })
  }

  // Make private this.#options available as a getter only
  get options() {
    return this.myOptions
  }

  // Private, schedules a job with the appropriate adapter, returns whatever
  // the adapter returns in response to a successful schedule.
  private schedule(args: any[]) {
    if (!this.constructor.adapter) {
      throw new AdapterNotConfiguredError()
    }

    try {
      return this.constructor.adapter.schedule(this.payload(args))
    } catch (e: any) {
      throw new SchedulingError(
        `[RedwoodJob] Exception when scheduling ${this.constructor.name}`,
        e,
      )
    }
  }
}
