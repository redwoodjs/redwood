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
  PerformNotImplementedError,
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

export class RedwoodJob {
  // The default queue for all jobs
  static queue = DEFAULT_QUEUE

  // The default priority for all jobs
  // Assumes a range of 1 - 100, 1 being highest priority
  static priority = 50

  // The adapter to use for scheduling jobs. Set via the static `config` method
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
  static performLater(...args: any[]) {
    return new this().performLater(...args)
  }

  // Class method to run the job immediately in the current process
  //   const result = RedwoodJob.performNow('foo', 'bar')
  static performNow(...args: any[]) {
    return new this().performNow(...args)
  }

  // Set options on the job before enqueueing it:
  //   const job = RedwoodJob.set({ wait: 300 })
  //   job.performLater('foo', 'bar')
  static set(options: JobSetOptions = {}) {
    return new this(options)
  }

  // Private property to store options set on the job
  #options: JobSetOptions = {}

  // A job can be instantiated manually, but this will also be invoked
  // automatically by .set() or .performLater()
  constructor(options: JobSetOptions = {}) {
    this.set(options)
  }

  // Set options on the job before enqueueing it:
  //   const job = RedwoodJob.set({ wait: 300 })
  //   job.performLater('foo', 'bar')
  set(options = {}) {
    this.#options = { queue: this.queue, priority: this.priority, ...options }
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

    return this.#schedule(args)
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
      if (e instanceof PerformNotImplementedError) {
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
  perform(..._args: any[]) {
    throw new PerformNotImplementedError()
  }

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
    return (
      this.#options?.logger || (this.constructor as typeof RedwoodJob).logger
    )
  }

  // Determines the name of the queue
  get queue() {
    return this.#options?.queue || (this.constructor as typeof RedwoodJob).queue
  }

  // Set the name of the queue directly on an instance of a job
  set queue(value) {
    this.#options = Object.assign(this.#options || {}, { queue: value })
  }

  // Determines the priority of the job
  get priority() {
    return (
      this.#options?.priority ||
      (this.constructor as typeof RedwoodJob).priority
    )
  }

  // Set the priority of the job directly on an instance of a job
  set priority(value) {
    this.#options = Object.assign(this.#options || {}, {
      priority: value,
    })
  }

  // Determines when the job should run.
  //
  // - If no options were set, defaults to running as soon as possible
  // - If a `wait` option is present it sets the number of seconds to wait
  // - If a `waitUntil` option is present it runs at that specific datetime
  get runAt() {
    if (!this.#options?.runAt) {
      this.#options = Object.assign(this.#options || {}, {
        runAt: this.#options?.wait
          ? new Date(new Date().getTime() + this.#options.wait * 1000)
          : this.#options?.waitUntil
            ? this.#options.waitUntil
            : new Date(),
      })
    }

    return this.#options.runAt
  }

  // Set the runAt time on a job directly:
  //   const job = new RedwoodJob()
  //   job.runAt = new Date(2030, 1, 2, 12, 34, 56)
  //   job.performLater()
  set runAt(value) {
    this.#options = Object.assign(this.#options || {}, { runAt: value })
  }

  // Make private this.#options available as a getter only
  get options() {
    return this.#options
  }

  // Private, schedules a job with the appropriate adapter, returns whatever
  // the adapter returns in response to a successful schedule.
  #schedule(args: any[]) {
    if (!(this.constructor as typeof RedwoodJob).adapter) {
      throw new AdapterNotConfiguredError()
    }

    try {
      return (this.constructor as typeof RedwoodJob).adapter.schedule(
        this.payload(args),
      )
    } catch (e: any) {
      throw new SchedulingError(
        `[RedwoodJob] Exception when scheduling ${this.constructor.name}`,
        e,
      )
    }
  }
}
